import { useQuery } from "@tanstack/react-query";
import { getSummary } from "../api/dashboard-api";
import { TimeRange, type Summary } from "../types";
import { financialKeys, STALE_TIME } from "@/lib/query-keys";
import type { BaseQueryOptions, QueryKeyOf } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UseSummaryOptions = BaseQueryOptions<
  Summary,
  QueryKeyOf<typeof financialKeys.summary>
>;

export function useSummary(
  timeRange: TimeRange,
  options?: UseSummaryOptions,
) {
  return useQuery<Summary, ApiError, Summary, QueryKeyOf<typeof financialKeys.summary>>({
    queryKey: financialKeys.summary(timeRange),
    queryFn: () => getSummary(timeRange),
    staleTime: STALE_TIME.SHORT,
    placeholderData: (previousData) => previousData,
    ...options,
  });
}
