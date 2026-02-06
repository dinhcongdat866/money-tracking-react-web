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
  financialKeys,
  analyticsKeys,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UpdateTransactionVariables = {
  id: string;
  data: UpdateTransactionData;
};

type UpdateTransactionContext = {
  previousMonthKey?: string;
};

export type UseUpdateTransactionOptions = BaseMutationOptions<
  TransactionItem,
  UpdateTransactionVariables,
  UpdateTransactionContext
>;

export function useUpdateTransaction(
  options?: UseUpdateTransactionOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<
    TransactionItem,
    ApiError,
    UpdateTransactionVariables,
    UpdateTransactionContext
  >({
    mutationFn: ({ id, data }) => updateTransaction(id, data),
    onMutate: async ({ id }) => {
      const prev = queryClient.getQueryData<TransactionItem>(
        transactionKeys.detail(id),
      );
      let previousMonthKey: string | undefined;
      if (prev) {
        const d = new Date(prev.date);
        previousMonthKey = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}`;
      }

      return { previousMonthKey };
    },
    onSettled: (data, _error, variables, context) => {
      // Invalidate the specific transaction detail
      queryClient.invalidateQueries({
        queryKey: transactionKeys.detail(variables.id),
      });

      const affectedMonths = new Set<string>();

      if (context?.previousMonthKey) {
        affectedMonths.add(context.previousMonthKey);
      }

      if (data) {
        const d = new Date(data.date);
        affectedMonths.add(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0",
          )}`,
        );
      }

      for (const monthKey of affectedMonths) {
        queryClient.invalidateQueries({
          queryKey: transactionKeys.monthly(monthKey),
        });
        queryClient.invalidateQueries({
          queryKey: transactionKeys.monthlySummary(monthKey),
        });
      }

      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(),
      });

      queryClient.invalidateQueries({ queryKey: financialKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
    ...options,
  });
}

