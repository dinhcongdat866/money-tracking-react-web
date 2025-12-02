"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthSelector } from "./components/MonthSelector";
import { MonthlySummaryReport } from "./components/MonthlySummaryReport";
import { DailyGroupedTransactions } from "./components/DailyGroupedTransactions";
import type { GroupedTransactions, MonthlySummary, TransactionItem } from "./types";
import { useMonthlyTransactions } from "./hooks/useMonthlyTransactions";

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getRecentMonthKeys(count: number = 3): string[] {
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
}

export default function TransactionsPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(now));

  const availableMonths = useMemo(() => getRecentMonthKeys(3), []);

  const { data: monthlyTransactions = [], isLoading, isError } =
    useMonthlyTransactions(selectedMonth);

  const currentMonthDate = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, (month ?? 1) - 1, 1);
  }, [selectedMonth]);

  const grouped: GroupedTransactions = useMemo(() => {
    if (!monthlyTransactions || monthlyTransactions.length === 0) return [];

    const groupsMap = new Map<
      string,
      { date: string; dailyTotal: number; transactions: TransactionItem[] }
    >();

    for (const tx of monthlyTransactions) {
      const d = new Date(tx.date);
      const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const existing = groupsMap.get(dateKey) ?? {
        date: dateKey,
        dailyTotal: 0,
        transactions: [],
      };

      const signedAmount = tx.type === "income" ? tx.amount : -tx.amount;
      existing.dailyTotal += signedAmount;
      existing.transactions.push(tx);
      groupsMap.set(dateKey, existing);
    }

    const result = Array.from(groupsMap.values());

    // Sort date DESC, and transactions inside each group DESC by time
    result.sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const group of result) {
      group.transactions.sort((a, b) =>
        a.date < b.date ? 1 : -1
      );
    }

    return result;
  }, [monthlyTransactions]);

  const monthlySummary: MonthlySummary = useMemo(() => {
    if (!monthlyTransactions || monthlyTransactions.length === 0) {
      return {
        month: formatMonthLabel(currentMonthDate),
        totalBefore: 0,
        totalAfter: 0,
        difference: 0,
      };
    }

    const totalIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const before = totalIncome; // mock: before = income
    const after = totalIncome - totalExpense;
    const difference = after - before;

    return {
      month: formatMonthLabel(currentMonthDate),
      totalBefore: before,
      totalAfter: after,
      difference,
    };
  }, [monthlyTransactions, currentMonthDate]);

  const hasData = monthlyTransactions.length > 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg font-semibold">
            Monthly Overview
          </CardTitle>
          <MonthSelector
            months={availableMonths}
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Failed to load transactions.
            </p>
          ) : hasData ? (
            <>
              <MonthlySummaryReport summary={monthlySummary} />
              <DailyGroupedTransactions groups={grouped} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transactions for this month.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


