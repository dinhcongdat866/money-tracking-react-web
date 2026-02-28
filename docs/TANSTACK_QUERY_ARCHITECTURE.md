# TanStack Query Architecture

Production-grade React Query patterns for financial transaction management.

**Scope:** Query key design, cache invalidation, prefetching patterns, and cursor-based infinite scrolling for Kanban board with 2000+ transactions per category.

---

## 1. Query Key Design

### Factory Pattern Implementation

We use a **query key factory** pattern for type-safe, refactor-friendly keys:

```typescript
// src/lib/query-keys.ts

export const transactionKeys = {
  // Base key - invalidate ALL transaction queries
  all: ['transactions'] as const,

  // List queries
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: { month?: string; page?: number; limit?: number }) =>
    [...transactionKeys.lists(), filters] as const,

  // Monthly queries (for timeline view)
  monthly: (month: string) =>
    [...transactionKeys.all, 'monthly', month] as const,

  // Category queries (for Kanban board columns)
  categories: () => [...transactionKeys.all, 'category'] as const,
  byCategory: (category: string, filters?: { month?: string; limit?: number }) =>
    filters
      ? [...transactionKeys.categories(), category, filters] as const
      : [...transactionKeys.categories(), category] as const,

  // Infinite scroll queries (for Kanban with all categories)
  infinite: (filters?: { month?: string; category?: string; search?: string }) =>
    filters
      ? [...transactionKeys.all, 'infinite', filters] as const
      : [...transactionKeys.all, 'infinite'] as const,

  // Recent queries (for dashboard)
  recent: () => [...transactionKeys.all, 'recent'] as const,

  // Detail queries
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
} as const;
```

### Why This Structure?

**Hierarchical invalidation:**
```typescript
// Invalidate ALL transactions (logout, global refresh)
queryClient.invalidateQueries({ queryKey: transactionKeys.all })

// Invalidate ALL category queries (after bulk update)
queryClient.invalidateQueries({ queryKey: transactionKeys.categories() })

// Invalidate specific category (after drag & drop)
queryClient.invalidateQueries({ queryKey: transactionKeys.byCategory('Food') })

// Invalidate specific month (after adding transaction)
queryClient.invalidateQueries({ queryKey: transactionKeys.monthly('2026-02') })
```

**Fine-grained control:**
```typescript
// Only invalidate Food category for February 2026
queryClient.invalidateQueries({ 
  queryKey: transactionKeys.byCategory('Food', { month: '2026-02' }) 
})
```

**Type safety:**
```typescript
// ✅ TypeScript will autocomplete and type-check
const key = transactionKeys.byCategory('Food', { month: '2026-02' })

// ❌ TypeScript error - wrong filter shape
const key = transactionKeys.byCategory('Food', { invalid: true })
```

---

## 2. Cache Invalidation Strategy

### Scenario: Drag Transaction from "Food" to "Transport"

```typescript
// src/features/transactions/hooks/useUpdateCategory.ts

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, oldCategory, newCategory }) => {
      return await updateTransactionCategory(transactionId, newCategory)
    },

    // 1. OPTIMISTIC UPDATE - Update UI immediately
    onMutate: async ({ transactionId, oldCategory, newCategory }) => {
      // Cancel outgoing refetches (don't want them to overwrite optimistic update)
      await queryClient.cancelQueries({ queryKey: transactionKeys.categories() })

      // Snapshot current state for rollback
      const previousOldCategory = queryClient.getQueryData(
        transactionKeys.byCategory(oldCategory)
      )
      const previousNewCategory = queryClient.getQueryData(
        transactionKeys.byCategory(newCategory)
      )

      // Find the transaction
      const transaction = previousOldCategory?.find(t => t.id === transactionId)

      if (transaction) {
        // Remove from old category
        queryClient.setQueryData(
          transactionKeys.byCategory(oldCategory),
          (old: Transaction[]) => old.filter(t => t.id !== transactionId)
        )

        // Add to new category
        queryClient.setQueryData(
          transactionKeys.byCategory(newCategory),
          (old: Transaction[] = []) => [
            { ...transaction, category: newCategory },
            ...old
          ]
        )
      }

      // Return context for rollback
      return { previousOldCategory, previousNewCategory, oldCategory, newCategory }
    },

    // 2. ROLLBACK ON ERROR
    onError: (err, variables, context) => {
      if (context?.previousOldCategory) {
        queryClient.setQueryData(
          transactionKeys.byCategory(context.oldCategory),
          context.previousOldCategory
        )
      }
      if (context?.previousNewCategory) {
        queryClient.setQueryData(
          transactionKeys.byCategory(context.newCategory),
          context.previousNewCategory
        )
      }

      toast.error('Failed to move transaction. Changes reverted.')
    },

    // 3. INVALIDATE ON SUCCESS
    onSuccess: (data, variables) => {
      // Invalidate both categories to get fresh data from server
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.byCategory(variables.oldCategory) 
      })
      queryClient.invalidateQueries({ 
        queryKey: transactionKeys.byCategory(variables.newCategory) 
      })

      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: financialKeys.balance() })
      queryClient.invalidateQueries({ queryKey: analyticsKeys.mostSpentExpenses() })

      toast.success('Transaction moved!')
    },
  })
}
```

### Cache Invalidation Hierarchy

```typescript
// Level 1: Surgical invalidation (after single transaction update)
queryClient.invalidateQueries({ 
  queryKey: transactionKeys.byCategory('Food', { month: '2026-02' }) 
})

// Level 2: Category-wide invalidation (after bulk update in category)
queryClient.invalidateQueries({ 
  queryKey: transactionKeys.byCategory('Food') 
})

// Level 3: All categories (after settings change affecting all categories)
queryClient.invalidateQueries({ 
  queryKey: transactionKeys.categories() 
})

// Level 4: Nuclear option (logout, reset)
queryClient.invalidateQueries({ 
  queryKey: transactionKeys.all 
})
```

### Trade-offs: Invalidation vs Direct Update

| Approach | When to Use | Pros | Cons |
|----------|-------------|------|------|
| **Direct Update** (`setQueryData`) | - Known data structure<br>- Single item update<br>- Optimistic UI | - Instant UI update<br>- No refetch needed<br>- Saves bandwidth | - Can get out of sync<br>- Must handle all edge cases<br>- More complex code |
| **Invalidation** (`invalidateQueries`) | - Complex aggregations<br>- Uncertain data structure<br>- After success | - Always correct<br>- Simple code<br>- Server is source of truth | - Requires refetch<br>- Network latency<br>- UI loading state |
| **Hybrid** (Both) | - Optimistic updates with validation | - Best UX (instant + correct)<br>- Handles edge cases | - More code<br>- Potential for double-fetching |

**Our Strategy:** Use hybrid approach
1. Optimistic update for instant feedback
2. Invalidate on success to ensure correctness
3. Rollback on error

---

## 3. Prefetching Patterns

### Pattern 1: Adjacent Month Prefetching

```typescript
// src/features/transactions/hooks/usePrefetchNextMonth.ts

export const usePrefetchNextMonth = (currentMonth: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Calculate next month
    const nextMonth = addMonths(currentMonth, 1)

    // Prefetch next month's transactions in background
    void queryClient.prefetchQuery({
      queryKey: transactionKeys.monthly(nextMonth),
      queryFn: () => getMonthlyTransactions(nextMonth, 1, 10),
      staleTime: STALE_TIME.SHORT, // Cache for 30s
    })

    // Also prefetch previous month (for back navigation)
    const prevMonth = subMonths(currentMonth, 1)
    void queryClient.prefetchQuery({
      queryKey: transactionKeys.monthly(prevMonth),
      queryFn: () => getMonthlyTransactions(prevMonth, 1, 10),
      staleTime: STALE_TIME.SHORT,
    })
  }, [currentMonth, queryClient])
}

// Usage in MonthSelector component
function MonthSelector() {
  const [selectedMonth, setSelectedMonth] = useState('2026-02')
  
  // Prefetch adjacent months
  usePrefetchNextMonth(selectedMonth)

  // When user clicks next month, data is already loaded!
  return <MonthNavigation month={selectedMonth} onMonthChange={setSelectedMonth} />
}
```

### Pattern 2: Hover Prefetching for Details

```typescript
// src/features/transactions/components/TransactionCard.tsx

export const TransactionCard = ({ transaction }) => {
  const queryClient = useQueryClient()
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    // Prefetch after 300ms hover (prevents excessive prefetching)
    const timer = setTimeout(() => {
      void queryClient.prefetchQuery({
        queryKey: transactionKeys.detail(transaction.id),
        queryFn: () => getTransactionDetail(transaction.id),
        staleTime: STALE_TIME.MEDIUM,
      })
    }, 300)

    setHoverTimer(timer)
  }

  const handleMouseLeave = () => {
    if (hoverTimer) clearTimeout(hoverTimer)
  }

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => openTransactionDetail(transaction.id)}
    >
      {/* When clicked, data is already loaded! */}
    </div>
  )
}
```

### Pattern 3: Kanban Column Prefetching

```typescript
// src/features/kanban/hooks/usePrefetchKanbanColumns.ts

export const usePrefetchKanbanColumns = (currentMonth: string) => {
  const queryClient = useQueryClient()

  useEffect(() => {
    const categories = ['Income', 'Food', 'Transport', 'Housing', 'Shopping', 'Utilities', 'Other']

    // Prefetch all category columns in parallel
    Promise.all(
      categories.map(category =>
        queryClient.prefetchQuery({
          queryKey: transactionKeys.byCategory(category, { month: currentMonth }),
          queryFn: () => getTransactionsByCategory(category, currentMonth),
          staleTime: STALE_TIME.REALTIME,
        })
      )
    )
  }, [currentMonth, queryClient])
}
```

### Pattern 4: Intersection Observer Prefetching

```typescript
// src/hooks/useInfiniteScrollPrefetch.ts

export const useInfiniteScrollPrefetch = (
  hasNextPage: boolean,
  fetchNextPage: () => void
) => {
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel is 200px from viewport, prefetch next page
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' } // Prefetch 200px before reaching bottom
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage])

  return observerRef
}
```

---

## 4. Handling Paginated API with Infinite Scrolling

### Implementation with `useInfiniteQuery`

```typescript
// src/features/kanban/hooks/useCategoryTransactions.ts

export const useCategoryTransactions = (
  category: string,
  month: string
) => {
  return useInfiniteQuery<PaginatedTransactionsResponse, ApiError>({
    // Query key includes category and month for proper cache separation
    queryKey: transactionKeys.byCategory(category, { month }),

    // Fetch function with page parameter
    queryFn: async ({ pageParam = 1 }) => {
      const response = await getTransactionsByCategory(category, {
        month,
        page: pageParam as number,
        limit: 20, // 20 transactions per page
      })
      return response
    },

    // Initial page
    initialPageParam: 1,

    // Determine next page
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },

    // Enable query only when category and month are provided
    enabled: Boolean(category && month),

    // Financial data should be fresh
    staleTime: STALE_TIME.REALTIME,

    // Keep previous data while fetching (prevent UI flicker)
    placeholderData: (previousData) => previousData,

    // Prefetch next page when 80% through current pages
    // This is handled by IntersectionObserver in component
  })
}

// Usage in Kanban Column
function KanbanColumn({ category, month }) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCategoryTransactions(category, month)

  // Flatten all pages
  const transactions = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  )

  // Intersection observer for infinite scroll
  const sentinelRef = useInfiniteScrollPrefetch(hasNextPage, fetchNextPage)

  return (
    <VirtualizedCardList transactions={transactions}>
      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-10">
        {isFetchingNextPage && <Spinner />}
      </div>
    </VirtualizedCardList>
  )
}
```

### Cursor vs Offset Pagination

**Current: Offset-based (page numbers)**
```typescript
// Page 1: GET /transactions?category=Food&page=1&limit=20
// Page 2: GET /transactions?category=Food&page=2&limit=20
```

**Better for production: Cursor-based**
```typescript
// Page 1: GET /transactions?category=Food&limit=20
// Returns: { items: [...], nextCursor: "cursor_abc123" }

// Page 2: GET /transactions?category=Food&limit=20&cursor=cursor_abc123
// Returns: { items: [...], nextCursor: "cursor_def456" }

// Implementation
queryFn: async ({ pageParam }) => {
  const response = await getTransactionsByCategory(category, {
    month,
    limit: 20,
    cursor: pageParam, // undefined for first page
  })
  return response
},

getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
```

**Why cursor-based?**
- ✅ No duplicate items when data changes (new transaction added)
- ✅ Better performance (no OFFSET in SQL)
- ✅ More reliable for real-time data
- ❌ Can't jump to specific page (no page numbers)
- ❌ More complex backend implementation

---

## 5. Stale Time Strategy

### Granular Stale Time Configuration

```typescript
// src/lib/query-keys.ts

export const STALE_TIME = {
  REALTIME: 0,           // Transactions, balance - always fresh
  SHORT: 30 * 1000,      // 30s - Dashboard metrics, quick aggregations
  MEDIUM: 60 * 1000,     // 1min - Transaction details, reports
  LONG: 5 * 60 * 1000,   // 5min - User settings, preferences
  STATIC: Infinity,      // Category list, static configs
} as const

// Apply per query
export const useCategoryTransactions = (category: string) => {
  return useQuery({
    queryKey: transactionKeys.byCategory(category),
    queryFn: () => getTransactionsByCategory(category),
    staleTime: STALE_TIME.REALTIME, // Financial data always fresh
  })
}

export const useUserSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
    staleTime: STALE_TIME.LONG, // Settings rarely change
  })
}
```

### Why Stale Time Matters

```typescript
// Scenario: User navigates Away → Back to Transactions page

// With staleTime: 0 (REALTIME)
// ✅ Refetches data immediately (always fresh)
// ❌ Network request every navigation
// Use for: Financial data, critical info

// With staleTime: 30s (SHORT)
// ✅ Instant load if < 30s ago
// ✅ Still refetches in background
// Use for: Dashboard metrics, aggregations

// With staleTime: Infinity (STATIC)
// ✅ Never refetches (until invalidated)
// ✅ Zero network requests
// Use for: Category list, static configs
```

---

## 6. Global Configuration

```typescript
// src/components/QueryProvider.tsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: Always fresh (can override per-query)
      staleTime: 0,
      
      // Cache for 5 minutes (prevents re-downloading on remount)
      gcTime: 1000 * 60 * 5,
      
      // Refetch when user returns to tab (important for financial data)
      refetchOnWindowFocus: true,
      
      // Refetch when network reconnects
      refetchOnReconnect: true,
      
      // Smart retry logic
      retry: shouldRetryOnError, // Don't retry 4xx, do retry 5xx
      
      // Exponential backoff: 1s, 2s, 4s, 8s, ...
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: shouldRetryOnError, // Same retry logic for mutations
    },
  },
})
```

---

## 7. Race Condition Handling

### Scenario: User Rapidly Switches Categories

```typescript
// Problem: User clicks Food → Transport → Shopping rapidly
// Three queries start, but responses arrive out of order:
// 1. Shopping query (200ms) ✅
// 2. Food query (250ms) ❌ Overwrites Shopping!
// 3. Transport query (300ms) ❌ Overwrites Food!

// Solution: React Query handles this automatically!
// Latest query wins, earlier queries are cancelled

export const useCategoryTransactions = (category: string) => {
  return useQuery({
    queryKey: transactionKeys.byCategory(category),
    queryFn: async ({ signal }) => {
      // signal is AbortSignal from React Query
      const response = await fetch(`/api/transactions?category=${category}`, {
        signal, // Automatically cancels if new query starts
      })
      return response.json()
    },
  })
}
```

### Scenario: Concurrent Mutations

```typescript
// Problem: User drags two transactions simultaneously
// Both mutations update the same category

// Solution: Queue mutations with TanStack Query
const mutation1 = useMutation({ mutationFn: moveTransaction })
const mutation2 = useMutation({ mutationFn: moveTransaction })

// React Query ensures mutations run sequentially (not concurrently)
mutation1.mutate({ id: '1', to: 'Food' })
mutation2.mutate({ id: '2', to: 'Food' }) // Waits for mutation1

// Invalidation happens after BOTH complete
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: transactionKeys.byCategory('Food') })
}
```

---

## 8. Discussion Points

### Q: Why use query key factory instead of strings?

**A:** Type safety, refactor-friendly, and hierarchical invalidation.

```typescript
// ❌ String keys - easy to make typos, no type checking
const key = ['transactions', 'category', 'Food']

// ✅ Factory - type-safe, autocomplete, refactor-safe
const key = transactionKeys.byCategory('Food')
```

### Q: When would you invalidate vs directly update cache?

**A:** 
- **Direct update:** Known structure, single item, optimistic UI
- **Invalidate:** Complex aggregations, after success to ensure correctness
- **Hybrid:** Optimistic update → API call → Invalidate on success (best UX)

### Q: How do you handle stale data during drag & drop?

**A:** Three-phase approach:
1. **onMutate:** Optimistic update, cancel outgoing queries
2. **onError:** Rollback to snapshot
3. **onSuccess:** Invalidate to get fresh data from server

### Q: What if two users drag the same transaction simultaneously?

**A:** 
1. Version-based conflict detection (each transaction has version number)
2. Server rejects stale updates (returns 409 Conflict)
3. Frontend shows conflict modal: "This transaction was updated elsewhere"
4. User chooses: Keep local change vs Accept server change

### Q: How would you scale this to 1 million transactions?

**A:**
- **Database:** Indexing on category + date, partitioning by year
- **Caching:** Redis for hot data (current month), CDN for static assets
- **Frontend:** Virtual scrolling (only render visible), lazy load categories
- **API:** Cursor pagination (better than offset), query optimization
- **Search:** Elasticsearch for fast filtering/searching

---

## Summary

### Key Architectural Decisions

1. **Query Key Factory:** Type-safe, hierarchical invalidation
2. **Hybrid Cache Strategy:** Optimistic updates + invalidation for correctness
3. **Smart Prefetching:** Adjacent data, hover, intersection observer
4. **Infinite Scroll:** `useInfiniteQuery` with cursor pagination (recommended)
5. **Granular Stale Time:** REALTIME for financial data, LONG for settings
6. **Race Condition Handling:** Automatic via AbortSignal
7. **Retry Logic:** Don't retry 4xx, do retry 5xx with exponential backoff

### Benefits

- ✅ Type-safe query keys with autocomplete
- ✅ Fine-grained cache invalidation
- ✅ Instant UI updates with optimistic mutations
- ✅ Automatic race condition handling
- ✅ Smart prefetching for perceived performance
- ✅ Proper error handling and retry logic
- ✅ Production-ready patterns

---

**Code References:**
- Query keys: `src/lib/query-keys.ts`
- Query provider: `src/components/QueryProvider.tsx`
- Infinite scroll: `src/features/transactions/hooks/useMonthlyTransactions.ts`
- Optimistic updates: `src/features/transactions/hooks/useUpdateCategory.ts` (to be created)

**Last Updated:** 2026-02-27  
**Project:** Money Tracking App - Kanban Board
