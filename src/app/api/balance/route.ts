import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.response;
  const { userId } = auth;

  const rows = await prisma.transaction.findMany({
    where: { userId },
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
