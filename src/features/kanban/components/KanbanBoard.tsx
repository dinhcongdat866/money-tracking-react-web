'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { KanbanColumn } from './KanbanColumn';
import { KanbanFilters } from './KanbanFilters';
import { TRANSACTION_CATEGORIES } from '../types';
import type { KanbanFilters as FilterType } from '../types';

/**
 * Main Kanban Board Component
 * 
 * Displays transactions organized by category in a Kanban-style layout.
 * Inspired by hiring pipeline interview problem:
 * - Categories = Pipeline stages (Applied, Phone Screen, etc.)
 * - Transactions = Candidates
 * - Drag & drop = Moving candidates between stages
 */
export function KanbanBoard() {
  const [filters, setFilters] = useState<FilterType>({
    month: format(new Date(), 'yyyy-MM'),
    type: 'all',
  });

  // TODO: Replace with actual data fetching hook
  // const { data, isLoading } = useKanbanData(filters)

  // Mock data for now
  const mockData = useMemo(() => {
    return TRANSACTION_CATEGORIES.map(category => ({
      category,
      transactions: [],
      total: 0,
      count: 0,
    }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <KanbanFilters filters={filters} onFiltersChange={setFilters} />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={mockData.reduce((sum, col) => sum + col.count, 0)}
        />
        <StatCard
          label="Total Income"
          value="$0"
          valueClassName="text-green-600"
        />
        <StatCard
          label="Total Expenses"
          value="$0"
          valueClassName="text-red-600"
        />
        <StatCard label="Net" value="$0" />
      </div>

      {/* Kanban Board Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex gap-4 min-h-[600px]">
          {mockData.map(column => (
            <KanbanColumn
              key={column.category.id}
              category={column.category}
              transactions={column.transactions}
              total={column.total}
              count={column.count}
            />
          ))}
        </div>
      </div>
    </div>
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
