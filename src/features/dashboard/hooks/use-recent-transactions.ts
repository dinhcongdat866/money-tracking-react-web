import { useInfiniteQuery } from "@tanstack/react-query";
import { getRecentTransactions } from "../api/dashboard-api";
import type { PaginatedTransactionsResponse } from "@/features/transactions/api/transactions-api";

const PAGE_SIZE = 10;

export function useRecentTransactions() {
  return useInfiniteQuery<PaginatedTransactionsResponse>({
    queryKey: ["recentTransactions"],
    queryFn: ({ pageParam = 1 }) =>
      getRecentTransactions(pageParam as number, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 0, // Financial data: always refetch from server
  });
}


