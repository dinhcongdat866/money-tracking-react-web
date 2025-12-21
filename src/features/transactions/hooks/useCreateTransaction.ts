import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction, type CreateTransactionData } from "../api/transactions-api";

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSettled: () => {
      // Invalidate all related queries to refetch from server
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

