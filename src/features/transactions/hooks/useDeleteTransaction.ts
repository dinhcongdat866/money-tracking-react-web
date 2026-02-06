import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
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
import type { PaginatedTransactionsResponse } from "../api/transactions-api";

type DeleteTransactionContext = {
  previousTransactions: Array<[QueryKey, unknown]>;
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

  return useMutation<void, ApiError, string, DeleteTransactionContext>({
    mutationKey: ["transactions", "mutation", "delete"],
    mutationFn: deleteTransaction,
    // Optimistic update: remove the transaction from relevant cached transaction lists
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      const previousTransactions = queryClient.getQueriesData(
        { queryKey: transactionKeys.all },
      );

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

      return { previousTransactions };
    },
    onError: (_error, _id, context) => {
      // Rollback to previous state if mutation fails
      if (!context?.previousTransactions) return;
      for (const [queryKey, data] of context.previousTransactions) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: (_data, _error, id) => {
      // Ensure detail view is refreshed
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      // Ensure lists and aggregates are in sync with server
      invalidateAllTransactions(queryClient);
      invalidateAllFinancial(queryClient);
      invalidateAllAnalytics(queryClient);
    },
    ...options,
  });
}

