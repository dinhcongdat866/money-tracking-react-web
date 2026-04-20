import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TimeRange } from "@/features/dashboard/types";
import { requireUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { searchParams } = new URL(req.url);
  const timeRange = searchParams.get("timeRange") as TimeRange;
  const limit = parseInt(searchParams.get("limit") ?? "5", 10);

  const now = new Date();
  let startDate: string;

  if (timeRange === "week") {
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);
    startDate = monday.toISOString().split("T")[0] ?? "";
  } else {
    startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const todayStr = now.toISOString().split("T")[0] ?? "";

  const rows = await prisma.transaction.groupBy({
    by: ["categoryId", "categoryName"],
    where: {
      userId,
      type: "expense",
      date: { gte: startDate, lte: todayStr },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  const totalExpense = rows.reduce((sum, r) => sum + (r._sum.amount ?? 0), 0);

  const result = rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName,
    expense: Math.round((r._sum.amount ?? 0) * 100) / 100,
    ratio:
      totalExpense > 0
        ? Math.round(((r._sum.amount ?? 0) / totalExpense) * 100) / 100
        : 0,
  }));

  return NextResponse.json(result);
}
