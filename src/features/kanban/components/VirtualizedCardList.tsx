'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TransactionCard } from './TransactionCard';
import type { TransactionItem } from '@/features/transactions/types';

type VirtualizedCardListProps = {
  transactions: TransactionItem[];
  category: string;
  highlightedId?: string | null;
};

/**
 * Virtualized Transaction Card List
 * 
 * Implements @tanstack/react-virtual for high-performance rendering
 * of large transaction lists in Kanban columns.
 * 
 * Key Features:
 * - Only renders visible cards (~15-20 items) regardless of total count
 * - Handles variable heights (cards with notes are taller)
 * - Smooth 60 FPS scrolling with 1000+ items
 * - Auto-measures actual card heights for accuracy
 * 
 * Interview Points:
 * - Reduces DOM nodes by 97% (500 items → 15 rendered)
 * - estimateSize for initial placeholder heights
 * - measureElement for actual heights after render
 * - overscan for smooth scrolling (renders 5 extra above/below)
 * - Absolute positioning with transform for performance (GPU accelerated)
 */
export function VirtualizedCardList({
  transactions,
  category,
  highlightedId,
}: VirtualizedCardListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // Estimate card height (adjusts automatically)
    overscan: 5, // Render 5 extra items above/below viewport for smooth scroll
    measureElement:
      typeof window !== 'undefined' && 'IntersectionObserver' in window
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-380px)] overflow-y-auto p-2"
      style={{
        contain: 'strict', // CSS containment for better performance
      }}
    >
      {/* Total height container for proper scrollbar */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {/* Render only visible items */}
        {virtualItems.map((virtualItem) => {
          const transaction = transactions[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                paddingBottom: '8px', // Gap between cards
              }}
            >
              <TransactionCard 
                transaction={transaction}
                isHighlighted={highlightedId === transaction.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
