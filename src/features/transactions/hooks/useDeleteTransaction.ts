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
  previousTransactions: Array<
    [QueryKey, InfiniteData<PaginatedTransactionsResponse> | undefined]
  >;
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
    mutationFn: deleteTransaction,
    // Optimistic update: remove the transaction from all cached transaction lists
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["transactions"] });

      const previousTransactions =
        queryClient.getQueriesData<InfiniteData<PaginatedTransactionsResponse>>(
          { queryKey: ["transactions"] },
        );

      for (const [queryKey, data] of previousTransactions) {
        if (!data) continue;

        const updated: InfiniteData<PaginatedTransactionsResponse> = {
          pageParams: data.pageParams,
          pages: data.pages.map((page) => {
            const filteredItems = page.items.filter((tx) => tx.id !== id);
            return {
              ...page,
              items: filteredItems,
              total: filteredItems.length < page.items.length
                ? page.total - 1
                : page.total,
            };
          }),
        };

        queryClient.setQueryData(queryKey, updated);
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

