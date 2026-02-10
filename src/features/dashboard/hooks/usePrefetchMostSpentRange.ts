import { useQueryClient } from "@tanstack/react-query";
import { analyticsKeys } from "@/lib/query-keys";
import { getMostSpentExpenses } from "../api/dashboard-api";
import type { TimeRange } from "../types";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";

export function usePrefetchMostSpentRange(defaultLimit: number = 3, delay: number = 150) {
  const queryClient = useQueryClient();

  return useDebouncedCallback(
    (range: TimeRange, limit: number = defaultLimit) => {
      void queryClient.prefetchQuery({
        queryKey: analyticsKeys.mostSpentExpenses(range, limit),
        queryFn: () => getMostSpentExpenses(range, limit),
        staleTime: 1000 * 60 * 60 * 1, // 1 hour
      });
    },
    delay,
  );
}

