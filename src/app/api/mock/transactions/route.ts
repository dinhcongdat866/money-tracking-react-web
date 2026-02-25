import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, addTransaction } from "./mock-data";
import type { TransactionItem } from "@/features/transactions/types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? undefined;
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1);

  await delay(300);

  let transactions = getAllTransactions();
  
  if (month) {
    transactions = transactions.filter(t => t.date.startsWith(month));
  }
  
  const total = transactions.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = transactions.slice(startIndex, endIndex);
  
  return NextResponse.json({
    items,
    page,
    pageSize: limit,
    total,
    hasMore: endIndex < total,
  });
}

export async function POST(req: NextRequest) {
  try {
    await delay(300);
    const body = await req.json();
    
    const transaction = addTransaction({
      amount: body.amount,
      type: body.type,
      category: {
        id: body.categoryId,
        name: body.categoryName,
      },
      date: body.date,
      note: body.note,
    });
    
    return NextResponse.json(transaction, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

