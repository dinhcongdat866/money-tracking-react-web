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
  transactionKeys,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

type CreateTransactionContext = {
  previousTransactions: Array<[QueryKey, unknown]>;
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
    mutationKey: ["transactions", "mutation", "create"],
    mutationFn: createTransaction,
    // Optimistic update: add the new transaction to relevant cached transaction lists
    onMutate: async (newTransaction) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      const previousTransactions = queryClient.getQueriesData(
        { queryKey: transactionKeys.all },
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

      // Determine the month bucket of the new transaction
      const txDate = new Date(newTransaction.date);
      const txMonthKey = `${txDate.getFullYear()}-${String(
        txDate.getMonth() + 1,
      ).padStart(2, "0")}`;

      for (const [key, data] of previousTransactions) {
        if (!Array.isArray(key) || key[0] !== "transactions" || !data) continue;

        const scope = key[1];

        // Monthly lists: only update the month that matches the new transaction
        if (scope === "monthly") {
          const monthKey = key[2];
          if (monthKey !== txMonthKey) continue;
        } else if (scope === "detail") {
          // Skip detail queries entirely
          continue;
        }

        // Runtime guard to ensure we only cast when data looks like InfiniteData
        const infinite = data as InfiniteData<PaginatedTransactionsResponse>;
        if (!Array.isArray(infinite.pages)) continue;

        const updated: InfiniteData<PaginatedTransactionsResponse> = {
          pageParams: infinite.pageParams,
          pages: infinite.pages.map((page, index) => {
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

        queryClient.setQueryData(key, updated);
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

