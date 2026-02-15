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


