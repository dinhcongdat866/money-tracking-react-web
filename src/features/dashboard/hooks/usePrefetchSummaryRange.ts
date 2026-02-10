import { useQueryClient } from "@tanstack/react-query";
import { financialKeys } from "@/lib/query-keys";
import { getSummary } from "../api/dashboard-api";
import type { TimeRange } from "../types";
import { useDebouncedCallback } from "@/lib/useDebouncedCallback";

export function usePrefetchSummaryRange(delay: number = 150) {
  const queryClient = useQueryClient();

  return useDebouncedCallback(
    (range: TimeRange) => {
      void queryClient.prefetchQuery({
        queryKey: financialKeys.summary(range),
        queryFn: () => getSummary(range),
        staleTime: 30 * 1000,
      });
    },
    delay,
  );
}

