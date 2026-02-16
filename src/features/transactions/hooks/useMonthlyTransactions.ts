import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getMonthlyTransactions,
  type PaginatedTransactionsResponse,
} from "../api/transactions-api";
import { transactionKeys, STALE_TIME } from "@/lib/query-keys";
import type { SimpleInfiniteQueryOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

const PAGE_SIZE = 10;

export type UseMonthlyTransactionsOptions = SimpleInfiniteQueryOptions<PaginatedTransactionsResponse>;

/**
 * Hook for fetching monthly transactions with infinite scroll pagination
 * 
 * @description
 * Fetches transactions for a specific month with pagination support:
 * - Infinite scroll with `fetchNextPage()`
 * - Realtime stale time (always fresh financial data)
 * - Placeholder data to prevent UI flicker during refetch
 * - Only fetches when month is provided
 * - Optimized with query key factory pattern
 * 
 * @example
 * ```tsx
 * const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = 
 *   useMonthlyTransactions("2026-02");
 * 
 * if (isLoading) return <Skeleton />;
 * 
 * return (
 *   <>
 *     {data.pages.map(page => 
 *       page.items.map(tx => <TransactionItem key={tx.id} {...tx} />)
 *     )}
 *     {hasNextPage && (
 *       <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
 *         {isFetchingNextPage ? "Loading..." : "Load More"}
 *       </button>
 *     )}
 *   </>
 * );
 * ```
 * 
 * @example With automatic infinite scroll
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useMonthlyTransactions("2026-02");
 * const { ref } = useIntersectionObserver({
 *   onIntersect: () => hasNextPage && fetchNextPage(),
 * });
 * 
 * return (
 *   <>
 *     {data?.pages.map(page => ...)}
 *     <div ref={ref}>Loading...</div>
 *   </>
 * );
 * ```
 * 
 * @param month - Month in YYYY-MM format (e.g., "2026-02")
 * @param options - Optional query configuration
 * @returns React Query infinite query object with pages, fetchNextPage, etc.
 */
export function useMonthlyTransactions(
  month: string,
  options?: UseMonthlyTransactionsOptions,
) {
  return useInfiniteQuery<PaginatedTransactionsResponse, ApiError>({
    queryKey: transactionKeys.monthly(month),
    queryFn: ({ pageParam = 1 }) =>
      getMonthlyTransactions(month, pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: Boolean(month),
    staleTime: STALE_TIME.REALTIME,
    placeholderData: (previousData) => previousData,
    ...options,
  });
}


