'use client';

/**
 * WebSocket Provider
 *
 * Provides WebSocket connection to the entire app via React Context.
 *
 * Leader-only WebSocket architecture:
 * - Only the leader tab maintains a live WebSocket connection.
 * - Follower tabs receive real-time events exclusively via BroadcastChannel.
 * - When the leader closes/crashes, a follower wins re-election, connects WS,
 *   and resumes broadcasting to the remaining followers.
 * - This keeps exactly 1 server connection regardless of how many tabs are open.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { WebSocketClient } from '@/lib/websocket/WebSocketClient';
import { getBroadcastManager } from '@/lib/sync/BroadcastManager';
import {
  type WebSocketContextValue,
  type WebSocketStatus,
  type WebSocketEventType,
  type WebSocketMessageHandler,
  type WebSocketEvent,
} from '@/lib/websocket/types';

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

// Singleton WebSocket client
let wsClient: WebSocketClient | null = null;

function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

    wsClient = new WebSocketClient({
      url: wsUrl,
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      debug: process.env.NODE_ENV === 'development',
    });
  }

  return wsClient;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');

  useEffect(() => {
    const broadcastMgr = getBroadcastManager();
    const client = getWebSocketClient();

    // Always track status changes (even when disconnected, so UI stays in sync)
    const unsubStatus = client.onStatusChange(setStatus);

    // When THIS tab wins (or already holds) leadership → open WS connection
    const unsubLeader = broadcastMgr.onBecomeLeader(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WSProvider] Became leader — connecting WebSocket');
      }
      client.connect();
    });

    // When THIS tab loses leadership (another tab won, or we're stepping down) → close WS
    const unsubStepDown = broadcastMgr.onStepDown(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('[WSProvider] Stepped down — disconnecting WebSocket');
      }
      client.disconnect();
      setStatus('disconnected');
    });

    // Sync initial status display
    setStatus(client.getStatus());

    return () => {
      unsubStatus();
      unsubLeader();
      unsubStepDown();
      // Note: do NOT disconnect here — we want the WS connection to survive
      // React navigation (component unmount/remount). The disconnect lifecycle
      // is managed entirely by the leader-election callbacks above.
    };
  }, []);

  const send = useCallback(<T,>(event: Omit<WebSocketEvent<T>, 'id' | 'timestamp'>) => {
    // Followers don't have a live WS — the send will be queued and flushed
    // once this tab becomes leader (or we can route via BroadcastChannel if needed).
    const client = getWebSocketClient();
    client.send(event);
  }, []);

  const subscribe = useCallback(<T,>(
    eventType: WebSocketEventType,
    handler: WebSocketMessageHandler<T>
  ) => {
    const client = getWebSocketClient();
    return client.subscribe(eventType, handler);
  }, []);

  const reconnect = useCallback(() => {
    const client = getWebSocketClient();
    client.disconnect();
    client.connect();
  }, []);

  const value: WebSocketContextValue = {
    status,
    isConnected: status === 'connected',
    send,
    subscribe,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }

  return context;
}

export function useWebSocketStatus(): WebSocketStatus {
  const { status } = useWebSocket();
  return status;
}
