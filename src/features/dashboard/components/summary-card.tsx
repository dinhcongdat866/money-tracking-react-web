"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useSummary } from "../hooks/use-summary";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TimeRange } from "../types";

export function SummaryCard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const { data, isLoading } = useSummary(timeRange);

  const summary = data
    ? [
        {
          name: timeRange === "week" ? "Last Week" : "Last Month",
          value: data.previous,
        },
        {
          name: timeRange === "week" ? "This Week" : "This Month",
          value: data.current,
        },
      ]
    : [];

  const changePercent =
    data && data.previous
      ? ((data.current - data.previous) / data.previous) * 100
      : 0;

  return (
    <Card className="h-full">
      <CardHeader className="space-y-1 pb-2">
        <p className="text-xs font-medium text-muted-foreground">Summary Card</p>
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {timeRange === "week" ? "This Week vs Last Week" : "This Month vs Last Month"}
          </CardTitle>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="h-[180px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary} barSize={40}>
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => `${v}$`} />
              <Tooltip
                formatter={(v: number) => `${v.toLocaleString()}$`}
              />
              <Bar dataKey="value">
                {summary.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 1 ? "#0ea5e9" : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
      <div className="px-6 pb-4">
        {!isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {changePercent >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            {Math.abs(changePercent).toFixed(1)}%
            {changePercent >= 0 ? " increase" : " decrease"} compared to last{" "}
            {timeRange}
          </div>
        )}
      </div>
    </Card>
  );
}