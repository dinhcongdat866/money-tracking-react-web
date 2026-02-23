'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanFilters } from './KanbanFilters';
import { TransactionCard } from './TransactionCard';
import { useKanbanData } from '../hooks/useKanbanData';
import { useUpdateCategory } from '@/features/transactions/hooks/useUpdateCategory';
import type { KanbanFilters as FilterType } from '../types';
import type { TransactionItem } from '@/features/transactions/types';

/**
 * Main Kanban Board Component
 * 
 * Displays transactions organized by category in a Kanban-style layout.
 * Inspired by hiring pipeline interview problem:
 * - Categories = Pipeline stages (Applied, Phone Screen, etc.)
 * - Transactions = Candidates
 * - Drag & drop = Moving candidates between stages
 * 
 * Key Features:
 * - Drag & drop between columns with @dnd-kit
 * - Optimistic updates (instant UI feedback)
 * - Automatic rollback on API failure
 * - Virtual scrolling for performance
 */
export function KanbanBoard() {
  const [filters, setFilters] = useState<FilterType>({
    month: format(new Date(), 'yyyy-MM'),
    type: 'all',
  });

  const [activeTransaction, setActiveTransaction] = useState<TransactionItem | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const { columns, summary, isLoading } = useKanbanData(filters);
  const updateCategory = useUpdateCategory();

  // Drag & drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const transaction = event.active.data.current?.transaction as TransactionItem;
    setActiveTransaction(transaction);
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTransaction(null);
      return;
    }

    const transactionId = active.id as string;
    const transaction = active.data.current?.transaction as TransactionItem;
    const oldCategory = active.data.current?.sourceCategory as string;
    const newCategory = over.data.current?.category as string;

    // No change - clear immediately
    if (oldCategory === newCategory) {
      setActiveTransaction(null);
      return;
    }

    // Optimistic update FIRST, then clear drag state
    // This prevents flicker by keeping overlay visible until new position renders
    await updateCategory.mutateAsync({
      transactionId,
      oldCategory,
      newCategory,
      transaction,
    });
    
    // Wait for next animation frame to ensure React has painted the new position
    // Double RAF ensures layout is complete and visible
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setActiveTransaction(null);
        
        // Highlight the dropped item for 3 seconds
        setHighlightedId(transactionId);
        setTimeout(() => {
          setHighlightedId(null);
        }, 3000);
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Filters */}
        <KanbanFilters filters={filters} onFiltersChange={setFilters} />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Transactions"
            value={summary.totalTransactions}
          />
          <StatCard
            label="Total Income"
            value={`$${summary.totalIncome.toFixed(2)}`}
            valueClassName="text-green-600"
          />
          <StatCard
            label="Total Expenses"
            value={`$${summary.totalExpenses.toFixed(2)}`}
            valueClassName="text-red-600"
          />
          <StatCard
            label="Net"
            value={`$${summary.net.toFixed(2)}`}
            valueClassName={summary.net >= 0 ? 'text-green-600' : 'text-red-600'}
          />
        </div>

        {/* Kanban Board Grid */}
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-h-[600px]">
          {columns.map(column => (
            <KanbanColumn
              key={column.category.id}
              category={column.category}
              transactions={column.transactions}
              total={column.total}
              count={column.count}
              highlightedId={highlightedId}
            />
          ))}
          </div>
        </div>
      </div>

      {/* Drag Overlay - Shows card while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeTransaction ? (
          <div className="rotate-3 scale-105">
            <TransactionCard
              transaction={activeTransaction}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function StatCard({
  label,
  value,
  valueClassName = 'text-foreground',
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="bg-card border rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}
