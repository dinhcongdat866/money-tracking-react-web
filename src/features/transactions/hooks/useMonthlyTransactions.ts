import { useQuery } from "@tanstack/react-query";
import { getMonthlyTransactions } from "../api/transactions-api";
import type { TransactionItem } from "../types";

export function useMonthlyTransactions(month: string) {
  return useQuery<TransactionItem[]>({
    queryKey: ["transactions", month],
    queryFn: () => getMonthlyTransactions(month),
    enabled: Boolean(month),
    staleTime: 0, // Financial data: always refetch from server
  });
}


