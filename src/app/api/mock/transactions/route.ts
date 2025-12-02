import { NextRequest, NextResponse } from "next/server";
import { MOCK_TRANSACTIONS, getMonthKey } from "./mock-data";

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");

  const data = month
    ? MOCK_TRANSACTIONS.filter(
        (t) => getMonthKey(new Date(t.date)) === month,
      )
    : MOCK_TRANSACTIONS;

  return NextResponse.json(data);
}

