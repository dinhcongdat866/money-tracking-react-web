import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTransaction } from "../api/transactions-api";

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransaction,
    onSettled: (data, error, id) => {
      // Invalidate all related queries to refetch from server
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["recentTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
    },
  });
}

