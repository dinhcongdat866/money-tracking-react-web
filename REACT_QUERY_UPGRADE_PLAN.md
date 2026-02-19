# React Query Production Upgrade Plan

## 🎯 Mục tiêu
Nâng cấp React Query setup hiện tại lên production-grade với best practices, type safety, và performance optimizations.

---

## Phase 1: Query Key Factory & Type Safety (Foundation) ⭐ **BẮT ĐẦU TỪ ĐÂY**

### 1.1 Tạo Query Key Factory Pattern
**Vấn đề hiện tại:** Query keys rải rác, khó maintain, dễ typo
```ts
// ❌ Hiện tại
queryKey: ["transactions", month]
queryKey: ["recentTransactions"]
queryKey: ["summary"]
```

**Giải pháp:** Centralized query key factory
```ts
// ✅ Production pattern
const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
  monthly: (month: string) => [...transactionKeys.all, 'monthly', month] as const,
}
```

**Lợi ích:**
- Type-safe, autocomplete
- Dễ invalidate theo nhóm
- Refactor an toàn

### 1.2 Type-safe Query/Mutation Hooks
- Generic types cho responses
- Error types rõ ràng
- Input validation

---

## Phase 2: Optimistic Updates & Cache Management

### 2.1 Optimistic Updates cho Mutations
**Vấn đề:** Hiện tại chỉ invalidate → user thấy loading, UX không mượt

**Giải pháp:** Optimistic updates với rollback
```ts
useMutation({
  mutationFn: createTransaction,
  onMutate: async (newTransaction) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: transactionKeys.monthly(month) });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(...);
    
    // Optimistically update
    queryClient.setQueryData(transactionKeys.monthly(month), (old) => {
      // Add new transaction to list
    });
    
    return { previous };
  },
  onError: (err, newTransaction, context) => {
    // Rollback on error
    queryClient.setQueryData(transactionKeys.monthly(month), context.previous);
  },
  onSettled: () => {
    // Refetch để sync với server
    queryClient.invalidateQueries({ queryKey: transactionKeys.monthly(month) });
  },
});
```

### 2.2 Smart Cache Invalidation
- Invalidate theo scope (chỉ tháng liên quan)
- Không invalidate toàn bộ queries
- Selective updates thay vì refetch

---

## Phase 3: Advanced Patterns

### 3.1 Prefetching Strategies
- Prefetch tháng tiếp theo khi user scroll gần cuối
- Prefetch transaction detail khi hover vào item
- Prefetch dashboard data khi mount

### 3.2 Dependent Queries
- Chỉ fetch reports khi đã có transactions
- Conditional queries với `enabled`

### 3.3 Parallel & Sequential Queries
- `useQueries` cho multiple independent queries
- Sequential với `enabled` dependencies

---

## Phase 4: Error Handling & UX

### 4.1 Centralized Error Handling
- Error boundary cho React Query errors
- Toast notifications cho mutations
- Retry strategies theo từng loại API

### 4.2 Loading States Granular
- Skeleton loaders
- Partial data rendering
- Suspense boundaries

---

## Phase 5: Performance & DevEx

### 5.1 Query DevTools
- React Query DevTools trong dev mode
- Inspect cache, queries, mutations

### 5.2 Select & Transform
- `select` để chỉ subscribe vào data cần thiết
- Transform data ở query level, không ở component

### 5.3 Stale Time Strategy
- Khác nhau theo loại data:
  - Financial data: `staleTime: 0` (như hiện tại)
  - Static data (categories): `staleTime: Infinity`
  - User profile: `staleTime: 5 minutes`

---

## Phase 6: Testing & Documentation ✅ **COMPLETED**

### 6.1 Testing React Query Hooks ✅
- ✅ Mock QueryClient (`createTestQueryClient`)
- ✅ Test optimistic updates (`useCreateTransaction.test.tsx`)
- ✅ Test error scenarios (API errors, network errors, rollback)
- ✅ Test query hooks (`useTransactionDetail.test.tsx`)
- ✅ Test utilities suite (`src/test/test-utils.tsx`)

**Files:**
- `src/test/test-utils.tsx` - Professional test utilities
- `src/features/transactions/hooks/useCreateTransaction.test.tsx` - Mutation tests
- `src/features/transactions/hooks/useTransactionDetail.test.tsx` - Query tests

### 6.2 Documentation ✅
- ✅ JSDoc cho tất cả major hooks (useCreateTransaction, useTransactionDetail, useDeleteTransaction, useMonthlyTransactions, useSummary)
- ✅ Examples cho common patterns (30+ code examples)
- ✅ Comprehensive guides (React Query Patterns, Testing Guide)
- ✅ Implementation summary

**Files:**
- `docs/react-query-patterns.md` - Complete patterns guide
- `docs/testing-guide.md` - Complete testing guide
- `docs/PHASE_6_IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

## 📋 Implementation Order (Recommended)

1. **Week 1:** Phase 1 (Query Key Factory) - Foundation quan trọng nhất
2. **Week 2:** Phase 2 (Optimistic Updates) - UX improvement lớn nhất
3. **Week 3:** Phase 3 (Advanced Patterns) - Performance
4. **Week 4:** Phase 4-6 (Polish & Testing)

---

## 🔄 Redux Integration (Sau này)

Khi thêm Redux, phân chia rõ ràng:
- **React Query:** Server state (API calls)
- **Redux:** Client state (UI state, filters, auth, global settings)

Không conflict, chỉ complement nhau!

