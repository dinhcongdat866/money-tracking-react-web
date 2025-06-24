import { useQuery } from "@tanstack/react-query";
import { getMostSpentExpenses } from "../api/dashboard-api";
import { TimeRange } from "../types";

export function useMostSpentExpenses(timeRange: TimeRange, limit: number = 3) {
  return useQuery({
    queryKey: ["mostSpentExpenses", timeRange, limit],
    queryFn: () => getMostSpentExpenses(timeRange, limit),
  })
}