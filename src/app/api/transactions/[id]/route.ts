import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toTransactionItem } from "@/lib/db-helpers";
import { TransactionType } from "@prisma/client";
import { requireUser } from "@/lib/api-auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const { id } = await params;
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) return new NextResponse("Not found", { status: 404 });

  return NextResponse.json(toTransactionItem(tx));
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return new NextResponse("Not found", { status: 404 });

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: body.amount,
        type: body.type as TransactionType,
        categoryId: body.categoryId,
        categoryName: body.categoryName,
        categoryIcon: body.categoryIcon ?? existing.categoryIcon,
        date: body.date,
        note: body.note ?? null,
        version: { increment: 1 },
      },
    });

    return NextResponse.json(toTransactionItem(updated));
  } catch {
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  try {
    const { id } = await params;

    const existing = await prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) return new NextResponse("Not found", { status: 404 });

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 },
    );
  }
}
