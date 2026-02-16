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
  transactionKeys,
  financialKeys,
  analyticsKeys,
} from "@/lib/query-keys";
import type { BaseMutationOptions } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";
import { useToast } from "@/components/ToastProvider";

type CreateTransactionContext = {
  previousTransactions: Array<[QueryKey, unknown]>;
};

export type UseCreateTransactionOptions = BaseMutationOptions<
  TransactionItem,
  CreateTransactionData,
  CreateTransactionContext
>;

/**
 * Hook for creating a new transaction with optimistic updates
 * 
 * @description
 * This hook handles transaction creation with smart optimistic updates:
 * - Immediately adds the transaction to the UI (optimistic update)
 * - Only updates the specific month's cache (not all months)
 * - Rolls back on error
 * - Shows toast notifications for success/error
 * - Invalidates related queries after completion
 * 
 * @example
 * ```tsx
 * const { mutate, isPending } = useCreateTransaction();
 * 
 * const handleSubmit = () => {
 *   mutate({
 *     amount: 100,
 *     type: "expense",
 *     categoryId: "food",
 *     categoryName: "Food",
 *     date: new Date().toISOString(),
 *     note: "Lunch",
 *   });
 * };
 * ```
 * 
 * @example With async/await
 * ```tsx
 * const { mutateAsync } = useCreateTransaction();
 * 
 * const handleSubmit = async () => {
 *   try {
 *     const transaction = await mutateAsync({
 *       amount: 100,
 *       type: "expense",
 *       categoryId: "food",
 *       categoryName: "Food",
 *       date: new Date().toISOString(),
 *     });
 *     console.log("Created:", transaction.id);
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 * 
 * @param options - Optional mutation configuration (onSuccess, onError, etc.)
 * @returns React Query mutation object with mutate, mutateAsync, isPending, etc.
 */
export function useCreateTransaction(
  options?: UseCreateTransactionOptions,
) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    onSuccess: () => {
      showToast({
        title: "Transaction created",
        description: "Your transaction has been saved.",
        variant: "success",
      });
    },
    onError: (error, _variables, context) => {
      // Rollback to previous state if mutation fails
      if (context?.previousTransactions) {
        for (const [queryKey, data] of context.previousTransactions) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      showToast({
        title: "Failed to create transaction",
        description: error.message,
        variant: "error",
      });
    },
    onSettled: (data, _error, variables) => {
      const dateSource = data?.date ?? variables.date;
      const d = new Date(dateSource);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      // Invalidate only the affected monthly list and summary
      queryClient.invalidateQueries({
        queryKey: transactionKeys.monthly(monthKey),
      });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.monthlySummary(monthKey),
      });

      queryClient.invalidateQueries({
        queryKey: transactionKeys.recent(),
      });

      queryClient.invalidateQueries({ queryKey: financialKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
    },
    ...options,
  });
}

