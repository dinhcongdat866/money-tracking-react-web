/**
 * Base Types for React Query Hooks
 * 
 * Reusable types to reduce code duplication across query/mutation hooks
 */

import type {
  UseQueryOptions,
  UseInfiniteQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import type { ApiError } from "./api-errors";

// ============================================================================
// BASE QUERY TYPES
// ============================================================================

/**
 * Base options type for useQuery hooks
 * 
 * @template TData - Response data type
 * @template TQueryKey - Query key type (from queryKeys factory)
 */
export type BaseQueryOptions<
  TData,
  TQueryKey extends readonly unknown[],
> = Omit<
  UseQueryOptions<TData, ApiError, TData, TQueryKey>,
  "queryKey" | "queryFn"
>;

/**
 * Base options type for useInfiniteQuery hooks
 * 
 * @template TData - Response data type (single page)
 * @template TQueryKey - Query key type (from queryKeys factory)
 */
export type BaseInfiniteQueryOptions<
  TData,
  TQueryKey extends readonly unknown[],
> = Omit<
  UseInfiniteQueryOptions<TData, ApiError, TData, TQueryKey, number>,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
>;

/**
 * Base options type for useMutation hooks
 * 
 * @template TData - Response data type
 * @template TVariables - Mutation variables/input type
 * @template TContext - Context type for optimistic updates (usually unknown)
 */
export type BaseMutationOptions<
  TData,
  TVariables,
  TContext = unknown,
> = Omit<
  UseMutationOptions<TData, ApiError, TVariables, TContext>,
  "mutationFn"
>;

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Extract query key type from a query key factory function
 * 
 * @example
 * type Key = QueryKeyOf<typeof transactionKeys.monthly>;
 * // Key = readonly ["transactions", "monthly", string]
 */
export type QueryKeyOf<T extends (...args: any[]) => readonly unknown[]> =
  ReturnType<T>;

/**
 * Simplified query options for hooks that don't need full UseQueryOptions
 */
export type SimpleQueryOptions<TData> = {
  enabled?: boolean;
  staleTime?: number;
  onError?: (error: ApiError) => void;
  onSuccess?: (data: TData) => void;
};

/**
 * Simplified infinite query options
 */
export type SimpleInfiniteQueryOptions<TData> = {
  enabled?: boolean;
  staleTime?: number;
  onError?: (error: ApiError) => void;
  onSuccess?: (data: TData) => void;
};

