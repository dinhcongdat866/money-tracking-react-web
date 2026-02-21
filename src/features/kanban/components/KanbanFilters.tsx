'use client';

import { format } from 'date-fns';
import type { KanbanFilters as FilterType } from '../types';

type KanbanFiltersProps = {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
};

/**
 * Kanban Board Filters
 * 
 * Controls for filtering the Kanban board:
 * - Month selector
 * - Transaction type filter (income/expense/all)
 * - Search (future)
 */
export function KanbanFilters({
  filters,
  onFiltersChange,
}: KanbanFiltersProps) {
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, month: e.target.value });
  };

  const handleTypeChange = (type: 'income' | 'expense' | 'all') => {
    onFiltersChange({ ...filters, type });
  };

  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Month Selector */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="month-select" className="block text-sm font-medium mb-1">
            Month
          </label>
          <input
            id="month-select"
            type="month"
            value={filters.month}
            onChange={handleMonthChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            max={format(new Date(), 'yyyy-MM')}
          />
        </div>

        {/* Type Filter */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Type</label>
          <div className="flex gap-2">
            <FilterButton
              label="All"
              active={filters.type === 'all'}
              onClick={() => handleTypeChange('all')}
            />
            <FilterButton
              label="Income"
              active={filters.type === 'income'}
              onClick={() => handleTypeChange('income')}
              className="text-green-600 border-green-300 hover:bg-green-50"
            />
            <FilterButton
              label="Expense"
              active={filters.type === 'expense'}
              onClick={() => handleTypeChange('expense')}
              className="text-red-600 border-red-300 hover:bg-red-50"
            />
          </div>
        </div>

        {/* Search (placeholder for future) */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="block text-sm font-medium mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search transactions..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  className = '',
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 rounded-md border font-medium text-sm transition-colors
        ${
          active
            ? 'bg-blue-500 text-white border-blue-500'
            : `bg-white border-gray-300 hover:bg-gray-50 ${className}`
        }
      `}
    >
      {label}
    </button>
  );
}
