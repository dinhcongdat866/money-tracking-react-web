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


