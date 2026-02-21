'use client';

import { TransactionCard } from './TransactionCard';
import type { CategoryConfig } from '../types';
import type { TransactionItem } from '@/features/transactions/types';

type KanbanColumnProps = {
  category: CategoryConfig;
  transactions: TransactionItem[];
  total: number;
  count: number;
};

/**
 * Kanban Column Component
 * 
 * Represents a single category/stage column in the Kanban board.
 * Similar to a pipeline stage column in the interview problem.
 * 
 * Features:
 * - Category header with icon and total
 * - Scrollable transaction list (will be virtualized later)
 * - Drop zone for drag & drop
 * - Empty state
 */
export function KanbanColumn({
  category,
  transactions,
  total,
  count,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col w-[320px] flex-shrink-0">
      {/* Column Header */}
      <div className={`border-2 rounded-t-lg p-4 ${category.color}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <h3 className="font-semibold">{category.name}</h3>
          </div>
          <span className="text-sm font-medium bg-white/50 px-2 py-1 rounded">
            {count}
          </span>
        </div>
        
        <p className="text-xs opacity-75 mb-2">{category.description}</p>
        
        <div className="text-right">
          <p className="text-sm font-medium">
            {category.id === 'income' ? '+' : '-'}${Math.abs(total).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Transaction List Container */}
      <div className="flex-1 border-x-2 border-b-2 border-gray-200 rounded-b-lg bg-gray-50 overflow-hidden">
        {/* Scrollable content area (will be virtualized) */}
        <div className="h-[calc(100vh-380px)] overflow-y-auto p-2">
          {transactions.length === 0 ? (
            <EmptyState categoryName={category.name} />
          ) : (
            <div className="space-y-2">
              {transactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ categoryName }: { categoryName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4 opacity-30">📭</div>
      <p className="text-sm text-muted-foreground">
        No transactions in {categoryName}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Drag transactions here to categorize them
      </p>
    </div>
  );
}
