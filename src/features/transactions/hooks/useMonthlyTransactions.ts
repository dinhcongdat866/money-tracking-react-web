import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getMonthlyTransactions,
  type PaginatedTransactionsResponse,
} from "../api/transactions-api";

const PAGE_SIZE = 10;

export function useMonthlyTransactions(month: string) {
  return useInfiniteQuery<PaginatedTransactionsResponse>({
    queryKey: ["transactions", month],
    queryFn: ({ pageParam = 1 }) =>
      getMonthlyTransactions(month, pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: Boolean(month),
    staleTime: 0, // Financial data: always refetch from server
  });
}


