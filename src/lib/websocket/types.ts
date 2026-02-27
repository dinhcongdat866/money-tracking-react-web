/**
 * WebSocket Event Types & Schema
 * 
 * Defines all real-time events for multi-device synchronization.
 * Aligned with hiring pipeline interview requirements.
 */

import type { TransactionItem } from '@/features/transactions/types';

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * Event types for real-time updates
 */
export enum WebSocketEventType {
  // Transaction events
  TRANSACTION_CREATED = 'transaction:created',
  TRANSACTION_UPDATED = 'transaction:updated',
  TRANSACTION_DELETED = 'transaction:deleted',
  
  // Category updates (drag & drop)
  TRANSACTION_MOVED = 'transaction:moved',
  
  // Balance updates
  BALANCE_UPDATED = 'balance:updated',
  
  // Sync events
  SYNC_REQUEST = 'sync:request',
  SYNC_COMPLETE = 'sync:complete',
  
  // Connection events
  PING = 'ping',
  PONG = 'pong',
}

/**
 * Base event structure
 */
export interface WebSocketEvent<T = unknown> {
  id: string; // Event ID for deduplication
  type: WebSocketEventType;
  timestamp: number;
  userId?: string; // Optional: identify which user triggered the event
  data: T;
  version?: number; // For conflict resolution
}

/**
 * Transaction created event
 */
export interface TransactionCreatedEvent {
  transaction: TransactionItem;
}

/**
 * Transaction updated event
 */
export interface TransactionUpdatedEvent {
  transaction: TransactionItem;
  previousVersion?: TransactionItem; // For conflict detection
  changes: Partial<TransactionItem>; // What changed
}

/**
 * Transaction deleted event
 */
export interface TransactionDeletedEvent {
  transactionId: string;
  categoryId: string;
}

/**
 * Transaction moved between categories (drag & drop)
 */
export interface TransactionMovedEvent {
  transactionId: string;
  transaction: TransactionItem;
  oldCategory: string;
  newCategory: string;
  timestamp: number;
}

/**
 * Balance updated event
 */
export interface BalanceUpdatedEvent {
  totalIncome: number;
  totalExpenses: number;
  net: number;
  month: string;
}

/**
 * WebSocket message handler
 */
export type WebSocketMessageHandler<T = unknown> = (event: WebSocketEvent<T>) => void;

/**
 * WebSocket subscription
 */
export interface WebSocketSubscription {
  eventType: WebSocketEventType;
  handler: WebSocketMessageHandler;
  id: string;
}

/**
 * WebSocket configuration
 */
export interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number; // Max reconnection attempts (default: 5)
  reconnectDelay?: number; // Initial delay in ms (default: 1000)
  heartbeatInterval?: number; // Ping interval in ms (default: 30000)
  debug?: boolean;
}

/**
 * WebSocket context value
 */
export interface WebSocketContextValue {
  status: WebSocketStatus;
  isConnected: boolean;
  send: <T>(event: Omit<WebSocketEvent<T>, 'id' | 'timestamp'>) => void;
  subscribe: <T>(eventType: WebSocketEventType, handler: WebSocketMessageHandler<T>) => () => void;
  reconnect: () => void;
}
