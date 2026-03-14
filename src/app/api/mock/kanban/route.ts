import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTransactionItem } from "@/lib/db-helpers";
import { TransactionType, Prisma } from "@prisma/client";

/**
 * Kanban API Route — cursor-based pagination backed by PostgreSQL.
 *
 * Query params:
 *   cursor   — last item ID from previous page
 *   limit    — items per page (default 100, max 200)
 *   category — filter by categoryId
 *   month    — filter by YYYY-MM
 *   type     — income | expense | all
 *   search   — full-text search in note, categoryName, amount
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const cursor = searchParams.get("cursor");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "100", 10), 1),
    200,
  );
  const category = searchParams.get("category");
  const month = searchParams.get("month") ?? undefined;
  const typeParam = searchParams.get("type") as
    | "income"
    | "expense"
    | "all"
    | null;
  const search = searchParams.get("search");

  // Build WHERE clause
  const where: Prisma.TransactionWhereInput = {};

  if (month) where.date = { startsWith: month };
  if (category) where.categoryId = category;
  if (typeParam && typeParam !== "all") {
    where.type = typeParam as TransactionType;
  }
  if (search) {
    where.OR = [
      { note: { contains: search, mode: "insensitive" } },
      { categoryName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Total counts for summary (all matching, not just current page)
  const [allRows, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: { type: true, amount: true },
    }),
    prisma.transaction.count({ where }),
  ]);

  const totalIncome = allRows
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = allRows
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const categoryTotal = totalIncome - totalExpenses;

  // Cursor-based page fetch
  const items = await prisma.transaction.findMany({
    where,
    orderBy: [{ date: "desc" }, { id: "asc" }],
    take: limit + 1, // fetch one extra to determine hasMore
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1, // skip the cursor item itself
        }
      : {}),
  });

  const hasMore = items.length > limit;
  const pageItems = items.slice(0, limit);
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null;

  return NextResponse.json({
    items: pageItems.map(toTransactionItem),
    nextCursor,
    hasMore,
    total,
    categoryTotal: Math.round(categoryTotal * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    pagination: {
      limit,
      currentCount: pageItems.length,
      totalAvailable: total,
    },
  });
}
