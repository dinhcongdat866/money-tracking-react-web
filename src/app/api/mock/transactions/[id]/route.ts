import { NextRequest, NextResponse } from "next/server";
import { getTransactionById, updateTransaction, deleteTransaction } from "../mock-data";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  await delay(400);
  const { id } = await params;
  const tx = getTransactionById(id);

  if (!tx) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(tx);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await delay(400);
    const { id } = await params;
    const body = await req.json();

    const updated = updateTransaction(id, {
      amount: body.amount,
      type: body.type,
      category: {
        id: body.categoryId,
        name: body.categoryName,
      },
      date: body.date,
      note: body.note,
    });

    if (!updated) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await delay(3000);
    const { id } = await params;
    const deleted = deleteTransaction(id);

    if (!deleted) {
      return new NextResponse("Not found", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}


