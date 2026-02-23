import { NextRequest, NextResponse } from "next/server";
import { getTransactionById } from "@/lib/mock-data/mock-data-service";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteParams) {
  await delay(300);
  const { id } = await params;
  const tx = getTransactionById(id);

  if (!tx) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.json(tx);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    await delay(300);
    const { id } = await params;
    const body = await req.json();

    // For now: Just return optimistic update success
    // In real app, this would persist to database
    // In dev: Changes are lost on page refresh (expected for mock)
    
    const tx = getTransactionById(id);
    if (!tx) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Return updated transaction
    const updated = {
      ...tx,
      amount: body.amount,
      type: body.type,
      category: {
        id: body.categoryId,
        name: body.categoryName,
        icon: tx.category.icon,
      },
      date: body.date,
      note: body.note,
    };

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    await delay(1000);
    const { id } = await params;
    
    // Check if exists
    const tx = getTransactionById(id);
    if (!tx) {
      return new NextResponse("Not found", { status: 404 });
    }

    // For now: Just return success
    // In real app, this would delete from database
    // In dev: Changes are lost on page refresh (expected for mock)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}


