import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  updateTransaction,
  type UpdateTransactionData,
} from "../api/transactions-api";
import type { TransactionItem } from "../types";
import {
  transactionKeys,
  invalidateAllTransactions,
  invalidateAllFinancial,
  invalidateAllAnalytics,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UpdateTransactionVariables = {
  id: string;
  data: UpdateTransactionData;
};

export type UseUpdateTransactionOptions = BaseMutationOptions<
  TransactionItem,
  UpdateTransactionVariables
>;

export function useUpdateTransaction(
  options?: UseUpdateTransactionOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<TransactionItem, ApiError, UpdateTransactionVariables, unknown>({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onSettled: (data, error, variables) => {
      // Invalidate the specific transaction detail
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(variables.id),
      });
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

