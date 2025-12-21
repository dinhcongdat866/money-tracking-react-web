import { useQuery } from "@tanstack/react-query";
import { getTransactionDetail } from "../api/transactions-api";
import type { TransactionItem } from "../types";

export function useTransactionDetail(id: string | undefined) {
  return useQuery<TransactionItem>({
    queryKey: ["transaction", id],
    queryFn: () => getTransactionDetail(id as string),
    enabled: Boolean(id),
    staleTime: 0, // Financial data: always refetch from server
  });
}


