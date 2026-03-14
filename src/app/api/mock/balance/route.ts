import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.transaction.findMany({
    select: { type: true, amount: true },
  });

  const income = rows
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = rows
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    amount: Math.round((income - expenses) * 100) / 100,
    currency: "USD",
  });
}
