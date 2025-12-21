import type { TransactionItem } from "@/features/transactions/types";

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

// In-memory storage for transactions
let MOCK_TRANSACTIONS: TransactionItem[] = [
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

// Helper functions to manipulate transactions
export function getAllTransactions(): TransactionItem[] {
  return [...MOCK_TRANSACTIONS];
}

export function getTransactionById(id: string): TransactionItem | undefined {
  return MOCK_TRANSACTIONS.find((t) => t.id === id);
}

export function addTransaction(transaction: Omit<TransactionItem, "id">): TransactionItem {
  const newTransaction: TransactionItem = {
    ...transaction,
    id: `t${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  MOCK_TRANSACTIONS.push(newTransaction);
  return newTransaction;
}

export function updateTransaction(id: string, updates: Partial<Omit<TransactionItem, "id">>): TransactionItem | null {
  const index = MOCK_TRANSACTIONS.findIndex((t) => t.id === id);
  if (index === -1) {
    return null;
  }
  MOCK_TRANSACTIONS[index] = {
    ...MOCK_TRANSACTIONS[index],
    ...updates,
    id, // Ensure id doesn't change
  };
  return MOCK_TRANSACTIONS[index];
}

export function deleteTransaction(id: string): boolean {
  const index = MOCK_TRANSACTIONS.findIndex((t) => t.id === id);
  if (index === -1) {
    return false;
  }
  MOCK_TRANSACTIONS.splice(index, 1);
  return true;
}

// Export for backward compatibility
export { MOCK_TRANSACTIONS };


