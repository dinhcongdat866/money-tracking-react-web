/**
 * Mock Data Service
 * 
 * Provides access to generated mock transaction data
 * Simulates database queries with filtering, pagination, etc.
 */

import mockTransactions from './transactions.json';
import type { TransactionItem } from '@/features/transactions/types';

// Type assertion for imported JSON
const transactions = mockTransactions as TransactionItem[];

/**
 * Get all transactions (unfiltered)
 */
export function getAllTransactions(): TransactionItem[] {
  return transactions;
}

/**
 * Get transactions for a specific month
 */
export function getTransactionsByMonth(month: string): TransactionItem[] {
  return transactions.filter(t => t.date.startsWith(month));
}

/**
 * Get transactions with pagination
 */
export function getTransactionsPaginated(
  page: number = 1,
  limit: number = 20,
  filters?: {
    month?: string;
    type?: 'income' | 'expense';
    categoryId?: string;
  }
): {
  items: TransactionItem[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
} {
  let filtered = [...transactions];
  
  // Apply filters
  if (filters?.month) {
    filtered = filtered.filter(t => t.date.startsWith(filters.month ?? '2026-01'));
  }
  
  if (filters?.type) {
    filtered = filtered.filter(t => t.type === filters.type);
  }
  
  if (filters?.categoryId) {
    filtered = filtered.filter(t => t.category.id === filters.categoryId);
  }
  
  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const items = filtered.slice(startIndex, endIndex);
  
  return {
    items,
    page,
    pageSize: limit,
    total,
    hasMore: endIndex < total,
  };
}

/**
 * Get single transaction by ID
 */
export function getTransactionById(id: string): TransactionItem | undefined {
  return transactions.find(t => t.id === id);
}

/**
 * Get monthly summary
 */
export function getMonthlySummary(month: string): {
  month: string;
  totalBefore: number;
  totalAfter: number;
  difference: number;
} {
  const monthTransactions = getTransactionsByMonth(month);
  
  const income = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const difference = income - expenses;
  
  return {
    month,
    totalBefore: 0, // Could calculate from previous months
    totalAfter: difference,
    difference,
  };
}

/**
 * Get transactions by category
 */
export function getTransactionsByCategory(
  categoryId: string,
  month?: string
): TransactionItem[] {
  let filtered = transactions.filter(t => t.category.id === categoryId);
  
  if (month) {
    filtered = filtered.filter(t => t.date.startsWith(month));
  }
  
  return filtered;
}

/**
 * Search transactions
 */
export function searchTransactions(
  query: string,
  month?: string
): TransactionItem[] {
  const searchLower = query.toLowerCase();
  
  let filtered = transactions.filter(t => {
    const matchesNote = t.note?.toLowerCase().includes(searchLower);
    const matchesCategory = t.category.name.toLowerCase().includes(searchLower);
    const matchesAmount = t.amount.toString().includes(query);
    
    return matchesNote || matchesCategory || matchesAmount;
  });
  
  if (month) {
    filtered = filtered.filter(t => t.date.startsWith(month));
  }
  
  return filtered;
}

/**
 * Get available months (for month selector)
 */
export function getAvailableMonths(): string[] {
  const months = new Set<string>();
  
  transactions.forEach(t => {
    const month = t.date.substring(0, 7); // YYYY-MM
    months.add(month);
  });
  
  return Array.from(months).sort().reverse();
}

/**
 * Get statistics
 */
export function getStatistics() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    totalTransactions: transactions.length,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
  };
}
