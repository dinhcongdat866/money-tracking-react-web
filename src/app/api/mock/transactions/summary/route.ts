import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions } from "../mock-data";
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

  await delay(300);

  const allTransactions = getAllTransactions();
  const monthTransactions = allTransactions.filter(t => t.date.startsWith(month));
  
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const difference = income - expenses;
  
  const [year, m] = month.split("-").map(Number);
  const label = new Date(
    year,
    (m ?? 1) - 1,
    1,
  ).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const result: MonthlySummary = {
    month: label,
    totalBefore: 0,
    totalAfter: difference,
    difference,
  };

  return NextResponse.json(result);
}


