'use client';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIME, transactionKeys } from '@/lib/query-keys';
import { getMonthlyTransactions } from '@/features/transactions/api/transactions-api';
import { TRANSACTION_CATEGORIES } from '../types';
import type { KanbanColumn, KanbanFilters } from '../types';

/**
 * Fetch and organize transactions for Kanban board
 * 
 * This hook:
 * 1. Fetches all transactions for the month
 * 2. Groups them by category
 * 3. Calculates totals per category
 * 4. Returns data in Kanban column format
 * 
 * Aligned with interview problem: Fetching candidates and grouping by pipeline stage
 */
export function useKanbanData(filters: KanbanFilters) {
  const { month, type = 'all', search } = filters;

  const { data, isLoading, error } = useQuery({
    queryKey: transactionKeys.monthly(month),
    queryFn: () => getMonthlyTransactions(month, 1, 1000), // Fetch all for Kanban view
    staleTime: STALE_TIME.SHORT,
  });

  const transactions = data?.items ?? [];

  // Group transactions by category
  const kanbanData: KanbanColumn[] = TRANSACTION_CATEGORIES.map(category => {
    const categoryTransactions = transactions.filter(t => {
      // Filter by category
      if (t.category.id !== category.id) return false;

      // Filter by type (income/expense/all)
      if (type !== 'all' && t.type !== type) return false;

      // Filter by search term
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesNote = t.note?.toLowerCase().includes(searchLower);
        const matchesCategory = t.category.name.toLowerCase().includes(searchLower);
        const matchesAmount = t.amount.toString().includes(search);
        
        if (!matchesNote && !matchesCategory && !matchesAmount) {
          return false;
        }
      }

      return true;
    });

    // Calculate total for this category
    const total = categoryTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    return {
      category,
      transactions: categoryTransactions,
      total,
      count: categoryTransactions.length,
    };
  });

  // Calculate summary stats
  const summary = {
    totalTransactions: transactions.length,
    totalIncome: transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    net: 0, // Will be calculated below
  };
  summary.net = summary.totalIncome - summary.totalExpenses;

  return {
    columns: kanbanData,
    summary,
    isLoading,
    error,
    // Expose individual category data for easy access
    getColumn: (categoryId: string) => 
      kanbanData.find(col => col.category.id === categoryId),
  };
}

/**
 * Prefetch Kanban data for adjacent months
 * 
 * Interview discussion point: Prefetching patterns for better UX
 */
export function usePrefetchKanbanData() {
  // TODO: Implement prefetch logic for adjacent months
  // Similar to usePrefetchNextMonth but for Kanban view
}
