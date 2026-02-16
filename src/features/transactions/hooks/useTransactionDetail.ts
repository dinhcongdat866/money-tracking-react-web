import { useQuery } from "@tanstack/react-query";
import { getTransactionDetail } from "../api/transactions-api";
import type { TransactionItem } from "../types";
import { transactionKeys, STALE_TIME } from "@/lib/query-keys";
import type { BaseQueryOptions, QueryKeyOf } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

type DetailQueryKey = QueryKeyOf<typeof transactionKeys.detail>;

export type UseTransactionDetailOptions = BaseQueryOptions<
  TransactionItem,
  DetailQueryKey
>;

/**
 * Hook for fetching a single transaction's details
 * 
 * @description
 * Fetches detailed information about a specific transaction. Features:
 * - Only fetches when ID is provided
 * - Medium stale time (1 minute)
 * - Automatic refetch when ID changes
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useTransactionDetail("tx-123");
 * 
 * if (isLoading) return <Skeleton />;
 * if (isError) return <Error />;
 * if (!data) return null;
 * 
 * return <TransactionCard transaction={data} />;
 * ```
 * 
 * @example Conditional fetching
 * ```tsx
 * // Won't fetch when id is undefined
 * const { data } = useTransactionDetail(selectedId);
 * ```
 * 
 * @param id - The transaction ID to fetch (won't fetch if undefined)
 * @param options - Optional query configuration
 * @returns React Query query object with data, isLoading, isError, etc.
 */
export function useTransactionDetail(
  id: string | undefined,
  options?: UseTransactionDetailOptions,
) {
  return useQuery<TransactionItem, ApiError, TransactionItem, DetailQueryKey>({
    queryKey: transactionKeys.detail(id as string),
    queryFn: () => getTransactionDetail(id as string),
    enabled: Boolean(id),
    staleTime: STALE_TIME.MEDIUM,
    ...options,
  });
}


