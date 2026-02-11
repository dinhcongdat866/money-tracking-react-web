import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import { deleteTransaction } from "../api/transactions-api";
import {
  transactionKeys,
  financialKeys,
  analyticsKeys,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";
import { useToast } from "@/components/ToastProvider";
import type { PaginatedTransactionsResponse } from "../api/transactions-api";
import type { TransactionItem } from "../types";

type DeleteTransactionContext = {
  previousTransactions: Array<[QueryKey, unknown]>;
  previousMonthKey?: string;
};

export type UseDeleteTransactionOptions = BaseMutationOptions<
  void,
  string,
  DeleteTransactionContext
>;

export function useDeleteTransaction(
  options?: UseDeleteTransactionOptions,
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, ApiError, string, DeleteTransactionContext>({
    mutationKey: ["transactions", "mutation", "delete"],
    mutationFn: deleteTransaction,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      const previousTransactions = queryClient.getQueriesData(
        { queryKey: transactionKeys.all },
      );

      // Capture previous month of this transaction (if detail is cached)
      const prevDetail = queryClient.getQueryData<TransactionItem>(
        transactionKeys.detail(id),
      );
      let previousMonthKey: string | undefined;
      if (prevDetail) {
        const d = new Date(prevDetail.date);
        previousMonthKey = `${d.getFullYear()}-${String(
          d.getMonth() + 1,
        ).padStart(2, "0")}`;
      }

      for (const [key, data] of previousTransactions) {
        if (!Array.isArray(key) || key[0] !== "transactions" || !data) continue;

        const scope = key[1];

        // Skip detail queries entirely
        if (scope === "detail") continue;

        // Runtime guard to ensure we only cast when data looks like InfiniteData
        const infinite = data as InfiniteData<PaginatedTransactionsResponse>;
        if (!Array.isArray(infinite.pages)) continue;

        const updated: InfiniteData<PaginatedTransactionsResponse> = {
          pageParams: infinite.pageParams,
          pages: infinite.pages.map((page) => {
            const filteredItems = page.items.filter((tx) => tx.id !== id);
            return {
              ...page,
              items: filteredItems,
              total:
                filteredItems.length < page.items.length
                  ? page.total - 1
                  : page.total,
            };
          }),
        };

        queryClient.setQueryData(key, updated);
      }

      return { previousTransactions, previousMonthKey };
    },
    onSuccess: () => {
      showToast({
        title: "Transaction deleted",
        description: "The transaction has been removed.",
        variant: "success",
      });
    },
    onError: (error, _id, context) => {
      // Rollback to previous state if mutation fails
      if (context?.previousTransactions) {
        for (const [queryKey, data] of context.previousTransactions) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      showToast({
        title: "Failed to delete transaction",
        description: error.message,
        variant: "error",
      });
    },
    onSettled: (_data, _error, id, context) => {
      // Ensure detail view is refreshed
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });

      if (context?.previousMonthKey) {
        queryClient.invalidateQueries({
          queryKey: transactionKeys.monthly(context.previousMonthKey),
        });
        queryClient.invalidateQueries({
          queryKey: transactionKeys.monthlySummary(context.previousMonthKey),
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

