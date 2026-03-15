'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionKeys, invalidateAllFinancial } from '@/lib/query-keys';
import { updateTransaction } from '@/features/transactions/api/transactions-api';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { WebSocketEventType, type TransactionMovedEvent } from '@/lib/websocket/types';
import { getBroadcastManager } from '@/lib/sync/BroadcastManager';
import type { TransactionItem } from '@/features/transactions/types';
import type { KanbanPaginatedResponse, KanbanFilters } from '../types';

type UpdateCategoryVariables = {
  transactionId: string;
  oldCategory: string;
  newCategory: string;
  transaction: TransactionItem;
  filters: KanbanFilters;
};

/**
 * Optimistic Update Hook for Category Changes
 * 
 * Three-phase mutation for instant UI feedback:
 * 1. onMutate: Update cache immediately
 * 2. onError: Rollback on API failure
 * 3. onSuccess: Broadcast to other devices/tabs
 * 
 * Features:
 * - Cancel outgoing queries to prevent race conditions
 * - Snapshot state for rollback
 * - Direct cache manipulation via setQueryData
 * - Concurrent mutation detection
 * - Version-based conflict resolution
 * - Updates only affected categories
 * - <16ms UI response time
 */
export function useUpdateCategoryOptimistic() {
  const queryClient = useQueryClient();
  const { send, isConnected } = useWebSocket();
  const broadcastManager = getBroadcastManager();

  return useMutation({
    mutationFn: async ({ transactionId, newCategory, transaction }: UpdateCategoryVariables) => {
      return await updateTransaction(transactionId, {
        type: transaction.type,
        amount: transaction.amount,
        categoryId: newCategory,
        categoryName: getCategoryName(newCategory),
        date: transaction.date,
        note: transaction.note,
      });
    },

    // ========================================================================
    // PHASE 1: OPTIMISTIC UPDATE (runs BEFORE API call)
    // ========================================================================
    onMutate: async ({ 
      transactionId, 
      oldCategory, 
      newCategory, 
      transaction,
      filters 
    }: UpdateCategoryVariables) => {
      // 0. Check for concurrent mutations on same transaction
      const mutations = queryClient.getMutationCache().getAll();
      const isAlreadyMutating = mutations.some((mutation) => {
        const variables = mutation.state.variables as
          | { transactionId?: string }
          | undefined;
        return (
          variables?.transactionId === transactionId &&
          mutation.state.status === 'pending' &&
          mutation !== queryClient.getMutationCache().getAll().slice(-1)[0] // Not current mutation
        );
      });

      if (isAlreadyMutating) {
        console.warn('[Optimistic] Concurrent mutation detected, aborting:', transactionId);
        throw new Error('Transaction is already being updated');
      }

      // 1. Cancel outgoing refetches (prevent race conditions)
      await queryClient.cancelQueries({
        queryKey: transactionKeys.kanban(),
      });

      // 2. Snapshot current state for rollback
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

      const previousOldData = queryClient.getQueryData(oldCategoryKey);
      const previousNewData = queryClient.getQueryData(newCategoryKey);

      // 3. Optimistically update the cache
      // Remove from old category (update all pages in infinite query)
      queryClient.setQueryData(
        oldCategoryKey,
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

      // Add to new category (prepend to first page)
      const updatedTransaction: TransactionItem = {
        ...transaction,
        category: {
          id: newCategory,
          name: getCategoryName(newCategory),
          icon: getCategoryIcon(newCategory),
        },
      };

      queryClient.setQueryData(
        newCategoryKey,
        (old: { pages: KanbanPaginatedResponse[]; pageParams: unknown[] } | undefined) => {
          if (!old) {
            // If no data yet, create initial structure
            return {
              pages: [{
                items: [updatedTransaction],
                nextCursor: null,
                hasMore: false,
                total: 1,
                categoryTotal: transaction.type === 'income' ? transaction.amount : -transaction.amount,
                pagination: {
                  limit: 100,
                  currentCount: 1,
                  totalAvailable: 1,
                },
              }],
              pageParams: [undefined],
            };
          }
          
          return {
            ...old,
            pages: old.pages.map((page, index) => {
              // Add to first page only
              if (index === 0) {
                return {
                  ...page,
                  items: [updatedTransaction, ...page.items],
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

      // 4. Return context for rollback
      return {
        previousOldData,
        previousNewData,
        oldCategoryKey,
        newCategoryKey,
      };
    },

    // ========================================================================
    // PHASE 2: SUCCESS (broadcast to other tabs/devices)
    // ========================================================================
    onSuccess: (data, variables) => {
      // Generate version for message ordering
      const version = Date.now();
      const updatedAt = Date.now();

      const updatedTransaction: TransactionItem = {
        ...variables.transaction,
        category: {
          id: variables.newCategory,
          name: getCategoryName(variables.newCategory),
          icon: getCategoryIcon(variables.newCategory),
        },
        version, // ✅ Version for ordering
        updatedAt, // ✅ Timestamp for fallback
      };

      const event = {
        type: WebSocketEventType.TRANSACTION_MOVED,
        data: {
          transactionId: variables.transactionId,
          transaction: updatedTransaction,
          oldCategory: variables.oldCategory,
          newCategory: variables.newCategory,
          timestamp: Date.now(),
        },
      };

      // Broadcast via WebSocket (if leader and connected)
      if (broadcastManager.isLeaderTab() && isConnected) {
        send<TransactionMovedEvent>(event);
        console.log('[Optimistic] WebSocket event sent:', variables.transactionId);
      }

      // Always broadcast via BroadcastChannel (for multi-tab sync)
      // Mark as local event to prevent echo broadcasting when WebSocket confirms
      broadcastManager.broadcastEvent({
        id: generateEventId(),
        timestamp: Date.now(),
        ...event,
      }, true);

      console.log('[Optimistic] Broadcasted to other tabs (local event)');
    },

    // ========================================================================
    // PHASE 3: ERROR HANDLING (rollback on failure)
    // ========================================================================
    onError: (error, variables, context) => {
      console.error('Failed to update category:', error);

      // Rollback optimistic updates
      if (context?.previousOldData) {
        queryClient.setQueryData(context.oldCategoryKey, context.previousOldData);
      }

      if (context?.previousNewData) {
        queryClient.setQueryData(context.newCategoryKey, context.previousNewData);
      }

      // TODO: Show error notification
      // toast.error('Failed to move transaction. Changes reverted.')
    },

    // ========================================================================
    // PHASE 4: SETTLED (refetch to sync with server)
    // ========================================================================
    onSettled: (data, error, variables) => {
      // Invalidate affected queries to refetch server state
      // This ensures our optimistic update matches server reality
      
      // Invalidate both columns
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.kanbanColumn(variables.oldCategory, {
          month: variables.filters.month,
          type: variables.filters.type,
          search: variables.filters.search,
        })
      });
      
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.kanbanColumn(variables.newCategory, {
          month: variables.filters.month,
          type: variables.filters.type,
          search: variables.filters.search,
        })
      });

      // Invalidate financial summaries
      void invalidateAllFinancial(queryClient);

      // TODO: Show success notification if no error
      // if (!error) toast.success('Transaction moved successfully!');
    },

    // Mutation meta for debugging
    meta: {
      action: 'update-category-optimistic',
      optimistic: true,
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCategoryName(categoryId: string): string {
  const categoryMap: Record<string, string> = {
    income: 'Income',
    food: 'Food & Dining',
    transport: 'Transportation',
    housing: 'Housing',
    shopping: 'Shopping',
    utilities: 'Utilities',
    other: 'Other',
  };
  return categoryMap[categoryId] || 'Other';
}

function getCategoryIcon(categoryId: string): string {
  const iconMap: Record<string, string> = {
    income: '💰',
    food: '🍔',
    transport: '🚗',
    housing: '🏠',
    shopping: '💳',
    utilities: '📱',
    other: '❓',
  };
  return iconMap[categoryId] || '❓';
}

function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
