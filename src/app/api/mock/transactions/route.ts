import { NextRequest, NextResponse } from "next/server";
import { getTransactionsPaginated } from "@/lib/mock-data/mock-data-service";
import type { TransactionItem } from "@/features/transactions/types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? undefined;
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1);

  // Simulate network latency so loaders are visible
  await delay(300);

  // Use mock data service
  const result = getTransactionsPaginated(page, limit, { month });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    await delay(300);
    const body = await req.json();
    
    // Create new transaction
    // In real app: Save to database
    // In dev: Mock response (not persisted)
    const transaction: TransactionItem = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount: body.amount,
      type: body.type,
      category: {
        id: body.categoryId,
        name: body.categoryName,
      },
      date: body.date,
      note: body.note,
    };
    
    return NextResponse.json(transaction, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

