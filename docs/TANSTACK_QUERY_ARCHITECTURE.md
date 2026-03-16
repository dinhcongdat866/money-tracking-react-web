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

# TanStack Query Architecture

**Problem:** Quản lý server state phức tạp (kanban, dashboard, infinite scroll) nhưng vẫn muốn code gọn, dễ invalidate và không bị stale data.

**Solution:** Dùng TanStack Query với query key factory, staleTime theo loại dữ liệu, và pattern optimistic update + invalidate.

## Architecture

- **Query Key Factory**
  - Tất cả query key đi qua `transactionKeys`, `financialKeys`, `analyticsKeys`
  - Hỗ trợ **hierarchical invalidation**:
    - `transactionKeys.all` → invalidate toàn bộ
    - `transactionKeys.categories()` → chỉ dữ liệu kanban
    - `transactionKeys.byCategory(category, { month })` → 1 cột/1 tháng

- **Default Query Client**
  - `staleTime: 0` cho dữ liệu tài chính (luôn mới)
  - `gcTime: 5 phút` để back/forward cực nhanh
  - `refetchOnWindowFocus: true`, `refetchOnReconnect: true`
  - Retry 5xx với exponential backoff, không retry 4xx

## Key Patterns

- **Optimistic Mutations (3 pha)**
  - `onMutate`: cancel queries, snapshot cache, update UI ngay
  - `onError`: rollback snapshot + toast lỗi
  - `onSuccess`: invalidate các query liên quan (cột kanban, balance, analytics)

- **Prefetching**
  - Prefetch tháng trước/sau cho trang Transactions
  - Prefetch toàn bộ cột kanban cho tháng hiện tại
  - Infinite scroll dùng `useInfiniteQuery` + IntersectionObserver

- **Stale Time Strategy**
  - `REALTIME`: transactions, balance, kanban
  - `SHORT`: dashboard summary
  - `LONG / STATIC`: settings, config, danh mục

## Results

- **UX:** back/forward gần như instant, drag & drop luôn đúng dữ liệu.
- **DX:** query key có type, dễ refactor, dễ giải thích trong phỏng vấn.
- **Where:** `QueryClient` + keys ở `src/lib/query-keys.ts` và `src/components/QueryProvider.tsx`.
