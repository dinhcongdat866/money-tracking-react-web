import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTransactionDetail } from "./useTransactionDetail";
import {
  createTestQueryClient,
  TestWrapper,
  mockFetch,
  cleanupTests,
} from "@/test/test-utils";
import { transactionKeys } from "@/lib/query-keys";
import type { TransactionItem } from "../types";

describe("useTransactionDetail", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it("should fetch transaction detail successfully", async () => {
    const mockTransaction: TransactionItem = {
      id: "tx-123",
      amount: 150,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-15T10:00:00.000Z",
      note: "Lunch at restaurant",
    };

    mockFetch({ data: mockTransaction });

    const { result } = renderHook(() => useTransactionDetail("tx-123"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTransaction);
    expect(result.current.isError).toBe(false);
  });

  it("should handle error scenarios", async () => {
    mockFetch({ error: "Transaction not found", status: 404 });

    const { result } = renderHook(() => useTransactionDetail("invalid-id"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeDefined();
  });

  it("should not fetch when id is undefined", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useTransactionDetail(undefined), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Should not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);

    // Should not have called fetch
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should use cached data when available", async () => {
    const mockTransaction: TransactionItem = {
      id: "tx-123",
      amount: 150,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-15T10:00:00.000Z",
      note: "Lunch",
    };

    // Pre-populate cache
    queryClient.setQueryData(transactionKeys.detail("tx-123"), mockTransaction);

    const fetchSpy = vi.spyOn(global, "fetch");

    const { result } = renderHook(() => useTransactionDetail("tx-123"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Should immediately have data from cache
    await waitFor(() => {
      expect(result.current.data).toEqual(mockTransaction);
    });

    // Should not have fetched (using cache)
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("should refetch when id changes", async () => {
    const transaction1: TransactionItem = {
      id: "tx-1",
      amount: 100,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-10T10:00:00.000Z",
    };

    const transaction2: TransactionItem = {
      id: "tx-2",
      amount: 200,
      type: "income",
      category: { id: "c2", name: "Salary" },
      date: "2026-02-15T10:00:00.000Z",
    };

    // First fetch
    mockFetch({ data: transaction1 });

    const { result, rerender } = renderHook(
      ({ id }) => useTransactionDetail(id),
      {
        initialProps: { id: "tx-1" },
        wrapper: ({ children }) => (
          <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
        ),
      },
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(transaction1);
    });

    // Change ID - should trigger new fetch
    mockFetch({ data: transaction2 });
    rerender({ id: "tx-2" });

    await waitFor(() => {
      expect(result.current.data).toEqual(transaction2);
    });
  });

  it("should handle network errors gracefully", async () => {
    // Simulate network error
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useTransactionDetail("tx-123"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });

  it("should expose loading states correctly", async () => {
    const mockTransaction: TransactionItem = {
      id: "tx-123",
      amount: 150,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-15T10:00:00.000Z",
    };

    // Simulate slow API
    let resolvePromise: (value: unknown) => void;
    const slowPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const headers = new Headers();
    headers.set('content-type', 'application/json');

    global.fetch = vi.fn().mockImplementation(() => slowPromise);

    const { result } = renderHook(() => useTransactionDetail("tx-123"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Should be loading
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
    expect(result.current.isPending).toBe(true);
    expect(result.current.isFetching).toBe(true);

    // Resolve the promise
    resolvePromise!({
      ok: true,
      status: 200,
      headers,
      json: async () => mockTransaction,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.data).toEqual(mockTransaction);
  });

  afterEach(() => {
    cleanupTests(queryClient);
  });
});

