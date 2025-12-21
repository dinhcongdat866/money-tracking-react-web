import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTransaction, type UpdateTransactionData } from "../api/transactions-api";

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) =>
      updateTransaction(id, data),
    onSettled: (data, error, variables) => {
      // Invalidate all related queries to refetch from server
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

