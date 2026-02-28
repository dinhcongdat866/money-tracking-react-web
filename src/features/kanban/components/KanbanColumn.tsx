'use client';

import { useDroppable } from '@dnd-kit/core';
import { VirtualizedCardList } from './VirtualizedCardList';
import type { CategoryConfig } from '../types';
import type { TransactionItem } from '@/features/transactions/types';

type KanbanColumnProps = {
  category: CategoryConfig;
  transactions: TransactionItem[];
  total: number;
  count: number;
  highlightedId?: string | null;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
};

/**
 * Kanban Column Component
 * 
 * Droppable column for a single transaction category.
 * 
 * Features:
 * - Category header with icon and total
 * - Virtualized transaction list with infinite scroll
 * - Drop zone with visual feedback
 * - Empty state with helpful message
 * - Background loading indicator
 */
export function KanbanColumn({
  category,
  transactions,
  total,
  count,
  highlightedId,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${category.id}`,
    data: {
      category: category.id,
    },
  });

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

      {/* Transaction List Container (Droppable) */}
      <div
        ref={setNodeRef}
        className={`flex-1 border-x-2 border-b-2 rounded-b-lg overflow-hidden transition-colors ${
          isOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        {transactions.length === 0 ? (
          <div className="h-[calc(100vh-380px)] flex items-center justify-center">
            <EmptyState categoryName={category.name} isOver={isOver} />
          </div>
        ) : (
          <VirtualizedCardList
            transactions={transactions}
            category={category.id}
            highlightedId={highlightedId}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ categoryName, isOver }: { categoryName: string; isOver: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className={`text-6xl mb-4 transition-all ${isOver ? 'opacity-100 scale-110' : 'opacity-30'}`}>
        {isOver ? '📥' : '📭'}
      </div>
      <p className="text-sm text-muted-foreground">
        {isOver ? 'Drop here!' : `No transactions in ${categoryName}`}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Drag transactions here to categorize them
      </p>
    </div>
  );
}
