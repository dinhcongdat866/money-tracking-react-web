import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, getMonthKey } from "../mock-data";
import type { MonthlySummary } from "@/features/transactions/types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json(
      { error: "Month is required in format YYYY-MM" },
      { status: 400 },
    );
  }

  // Simulate network latency so loaders are visible
  await delay(1000);

  const allTransactions = getAllTransactions();
  const filtered = allTransactions.filter(
    (t) => getMonthKey(new Date(t.date)) === month,
  );

  let summary: MonthlySummary;

  if (filtered.length === 0) {
    const [year, m] = month.split("-").map(Number);
    const label = new Date(
      year,
      (m ?? 1) - 1,
      1,
    ).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    summary = {
      month: label,
      totalBefore: 0,
      totalAfter: 0,
      difference: 0,
    };
  } else {
    const totalIncome = filtered
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filtered
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const before = totalIncome; // mock rule: before = income
    const after = totalIncome - totalExpense;
    const difference = after - before;

    const [year, m] = month.split("-").map(Number);
    const label = new Date(
      year,
      (m ?? 1) - 1,
      1,
    ).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    summary = {
      month: label,
      totalBefore: before,
      totalAfter: after,
      difference,
    };
  }

  return NextResponse.json(summary);
}


