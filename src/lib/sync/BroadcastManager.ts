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
const HEARTBEAT_INTERVAL = 5000; // 5 seconds
const HEARTBEAT_TIMEOUT = 10000; // 10 seconds

export class BroadcastManager {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private isLeader = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private eventHandlers: Set<(event: WebSocketEvent) => void> = new Set();
  private debug: boolean;
  private recentLocalEvents: Set<string> = new Set();

  constructor(debug = false) {
    this.tabId = this.generateTabId();
    this.debug = debug;
    
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.init();
    } else {
      console.warn('[Broadcast] BroadcastChannel not supported');
    }
  }

  /**
   * Initialize broadcast channel and elect leader
   */
  private init(): void {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    // Attempt leader election
    this.electLeader();

    // Handle tab close
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Leader Election Algorithm
   * 
   * Simple but effective approach:
   * 1. Each tab writes its ID to localStorage
   * 2. After 50ms delay, check if your ID is still there
   * 3. If yes, you're the leader!
   * 4. Leader sends heartbeat every 5s
   * 5. Other tabs monitor heartbeat, become leader if timeout
   */
  private electLeader(): void {
    const currentLeader = localStorage.getItem(LEADER_KEY);
    const lastHeartbeat = localStorage.getItem(`${LEADER_KEY}-heartbeat`);
    
    // Check if current leader is alive
    if (currentLeader && lastHeartbeat) {
      const timeSinceHeartbeat = Date.now() - parseInt(lastHeartbeat, 10);
      
      if (timeSinceHeartbeat < HEARTBEAT_TIMEOUT) {
        // Leader is alive, we're a follower
        this.isLeader = false;
        if (this.debug) console.log(`[Broadcast] Follower tab (${this.tabId})`);
        return;
      }
    }

    // No leader or leader is dead, attempt to become leader
    localStorage.setItem(LEADER_KEY, this.tabId);
    
    setTimeout(() => {
      const storedLeader = localStorage.getItem(LEADER_KEY);
      
      if (storedLeader === this.tabId) {
        this.becomeLeader();
      } else {
        this.isLeader = false;
        if (this.debug) console.log(`[Broadcast] Lost election (${this.tabId})`);
      }
    }, 50);
  }

  /**
   * Become the leader tab
   */
  private becomeLeader(): void {
    this.isLeader = true;
    if (this.debug) console.log(`[Broadcast] ✅ Leader tab (${this.tabId})`);
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Notify other tabs
    this.broadcast({
      type: 'leader:elected',
      leaderId: this.tabId,
    });
  }

  /**
   * Start leader heartbeat
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        localStorage.setItem(`${LEADER_KEY}-heartbeat`, Date.now().toString());
        
        this.broadcast({
          type: 'leader:heartbeat',
          leaderId: this.tabId,
        });
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Handle incoming broadcast messages
   */
  private handleMessage(data: BroadcastMessage): void {
    // Handle internal messages
    if (data.type === 'leader:elected') {
      if (this.debug) console.log(`[Broadcast] New leader: ${data.leaderId}`);
      
      // If we were leader but someone else got elected, step down
      if (this.isLeader && data.leaderId !== this.tabId) {
        this.stepDown();
      }
      return;
    }

    if (data.type === 'leader:heartbeat') {
      // Leader is alive, we remain follower
      return;
    }

    // Handle WebSocket events
    if (data.type === 'websocket:event') {
      const { event, fromTab } = data;
      
      // Ignore events from self (prevent duplicate handling)
      if (fromTab === this.tabId) {
        if (this.debug) {
          console.log(`[Broadcast] Ignoring self-broadcast from ${fromTab}`);
        }
        return;
      }
      
      if (this.debug) {
        console.log(`[Broadcast] Received from ${fromTab}:`, event.type);
      }

      // Notify all handlers
      this.eventHandlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error('[Broadcast] Handler error:', error);
        }
      });
    }
  }

  /**
   * Broadcast WebSocket event to other tabs
   * Only called by leader tab
   */
  public broadcastEvent(event: WebSocketEvent, isLocalEvent = false): void {
    if (!this.channel) return;

    this.channel.postMessage({
      type: 'websocket:event',
      fromTab: this.tabId,
      event,
    });

    // Track local events to prevent echo broadcasting
    if (isLocalEvent) {
      const eventKey = this.generateEventKey(event);
      this.recentLocalEvents.add(eventKey);
      
      // Auto-cleanup after 5 seconds
      setTimeout(() => {
        this.recentLocalEvents.delete(eventKey);
      }, 5000);
    }

    if (this.debug) {
      console.log(`[Broadcast] Sent to other tabs:`, event.type, isLocalEvent ? '(local)' : '(external)');
    }
  }

  /**
   * Check if event is a recent local event (to prevent echo)
   */
  public isRecentLocalEvent(event: WebSocketEvent): boolean {
    const eventKey = this.generateEventKey(event);
    return this.recentLocalEvents.has(eventKey);
  }

  /**
   * Generate unique key for event deduplication
   */
  private generateEventKey(event: WebSocketEvent): string {
    const data = event.data as Record<string, unknown> & { transactionId?: string; transaction?: { id: string }; id?: string };
    
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
        return `${event.type}-${data.transactionId || data.transaction?.id || Date.now()}`;
    }
  }

  /**
   * Broadcast internal message
   */
  private broadcast(message: Record<string, unknown>): void {
    if (!this.channel) return;
    this.channel.postMessage(message);
  }

  /**
   * Subscribe to broadcast events
   */
  public onEvent(handler: (event: WebSocketEvent) => void): () => void {
    this.eventHandlers.add(handler);
    
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Check if this tab is the leader
   */
  public isLeaderTab(): boolean {
    return this.isLeader;
  }

  /**
   * Step down from leader role
   */
  private stepDown(): void {
    if (this.debug) console.log(`[Broadcast] Stepping down (${this.tabId})`);
    
    this.isLeader = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Cleanup on tab close
   */
  private cleanup(): void {
    if (this.isLeader) {
      localStorage.removeItem(LEADER_KEY);
      localStorage.removeItem(`${LEADER_KEY}-heartbeat`);
      
      if (this.debug) console.log(`[Broadcast] Leader cleanup (${this.tabId})`);
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.channel) {
      this.channel.close();
    }
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get tab ID
   */
  public getTabId(): string {
    return this.tabId;
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
