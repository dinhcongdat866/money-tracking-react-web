import type { QueryClient } from "@tanstack/react-query";

/**
 * Query Key Factory Pattern
 * 
 * Centralized, type-safe query keys for React Query.
 * This pattern ensures:
 * - Type safety and autocomplete
 * - Easy invalidation by scope
 * - Refactor-safe code
 */

export const STALE_TIME = {
  /** Always fresh - refetch immediately (0ms) */
  REALTIME: 0,
  
  /** Short cache - slightly stale OK (30s) */
  SHORT: 30 * 1000,
  
  /** Medium cache - moderate staleness (1min) */
  MEDIUM: 60 * 1000,
  
  /** Long cache - rarely changes (5min) */
  LONG: 5 * 60 * 1000,
  
  /** Static - never expires (Infinity) */
  STATIC: Infinity,
} as const;

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const transactionKeys = {
  /** Base key for all transaction queries */
  all: ['transactions'] as const,

  /** All list queries */
  lists: () => [...transactionKeys.all, 'list'] as const,

  /** Specific list query by filters */
  list: (filters: { month?: string; page?: number; limit?: number }) =>
    [...transactionKeys.lists(), filters] as const,

  /** Monthly transactions query */
  monthly: (month: string) =>
    [...transactionKeys.all, 'monthly', month] as const,

  /** Monthly summary query for a specific month */
  monthlySummary: (month: string) =>
    [...transactionKeys.all, 'monthlySummary', month] as const,

  /** Recent transactions query */
  recent: () =>
    [...transactionKeys.all, 'recent'] as const,

  /** All category queries (for Kanban board) */
  categories: () => [...transactionKeys.all, 'category'] as const,

  /** Transactions by category query (for Kanban columns) */
  byCategory: (category: string, filters?: { month?: string; limit?: number }) =>
    filters
      ? [...transactionKeys.categories(), category, filters] as const
      : [...transactionKeys.categories(), category] as const,

  /** All transactions with infinite scroll (for Kanban board with all categories) */
  infinite: (filters?: { month?: string; category?: string; search?: string }) =>
    filters
      ? [...transactionKeys.all, 'infinite', filters] as const
      : [...transactionKeys.all, 'infinite'] as const,

  /** All detail queries */
  details: () => [...transactionKeys.all, 'detail'] as const,

  /** Specific transaction detail query */
  detail: (id: string) =>
    [...transactionKeys.details(), id] as const,
} as const;

// ============================================================================
// FINANCIAL METRICS (Summary, Balance)
// ============================================================================

export const financialKeys = {
  /** Base key for all financial metric queries */
  all: ['financial'] as const,

  /** Summary query - can be used in dashboard, reports, etc. */
  summary: (timeRange?: string) =>
    timeRange
      ? [...financialKeys.all, 'summary', timeRange] as const
      : [...financialKeys.all, 'summary'] as const,

  /** Balance query - can be used in dashboard, header, etc. */
  balance: () =>
    [...financialKeys.all, 'balance'] as const,
} as const;

// ============================================================================
// ANALYTICS (Expenses, Reports, Insights)
// ============================================================================

export const analyticsKeys = {
  /** Base key for all analytics queries */
  all: ['analytics'] as const,

  /** Most spent expenses query - can be used in dashboard, reports, etc. */
  mostSpentExpenses: (timeRange?: string, limit?: number) => {
    const key = [...analyticsKeys.all, 'mostSpentExpenses'] as const;
    if (timeRange !== undefined && limit !== undefined) {
      return [...key, timeRange, limit] as const;
    }
    if (timeRange !== undefined) {
      return [...key, timeRange] as const;
    }
    return key;
  },
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Invalidate all transaction queries
 */
export function invalidateAllTransactions(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: transactionKeys.all });
}

/**
 * Invalidate specific category query (for Kanban column updates)
 */
export function invalidateCategory(queryClient: QueryClient, category: string) {
  return queryClient.invalidateQueries({ queryKey: transactionKeys.byCategory(category) });
}

/**
 * Invalidate multiple categories (for drag & drop between columns)
 */
export function invalidateCategories(queryClient: QueryClient, categories: string[]) {
  return Promise.all(
    categories.map(category => invalidateCategory(queryClient, category))
  );
}

/**
 * Invalidate all financial metric queries (summary, balance)
 */
export function invalidateAllFinancial(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: financialKeys.all });
}

/**
 * Invalidate all analytics queries
 */
export function invalidateAllAnalytics(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
}

/**
 * Invalidate all queries (useful for logout, etc.)
 */
export function invalidateAll(queryClient: QueryClient) {
  void Promise.all([
    invalidateAllTransactions(queryClient),
    invalidateAllFinancial(queryClient),
    invalidateAllAnalytics(queryClient),
  ]);
}

