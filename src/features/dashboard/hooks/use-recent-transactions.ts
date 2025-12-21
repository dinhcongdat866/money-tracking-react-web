import { useQuery } from "@tanstack/react-query";
import { getRecentTransactions } from "../api/dashboard-api";
import { Transaction } from "../types";

export function useRecentTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["recentTransactions"],
    queryFn: getRecentTransactions,
    staleTime: 0, // Financial data: always refetch from server
  });
}


