import { NextRequest, NextResponse } from "next/server";
import { getMonthlySummary } from "@/lib/mock-data/mock-data-service";
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

  // Simulate network latency
  await delay(300);

  const summary = getMonthlySummary(month);
  
  // Format month label
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
    totalBefore: summary.totalBefore,
    totalAfter: summary.totalAfter,
    difference: summary.difference,
  };

  return NextResponse.json(result);
}


