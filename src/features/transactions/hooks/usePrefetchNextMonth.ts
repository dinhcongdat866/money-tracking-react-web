import { useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { transactionKeys } from "@/lib/query-keys";
import {
  getMonthlySummaryApi,
  getMonthlyTransactions,
} from "../api/transactions-api";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getNextMonthKey(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  const base = new Date(y ?? new Date().getFullYear(), (m ?? 1) - 1, 1);
  base.setMonth(base.getMonth() + 1);
  return getMonthKey(base);
}

export function usePrefetchNextMonth(
  selectedMonth: string,
  pageSize: number = 10,
  minIntervalMs: number = 1000,
) {
  const queryClient = useQueryClient();
  const lastRunRef = useRef<number>(0);

  const run = useCallback(() => {
    const now = Date.now();
    if (now - lastRunRef.current < minIntervalMs) return;
    lastRunRef.current = now;

    const nextMonthKey = getNextMonthKey(selectedMonth);

    void queryClient.prefetchInfiniteQuery({
      queryKey: transactionKeys.monthly(nextMonthKey),
      queryFn: ({ pageParam = 1 }) =>
        getMonthlyTransactions(nextMonthKey, pageParam as number, pageSize),
      initialPageParam: 1,
      getNextPageParam: (
        lastPage: { hasMore: boolean; page: number },
      ) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    });

    void queryClient.prefetchQuery({
      queryKey: transactionKeys.monthlySummary(nextMonthKey),
      queryFn: () => getMonthlySummaryApi(nextMonthKey),
    });
  }, [minIntervalMs, pageSize, queryClient, selectedMonth]);

  return run;
}

