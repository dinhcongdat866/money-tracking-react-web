import type { TransactionItem } from "@/features/transactions/types";

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

// Initial mock data
const INITIAL_MOCK_TRANSACTIONS: TransactionItem[] = [
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
  {
    id: "t6",
    amount: 18.75,
    type: "expense",
    category: { id: "1", name: "Food & Drink" },
    date: "2025-12-04T08:10:00.000Z",
    note: "Coffee & bagel",
  },
  {
    id: "t7",
    amount: 82.4,
    type: "expense",
    category: { id: "6", name: "Groceries" },
    date: "2025-12-04T19:45:00.000Z",
    note: "Weekly grocery run",
  },
  {
    id: "t8",
    amount: 230,
    type: "expense",
    category: { id: "7", name: "Utilities" },
    date: "2025-12-01T14:00:00.000Z",
    note: "Electricity bill",
  },
  {
    id: "t9",
    amount: 55,
    type: "expense",
    category: { id: "3", name: "Transport" },
    date: "2025-12-05T07:50:00.000Z",
    note: "Ride share",
  },
  {
    id: "t10",
    amount: 320,
    type: "expense",
    category: { id: "8", name: "Health" },
    date: "2025-11-30T10:15:00.000Z",
    note: "Dental checkup",
  },
  {
    id: "t11",
    amount: 45,
    type: "income",
    category: { id: "9", name: "Refund" },
    date: "2025-12-06T11:25:00.000Z",
    note: "Order refund",
  },
  {
    id: "t12",
    amount: 75,
    type: "income",
    category: { id: "10", name: "Gift" },
    date: "2025-11-27T16:00:00.000Z",
    note: "Gift from friend",
  },
  {
    id: "t13",
    amount: 2600,
    type: "income",
    category: { id: "2", name: "Salary" },
    date: "2025-11-25T09:00:00.000Z",
    note: "Side contract",
  },
  {
    id: "t14",
    amount: 95,
    type: "expense",
    category: { id: "11", name: "Shopping" },
    date: "2025-12-06T13:40:00.000Z",
    note: "Clothes",
  },
  {
    id: "t15",
    amount: 12,
    type: "expense",
    category: { id: "1", name: "Food & Drink" },
    date: "2025-12-06T18:20:00.000Z",
    note: "Snacks",
  },
  {
    id: "t16",
    amount: 150,
    type: "expense",
    category: { id: "12", name: "Education" },
    date: "2025-12-02T21:10:00.000Z",
    note: "Online course",
  },
  {
    id: "t17",
    amount: 42,
    type: "expense",
    category: { id: "4", name: "Entertainment" },
    date: "2025-12-05T22:00:00.000Z",
    note: "Streaming subs",
  },
  {
    id: "t18",
    amount: 15,
    type: "income",
    category: { id: "9", name: "Refund" },
    date: "2025-12-05T12:30:00.000Z",
    note: "Return credit",
  },
  {
    id: "t19",
    amount: 410,
    type: "expense",
    category: { id: "7", name: "Utilities" },
    date: "2025-10-29T09:10:00.000Z",
    note: "Water + gas",
  },
  {
    id: "t20",
    amount: 200,
    type: "expense",
    category: { id: "13", name: "Travel" },
    date: "2025-11-10T06:30:00.000Z",
    note: "Train tickets",
  },
  {
    id: "t21",
    amount: 38,
    type: "expense",
    category: { id: "1", name: "Food & Drink" },
    date: "2025-12-07T08:15:00.000Z",
    note: "Breakfast",
  },
  {
    id: "t22",
    amount: 210,
    type: "income",
    category: { id: "10", name: "Gift" },
    date: "2025-12-07T15:45:00.000Z",
    note: "Family gift",
  },
  {
    id: "t23",
    amount: 67,
    type: "expense",
    category: { id: "11", name: "Shopping" },
    date: "2025-12-07T17:20:00.000Z",
    note: "Books",
  },
];

// Use globalThis to persist data across hot reloads and module re-initializations
// This is a dev-only pattern to simulate persistent storage
const GLOBAL_STORAGE_KEY = "__MOCK_TRANSACTIONS_STORAGE__";

function getMockTransactions(): TransactionItem[] {
  // Type assertion for globalThis
  const globalStorage = globalThis as typeof globalThis & {
    [GLOBAL_STORAGE_KEY]?: TransactionItem[];
  };

  // If data exists in globalThis, use it; otherwise initialize with default data
  if (!globalStorage[GLOBAL_STORAGE_KEY]) {
    globalStorage[GLOBAL_STORAGE_KEY] = [...INITIAL_MOCK_TRANSACTIONS];
  }

  return globalStorage[GLOBAL_STORAGE_KEY]!;
}

// In-memory storage for transactions (now backed by globalThis)
const MOCK_TRANSACTIONS = getMockTransactions();

// Helper functions to manipulate transactions
export function getAllTransactions(): TransactionItem[] {
  return [...getMockTransactions()];
}

export function getTransactionById(id: string): TransactionItem | undefined {
  return getMockTransactions().find((t) => t.id === id);
}

export function addTransaction(transaction: Omit<TransactionItem, "id">): TransactionItem {
  const transactions = getMockTransactions();
  const newTransaction: TransactionItem = {
    ...transaction,
    id: `t${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  transactions.push(newTransaction);
  return newTransaction;
}

export function updateTransaction(id: string, updates: Partial<Omit<TransactionItem, "id">>): TransactionItem | null {
  const transactions = getMockTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return null;
  }
  transactions[index] = {
    ...transactions[index],
    ...updates,
    id, // Ensure id doesn't change
  };
  return transactions[index];
}

export function deleteTransaction(id: string): boolean {
  const transactions = getMockTransactions();
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) {
    return false;
  }
  transactions.splice(index, 1);
  return true;
}

// Export for backward compatibility
export { MOCK_TRANSACTIONS };


