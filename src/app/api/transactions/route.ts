import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTransactionItem } from "@/lib/db-helpers";
import { TransactionType, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const month = searchParams.get("month") ?? undefined;

  // Kanban mode: cursor-based by category (same data as list, different shape)
  if (category) {
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") ?? "100", 10), 1),
      200,
    );
    const typeParam = searchParams.get("type") as
      | "income"
      | "expense"
      | "all"
      | null;
    const search = searchParams.get("search");

    const where: Prisma.TransactionWhereInput = {};
    if (month) where.date = { startsWith: month };
    where.categoryId = category;
    if (typeParam && typeParam !== "all") {
      where.type = typeParam as TransactionType;
    }
    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
        { categoryName: { contains: search, mode: "insensitive" } },
      ];
    }

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

    const items = await prisma.transaction.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "asc" }],
      take: limit + 1,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
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

  // List mode: page/limit for Transactions page
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1);
  const where = month ? { date: { startsWith: month } } : {};

  const [total, rows] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    items: rows.map(toTransactionItem),
    page,
    pageSize: limit,
    total,
    hasMore: page * limit < total,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawDate = body.date as string;
    const dateOnly =
      typeof rawDate === "string" && rawDate.includes("T")
        ? rawDate.slice(0, 10)
        : rawDate;

    const tx = await prisma.transaction.create({
      data: {
        amount: body.amount,
        type: body.type as TransactionType,
        categoryId: body.categoryId,
        categoryName: body.categoryName,
        categoryIcon: body.categoryIcon ?? null,
        date: dateOnly,
        note: body.note ?? null,
      },
    });

    return NextResponse.json(toTransactionItem(tx), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 },
    );
  }
}
