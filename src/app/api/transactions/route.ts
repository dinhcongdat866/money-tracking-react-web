import { NextRequest, NextResponse } from "next/server";
import { addTransaction } from "../mock/transactions/mock-data";

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

