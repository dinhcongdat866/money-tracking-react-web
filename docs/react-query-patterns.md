# React Query Patterns & Best Practices

Tài liệu này chứa các patterns và best practices khi sử dụng React Query trong dự án Money Tracking.

## 📚 Table of Contents

- [Query Patterns](#query-patterns)
- [Mutation Patterns](#mutation-patterns)
- [Optimistic Updates](#optimistic-updates)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Common Pitfalls](#common-pitfalls)

---

## Query Patterns

### Basic Query

```tsx
import { useTransactionDetail } from "@/features/transactions/hooks/useTransactionDetail";

function TransactionDetail({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useTransactionDetail(id);

  if (isLoading) {
    return <Skeleton />;
  }

  if (isError) {
    return <ErrorMessage error={error} />;
  }

  if (!data) {
    return <NotFound />;
  }

  return <TransactionCard transaction={data} />;
}
```

### Conditional Queries (enabled)

```tsx
import { useTransactionDetail } from "@/features/transactions/hooks/useTransactionDetail";

function ConditionalQuery({ selectedId }: { selectedId?: string }) {
  // Won't fetch if selectedId is undefined
  const { data } = useTransactionDetail(selectedId);

  // Hook already has `enabled: Boolean(id)` internally
  return data ? <Detail data={data} /> : <EmptyState />;
}
```

### Infinite Scroll

```tsx
import { useMonthlyTransactions } from "@/features/transactions/hooks/useMonthlyTransactions";

function TransactionList({ month }: { month: string }) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMonthlyTransactions(month);

  if (isLoading) return <Skeleton />;

  return (
    <>
      {data.pages.map((page) =>
        page.items.map((tx) => <TransactionItem key={tx.id} {...tx} />)
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load More"}
        </button>
      )}
    </>
  );
}
```

### Parallel Queries

```tsx
import { useSummary } from "@/features/dashboard/hooks/use-summary";
import { useBalance } from "@/features/dashboard/hooks/use-balance";
import { TimeRange } from "@/features/dashboard/types";

function Dashboard() {
  // These queries run in parallel
  const { data: summary } = useSummary(TimeRange.MONTH);
  const { data: balance } = useBalance();

  return (
    <>
      <SummaryCard data={summary} />
      <BalanceCard data={balance} />
    </>
  );
}
```

### Dependent Queries

```tsx
import { useTransactionDetail } from "@/features/transactions/hooks/useTransactionDetail";
import { useMonthlySummary } from "@/features/transactions/hooks/useMonthlySummary";

function TransactionWithMonthlySummary({ id }: { id: string }) {
  const { data: transaction } = useTransactionDetail(id);

  // Extract month from transaction date
  const month = transaction
    ? new Date(transaction.date).toISOString().slice(0, 7)
    : undefined;

  // This query only runs after we have the month from the first query
  const { data: summary } = useMonthlySummary(month || "", {
    enabled: Boolean(month),
  });

  return (
    <>
      <TransactionCard transaction={transaction} />
      <MonthlySummary summary={summary} />
    </>
  );
}
```

---

## Mutation Patterns

### Basic Mutation

```tsx
import { useCreateTransaction } from "@/features/transactions/hooks/useCreateTransaction";

function AddTransactionForm() {
  const { mutate, isPending } = useCreateTransaction();

  const handleSubmit = (values: FormValues) => {
    mutate({
      amount: values.amount,
      type: values.type,
      categoryId: values.categoryId,
      categoryName: values.categoryName,
      date: new Date().toISOString(),
      note: values.note,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Transaction"}
      </button>
    </form>
  );
}
```

### Async Mutation (with async/await)

```tsx
import { useCreateTransaction } from "@/features/transactions/hooks/useCreateTransaction";
import { useRouter } from "next/navigation";

function AddTransactionForm() {
  const router = useRouter();
  const { mutateAsync } = useCreateTransaction();

  const handleSubmit = async (values: FormValues) => {
    try {
      const transaction = await mutateAsync({
        amount: values.amount,
        type: values.type,
        categoryId: values.categoryId,
        categoryName: values.categoryName,
        date: new Date().toISOString(),
      });

      // Navigate after successful creation
      router.push(`/transactions/${transaction.id}`);
    } catch (error) {
      console.error("Failed to create transaction:", error);
      // Error toast is already shown by the hook
    }
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

### Mutation with Custom Callbacks

```tsx
import { useDeleteTransaction } from "@/features/transactions/hooks/useDeleteTransaction";
import { useRouter } from "next/navigation";

function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const { mutate, isPending } = useDeleteTransaction({
    onSuccess: () => {
      // Custom success handler
      router.push("/transactions");
    },
    onError: (error) => {
      // Custom error handler
      console.error("Delete failed:", error);
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      mutate(id);
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending}>
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
```

---

## Optimistic Updates

### How It Works

Optimistic updates make your app feel instant by updating the UI before the server responds. If the server fails, the update is rolled back automatically.

```tsx
// Inside useCreateTransaction hook (already implemented)
onMutate: async (newTransaction) => {
  // 1. Cancel ongoing queries to avoid race conditions
  await queryClient.cancelQueries({ queryKey: transactionKeys.all });

  // 2. Snapshot current state (for rollback)
  const previous = queryClient.getQueryData(transactionKeys.monthly(month));

  // 3. Optimistically update the UI
  queryClient.setQueryData(transactionKeys.monthly(month), (old) => {
    return {
      ...old,
      pages: old.pages.map((page, i) => 
        i === 0 
          ? { ...page, items: [optimisticTransaction, ...page.items] }
          : page
      ),
    };
  });

  // 4. Return context for potential rollback
  return { previous };
},
onError: (err, variables, context) => {
  // 5. Rollback on error
  queryClient.setQueryData(key, context.previous);
},
onSettled: () => {
  // 6. Refetch to sync with server
  queryClient.invalidateQueries({ queryKey: transactionKeys.monthly(month) });
},
```

### Benefits

✅ **Instant UI feedback** - No waiting for server  
✅ **Automatic rollback** - Errors are handled gracefully  
✅ **Server sync** - Eventually consistent with backend  
✅ **Optimized invalidation** - Only affected queries are refetched  

### When to Use Optimistic Updates

✅ **Use for:**
- Creating transactions
- Deleting transactions
- Updating transactions
- Toggling flags/favorites

❌ **Don't use for:**
- Complex calculations (let server handle)
- Multi-step transactions
- Operations requiring server validation

---

## Error Handling

### Hook-Level Error Handling

```tsx
import { useTransactionDetail } from "@/features/transactions/hooks/useTransactionDetail";

function TransactionDetail({ id }: { id: string }) {
  const { data, isError, error } = useTransactionDetail(id);

  if (isError) {
    return (
      <div className="error">
        <h3>Failed to load transaction</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return <TransactionCard transaction={data} />;
}
```

### Global Error Boundary

```tsx
import { ReactQueryErrorBoundary } from "@/components/ReactQueryErrorBoundary";

function App() {
  return (
    <ReactQueryErrorBoundary>
      <YourApp />
    </ReactQueryErrorBoundary>
  );
}
```

### Mutation Error with Toast

```tsx
// Toast notifications are built into mutation hooks
import { useCreateTransaction } from "@/features/transactions/hooks/useCreateTransaction";

function Form() {
  const { mutate } = useCreateTransaction();
  // Automatically shows toast on success/error
  // No need to handle errors manually!
}
```

### Custom Error Handler

```tsx
import { useCreateTransaction } from "@/features/transactions/hooks/useCreateTransaction";

function Form() {
  const { mutate, error, isError } = useCreateTransaction({
    onError: (error) => {
      // Custom error handling
      if (error.status === 401) {
        router.push("/login");
      }
    },
  });

  return (
    <>
      {isError && <ErrorAlert error={error} />}
      <form onSubmit={handleSubmit}>{/* ... */}</form>
    </>
  );
}
```

---

## Testing

### Test Utilities

```tsx
import {
  createTestQueryClient,
  renderWithClient,
  mockFetch,
} from "@/test/test-utils";
```

### Testing Queries

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useTransactionDetail } from "./useTransactionDetail";
import { createTestQueryClient, TestWrapper, mockFetch } from "@/test/test-utils";

describe("useTransactionDetail", () => {
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should fetch transaction successfully", async () => {
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

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
  });

  it("should handle errors", async () => {
    mockFetch({ error: "Not found", status: 404 });

    const { result } = renderHook(() => useTransactionDetail("invalid"), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

### Testing Mutations with Optimistic Updates

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { useCreateTransaction } from "./useCreateTransaction";
import { createTestQueryClient, TestWrapper, mockFetch } from "@/test/test-utils";
import { transactionKeys } from "@/lib/query-keys";

describe("useCreateTransaction optimistic updates", () => {
  it("should optimistically update cache", async () => {
    const queryClient = createTestQueryClient();
    const monthKey = "2026-02";

    // Pre-populate cache
    queryClient.setQueryData(transactionKeys.monthly(monthKey), {
      pages: [{ items: [], total: 0, page: 1, limit: 20, hasMore: false }],
      pageParams: [undefined],
    });

    mockFetch({ data: { id: "tx-123", amount: 100 } });

    const { result } = renderHook(() => useCreateTransaction(), {
      wrapper: ({ children }) => (
        <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
      ),
    });

    const promise = result.current.mutateAsync({
      amount: 100,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
    });

    // Check optimistic update BEFORE API resolves
    await waitFor(() => {
      const data = queryClient.getQueryData(transactionKeys.monthly(monthKey));
      expect(data.pages[0].items).toHaveLength(1);
      expect(data.pages[0].items[0].id).toContain("optimistic-");
    });

    await promise;
  });
});
```

### Testing Error Rollback

```tsx
it("should rollback on error", async () => {
  const queryClient = createTestQueryClient();
  const monthKey = "2026-02";

  const existingData = {
    pages: [
      {
        items: [{ id: "tx-1", amount: 50 }],
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

  await expect(
    result.current.mutateAsync({
      amount: 100,
      type: "expense",
      categoryId: "c1",
      categoryName: "Food",
      date: "2026-02-15T10:00:00.000Z",
    })
  ).rejects.toThrow();

  // Should rollback to original state
  const data = queryClient.getQueryData(transactionKeys.monthly(monthKey));
  expect(data).toEqual(existingData);
});
```

---

## Common Pitfalls

### ❌ Pitfall 1: Not using Query Keys Factory

```tsx
// ❌ BAD - Hard-coded keys
queryKey: ["transactions", month]
queryKey: ["transaction-detail", id]

// ✅ GOOD - Use query keys factory
import { transactionKeys } from "@/lib/query-keys";
queryKey: transactionKeys.monthly(month)
queryKey: transactionKeys.detail(id)
```

**Why?** Query keys factory ensures:
- Type safety
- Consistent naming
- Easy invalidation
- Refactor safety

---

### ❌ Pitfall 2: Invalidating Too Much

```tsx
// ❌ BAD - Invalidates all transactions globally
queryClient.invalidateQueries({ queryKey: ["transactions"] });

// ✅ GOOD - Only invalidate affected month
const monthKey = "2026-02";
queryClient.invalidateQueries({ queryKey: transactionKeys.monthly(monthKey) });
```

**Why?** Over-invalidation causes:
- Unnecessary API calls
- Poor performance
- UI flicker

---

### ❌ Pitfall 3: Not Handling Loading States

```tsx
// ❌ BAD - No loading state
const { data } = useTransactionDetail(id);
return <TransactionCard transaction={data} />;

// ✅ GOOD - Handle all states
const { data, isLoading, isError } = useTransactionDetail(id);

if (isLoading) return <Skeleton />;
if (isError) return <ErrorMessage />;
if (!data) return null;

return <TransactionCard transaction={data} />;
```

---

### ❌ Pitfall 4: Forgetting to Cancel Queries in onMutate

```tsx
// ❌ BAD - Race condition possible
onMutate: (newData) => {
  const previous = queryClient.getQueryData(key);
  queryClient.setQueryData(key, newData);
  return { previous };
}

// ✅ GOOD - Cancel queries first
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(key);
  queryClient.setQueryData(key, newData);
  return { previous };
}
```

**Why?** Without canceling:
- Ongoing fetches can overwrite your optimistic update
- Race conditions can occur

---

### ❌ Pitfall 5: Testing Without Proper Setup

```tsx
// ❌ BAD - No QueryClient provider
const { result } = renderHook(() => useTransactionDetail("tx-1"));

// ✅ GOOD - Use test utilities
const { result } = renderHook(() => useTransactionDetail("tx-1"), {
  wrapper: ({ children }) => (
    <TestWrapper queryClient={createTestQueryClient()}>
      {children}
    </TestWrapper>
  ),
});
```

---

## Query Key Patterns

### Hierarchical Keys

```tsx
// Base key
transactionKeys.all = ['transactions']

// Lists
transactionKeys.monthly('2026-02') = ['transactions', 'monthly', '2026-02']
transactionKeys.recent() = ['transactions', 'recent']

// Details
transactionKeys.detail('tx-123') = ['transactions', 'detail', 'tx-123']
```

### Invalidation by Scope

```tsx
// Invalidate all transactions
queryClient.invalidateQueries({ queryKey: transactionKeys.all });

// Invalidate only one month
queryClient.invalidateQueries({ 
  queryKey: transactionKeys.monthly('2026-02') 
});

// Invalidate all monthly queries
queryClient.invalidateQueries({ 
  queryKey: [...transactionKeys.all, 'monthly'] 
});
```

---

## Performance Tips

### 1. Use `select` to Subscribe to Partial Data

```tsx
// Only re-render when amount changes
const { data: amount } = useTransactionDetail(id, {
  select: (transaction) => transaction.amount,
});
```

### 2. Set Appropriate Stale Times

```tsx
// Financial data - always fresh
staleTime: STALE_TIME.REALTIME // 0ms

// Dashboard metrics - short cache
staleTime: STALE_TIME.SHORT // 30s

// Static data - long cache
staleTime: STALE_TIME.STATIC // Infinity
```

### 3. Use Placeholder Data

```tsx
// Prevents UI flicker during refetch
const { data } = useMonthlyTransactions(month, {
  placeholderData: (previousData) => previousData,
});
```

### 4. Prefetch Next Page

```tsx
import { usePrefetchNextMonth } from "@/features/transactions/hooks/usePrefetchNextMonth";

function MonthSelector({ currentMonth }: { currentMonth: string }) {
  usePrefetchNextMonth(currentMonth);
  // Next month will be prefetched in the background
}
```

---

## Resources

- **React Query Docs:** https://tanstack.com/query/latest
- **Query Key Factory:** `src/lib/query-keys.ts`
- **Test Utilities:** `src/test/test-utils.tsx`
- **Example Tests:** `src/features/transactions/hooks/*.test.tsx`

---

## Quick Reference

| Pattern | Hook | Key Feature |
|---------|------|-------------|
| Basic Query | `useTransactionDetail` | Simple data fetching |
| Infinite Scroll | `useMonthlyTransactions` | Pagination with `fetchNextPage()` |
| Mutation | `useCreateTransaction` | Optimistic updates + rollback |
| Delete | `useDeleteTransaction` | Optimistic removal |
| Parallel | Multiple `use*` hooks | Independent queries |
| Dependent | `enabled: Boolean(dep)` | Sequential queries |

---

**Made with ❤️ for Money Tracking App**



