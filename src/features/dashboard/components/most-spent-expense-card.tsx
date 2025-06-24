"use client";

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMostSpentExpenses } from "../hooks/use-most-spent-expenses";
import { TimeRange } from "../types"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MostSpentExpensesCard({ limit = 3 }: { limit?: number }) {
    const [range, setRange] = useState<TimeRange>("month");
    const { data, isLoading } = useMostSpentExpenses(range, limit);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    Top Expenses
                    <div className="flex gap-2">
                        <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
                            <TabsList>
                                <TabsTrigger value="week">Week</TabsTrigger>
                                <TabsTrigger value="month">Month</TabsTrigger>
                            </TabsList>
                        </Tabs>
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
