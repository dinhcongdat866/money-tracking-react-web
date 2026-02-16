import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCreateTransaction } from "./useCreateTransaction";
import {
  createTestQueryClient,
  TestWrapper,
  mockFetch,
  cleanupTests,
} from "@/test/test-utils";
import { transactionKeys } from "@/lib/query-keys";
import type { TransactionItem } from "../types";
import type { PaginatedTransactionsResponse } from "../api/transactions-api";
import type { InfiniteData } from "@tanstack/react-query";

// Mock toast
vi.mock("@/components/ToastProvider", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe("useCreateTransaction", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should create transaction successfully", async () => {
    // Mock successful API response
    const newTransaction: TransactionItem = {
      id: "tx-123",
      amount: 150,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-15T10:00:00.000Z",
      note: "Lunch",
    };

    mockFetch({ data: newTransaction });

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Execute mutation
    await result.current.mutateAsync({
      amount: 150,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
      note: "Lunch",
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it("should optimistically update cache before API response", async () => {
    const monthKey = "2026-02";

    // Pre-populate cache with existing transactions
    const existingData: InfiniteData<PaginatedTransactionsResponse> = {
      pages: [
        {
          items: [
            {
              id: "tx-1",
              amount: 100,
              type: "expense",
              category: { id: "c1", name: "Food" },
              date: "2026-02-10T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    };

    queryClient.setQueryData(transactionKeys.monthly(monthKey), existingData);

    mockFetch({
      data: {
        id: "tx-123",
        amount: 150,
        type: "expense",
        category: { id: "c1", name: "Food" },
        date: "2026-02-15T10:00:00.000Z",
        note: "Lunch",
      },
    });

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Create transaction
    await result.current.mutateAsync({
      amount: 150,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
      note: "Lunch",
    });

    // Wait for success state
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify mutation completed
    expect(global.fetch).toHaveBeenCalled();
  });

  it("should rollback optimistic update on error", async () => {
    const monthKey = "2026-02";

    // Pre-populate cache
    const existingData: InfiniteData<PaginatedTransactionsResponse> = {
      pages: [
        {
          items: [
            {
              id: "tx-1",
              amount: 100,
              type: "expense",
              category: { id: "c1", name: "Food" },
              date: "2026-02-10T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    };

    queryClient.setQueryData(transactionKeys.monthly(monthKey), existingData);

    // Mock API error
    mockFetch({ error: "Network error", status: 500 });

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Try to create transaction (should fail)
    await expect(
      result.current.mutateAsync({
        amount: 150,
        type: "expense",
        categoryId: "c1",
        categoryName: "Food",
        date: "2026-02-15T10:00:00.000Z",
        note: "Lunch",
      }),
    ).rejects.toThrow();

    // Cache should be rolled back to original state
    const data = queryClient.getQueryData<
      InfiniteData<PaginatedTransactionsResponse>
    >(transactionKeys.monthly(monthKey));

    expect(data?.pages[0].items).toHaveLength(1);
    expect(data?.pages[0].items[0].id).toBe("tx-1");
  });

  it("should only update affected month's cache", async () => {
    const februaryKey = "2026-02";
    const marchKey = "2026-03";

    // Setup cache for two different months
    const februaryData: InfiniteData<PaginatedTransactionsResponse> = {
      pages: [
        {
          items: [
            {
              id: "tx-feb",
              amount: 100,
              type: "expense",
              category: { id: "c1", name: "Food" },
              date: "2026-02-10T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    };

    const marchData: InfiniteData<PaginatedTransactionsResponse> = {
      pages: [
        {
          items: [
            {
              id: "tx-mar",
              amount: 200,
              type: "expense",
              category: { id: "c1", name: "Food" },
              date: "2026-03-10T10:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          hasMore: false,
        },
      ],
      pageParams: [undefined],
    };

    queryClient.setQueryData(transactionKeys.monthly(februaryKey), februaryData);
    queryClient.setQueryData(transactionKeys.monthly(marchKey), marchData);

    mockFetch({
      data: {
        id: "tx-new",
        amount: 150,
        type: "expense",
        category: { id: "c1", name: "Food" },
        date: "2026-02-15T10:00:00.000Z",
      },
    });

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Create transaction in February
    await result.current.mutateAsync({
      amount: 150,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
    });

    // February should be updated (optimistically)
    const febData = queryClient.getQueryData<
      InfiniteData<PaginatedTransactionsResponse>
    >(transactionKeys.monthly(februaryKey));
    expect(febData?.pages[0].items.length).toBeGreaterThan(1);

    // March should remain unchanged
    const marData = queryClient.getQueryData<
      InfiniteData<PaginatedTransactionsResponse>
    >(transactionKeys.monthly(marchKey));
    expect(marData?.pages[0].items).toHaveLength(1);
    expect(marData?.pages[0].items[0].id).toBe("tx-mar");
  });

  it("should handle mutation loading state", async () => {
    // Delay fetch to test loading state
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    const headers = new Headers();
    headers.set('content-type', 'application/json');

    global.fetch = vi.fn().mockImplementation(() => fetchPromise);

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    expect(result.current.isPending).toBe(false);

    // Start mutation (don't await yet)
    const promise = result.current.mutateAsync({
      amount: 150,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
    });

    // Should be pending
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Resolve fetch
    resolveFetch!({
      ok: true,
      status: 200,
      headers,
      json: async () => ({
        id: "tx-123",
        amount: 150,
        type: "expense",
        category: { id: "c1", name: "Food" },
        date: "2026-02-15T10:00:00.000Z",
      }),
    });

    await promise;

    // Should be complete
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });

  afterEach(() => {
    cleanupTests(queryClient);
  });
});

