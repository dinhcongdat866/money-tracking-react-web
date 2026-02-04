"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TransactionItem } from "../types";

type ExpenseByCategoryProps = {
  transactions: TransactionItem[];
};

type CategoryExpense = {
  categoryId: string;
  categoryName: string;
  expense: number;
  percentage: number;
  color: string;
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
];

export function ExpenseByCategory({ transactions }: ExpenseByCategoryProps) {
  const categoryExpenses = useMemo(() => {
    const expenseMap = new Map<string, { name: string; total: number }>();

    transactions
      .filter((tx) => tx.type === "expense")
      .forEach((tx) => {
        const existing = expenseMap.get(tx.category.id) ?? {
          name: tx.category.name,
          total: 0,
        };
        existing.total += tx.amount;
        expenseMap.set(tx.category.id, existing);
      });

    const totalExpense = Array.from(expenseMap.values()).reduce(
      (sum, item) => sum + item.total,
      0
    );

    const result: CategoryExpense[] = Array.from(expenseMap.entries()).map(
      ([categoryId, { name, total }], index) => ({
        categoryId,
        categoryName: name,
        expense: total,
        percentage: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
        color: CHART_COLORS[index % CHART_COLORS.length],
      })
    );

    result.sort((a, b) => b.expense - a.expense);

    return result;
  }, [transactions]);

  const chartData = categoryExpenses.map((item) => ({
    name: item.categoryName,
    value: item.expense,
    percentage: item.percentage,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toLocaleString()} ({data.payload.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (categoryExpenses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground text-center">
          No expense data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold mb-4">Expense by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percentage }) => `${percentage.toFixed(1)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={categoryExpenses[index].color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-semibold mb-4">Category Details</h3>
        <div className="space-y-3">
          {categoryExpenses.map((item) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between py-2 border-b last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.categoryName}</span>
              </div>
              <span className="text-sm font-semibold">
                ${item.expense.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

