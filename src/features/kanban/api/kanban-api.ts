/**
 * Kanban API Client
 * 
 * Professional-grade API client for cursor-based infinite scroll.
 * Supports high-performance Kanban boards with 2000+ items per column.
 */

import { transactionKeys } from '@/lib/query-keys';
import type { KanbanPaginatedResponse, KanbanPageParam } from '../types';

/**
 * Fetch paginated transactions for a Kanban column
 * 
 * Uses cursor-based pagination for efficient infinite scroll.
 * 
 * @param params - Query parameters including cursor, category, filters
 * @returns Paginated response with items and next cursor
 * 
 * Interview points:
 * - Cursor-based pagination (more efficient than offset)
 * - 100 items per page (optimal for performance)
 * - Category-specific queries (load only visible column data)
 * - Search/filter support
 */
export async function getKanbanColumnData(
  params: KanbanPageParam
): Promise<KanbanPaginatedResponse> {
  const searchParams = new URLSearchParams({
    category: params.category,
    month: params.month,
    limit: '100', // Professional standard: 100 items per page
  });

  // Add optional params
  if (params.cursor) {
    searchParams.append('cursor', params.cursor);
  }
  if (params.type && params.type !== 'all') {
    searchParams.append('type', params.type);
  }
  if (params.search) {
    searchParams.append('search', params.search);
  }

  const response = await fetch(`/api/mock/kanban?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch kanban data: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get query key for Kanban column infinite query
 * 
 * Uses centralized query key factory from @/lib/query-keys
 * Structured keys for easy cache invalidation:
 * ['transactions', 'kanban', category, { month, type, search }]
 */
export function getKanbanQueryKey(params: Omit<KanbanPageParam, 'cursor'>) {
  return transactionKeys.kanbanColumn(params.category, {
    month: params.month,
    type: params.type,
    search: params.search,
  });
}
