import { useInfiniteQuery } from "@tanstack/react-query";
import { getRecentTransactions } from "../api/dashboard-api";
import type { PaginatedTransactionsResponse } from "@/features/transactions/api/transactions-api";
import { transactionKeys, STALE_TIME } from "@/lib/query-keys";
import type { SimpleInfiniteQueryOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

const PAGE_SIZE = 10;

export type UseRecentTransactionsOptions = SimpleInfiniteQueryOptions<PaginatedTransactionsResponse>;

export function useRecentTransactions(
  options?: UseRecentTransactionsOptions,
) {
  return useInfiniteQuery<PaginatedTransactionsResponse, ApiError>({
    queryKey: transactionKeys.recent(),
    queryFn: ({ pageParam = 1 }) =>
      getRecentTransactions(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: STALE_TIME.REALTIME,
    ...options,
  });
}


