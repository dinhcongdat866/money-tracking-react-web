'use client';

import { format, parseISO } from 'date-fns';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { TransactionItem } from '@/features/transactions/types';

type TransactionCardProps = {
  transaction: TransactionItem;
  isDragging?: boolean;
  isHighlighted?: boolean;
};

/**
 * Transaction Card Component
 * 
 * Draggable card for a single transaction.
 * 
 * Features:
 * - Draggable with @dnd-kit
 * - Amount with income/expense styling
 * - Formatted date
 * - Optional note (line-clamped)
 * - Category badge
 * - Visual feedback during drag
 */
export function TransactionCard({ transaction, isDragging = false, isHighlighted = false }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isCurrentlyDragging,
  } = useDraggable({
    id: transaction.id,
    data: {
      transaction,
      sourceCategory: transaction.category.id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isCurrentlyDragging ? 0 : 1, // Hide original card when dragging
    cursor: isCurrentlyDragging ? 'grabbing' : 'grab',
    transition: isCurrentlyDragging ? 'none' : 'opacity 150ms ease-in', // Smooth fade-in when appearing in new position
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-all ${
        isHighlighted 
          ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg animate-pulse' 
          : 'border-gray-200'
      }`}
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
