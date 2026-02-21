'use client';

import { format, parseISO } from 'date-fns';
import type { TransactionItem } from '@/features/transactions/types';

type TransactionCardProps = {
  transaction: TransactionItem;
};

/**
 * Transaction Card Component
 * 
 * Draggable card representing a single transaction in the Kanban board.
 * Similar to a candidate card in the interview problem.
 * 
 * Features:
 * - Amount and type (income/expense)
 * - Date
 * - Optional note
 * - Category badge
 * - Hover effects
 * - Will be draggable in next phase
 */
export function TransactionCard({ transaction }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      {/* Amount */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-lg font-bold ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
        </span>
        
        <span className="text-xs text-muted-foreground">
          {format(parseISO(transaction.date), 'MMM d')}
        </span>
      </div>

      {/* Category Badge */}
      <div className="flex items-center gap-1 mb-2">
        {transaction.category.icon && (
          <span className="text-sm">{transaction.category.icon}</span>
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {transaction.category.name}
        </span>
      </div>

      {/* Note (if exists) */}
      {transaction.note && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {transaction.note}
        </p>
      )}

      {/* Drag indicator */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center">
        <div className="flex gap-0.5">
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
          <div className="w-1 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>
    </div>
  );
}
