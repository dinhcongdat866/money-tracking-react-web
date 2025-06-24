"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useMostSpentExpenses } from "../hooks/use-most-spent-expenses";
import { TimeRange } from "../types";

export function MostSpentExpenseCard({ timeRange, limit = 3 }: { timeRange: TimeRange, limit?: number }) {
  const { data, isLoading, isError } = useMostSpentExpenses(timeRange, limit);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top Spending Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-muted-foreground text-sm">Loading...</p>}
        {isError && <p className="text-destructive text-sm">Failed to load data.</p>}
        {data?.map((item) => (
          <div key={item.categoryId} className="flex items-center justify-between">
            <div className="text-sm font-medium">{item.categoryName}</div>
            <div className="text-sm text-muted-foreground">
              ${item.expense.toLocaleString()} ({Math.round(item.ratio * 100)}%)
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
