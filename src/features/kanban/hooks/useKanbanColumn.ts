'use client';

import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { STALE_TIME, transactionKeys } from '@/lib/query-keys';
import { getKanbanColumnData } from '../api/kanban-api';
import type { KanbanFilters, KanbanPaginatedResponse } from '../types';
import type { TransactionItem } from '@/features/transactions/types';

/**
 * Kanban Column Infinite Query Hook
 * 
 * Infinite scroll implementation for transaction categories.
 * 
 * Features:
 * - Cursor-based pagination (100 items per page)
 * - Handles 2000+ items per column smoothly
 * - Smart caching with 1-minute staleTime
 * - Automatic background refetch on focus
 * - Flattened pages for virtual list consumption
 * 
 * @param categoryId - Category ID for this column
 * @param filters - Month, type, search filters
 */
export function useKanbanColumn(categoryId: string, filters: KanbanFilters) {
  const { month, type = 'all', search } = filters;

  const query = useInfiniteQuery<
    KanbanPaginatedResponse,
    Error,
    InfiniteData<KanbanPaginatedResponse>,
    ReturnType<typeof transactionKeys.kanbanColumn>,
    string | undefined
  >({
    queryKey: transactionKeys.kanbanColumn(categoryId, {
      month,
      type,
      search,
    }),
    
    queryFn: ({ pageParam }) => {
      return getKanbanColumnData({
        cursor: pageParam,
        category: categoryId,
        month,
        type,
        search,
      });
    },
    
    // Extract cursor from last page for next fetch
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined;
    },
    
    // Initial page param (no cursor = first page)
    initialPageParam: undefined,
    
    // Cache data for 1 minute to prevent redundant fetches
    staleTime: STALE_TIME.MEDIUM,
    
    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,
    
    // Keep previous data while refetching (smooth UX)
    placeholderData: (previousData) => previousData,
  });

  // Flatten all pages into single array for virtualization
  const transactions = query.data?.pages.flatMap(page => page.items) ?? [];
  
  const firstPage = query.data?.pages[0];
  const total = firstPage?.categoryTotal ?? 0;
  const totalCount = firstPage?.total ?? 0;
  const totalIncome = firstPage?.totalIncome ?? 0;
  const totalExpenses = firstPage?.totalExpenses ?? 0;

  return {
    transactions,
    total,
    totalCount,
    totalIncome,
    totalExpenses,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook for all Kanban columns at once
 * 
 * Returns data for all columns in a single call.
 * Each column uses its own infinite query.
 * 
 * @param categories - List of category IDs
 * @param filters - Global filters (month, type, search)
 */
export function useKanbanColumns(
  categories: string[],
  filters: KanbanFilters
) {
  // Create queries for all categories. Categories list is stable (TRANSACTION_CATEGORIES).
  const columns = categories.map((categoryId) => {
    return {
      categoryId,
      // eslint-disable-next-line react-hooks/rules-of-hooks -- categoryIds from TRANSACTION_CATEGORIES, stable at runtime
      ...useKanbanColumn(categoryId, filters),
    };
  });

  const summary = {
    totalTransactions: columns.reduce((sum, col) => sum + col.totalCount, 0),
    totalIncome: columns.reduce((sum, col) => sum + col.totalIncome, 0),
    totalExpenses: columns.reduce((sum, col) => sum + col.totalExpenses, 0),
    net: 0,
  };
  summary.net = summary.totalIncome - summary.totalExpenses;

  return {
    columns,
    summary,
    isLoading: columns.some(col => col.isLoading),
    isFetching: columns.some(col => col.isFetching),
  };
}

/**
 * Get flattened transactions for a column
 * Helper to convert infinite query pages to flat array
 */
export function flattenInfiniteQueryPages(
  data: { pages: { items: TransactionItem[] }[] } | undefined
): TransactionItem[] {
  return data?.pages.flatMap(page => page.items) ?? [];
}
