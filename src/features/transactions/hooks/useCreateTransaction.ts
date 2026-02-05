import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import {
  createTransaction,
  type CreateTransactionData,
} from "../api/transactions-api";
import type { TransactionItem } from "../types";
import type { PaginatedTransactionsResponse } from "../api/transactions-api";
import {
  invalidateAllTransactions,
  invalidateAllFinancial,
  invalidateAllAnalytics,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

type CreateTransactionContext = {
  previousTransactions: Array<
    [QueryKey, InfiniteData<PaginatedTransactionsResponse> | undefined]
  >;
};

export type UseCreateTransactionOptions = BaseMutationOptions<
  TransactionItem,
  CreateTransactionData,
  CreateTransactionContext
>;

export function useCreateTransaction(
  options?: UseCreateTransactionOptions,
) {
  const queryClient = useQueryClient();

  return useMutation<
    TransactionItem,
    ApiError,
    CreateTransactionData,
    CreateTransactionContext
  >({
    mutationFn: createTransaction,
    // Optimistic update: add the new transaction to all cached transaction lists
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: ["transactions"] });

      const previousTransactions =
        queryClient.getQueriesData<InfiniteData<PaginatedTransactionsResponse>>(
          { queryKey: ["transactions"] },
        );

      const optimisticTransaction: TransactionItem = {
        id: `optimistic-${Date.now()}`,
        amount: newTransaction.amount,
        type: newTransaction.type,
        category: {
          id: newTransaction.categoryId,
          name: newTransaction.categoryName,
        },
        date: newTransaction.date,
        note: newTransaction.note,
      };

      for (const [queryKey, data] of previousTransactions) {
        if (!data) continue;

        const updated: InfiniteData<PaginatedTransactionsResponse> = {
          pageParams: data.pageParams,
          pages: data.pages.map((page, index) => {
            if (index === 0) {
              return {
                ...page,
                items: [optimisticTransaction, ...page.items],
                total: page.total + 1,
              };
            }
            return page;
          }),
        };

        queryClient.setQueryData(queryKey, updated);
      }

      return { previousTransactions };
    },
    onError: (_error, _variables, context) => {
      // Rollback to previous state if mutation fails
      if (!context?.previousTransactions) return;
      for (const [queryKey, data] of context.previousTransactions) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: () => {
      // Ensure data is in sync with server
      invalidateAllTransactions(queryClient);
      invalidateAllFinancial(queryClient);
      invalidateAllAnalytics(queryClient);
    },
    ...options,
  });
}

