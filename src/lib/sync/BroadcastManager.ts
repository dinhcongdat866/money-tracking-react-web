/**
 * Broadcast Manager for Multi-Tab Sync
 *
 * Synchronizes state across browser tabs using BroadcastChannel API.
 * Implements leader election to optimize WebSocket connections.
 *
 * Strategy:
 * - Only 1 tab (leader) maintains WebSocket connection
 * - Leader broadcasts events to other tabs
 * - If leader closes, new leader is elected automatically
 * - All tabs process events (from WebSocket or BroadcastChannel)
 * - Reduces server load (1 connection vs N tabs)
 * - Seamless failover when leader closes
 */

import type { WebSocketEvent } from '@/lib/websocket/types';

type BroadcastMessage =
  | { type: 'leader:elected'; leaderId?: string }
  | { type: 'leader:heartbeat'; leaderId: string }
  | { type: 'websocket:event'; fromTab: string; event: WebSocketEvent };

const CHANNEL_NAME = 'money-tracker-sync';
const LEADER_KEY = 'ws-leader-id';
const LEADER_STARTED_KEY = `${LEADER_KEY}-started`;
const HEARTBEAT_INTERVAL = 5000;   // Leader sends heartbeat every 5 s
const HEARTBEAT_TIMEOUT = 12000;   // Follower re-elects if no heartbeat for 12 s
const FOLLOWER_POLL_INTERVAL = 4000; // Follower checks heartbeat every 4 s

export class BroadcastManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private isLeader = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private followerMonitorInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Set<(event: WebSocketEvent) => void> = new Set();
  private onBecomeLeaderCallbacks: Set<() => void> = new Set();
  private onStepDownCallbacks: Set<() => void> = new Set();
  private debug: boolean;
  private recentLocalEvents: Set<string> = new Set();
  private storageListener: ((e: StorageEvent) => void) | null = null;

  constructor(debug = false) {
    this.tabId = this.generateTabId();
    this.debug = debug;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.init();
    } else {
      console.warn('[Broadcast] BroadcastChannel not supported');
    }
  }

  // ============================================================================
  // INIT
  // ============================================================================

  private init(): void {
    this.channel = new BroadcastChannel(CHANNEL_NAME);

    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // Detect clean leader shutdown: storage event fires on all OTHER tabs
    // when the key is removed in cleanup()
    this.storageListener = (e: StorageEvent) => {
      if (this.isLeader) return;

      if (e.key === LEADER_KEY && e.newValue === null) {
        if (this.debug) console.log(`[Broadcast] Leader key removed (storage event), re-electing`);
        this.electLeader();
      }
    };
    window.addEventListener('storage', this.storageListener);

    this.electLeader();

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  // ============================================================================
  // LEADER ELECTION
  // ============================================================================

  /**
   * Leader Election Algorithm
   *
   * 1. If an alive leader exists (heartbeat fresh), become follower immediately.
   * 2. Otherwise write own tabId to localStorage.
   * 3. After 50 ms, whoever's ID is still there wins (last writer wins, safe enough
   *    because only one tab reaches this code at a time when triggered by storage event).
   * 4. Winner → becomeLeader(); loser → setAsFollower().
   */
  private electLeader(): void {
    const currentLeader = localStorage.getItem(LEADER_KEY);
    const lastHeartbeat = localStorage.getItem(`${LEADER_KEY}-heartbeat`);

    if (currentLeader && lastHeartbeat) {
      const elapsed = Date.now() - parseInt(lastHeartbeat, 10);
      if (elapsed < HEARTBEAT_TIMEOUT) {
        if (this.debug) console.log(`[Broadcast] Alive leader found, becoming follower (${this.tabId})`);
        this.setAsFollower();
        return;
      }
    }

    // No leader or stale leader — attempt to claim leadership
    localStorage.setItem(LEADER_KEY, this.tabId);

    setTimeout(() => {
      const stored = localStorage.getItem(LEADER_KEY);
      if (stored === this.tabId) {
        this.becomeLeader();
      } else {
        // Another tab wrote last and won
        this.setAsFollower();
      }
    }, 50);
  }

  // ============================================================================
  // LEADER STATE
  // ============================================================================

  private becomeLeader(): void {
    this.isLeader = true;
    this.stopFollowerMonitor();

    if (this.debug) console.log(`[Broadcast] ✅ Leader tab (${this.tabId})`);

    const now = Date.now();
    localStorage.setItem(LEADER_STARTED_KEY, now.toString());
    localStorage.setItem(`${LEADER_KEY}-heartbeat`, now.toString());

    this.startHeartbeat();

    this.broadcast({ type: 'leader:elected', leaderId: this.tabId });

    this.onBecomeLeaderCallbacks.forEach((cb) => {
      try { cb(); } catch (err) { console.error('[Broadcast] onBecomeLeader callback error:', err); }
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(() => {
      if (!this.isLeader) return;
      localStorage.setItem(`${LEADER_KEY}-heartbeat`, Date.now().toString());
      this.broadcast({ type: 'leader:heartbeat', leaderId: this.tabId });
    }, HEARTBEAT_INTERVAL);
  }

  private stepDown(): void {
    if (this.debug) console.log(`[Broadcast] Stepping down (${this.tabId})`);

    this.isLeader = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.startFollowerMonitor();

    this.onStepDownCallbacks.forEach((cb) => {
      try { cb(); } catch (err) { console.error('[Broadcast] onStepDown callback error:', err); }
    });
  }

  // ============================================================================
  // FOLLOWER STATE
  // ============================================================================

  /**
   * Transition to follower state.
   * Called after losing an election OR being explicitly told to step down.
   */
  private setAsFollower(): void {
    if (this.isLeader) {
      // Edge case: we were leader and are now being demoted
      this.stepDown();
      return;
    }

    this.isLeader = false;
    if (this.debug) console.log(`[Broadcast] Follower tab (${this.tabId})`);

    this.startFollowerMonitor();

    this.onStepDownCallbacks.forEach((cb) => {
      try { cb(); } catch (err) { console.error('[Broadcast] onStepDown callback error:', err); }
    });
  }

  /**
   * Follower polls heartbeat timestamp every FOLLOWER_POLL_INTERVAL ms.
   * If heartbeat is stale (> HEARTBEAT_TIMEOUT), assumes leader is dead and
   * triggers re-election. This handles crashed/force-killed leader tabs where
   * beforeunload never fires.
   */
  private startFollowerMonitor(): void {
    this.stopFollowerMonitor();

    this.followerMonitorInterval = setInterval(() => {
      if (this.isLeader) {
        this.stopFollowerMonitor();
        return;
      }

      const lastHeartbeat = localStorage.getItem(`${LEADER_KEY}-heartbeat`);
      if (!lastHeartbeat) {
        const currentLeader = localStorage.getItem(LEADER_KEY);
        const startedAt = localStorage.getItem(LEADER_STARTED_KEY);

        // If a leader exists but hasn't written heartbeat yet, give it a grace window.
        // (This happens right after leader election / when browser throttles timers.)
        if (currentLeader && startedAt) {
          const elapsed = Date.now() - parseInt(startedAt, 10);
          if (elapsed < HEARTBEAT_TIMEOUT) {
            if (this.debug) console.log(`[Broadcast] Leader start detected without heartbeat (${elapsed}ms), waiting`);
            return;
          }
        }

        if (this.debug) console.log(`[Broadcast] No heartbeat found, re-electing`);
        localStorage.removeItem(LEADER_KEY);
        localStorage.removeItem(LEADER_STARTED_KEY);
        this.electLeader();
        return;
      }

      const elapsed = Date.now() - parseInt(lastHeartbeat, 10);
      if (elapsed > HEARTBEAT_TIMEOUT) {
        if (this.debug) console.log(`[Broadcast] Heartbeat stale (${elapsed}ms), re-electing`);
        // Clear stale keys so other followers don't also think a leader exists
        localStorage.removeItem(LEADER_KEY);
        localStorage.removeItem(LEADER_STARTED_KEY);
        localStorage.removeItem(`${LEADER_KEY}-heartbeat`);
        this.electLeader();
      }
    }, FOLLOWER_POLL_INTERVAL);
  }

  private stopFollowerMonitor(): void {
    if (this.followerMonitorInterval) {
      clearInterval(this.followerMonitorInterval);
      this.followerMonitorInterval = null;
    }
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  private handleMessage(data: BroadcastMessage): void {
    if (data.type === 'leader:elected') {
      if (this.debug) console.log(`[Broadcast] New leader announced: ${data.leaderId}`);

      if (this.isLeader && data.leaderId !== this.tabId) {
        this.stepDown();
      }
      return;
    }

    if (data.type === 'leader:heartbeat') {
      // Leader alive; nothing to do for follower
      return;
    }

    if (data.type === 'websocket:event') {
      const { event, fromTab } = data;

      if (fromTab === this.tabId) {
        if (this.debug) console.log(`[Broadcast] Ignoring self-broadcast from ${fromTab}`);
        return;
      }

      if (this.debug) console.log(`[Broadcast] Received from ${fromTab}:`, event.type);

      this.eventHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('[Broadcast] Handler error:', error);
        }
      });
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Register a callback invoked when THIS tab becomes the leader.
   * If we are already the leader at registration time, the callback is called immediately.
   */
  public onBecomeLeader(callback: () => void): () => void {
    this.onBecomeLeaderCallbacks.add(callback);

    // Already leader — fire immediately so caller doesn't miss the event
    if (this.isLeader) {
      try { callback(); } catch (err) { console.error('[Broadcast] onBecomeLeader immediate callback error:', err); }
    }

    return () => this.onBecomeLeaderCallbacks.delete(callback);
  }

  /**
   * Register a callback invoked when THIS tab steps down from leadership
   * (either due to another tab winning, or clean shutdown).
   */
  public onStepDown(callback: () => void): () => void {
    this.onStepDownCallbacks.add(callback);
    return () => this.onStepDownCallbacks.delete(callback);
  }

  /**
   * Broadcast a WebSocket event to all other tabs.
   * Should only be called by the leader tab.
   */
  public broadcastEvent(event: WebSocketEvent, isLocalEvent = false): void {
    if (!this.channel) return;

    this.channel.postMessage({
      type: 'websocket:event',
      fromTab: this.tabId,
      event,
    });

    if (isLocalEvent) {
      const eventKey = this.generateEventKey(event);
      this.recentLocalEvents.add(eventKey);
      setTimeout(() => this.recentLocalEvents.delete(eventKey), 5000);
    }

    if (this.debug) {
      console.log(`[Broadcast] Sent to other tabs:`, event.type, isLocalEvent ? '(local)' : '(external)');
    }
  }

  public isRecentLocalEvent(event: WebSocketEvent): boolean {
    return this.recentLocalEvents.has(this.generateEventKey(event));
  }

  public onEvent(handler: (event: WebSocketEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  public isLeaderTab(): boolean {
    return this.isLeader;
  }

  public getTabId(): string {
    return this.tabId;
  }

  // ============================================================================
  // INTERNAL HELPERS
  // ============================================================================

  private broadcast(message: Record<string, unknown>): void {
    if (!this.channel) return;
    this.channel.postMessage(message);
  }

  private generateEventKey(event: WebSocketEvent): string {
    const data = event.data as Record<string, unknown> & {
      transactionId?: string;
      transaction?: { id: string };
      id?: string;
    };

    switch (event.type) {
      case 'transaction:moved':
        return `${event.type}-${data.transactionId}-${data.newCategory}`;
      case 'transaction:created':
        return `${event.type}-${data.transaction?.id}`;
      case 'transaction:updated':
        return `${event.type}-${data.transaction?.id}`;
      case 'transaction:deleted':
        return `${event.type}-${data.transactionId}`;
      default:
        return `${event.type}-${data.transactionId ?? data.transaction?.id ?? Date.now()}`;
    }
  }

  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanup(): void {
    if (this.isLeader) {
      // Removing the key fires a 'storage' event on all surviving follower tabs,
      // which immediately triggers their re-election.
      localStorage.removeItem(LEADER_KEY);
      localStorage.removeItem(LEADER_STARTED_KEY);
      localStorage.removeItem(`${LEADER_KEY}-heartbeat`);
      if (this.debug) console.log(`[Broadcast] Leader cleanup (${this.tabId})`);
    }

    this.stopFollowerMonitor();

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }

    if (this.channel) {
      this.channel.close();
    }
  }
}

// Singleton instance
let broadcastManager: BroadcastManager | null = null;

export function getBroadcastManager(): BroadcastManager {
  if (!broadcastManager) {
    broadcastManager = new BroadcastManager(
      process.env.NODE_ENV === 'development'
    );
  }
  return broadcastManager;
}
