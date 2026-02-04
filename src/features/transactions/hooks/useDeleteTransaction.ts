import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { deleteTransaction } from "../api/transactions-api";
import {
  transactionKeys,
  invalidateAllTransactions,
  invalidateAllFinancial,
  invalidateAllAnalytics,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UseDeleteTransactionOptions = BaseMutationOptions<
  void,
  string
>;

export function useDeleteTransaction(
  options?: UseDeleteTransactionOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string, unknown>({
    mutationFn: deleteTransaction,
    onSettled: (data, error, id) => {
      // Invalidate the specific transaction detail
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      // Invalidate all transaction queries (includes monthly, recent)
      invalidateAllTransactions(queryClient);
      // Invalidate all financial metric queries (summary, balance)
      invalidateAllFinancial(queryClient);
      // Invalidate all analytics queries (mostSpentExpenses, etc.)
      invalidateAllAnalytics(queryClient);
    },
    ...options,
  });
}

