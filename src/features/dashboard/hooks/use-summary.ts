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

/**
 * Hook for fetching financial summary data for the dashboard
 * 
 * @description
 * Fetches aggregated financial summary (total income, expenses, etc.) for a given time range:
 * - Short stale time (30s)
 * - Placeholder data to prevent UI flicker during refetch
 * - Supports multiple time ranges (TODAY, WEEK, MONTH, YEAR)
 * - Automatically invalidated when transactions change
 * 
 * @example
 * ```tsx
 * const { data, isLoading } = useSummary(TimeRange.MONTH);
 * 
 * if (isLoading) return <Skeleton />;
 * 
 * return (
 *   <div>
 *     <p>Income: ${data.totalIncome}</p>
 *     <p>Expenses: ${data.totalExpense}</p>
 *     <p>Net: ${data.totalIncome - data.totalExpense}</p>
 *   </div>
 * );
 * ```
 * 
 * @example With time range selector
 * ```tsx
 * const [range, setRange] = useState(TimeRange.MONTH);
 * const { data } = useSummary(range);
 * 
 * return (
 *   <>
 *     <select value={range} onChange={e => setRange(e.target.value)}>
 *       <option value={TimeRange.WEEK}>This Week</option>
 *       <option value={TimeRange.MONTH}>This Month</option>
 *       <option value={TimeRange.YEAR}>This Year</option>
 *     </select>
 *     <SummaryCard data={data} />
 *   </>
 * );
 * ```
 * 
 * @param timeRange - Time range for the summary (TODAY, WEEK, MONTH, YEAR)
 * @param options - Optional query configuration
 * @returns React Query query object with summary data
 */
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
