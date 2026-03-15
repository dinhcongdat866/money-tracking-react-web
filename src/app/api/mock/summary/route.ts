import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get("timeRange") || "week";

  const now = new Date();
  let currentStart: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (timeRange === "week") {
    // Current week: Mon–today
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon = 0
    currentStart = new Date(now);
    currentStart.setDate(now.getDate() - dayOfWeek);
    currentStart.setHours(0, 0, 0, 0);

    previousEnd = new Date(currentStart);
    previousEnd.setDate(currentStart.getDate() - 1);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);
  } else {
    // Current month
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  const toDateStr = (d: Date): string => d.toISOString().split("T")[0] ?? "";

  const [currentRows, previousRows] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: { gte: toDateStr(currentStart), lte: toDateStr(now) },
        type: "expense",
      },
      select: { amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        date: { gte: toDateStr(previousStart), lte: toDateStr(previousEnd) },
        type: "expense",
      },
      select: { amount: true },
    }),
  ]);

  const current = currentRows.reduce((s, t) => s + t.amount, 0);
  const previous = previousRows.reduce((s, t) => s + t.amount, 0);

  return NextResponse.json({
    current: Math.round(current * 100) / 100,
    previous: Math.round(previous * 100) / 100,
  });
}
