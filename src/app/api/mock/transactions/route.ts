import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, getMonthKey, addTransaction } from "./mock-data";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const limit = Math.max(parseInt(searchParams.get("limit") ?? "20", 10), 1);

  // Simulate network latency so loaders are visible
  await delay(3000);

  const allTransactions = getAllTransactions();
  const filtered = month
    ? allTransactions.filter(
        (t) => getMonthKey(new Date(t.date)) === month,
      )
    : allTransactions;

  // Sort by date desc to keep pagination deterministic
  filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const total = filtered.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const items = filtered.slice(start, end);

  return NextResponse.json({
    items,
    page,
    pageSize: limit,
    total,
    hasMore: end < total,
  });
}

export async function POST(req: NextRequest) {
  try {
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
    
    delay(3000);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

