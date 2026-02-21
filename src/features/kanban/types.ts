import type { TransactionItem } from '../transactions/types';

/**
 * Category configuration for Kanban columns
 */
export type CategoryConfig = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
};

/**
 * Transaction categories for Kanban board
 */
export const TRANSACTION_CATEGORIES: CategoryConfig[] = [
  {
    id: 'income',
    name: 'Income',
    icon: '💰',
    color: 'bg-green-100 border-green-300 text-green-800',
    description: 'Salary, freelance, investments',
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: '🍔',
    color: 'bg-orange-100 border-orange-300 text-orange-800',
    description: 'Restaurants, groceries, delivery',
  },
  {
    id: 'transport',
    name: 'Transportation',
    icon: '🚗',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    description: 'Gas, public transport, rideshare',
  },
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    description: 'Rent, utilities, maintenance',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '💳',
    color: 'bg-pink-100 border-pink-300 text-pink-800',
    description: 'Clothes, electronics, gifts',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    icon: '📱',
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    description: 'Internet, phone, subscriptions',
  },
  {
    id: 'other',
    name: 'Other',
    icon: '❓',
    color: 'bg-gray-100 border-gray-300 text-gray-800',
    description: 'Uncategorized expenses',
  },
] as const;

/**
 * Kanban column data
 */
export type KanbanColumn = {
  category: CategoryConfig;
  transactions: TransactionItem[];
  total: number;
  count: number;
};

/**
 * Drag and drop event data
 */
export type DragEndEvent = {
  active: {
    id: string;
    data: {
      current?: {
        transaction: TransactionItem;
        sourceCategory: string;
      };
    };
  };
  over: {
    id: string;
    data: {
      current?: {
        category: string;
      };
    };
  } | null;
};

/**
 * Kanban filters
 */
export type KanbanFilters = {
  month: string;
  search?: string;
  type?: 'income' | 'expense' | 'all';
};
