'use client';

/**
 * WebSocket Provider
 * 
 * Provides WebSocket connection to entire app via React Context.
 * Handles connection lifecycle and status management.
 * 
 * Interview Points:
 * - Single WebSocket connection for entire app
 * - Automatic reconnection with exponential backoff
 * - Heartbeat to keep connection alive
 * - Event subscription system for components
 * - Connection status visible in UI
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { WebSocketClient } from '@/lib/websocket/WebSocketClient';
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
    // In development, use mock WebSocket server
    // In production, use real WebSocket URL
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
    const client = getWebSocketClient();
    
    // Listen to status changes
    const unsubscribe = client.onStatusChange(setStatus);
    
    // Connect on mount
    client.connect();
    
    // Set initial status
    setStatus(client.getStatus());
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Note: Don't disconnect here to keep connection alive across navigation
    };
  }, []);

  const send = useCallback(<T,>(event: Omit<WebSocketEvent<T>, 'id' | 'timestamp'>) => {
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

/**
 * Hook to access WebSocket context
 */
export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  
  return context;
}

/**
 * Hook to get connection status only (lightweight)
 */
export function useWebSocketStatus(): WebSocketStatus {
  const { status } = useWebSocket();
  return status;
}
