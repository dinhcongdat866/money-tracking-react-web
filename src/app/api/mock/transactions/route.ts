import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, getMonthKey, addTransaction } from "./mock-data";

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const allTransactions = getAllTransactions();
  const data = month
    ? allTransactions.filter(
        (t) => getMonthKey(new Date(t.date)) === month,
      )
    : allTransactions;

  return NextResponse.json(data);
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
    
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

