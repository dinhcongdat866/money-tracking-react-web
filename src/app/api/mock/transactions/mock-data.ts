import type { TransactionItem } from "@/features/transactions/types";

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

export const MOCK_TRANSACTIONS: TransactionItem[] = [
  {
    id: "t1",
    amount: 25.5,
    type: "expense",
    category: { id: "1", name: "Food & Drink" },
    date: "2025-12-03T12:00:00.000Z",
    note: "Lunch",
  },
  {
    id: "t2",
    amount: 1200,
    type: "income",
    category: { id: "2", name: "Salary" },
    date: "2025-12-02T09:00:00.000Z",
    note: "Monthly salary",
  },
  {
    id: "t3",
    amount: 60,
    type: "expense",
    category: { id: "3", name: "Transport" },
    date: "2025-11-28T18:30:00.000Z",
    note: "Gas",
  },
  {
    id: "t4",
    amount: 40,
    type: "expense",
    category: { id: "4", name: "Entertainment" },
    date: "2025-11-15T20:00:00.000Z",
    note: "Movies",
  },
  {
    id: "t5",
    amount: 500,
    type: "expense",
    category: { id: "5", name: "Rent" },
    date: "2025-12-03T09:00:00.000Z",
    note: "Rent",
  },
];


