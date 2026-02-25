import type { TransactionItem } from "@/features/transactions/types";
import generatedTransactions from "@/lib/mock-data/transactions.json";

export function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

// Load generated transactions from JSON file
const INITIAL_MOCK_TRANSACTIONS: TransactionItem[] = generatedTransactions as TransactionItem[];

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


