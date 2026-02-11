import { useQuery } from "@tanstack/react-query";
import { getMonthlySummaryApi } from "../api/transactions-api";
import type { MonthlySummary } from "../types";
import { transactionKeys } from "@/lib/query-keys";
import type { BaseQueryOptions, QueryKeyOf } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

type MonthlySummaryQueryKey = QueryKeyOf<typeof transactionKeys.monthlySummary>;

export type UseMonthlySummaryOptions = BaseQueryOptions<
  MonthlySummary,
  MonthlySummaryQueryKey
>;

export function useMonthlySummary(
  month: string,
  options?: UseMonthlySummaryOptions,
) {
  return useQuery<
    MonthlySummary,
    ApiError,
    MonthlySummary,
    MonthlySummaryQueryKey
  >({
    queryKey: transactionKeys.monthlySummary(month),
    queryFn: () => getMonthlySummaryApi(month),
    enabled: Boolean(month),
    staleTime: 0, // Always refetch for financial summary
    placeholderData: (previousData) => previousData, // Keep previous summary while fetching new month
    ...options,
  });
}


