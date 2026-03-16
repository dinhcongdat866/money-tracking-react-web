# TanStack Query Architecture

**Problem:** Complex server state (kanban, dashboard, infinite scroll) quickly becomes messy if query keys and cache rules are ad‑hoc.

**Solution:** TanStack Query with a query key factory, clear stale times per data type, and a hybrid “optimistic update + invalidate” pattern.

## Architecture

- **Query Key Factory**
  - All data goes through `transactionKeys`, `financialKeys`, `analyticsKeys`.
  - Supports **hierarchical invalidation**:
    - `transactionKeys.all` → invalidate every transaction query.
    - `transactionKeys.categories()` → only kanban columns.
    - `transactionKeys.byCategory(category, { month })` → a single column for a single month.

- **Default Query Client**
  - `staleTime: 0` for financial data (always fresh).
  - `gcTime: 5 minutes` so back/forward navigation feels instant.
  - `refetchOnWindowFocus: true`, `refetchOnReconnect: true` for safety.
  - Smart retries: retry 5xx with exponential backoff, skip 4xx.

## Key Patterns

- **Optimistic Mutations (3 phases)**
  - `onMutate`: cancel queries, snapshot cache, update UI immediately.
  - `onError`: rollback from the snapshot and show an error toast.
  - `onSuccess`: invalidate related queries (kanban columns, balance, analytics).

- **Prefetching**
  - Prefetch previous/next month for the Transactions page.
  - Prefetch all kanban columns for the active month.
  - Infinite scroll with `useInfiniteQuery` plus `IntersectionObserver`.

- **Stale Time Strategy**
  - `REALTIME`: transactions, balance, kanban.
  - `SHORT`: dashboard summaries.
  - `LONG / STATIC`: settings, configuration, categories.

## Results

- **UX:** Back/forward navigation feels almost instant while data stays correct.
- **DX:** Strongly‑typed query keys, easy refactors, and a clean story for interviews.
- **Where:** `QueryClient` + keys live in `src/lib/query-keys.ts` and `src/components/QueryProvider.tsx`.
