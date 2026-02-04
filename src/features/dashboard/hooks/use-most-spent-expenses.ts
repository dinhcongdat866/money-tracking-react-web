import { useQuery } from "@tanstack/react-query";
import { getMostSpentExpenses } from "../api/dashboard-api";
import { TimeRange, type CategoryExpense } from "../types";
import { analyticsKeys } from "@/lib/query-keys";
import type { BaseQueryOptions, QueryKeyOf } from "@/lib/react-query-types";
import type { ApiError } from "@/lib/api-errors";

export type UseMostSpentExpensesOptions = BaseQueryOptions<
  CategoryExpense[],
  QueryKeyOf<typeof analyticsKeys.mostSpentExpenses>
>;

export function useMostSpentExpenses(
  timeRange: TimeRange,
  limit: number = 3,
  options?: UseMostSpentExpensesOptions,
) {
  return useQuery<CategoryExpense[], ApiError, CategoryExpense[], QueryKeyOf<typeof analyticsKeys.mostSpentExpenses>>({
    queryKey: analyticsKeys.mostSpentExpenses(timeRange, limit),
    queryFn: () => getMostSpentExpenses(timeRange, limit),
    staleTime: 1000 * 60 * 60 * 1, // 1 hour
    ...options,
  });
}
