import { NextResponse } from "next/server";
import type { Transaction } from "@/features/dashboard/types";

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    amount: 25.5,
    type: "expense",
    category: {
      id: "1",
      name: "Food & Drink",
    },
    date: new Date().toISOString(),
    note: "Lunch with friends ",
  },
  {
    id: "2",
    amount: 1200,
    type: "income",
    category: {
      id: "2",
      name: "Salary",
    },
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    note: "Monthly salary",
  },
  {
    id: "3",
    amount: 60,
    type: "expense",
    category: {
      id: "3",
      name: "Transport",
    },
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    note: "Gas",
  },
];

export function GET() {
  return NextResponse.json(MOCK_TRANSACTIONS);
}


