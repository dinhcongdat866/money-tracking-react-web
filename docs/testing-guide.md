# React Query Testing Guide

Complete guide for testing React Query hooks and components in the Money Tracking app.

## 📋 Table of Contents

- [Setup](#setup)
- [Test Utilities](#test-utilities)
- [Testing Queries](#testing-queries)
- [Testing Mutations](#testing-mutations)
- [Testing Optimistic Updates](#testing-optimistic-updates)
- [Testing Error Scenarios](#testing-error-scenarios)
- [Best Practices](#best-practices)

---

## Setup

### Test Configuration

Your test setup is already configured in `vitest.config.ts`:

```ts
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- useCreateTransaction.test.tsx

# Run with coverage
npm test -- --coverage
```

---

## Test Utilities

### Available Utilities

Located in `src/test/test-utils.tsx`:

#### 1. `createTestQueryClient()`

Creates a fresh QueryClient for each test with optimized settings:

```tsx
import { createTestQueryClient } from "@/test/test-utils";

const queryClient = createTestQueryClient();
// Returns QueryClient with:
// - retry: false (faster tests)
// - refetchOnWindowFocus: false
// - gcTime: 0 (no caching between tests)
// - Silent logger (no console spam)
```

#### 2. `TestWrapper`

Wraps your components/hooks with QueryClientProvider:

```tsx
import { TestWrapper } from "@/test/test-utils";

<TestWrapper queryClient={queryClient}>
  <YourComponent />
</TestWrapper>
```

#### 3. `renderWithClient()`

Custom render function with React Query context:

```tsx
import { renderWithClient } from "@/test/test-utils";

const { getByText } = renderWithClient(<YourComponent />);
```

#### 4. `mockFetch()`

Mock API responses:

```tsx
import { mockFetch } from "@/test/test-utils";

// Success response
mockFetch({ data: { id: "tx-1", amount: 100 } });

// Error response
mockFetch({ error: "Not found", status: 404 });
```

#### 5. `cleanupTests()`

Clean up after each test:

```tsx
import { cleanupTests } from "@/test/test-utils";

afterEach(() => {
  cleanupTests(queryClient);
});
```

---

## Testing Queries

### Basic Query Test

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTransactionDetail } from "./useTransactionDetail";
import {
  createTestQueryClient,
  TestWrapper,
  mockFetch,
  cleanupTests,
} from "@/test/test-utils";

describe("useTransactionDetail", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTests(queryClient);
  });

  it("should fetch data successfully", async () => {
    const mockData = {
      id: "tx-1",
      amount: 100,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-15T10:00:00.000Z",
    };

    mockFetch({ data: mockData });

    const { result } = renderHook(() => useTransactionDetail("tx-1"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });
});
```

### Testing Conditional Queries (enabled)

```tsx
it("should not fetch when id is undefined", async () => {
  const fetchSpy = vi.spyOn(global, "fetch");

  const { result } = renderHook(() => useTransactionDetail(undefined), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  expect(result.current.isLoading).toBe(false);
  expect(result.current.isFetching).toBe(false);
  expect(fetchSpy).not.toHaveBeenCalled();
});
```

### Testing Query Refetch on Props Change

```tsx
it("should refetch when id changes", async () => {
  const data1 = { id: "tx-1", amount: 100 };
  const data2 = { id: "tx-2", amount: 200 };

  mockFetch({ data: data1 });

  const { result, rerender } = renderHook(
    ({ id }) => useTransactionDetail(id),
    {
      initialProps: { id: "tx-1" },
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    }
  );

  await waitFor(() => {
    expect(result.current.data).toEqual(data1);
  });

  // Change ID
  mockFetch({ data: data2 });
  rerender({ id: "tx-2" });

  await waitFor(() => {
    expect(result.current.data).toEqual(data2);
  });
});
```

### Testing Cached Data

```tsx
it("should use cached data when available", async () => {
  const mockData = {
    id: "tx-1",
    amount: 100,
    type: "expense",
    category: { id: "c1", name: "Food" },
    date: "2026-02-15T10:00:00.000Z",
  };

  // Pre-populate cache
  queryClient.setQueryData(transactionKeys.detail("tx-1"), mockData);

  const fetchSpy = vi.spyOn(global, "fetch");

  const { result } = renderHook(() => useTransactionDetail("tx-1"), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  // Should immediately have data from cache
  await waitFor(() => {
    expect(result.current.data).toEqual(mockData);
  });

  // Should not have fetched
  expect(fetchSpy).not.toHaveBeenCalled();
});
```

---

## Testing Mutations

### Basic Mutation Test

```tsx
import { useCreateTransaction } from "./useCreateTransaction";

// Mock toast
vi.mock("@/components/ToastProvider", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe("useCreateTransaction", () => {
  it("should create transaction successfully", async () => {
    const mockResponse = {
      id: "tx-123",
      amount: 150,
      type: "expense",
      category: { id: "c1", name: "Food" },
      date: "2026-02-15T10:00:00.000Z",
      note: "Lunch",
    };

    mockFetch({ data: mockResponse });

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

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
});
```

### Testing Mutation Loading State

```tsx
it("should handle loading state correctly", async () => {
  mockFetch({ data: { id: "tx-123", amount: 150 } });

  const { result } = renderHook(() => useCreateTransaction(), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  // Initially not pending
  expect(result.current.isPending).toBe(false);

  // Start mutation
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

  await promise;

  // Should be complete
  await waitFor(() => {
    expect(result.current.isPending).toBe(false);
  });
});
```

---

## Testing Optimistic Updates

### Testing Immediate UI Update

```tsx
import { transactionKeys } from "@/lib/query-keys";
import type { InfiniteData } from "@tanstack/react-query";
import type { PaginatedTransactionsResponse } from "../api/transactions-api";

it("should optimistically update cache before API response", async () => {
  const monthKey = "2026-02";

  // Pre-populate cache with existing data
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
        limit: 20,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  };

  queryClient.setQueryData(transactionKeys.monthly(monthKey), existingData);

  mockFetch({ data: { id: "tx-123", amount: 150 } });

  const { result } = renderHook(() => useCreateTransaction(), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  // Start mutation
  const mutationPromise = result.current.mutateAsync({
    amount: 150,
    type: "expense",
    categoryId: "c1",
    categoryName: "Food",
    date: "2026-02-15T10:00:00.000Z",
  });

  // Check optimistic update BEFORE API resolves
  await waitFor(() => {
    const data = queryClient.getQueryData<
      InfiniteData<PaginatedTransactionsResponse>
    >(transactionKeys.monthly(monthKey));

    // Should have 2 items now (1 existing + 1 optimistic)
    expect(data?.pages[0].items).toHaveLength(2);

    // First item should be the optimistic one
    const firstItem = data?.pages[0].items[0];
    expect(firstItem?.id).toContain("optimistic-");
    expect(firstItem?.amount).toBe(150);
  });

  await mutationPromise;
});
```

### Testing Rollback on Error

```tsx
it("should rollback optimistic update on error", async () => {
  const monthKey = "2026-02";

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
        limit: 20,
        hasMore: false,
      },
    ],
    pageParams: [undefined],
  };

  queryClient.setQueryData(transactionKeys.monthly(monthKey), existingData);

  // Mock API error
  mockFetch({ error: "Server error", status: 500 });

  const { result } = renderHook(() => useCreateTransaction(), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  // Try to create (should fail)
  await expect(
    result.current.mutateAsync({
      amount: 150,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
    })
  ).rejects.toThrow();

  // Cache should be rolled back to original
  const data = queryClient.getQueryData<
    InfiniteData<PaginatedTransactionsResponse>
  >(transactionKeys.monthly(monthKey));

  expect(data?.pages[0].items).toHaveLength(1);
  expect(data?.pages[0].items[0].id).toBe("tx-1");
});
```

### Testing Selective Updates (Only Affected Month)

```tsx
it("should only update affected month's cache", async () => {
  const februaryKey = "2026-02";
  const marchKey = "2026-03";

  // Setup cache for two months
  const februaryData: InfiniteData<PaginatedTransactionsResponse> = {
    pages: [{ items: [{ id: "tx-feb", amount: 100 }], total: 1 }],
    pageParams: [undefined],
  };

  const marchData: InfiniteData<PaginatedTransactionsResponse> = {
    pages: [{ items: [{ id: "tx-mar", amount: 200 }], total: 1 }],
    pageParams: [undefined],
  };

  queryClient.setQueryData(transactionKeys.monthly(februaryKey), februaryData);
  queryClient.setQueryData(transactionKeys.monthly(marchKey), marchData);

  mockFetch({ data: { id: "tx-new", amount: 150 } });

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

  // February should be updated
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
```

---

## Testing Error Scenarios

### Testing API Errors

```tsx
it("should handle API error", async () => {
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
```

### Testing Network Errors

```tsx
it("should handle network error", async () => {
  // Simulate network error
  global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

  const { result } = renderHook(() => useTransactionDetail("tx-1"), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
  });

  expect(result.current.error).toBeDefined();
});
```

### Testing Validation Errors

```tsx
it("should handle validation error from API", async () => {
  mockFetch({
    error: "Amount must be positive",
    status: 400,
  });

  const { result } = renderHook(() => useCreateTransaction(), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  await expect(
    result.current.mutateAsync({
      amount: -100, // Invalid
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
    })
  ).rejects.toThrow();

  expect(result.current.isError).toBe(true);
});
```

---

## Best Practices

### ✅ DO

1. **Create fresh QueryClient for each test**
   ```tsx
   beforeEach(() => {
     queryClient = createTestQueryClient();
   });
   ```

2. **Clean up after tests**
   ```tsx
   afterEach(() => {
     cleanupTests(queryClient);
   });
   ```

3. **Use `waitFor` for async assertions**
   ```tsx
   await waitFor(() => {
     expect(result.current.isSuccess).toBe(true);
   });
   ```

4. **Mock external dependencies**
   ```tsx
   vi.mock("@/components/ToastProvider", () => ({
     useToast: () => ({ showToast: vi.fn() }),
   }));
   ```

5. **Test all states: loading, success, error**
   ```tsx
   it("shows loading state", async () => {
     expect(result.current.isLoading).toBe(true);
   });

   it("shows success state", async () => {
     await waitFor(() => {
       expect(result.current.isSuccess).toBe(true);
     });
   });

   it("shows error state", async () => {
     await waitFor(() => {
       expect(result.current.isError).toBe(true);
     });
   });
   ```

### ❌ DON'T

1. **Don't reuse QueryClient across tests**
   ```tsx
   // ❌ BAD
   const queryClient = createTestQueryClient(); // Outside beforeEach
   ```

2. **Don't forget to await async operations**
   ```tsx
   // ❌ BAD
   result.current.mutate(data);
   expect(result.current.isSuccess).toBe(true); // Won't work

   // ✅ GOOD
   await result.current.mutateAsync(data);
   expect(result.current.isSuccess).toBe(true);
   ```

3. **Don't test implementation details**
   ```tsx
   // ❌ BAD
   expect(queryClient.getQueryData(key)).toBeDefined();

   // ✅ GOOD
   expect(result.current.data).toEqual(expectedData);
   ```

4. **Don't skip error scenarios**
   ```tsx
   // ❌ BAD - Only testing happy path
   it("creates transaction", async () => {
     await mutateAsync(validData);
   });

   // ✅ GOOD - Test both success and failure
   it("creates transaction successfully", async () => {
     await mutateAsync(validData);
   });

   it("handles creation error", async () => {
     await expect(mutateAsync(invalidData)).rejects.toThrow();
   });
   ```

---

## Common Patterns

### Pattern: Testing with Multiple Queries

```tsx
it("should fetch multiple queries in parallel", async () => {
  mockFetch({ data: summaryData });

  const { result: summaryResult } = renderHook(() => useSummary(TimeRange.MONTH), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  const { result: balanceResult } = renderHook(() => useBalance(), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  await waitFor(() => {
    expect(summaryResult.current.isSuccess).toBe(true);
    expect(balanceResult.current.isSuccess).toBe(true);
  });
});
```

### Pattern: Testing Dependent Queries

```tsx
it("should only fetch when dependency is met", async () => {
  const { result, rerender } = renderHook(
    ({ id }) => useTransactionDetail(id),
    {
      initialProps: { id: undefined },
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    }
  );

  // Should not fetch
  expect(result.current.isFetching).toBe(false);

  // Provide ID - should now fetch
  mockFetch({ data: mockTransaction });
  rerender({ id: "tx-1" });

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
});
```

### Pattern: Testing Custom Callbacks

```tsx
it("should call onSuccess callback", async () => {
  const onSuccess = vi.fn();

  mockFetch({ data: mockTransaction });

  const { result } = renderHook(
    () => useCreateTransaction({ onSuccess }),
    {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    }
  );

  await result.current.mutateAsync(validData);

  expect(onSuccess).toHaveBeenCalledWith(
    mockTransaction,
    validData,
    expect.any(Object)
  );
});
```

---

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- useCreateTransaction.test.tsx
```

### Watch Mode

```bash
npm test -- --watch
```

### Coverage Report

```bash
npm test -- --coverage
```

### Run Tests for Specific Feature

```bash
npm test -- src/features/transactions
```

---

## Debugging Tests

### 1. Use `screen.debug()`

```tsx
import { screen } from "@testing-library/react";

it("renders correctly", () => {
  renderWithClient(<MyComponent />);
  screen.debug(); // Prints current DOM
});
```

### 2. Use `console.log` for Query State

```tsx
it("checks query state", async () => {
  const { result } = renderHook(() => useTransactionDetail("tx-1"), {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
  });

  console.log(result.current); // Check hook state
});
```

### 3. Check React Query DevTools

```tsx
// In your test
queryClient.getQueryState(transactionKeys.detail("tx-1"));
queryClient.getQueriesData({ queryKey: transactionKeys.all });
```

---

## Summary Checklist

- ✅ Use `createTestQueryClient()` for each test
- ✅ Wrap hooks/components with `TestWrapper`
- ✅ Mock API calls with `mockFetch()`
- ✅ Clean up with `cleanupTests()` in `afterEach`
- ✅ Test loading, success, and error states
- ✅ Test optimistic updates and rollbacks
- ✅ Use `waitFor` for async assertions
- ✅ Mock external dependencies (toast, router, etc.)
- ✅ Test selective cache updates (only affected data)
- ✅ Write descriptive test names

---

**Happy Testing! 🧪**



