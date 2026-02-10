"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useMostSpentExpenses } from "../hooks/use-most-spent-expenses";
import { TimeRange } from "../types";
import { usePrefetchMostSpentRange } from "../hooks/usePrefetchMostSpentRange";

export function MostSpentExpensesCard({ limit = 3 }: { limit?: number }) {
    const [range, setRange] = useState<TimeRange>("month");
    const { data, isLoading } = useMostSpentExpenses(range, limit);

    const { schedule, cancel } = usePrefetchMostSpentRange(limit);

    return (
        <Card>
            <CardHeader className="space-y-1 pb-2">
                <p className="text-xs font-medium text-muted-foreground">Most Spent Expenses Card</p>
                <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Top Expenses</CardTitle>
                    <div className="flex gap-2">
                        <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
                            <TabsList>
                                <TabsTrigger
                                    value="week"
                                    onMouseEnter={() => range !== "week" && schedule("week", limit)}
                                    onFocus={() => range !== "week" && schedule("week", limit)}
                                    onMouseLeave={cancel}
                                >
                                    Week
                                </TabsTrigger>
                                <TabsTrigger
                                    value="month"
                                    onMouseEnter={() => range !== "month" && schedule("month", limit)}
                                    onFocus={() => range !== "month" && schedule("month", limit)}
                                    onMouseLeave={cancel}
                                >
                                    Month
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading && <Skeleton className="h-10 w-full" />}
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
