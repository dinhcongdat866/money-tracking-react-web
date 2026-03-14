import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTransactionItem } from "@/lib/db-helpers";
import { TransactionType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? undefined;
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

    const tx = await prisma.transaction.create({
      data: {
        amount: body.amount,
        type: body.type as TransactionType,
        categoryId: body.categoryId,
        categoryName: body.categoryName,
        categoryIcon: body.categoryIcon ?? null,
        date: body.date,
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
