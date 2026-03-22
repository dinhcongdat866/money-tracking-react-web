/**
 * Kanban API Client
 * 
 * API client for cursor-based infinite scroll with 100 items per page.
 */

import { apiRequest } from '@/lib/api-client';
import { transactionKeys } from '@/lib/query-keys';
import type { KanbanPaginatedResponse, KanbanPageParam } from '../types';

/**
 * Fetch paginated transactions for a Kanban column
 * 
 * Uses cursor-based pagination for efficient infinite scroll.
 * 
 * @param params - Query parameters (cursor, category, month, type, search)
 * @returns Paginated response with items and next cursor
 */
export async function getKanbanColumnData(
  params: KanbanPageParam
): Promise<KanbanPaginatedResponse> {
  const searchParams = new URLSearchParams({
    category: params.category,
    month: params.month,
    limit: '100',
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

  return apiRequest<KanbanPaginatedResponse>(
    `/api/transactions?${searchParams.toString()}`,
  );
}

/**
 * Get query key for Kanban column
 * 
 * Uses centralized query key factory for cache management.
 */
export function getKanbanQueryKey(params: Omit<KanbanPageParam, 'cursor'>) {
  return transactionKeys.kanbanColumn(params.category, {
    month: params.month,
    type: params.type,
    search: params.search,
  });
}
