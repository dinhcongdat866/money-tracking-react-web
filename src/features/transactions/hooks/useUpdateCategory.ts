'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionKeys, invalidateAllFinancial } from '@/lib/query-keys';
import { updateTransaction } from '../api/transactions-api';
import type { TransactionItem } from '../types';

type UpdateCategoryVariables = {
  transactionId: string;
  oldCategory: string;
  newCategory: string;
  transaction: TransactionItem;
};

/**
 * Update Transaction Category with Optimistic Updates
 * 
 * Re-categorize transactions via drag & drop.
 * 
 * Three-phase mutation pattern:
 * 1. onMutate: Update cache immediately (optimistic)
 * 2. onError: Rollback on API failure
 * 3. onSuccess: Refetch to sync with server
 * 
 * Features:
 * - Cancel outgoing queries to prevent race conditions
 * - Snapshot current state for rollback
 * - Direct cache manipulation via setQueryData
 * - Handles concurrent updates and network failures
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, newCategory, transaction }: UpdateCategoryVariables) => {
      // API call to update transaction
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
    onMutate: async ({ transactionId, oldCategory, newCategory, transaction }: UpdateCategoryVariables) => {
      // 1. Cancel outgoing refetches (prevent race conditions)
      // If a background refetch completes after our optimistic update,
      // it would overwrite our optimistic state
      await queryClient.cancelQueries({
        queryKey: transactionKeys.all,
      });

      // 2. Snapshot current state for rollback
      const previousOldCategoryData = queryClient.getQueryData<TransactionItem[]>(
        transactionKeys.byCategory(oldCategory)
      );
      const previousNewCategoryData = queryClient.getQueryData<TransactionItem[]>(
        transactionKeys.byCategory(newCategory)
      );

      // 3. Optimistically update the cache
      // Remove from old category
      queryClient.setQueryData<TransactionItem[]>(
        transactionKeys.byCategory(oldCategory),
        (old) => old?.filter(t => t.id !== transactionId) ?? []
      );

      // Add to new category with updated category info
      const updatedTransaction: TransactionItem = {
        ...transaction,
        category: {
          id: newCategory,
          name: getCategoryName(newCategory),
          icon: getCategoryIcon(newCategory),
        },
      };

      queryClient.setQueryData<TransactionItem[]>(
        transactionKeys.byCategory(newCategory),
        (old) => {
          const existing = old ?? [];
          // Add at beginning (most recent)
          return [updatedTransaction, ...existing];
        }
      );

      // 4. Update monthly data cache if it exists
      // Note: Monthly cache stores PaginatedTransactionsResponse, not array
      const monthKey = transactionKeys.monthly(transaction.date.substring(0, 7));
      const monthlyData = queryClient.getQueryData(monthKey);
      
      if (monthlyData) {
        type MonthlyData = { items: TransactionItem[]; [key: string]: unknown };
        queryClient.setQueryData(
          monthKey,
          (old: MonthlyData | undefined) => {
            if (!old?.items) return old;
            return {
              ...old,
              items: old.items.map((t: TransactionItem) =>
                t.id === transactionId ? updatedTransaction : t
              ),
            };
          }
        );
      }

      // 5. Return context for rollback
      return {
        previousOldCategoryData,
        previousNewCategoryData,
        oldCategory,
        newCategory,
        transactionId,
      };
    },

    // ========================================================================
    // PHASE 2: ERROR HANDLING (rollback on failure)
    // ========================================================================
    onError: (error, variables, context) => {
      console.error('Failed to update category:', error);

      // Rollback optimistic updates
      if (context?.previousOldCategoryData) {
        queryClient.setQueryData(
          transactionKeys.byCategory(context.oldCategory),
          context.previousOldCategoryData
        );
      }

      if (context?.previousNewCategoryData) {
        queryClient.setQueryData(
          transactionKeys.byCategory(context.newCategory),
          context.previousNewCategoryData
        );
      }

      // Show error notification
      // toast.error('Failed to update category. Changes reverted.')
    },

    // ========================================================================
    // PHASE 3: SUCCESS (refetch to sync with server)
    // ========================================================================
    onSuccess: (_data, variables) => {
      // Invalidate related queries to refetch server state
      // This ensures our optimistic update matches server reality
      
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byCategory(variables.newCategory),
      });
      
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byCategory(variables.oldCategory),
      });

      // Invalidate financial summaries (balance, totals)
      void invalidateAllFinancial(queryClient);

      // Show success notification
      // toast.success('Transaction category updated!')
    },

    // Mutation meta for debugging and logging
    meta: {
      action: 'update-category',
      optimistic: true,
    },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get category display name by ID
 */
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

/**
 * Get category icon by ID
 */
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
