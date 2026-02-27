/**
 * WebSocket Client
 * 
 * Production-ready WebSocket client with:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat (ping/pong) to keep connection alive
 * - Event subscription system
 * - Message queue for offline mode
 * - Event deduplication
 */

import {
  type WebSocketConfig,
  type WebSocketEvent,
  type WebSocketMessageHandler,
  type WebSocketSubscription,
  type WebSocketStatus,
  WebSocketEventType,
} from './types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private status: WebSocketStatus = 'disconnected';
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: WebSocketEvent[] = [];
  private processedEventIds: Set<string> = new Set();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      debug: false,
      ...config,
    };
    
    // Setup graceful shutdown on tab close
    this.setupGracefulShutdown();
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (this.config.debug) console.log('[WS] Already connected');
      return;
    }

    this.setStatus('connecting');
    
    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('[WS] Connection error:', error);
      this.handleConnectionLost();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.config.debug) console.log('[WS] Disconnecting...');
    
    this.clearTimers();
    this.reconnectAttempts = this.config.reconnectAttempts; // Prevent auto-reconnect
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.setStatus('disconnected');
  }

  /**
   * Send event to server
   */
  public send<T>(event: Omit<WebSocketEvent<T>, 'id' | 'timestamp'>): void {
    const fullEvent: WebSocketEvent<T> = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
    } as WebSocketEvent<T>;

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(fullEvent));
      if (this.config.debug) console.log('[WS] Sent:', fullEvent);
    } else {
      // Queue message for later
      if (this.config.debug) console.log('[WS] Queued (offline):', fullEvent);
      this.messageQueue.push(fullEvent);
    }
  }

  /**
   * Subscribe to events
   */
  public subscribe<T>(
    eventType: WebSocketEventType,
    handler: WebSocketMessageHandler<T>
  ): () => void {
    const id = this.generateEventId();
    const subscription: WebSocketSubscription = {
      id,
      eventType,
      handler: handler as WebSocketMessageHandler,
    };

    this.subscriptions.set(id, subscription);
    
    if (this.config.debug) {
      console.log(`[WS] Subscribed to ${eventType} (${id})`);
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id);
      if (this.config.debug) {
        console.log(`[WS] Unsubscribed from ${eventType} (${id})`);
      }
    };
  }

  /**
   * Get connection status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Listen to status changes
   */
  public onStatusChange(listener: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  // ============================================================================
  // GRACEFUL SHUTDOWN
  // ============================================================================

  /**
   * Setup graceful shutdown when tab/window closes
   */
  private setupGracefulShutdown(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        if (this.config.debug) console.log('[WS] Tab closing, disconnecting gracefully');
        
        // Disable auto-reconnect
        this.reconnectAttempts = this.config.reconnectAttempts;
        
        // Close connection with normal closure code
        this.ws.close(1000, 'Tab closed');
      }
    });

    // Also handle visibility change (tab hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.config.debug) console.log('[WS] Tab hidden');
        // Optional: pause heartbeat to save battery
      } else {
        if (this.config.debug) console.log('[WS] Tab visible');
        // Resume operations if needed
      }
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      if (this.config.debug) console.log('[WS] Connected');
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketEvent;
        this.handleMessage(message);
      } catch (error) {
        console.error('[WS] Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };

    this.ws.onclose = (event) => {
      if (this.config.debug) {
        console.log('[WS] Connection closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
      }
      
      // Only auto-reconnect if not intentional close
      if (event.code !== 1000) {
        this.handleConnectionLost();
      } else {
        // Intentional close (tab closed), just cleanup
        this.clearTimers();
        this.setStatus('disconnected');
      }
    };
  }

  private handleMessage(event: WebSocketEvent): void {
    // Deduplication: Skip if already processed
    if (this.processedEventIds.has(event.id)) {
      if (this.config.debug) console.log('[WS] Duplicate event ignored:', event.id);
      return;
    }

    // Mark as processed
    this.processedEventIds.add(event.id);
    this.cleanupProcessedEvents();

    // Handle pong (server response to ping)
    if (event.type === WebSocketEventType.PONG) {
      if (this.config.debug) console.log('[WS] Pong received');
      return;
    }

    if (this.config.debug) console.log('[WS] Received:', event);

    // Notify all subscribers
    this.subscriptions.forEach((subscription) => {
      if (subscription.eventType === event.type) {
        try {
          subscription.handler(event);
        } catch (error) {
          console.error(`[WS] Handler error for ${event.type}:`, error);
        }
      }
    });
  }

  /**
   * Handle unexpected connection loss (network issue, server restart)
   * NOT for intentional disconnect (tab close)
   */
  private handleConnectionLost(): void {
    this.clearTimers();
    this.setStatus('disconnected');

    // Attempt auto-reconnection (only if not intentionally closed)
    if (this.reconnectAttempts < this.config.reconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('[WS] Max reconnection attempts reached');
    }
  }

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );

    if (this.config.debug) {
      console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.reconnectAttempts})`);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({
          type: WebSocketEventType.PING,
          data: {},
        });
        if (this.config.debug) console.log('[WS] Ping sent');
      }
    }, this.config.heartbeatInterval);
  }

  private clearTimers(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    if (this.config.debug) {
      console.log(`[WS] Flushing ${this.messageQueue.length} queued messages`);
    }

    while (this.messageQueue.length > 0) {
      const event = this.messageQueue.shift();
      if (event && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(event));
      }
    }
  }

  private setStatus(status: WebSocketStatus): void {
    if (this.status === status) return;
    
    this.status = status;
    
    // Notify all listeners
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error('[WS] Status listener error:', error);
      }
    });
  }

  private cleanupProcessedEvents(): void {
    // Keep only last 1000 event IDs to prevent memory leak
    if (this.processedEventIds.size > 1000) {
      const idsArray = Array.from(this.processedEventIds);
      const toRemove = idsArray.slice(0, 500);
      toRemove.forEach((id) => this.processedEventIds.delete(id));
      
      if (this.config.debug) {
        console.log(`[WS] Cleaned up ${toRemove.length} old event IDs`);
      }
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
