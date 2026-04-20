import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MonthlySummary } from "@/features/transactions/types";
import { requireUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json(
      { error: "Month is required in format YYYY-MM" },
      { status: 400 },
    );
  }

  const rows = await prisma.transaction.findMany({
    where: { userId, date: { startsWith: month } },
    select: { type: true, amount: true },
  });

  const income = rows
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = rows
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const difference = income - expenses;

  const [year, m] = month.split("-").map(Number);
  const label = new Date(Number(year), (m ?? 1) - 1, 1).toLocaleDateString("en-US", {
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
