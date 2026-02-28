'use client';

/**
 * Real-time Kanban Synchronization Hook
 * 
 * Integrates WebSocket updates with TanStack Query cache.
 * 
 * Features:
 * - Direct cache manipulation for instant updates
 * - Conflict resolution with optimistic updates
 * - Event deduplication to prevent double processing
 * - Multi-tab sync via BroadcastChannel
 * - Version-based conflict detection
 * - Memory-efficient event processing
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { getBroadcastManager } from '@/lib/sync/BroadcastManager';
import { transactionKeys } from '@/lib/query-keys';
import {
  WebSocketEventType,
  type WebSocketEvent,
  type TransactionMovedEvent,
  type TransactionCreatedEvent,
  type TransactionUpdatedEvent,
  type TransactionDeletedEvent,
} from '@/lib/websocket/types';
import type { KanbanPaginatedResponse, KanbanFilters } from '../types';

/**
 * Hook to sync real-time updates with Kanban board
 */
export function useRealtimeKanban(filters: KanbanFilters) {
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const broadcastManager = useRef(getBroadcastManager());
  const queuedUpdates = useRef<WebSocketEvent[]>([]);
  const processedEvents = useRef(new Map<string, number>());
  const pendingTimeouts = useRef<NodeJS.Timeout[]>([]);
  
  // Track transaction versions for message ordering
  const transactionVersions = useRef(new Map<string, number>());

  useEffect(() => {
    // Subscribe to WebSocket events
    const unsubscribers: (() => void)[] = [];

    // Subscribe to transaction moved (drag & drop from another device/tab)
    const unsubMovedWs = subscribe<TransactionMovedEvent>(
      WebSocketEventType.TRANSACTION_MOVED,
      (event) => {
        handleTransactionMoved(event);
        
        // Leader broadcasts to other tabs (skip if this is echo of our own event)
        if (broadcastManager.current.isLeaderTab()) {
          if (broadcastManager.current.isRecentLocalEvent(event)) {
            console.log('[Realtime] Skipped echo broadcast of local event');
            return;
          }
          broadcastManager.current.broadcastEvent(event);
        }
      }
    );
    unsubscribers.push(unsubMovedWs);

    // Subscribe to transaction created
    const unsubCreatedWs = subscribe<TransactionCreatedEvent>(
      WebSocketEventType.TRANSACTION_CREATED,
      (event) => {
        handleTransactionCreated(event);
        if (broadcastManager.current.isLeaderTab()) {
          if (broadcastManager.current.isRecentLocalEvent(event)) {
            console.log('[Realtime] Skipped echo broadcast of local created event');
            return;
          }
          broadcastManager.current.broadcastEvent(event);
        }
      }
    );
    unsubscribers.push(unsubCreatedWs);

    // Subscribe to transaction updated
    const unsubUpdatedWs = subscribe<TransactionUpdatedEvent>(
      WebSocketEventType.TRANSACTION_UPDATED,
      (event) => {
        handleTransactionUpdated(event);
        if (broadcastManager.current.isLeaderTab()) {
          if (broadcastManager.current.isRecentLocalEvent(event)) {
            console.log('[Realtime] Skipped echo broadcast of local updated event');
            return;
          }
          broadcastManager.current.broadcastEvent(event);
        }
      }
    );
    unsubscribers.push(unsubUpdatedWs);

    // Subscribe to transaction deleted
    const unsubDeletedWs = subscribe<TransactionDeletedEvent>(
      WebSocketEventType.TRANSACTION_DELETED,
      (event) => {
        handleTransactionDeleted(event);
        if (broadcastManager.current.isLeaderTab()) {
          if (broadcastManager.current.isRecentLocalEvent(event)) {
            console.log('[Realtime] Skipped echo broadcast of local deleted event');
            return;
          }
          broadcastManager.current.broadcastEvent(event);
        }
      }
    );
    unsubscribers.push(unsubDeletedWs);

    // Subscribe to broadcast events (from other tabs)
    const unsubBroadcast = broadcastManager.current.onEvent((event) => {
      // Process events from other tabs
      switch (event.type) {
        case WebSocketEventType.TRANSACTION_MOVED:
          handleTransactionMoved(event as WebSocketEvent<TransactionMovedEvent>);
          break;
        case WebSocketEventType.TRANSACTION_CREATED:
          handleTransactionCreated(event as WebSocketEvent<TransactionCreatedEvent>);
          break;
        case WebSocketEventType.TRANSACTION_UPDATED:
          handleTransactionUpdated(event as WebSocketEvent<TransactionUpdatedEvent>);
          break;
        case WebSocketEventType.TRANSACTION_DELETED:
          handleTransactionDeleted(event as WebSocketEvent<TransactionDeletedEvent>);
          break;
      }
    });
    unsubscribers.push(unsubBroadcast);

    return () => {
      // Cleanup all subscriptions
      unsubscribers.forEach(unsub => unsub());
      
      // Clear all pending timeouts to prevent memory leaks
      pendingTimeouts.current.forEach(timeout => clearTimeout(timeout));
      pendingTimeouts.current = [];
      
      // Clear processed events map
      processedEvents.current.clear();
      
      // Clear transaction versions map
      transactionVersions.current.clear();
    };
  }, [subscribe, filters.month, filters.type, filters.search]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Check if event is outdated based on version/timestamp
   * Returns true if should DISCARD (outdated), false if should APPLY
   */
  const isOutdatedEvent = (transactionId: string, newVersion?: number, newTimestamp?: number): boolean => {
    const currentVersion = transactionVersions.current.get(transactionId);
    
    // No version info → Apply (backward compatible)
    if (!newVersion && !newTimestamp) {
      return false;
    }

    // Version-based check (primary)
    if (newVersion && currentVersion) {
      if (newVersion <= currentVersion) {
        console.warn(`[Realtime] Outdated event (version ${newVersion} <= ${currentVersion}), discarding`);
        return true;
      }
    }

    // Timestamp-based check (fallback)
    if (newTimestamp && currentVersion) {
      // If we have a version but new event doesn't, use timestamp
      const currentTimestamp = transactionVersions.current.get(`${transactionId}-ts`);
      if (currentTimestamp && newTimestamp <= currentTimestamp) {
        console.warn(`[Realtime] Outdated event (timestamp ${newTimestamp} <= ${currentTimestamp}), discarding`);
        return true;
      }
    }

    return false;
  };

  /**
   * Update version tracking for transaction
   */
  const updateTransactionVersion = (transactionId: string, version?: number, timestamp?: number): void => {
    if (version) {
      transactionVersions.current.set(transactionId, version);
    }
    if (timestamp) {
      transactionVersions.current.set(`${transactionId}-ts`, timestamp);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle transaction moved between categories
   */
  const handleTransactionMoved = (event: WebSocketEvent<TransactionMovedEvent>) => {
    const { transaction, oldCategory, newCategory } = event.data;

    // Deduplicate events (prevent double processing from WebSocket + BroadcastChannel)
    const eventKey = `moved-${transaction.id}-${newCategory}`;
    const now = Date.now();
    const lastProcessed = processedEvents.current.get(eventKey);
    
    if (lastProcessed && (now - lastProcessed) < 3000) {
      console.log('[Realtime] Skipped duplicate event:', eventKey);
      return;
    }
    
    processedEvents.current.set(eventKey, now);
    
    // Cleanup old entries (keep map small)
    const timeoutId = setTimeout(() => {
      processedEvents.current.delete(eventKey);
    }, 5000);
    pendingTimeouts.current.push(timeoutId);

    // ✅ VERSION CHECK: Discard outdated events
    if (isOutdatedEvent(transaction.id, transaction.version, transaction.updatedAt)) {
      console.log('[Realtime] Skipped outdated transaction:moved event');
      return;
    }

    // Check if transaction is currently being mutated
    if (isTransactionBeingMutated(transaction.id)) {
      queuedUpdates.current.push(event);
      console.log('[Realtime] Transaction being mutated, queued update');
      return;
    }

    const oldCategoryKey = transactionKeys.kanbanColumn(oldCategory, {
      month: filters.month,
      type: filters.type,
      search: filters.search,
    });

    const newCategoryKey = transactionKeys.kanbanColumn(newCategory, {
      month: filters.month,
      type: filters.type,
      search: filters.search,
    });

    // Remove from old category
    queryClient.setQueryData(
      oldCategoryKey,
      (old: { pages: KanbanPaginatedResponse[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.filter(t => t.id !== transaction.id),
            total: page.total - 1,
            pagination: {
              ...page.pagination,
              totalAvailable: page.pagination.totalAvailable - 1,
            },
          })),
        };
      }
    );

    // Add to new category (prepend to first page)
    queryClient.setQueryData(
      newCategoryKey,
      (old: { pages: KanbanPaginatedResponse[]; pageParams: unknown[] } | undefined) => {
        if (!old) {
          // No data yet, trigger refetch instead
          queryClient.invalidateQueries({ queryKey: newCategoryKey });
          return old;
        }

        return {
          ...old,
          pages: old.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                items: [transaction, ...page.items],
                total: page.total + 1,
                pagination: {
                  ...page.pagination,
                  totalAvailable: page.pagination.totalAvailable + 1,
                },
              };
            }
            return page;
          }),
        };
      }
    );

    // Update version tracking
    updateTransactionVersion(transaction.id, transaction.version, transaction.updatedAt);

    console.log(`[Realtime] Transaction moved: ${oldCategory} → ${newCategory}`, {
      version: transaction.version,
      updatedAt: transaction.updatedAt,
    });
  };

  /**
   * Handle transaction created
   */
  const handleTransactionCreated = (event: WebSocketEvent<TransactionCreatedEvent>) => {
    const { transaction } = event.data;
    const categoryId = transaction.category.id;

    // Deduplicate events
    const eventKey = `created-${transaction.id}`;
    const now = Date.now();
    const lastProcessed = processedEvents.current.get(eventKey);
    
    if (lastProcessed && (now - lastProcessed) < 3000) {
      console.log('[Realtime] Skipped duplicate created event:', eventKey);
      return;
    }
    
    processedEvents.current.set(eventKey, now);
    const timeoutId = setTimeout(() => processedEvents.current.delete(eventKey), 5000);
    pendingTimeouts.current.push(timeoutId);

    // ✅ VERSION CHECK: For created events, just track the version
    // (No need to check outdated since it's a new item)

    const categoryKey = transactionKeys.kanbanColumn(categoryId, {
      month: filters.month,
      type: filters.type,
      search: filters.search,
    });

    // Add to category
    queryClient.setQueryData(
      categoryKey,
      (old: { pages: KanbanPaginatedResponse[]; pageParams: unknown[] } | undefined) => {
        if (!old) {
          // No data yet, trigger refetch
          queryClient.invalidateQueries({ queryKey: categoryKey });
          return old;
        }

        return {
          ...old,
          pages: old.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                items: [transaction, ...page.items],
                total: page.total + 1,
                pagination: {
                  ...page.pagination,
                  totalAvailable: page.pagination.totalAvailable + 1,
                },
              };
            }
            return page;
          }),
        };
      }
    );

    // Update version tracking
    updateTransactionVersion(transaction.id, transaction.version, transaction.updatedAt);

    console.log(`[Realtime] Transaction created in ${categoryId}`, {
      id: transaction.id,
      version: transaction.version,
    });
  };

  /**
   * Handle transaction updated
   */
  const handleTransactionUpdated = (event: WebSocketEvent<TransactionUpdatedEvent>) => {
    const { transaction } = event.data;
    const categoryId = transaction.category.id;

    // Deduplicate events
    const eventKey = `updated-${transaction.id}`;
    const now = Date.now();
    const lastProcessed = processedEvents.current.get(eventKey);
    
    if (lastProcessed && (now - lastProcessed) < 3000) {
      console.log('[Realtime] Skipped duplicate updated event:', eventKey);
      return;
    }
    
    processedEvents.current.set(eventKey, now);
    const timeoutId = setTimeout(() => processedEvents.current.delete(eventKey), 5000);
    pendingTimeouts.current.push(timeoutId);

    // ✅ VERSION CHECK: Critical for UPDATE events (most prone to ordering issues)
    if (isOutdatedEvent(transaction.id, transaction.version, transaction.updatedAt)) {
      console.log('[Realtime] Skipped outdated transaction:updated event');
      return;
    }

    const categoryKey = transactionKeys.kanbanColumn(categoryId, {
      month: filters.month,
      type: filters.type,
      search: filters.search,
    });

    // Update transaction in cache
    queryClient.setQueryData(
      categoryKey,
      (old: { pages: KanbanPaginatedResponse[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.map(t => 
              t.id === transaction.id ? transaction : t
            ),
          })),
        };
      }
    );

    // Update version tracking
    updateTransactionVersion(transaction.id, transaction.version, transaction.updatedAt);

    console.log(`[Realtime] Transaction updated: ${transaction.id}`, {
      version: transaction.version,
      updatedAt: transaction.updatedAt,
    });
  };

  /**
   * Handle transaction deleted
   */
  const handleTransactionDeleted = (event: WebSocketEvent<TransactionDeletedEvent>) => {
    const { transactionId, categoryId } = event.data;

    // Deduplicate events
    const eventKey = `deleted-${transactionId}`;
    const now = Date.now();
    const lastProcessed = processedEvents.current.get(eventKey);
    
    if (lastProcessed && (now - lastProcessed) < 3000) {
      console.log('[Realtime] Skipped duplicate deleted event:', eventKey);
      return;
    }
    
    processedEvents.current.set(eventKey, now);
    const timeoutId = setTimeout(() => processedEvents.current.delete(eventKey), 5000);
    pendingTimeouts.current.push(timeoutId);

    // ✅ VERSION CHECK: For delete events
    // Note: Delete events might not have version, but we check timestamp
    const version = (event.data as any).version;
    const timestamp = event.timestamp;
    if (isOutdatedEvent(transactionId, version, timestamp)) {
      console.log('[Realtime] Skipped outdated transaction:deleted event');
      return;
    }

    const categoryKey = transactionKeys.kanbanColumn(categoryId, {
      month: filters.month,
      type: filters.type,
      search: filters.search,
    });

    // Remove from cache
    queryClient.setQueryData(
      categoryKey,
      (old: { pages: KanbanPaginatedResponse[]; pageParams: unknown[] } | undefined) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            items: page.items.filter(t => t.id !== transactionId),
            total: page.total - 1,
            pagination: {
              ...page.pagination,
              totalAvailable: page.pagination.totalAvailable - 1,
            },
          })),
        };
      }
    );

    // Cleanup version tracking for deleted transaction
    transactionVersions.current.delete(transactionId);
    transactionVersions.current.delete(`${transactionId}-ts`);

    console.log(`[Realtime] Transaction deleted: ${transactionId}`);
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Check if transaction is currently being mutated (optimistic update)
   */
  const isTransactionBeingMutated = (transactionId: string): boolean => {
    const mutations = queryClient.getMutationCache().getAll();
    
    return mutations.some(mutation => {
      const variables = mutation.state.variables as any;
      return (
        variables?.transactionId === transactionId &&
        mutation.state.status === 'pending'
      );
    });
  };

  /**
   * Process queued updates after mutation completes
   */
  useEffect(() => {
    // Check if there are queued updates
    if (queuedUpdates.current.length === 0) return;

    // Process queued updates
    const updates = [...queuedUpdates.current];
    queuedUpdates.current = [];

    updates.forEach(event => {
      switch (event.type) {
        case WebSocketEventType.TRANSACTION_MOVED:
          handleTransactionMoved(event as WebSocketEvent<TransactionMovedEvent>);
          break;
      }
    });

    if (updates.length > 0) {
      console.log(`[Realtime] Processed ${updates.length} queued updates`);
    }
  }, [queryClient.getMutationCache().getAll().length]);
}
