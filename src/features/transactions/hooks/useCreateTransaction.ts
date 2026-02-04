import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createTransaction,
  type CreateTransactionData,
} from "../api/transactions-api";
import type { TransactionItem } from "../types";
import {
  invalidateAllTransactions,
  invalidateAllFinancial,
  invalidateAllAnalytics,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UseCreateTransactionOptions = BaseMutationOptions<
  TransactionItem,
  CreateTransactionData
>;

export function useCreateTransaction(
  options?: UseCreateTransactionOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<TransactionItem, ApiError, CreateTransactionData, unknown>({
    mutationFn: createTransaction,
    onSettled: () => {
      // Invalidate all transaction queries (includes monthly, recent, detail)
      invalidateAllTransactions(queryClient);
      // Invalidate all financial metric queries (summary, balance)
      invalidateAllFinancial(queryClient);
      // Invalidate all analytics queries (mostSpentExpenses, etc.)
      invalidateAllAnalytics(queryClient);
    },
    ...options,
  });
}

