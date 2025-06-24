import { useQuery } from "@tanstack/react-query";
import { getSummary } from "../api/dashboard-api";
import { TimeRange } from "../types";

export function useSummary(timeRange: TimeRange) {
  return useQuery({
    queryKey: ["summary", timeRange],
    queryFn: () => getSummary(timeRange),
    staleTime: 1000 * 60 * 60 * 1,
  });
}
