"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMostSpentExpenses } from "../hooks/use-most-spent-expenses";
import { TimeRange } from "../types"

const timeRanges: TimeRange[] = ["week", "month"]

export function MostSpentExpensesCard({ limit = 3 }: { limit?: number }) {
  const [range, setRange] = useState<TimeRange>("month");
  const { data, isLoading } = useMostSpentExpenses(range, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Top Expenses
          <div className="flex gap-2">
            {timeRanges.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={t === range ? "default" : "ghost"}
                onClick={() => setRange(t)}
              >
                {t === "week" ? "This Week" : "This Month"}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading...</p>}
        {!isLoading && data && data.length > 0 && (
          <ul className="space-y-2">
            {data.map((item) => (
              <li key={item.categoryId} className="flex justify-between">
                <span>{item.categoryName}</span>
                <span className="text-muted-foreground">
                  ${item.expense} ({(item.ratio * 100).toFixed(0)}%)
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
