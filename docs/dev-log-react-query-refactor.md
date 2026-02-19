# Dev Log: React Query Production-Grade Refactoring

**Date:** 2026-02-05
**Feature:** Phase 1 - Query Key Factory & Type Safety  
**Focus:** Scalability, Maintainability, Type Safety

---

## Overview

Refactored React Query hooks to follow production-grade patterns, focusing on scalability, maintainability, and type safety. This refactoring establishes a solid foundation for future development.

---

## Key Learnings

### 1. Scalability & Maintainability Thinking

**Problem:** Code duplication and lack of centralized patterns make it hard to maintain and extend.

**Solution:** 
- Created base types (`BaseQueryOptions`, `BaseMutationOptions`) to eliminate boilerplate
- Centralized common patterns in `react-query-types.ts` as a single source of truth
- Used `Omit` to exclude required attributes from base types, allowing hooks to define their own required fields

**Key Insight:** 
> Cursor (AI) doesn't automatically think about scalability and maintainability. Engineers need to guide the approach and think critically about architecture decisions.

**Benefit:**
- Changes to base types propagate to all hooks automatically
- Reduced code duplication by ~60%
- Easier to adapt when React Query API changes

---

### 2. Query Key Factory Pattern - Domain-Based Naming

**Problem:** Initially defined query keys by page name (e.g., `dashboardKeys`), which creates maintenance issues when:
- Same domain data is needed across multiple pages
- New pages need similar cache keys
- Domain logic extends beyond a single page

**Solution:** Domain-based naming convention:
```ts
// ❌ Bad: Page-based
dashboardKeys.summary()  // What if reports page also needs summary?

// ✅ Good: Domain-based
financialKeys.summary()  // Reusable across dashboard, reports, header, etc.
analyticsKeys.mostSpentExpenses()  // Can be used anywhere analytics are needed
```

**Benefits:**
- **Type-safe autocomplete:** `transactionKeys.monthly()` provides full IntelliSense
- **Group invalidation:** `invalidateAllTransactions()` invalidates all related queries
- **Easy refactoring:** Change key structure in one place, all hooks update
- **Extensibility:** Add new query keys following the same pattern

**Key Insight:**
> Define query keys based on **domain/data type**, not page names. This prevents awkward conflicts when the same data is needed across multiple pages.

---

### 3. Generic Types for Queries

**Problem:** Without proper generic types, TypeScript can't provide type safety and autocomplete for responses and errors.

**Solution:** Full generic type signatures:
```ts
useQuery<TransactionItem, ApiError, TransactionItem, QueryKeyType>
//        ↑ Response    ↑ Error    ↑ Selected    ↑ Query Key
```

**Benefits:**
- **Autocomplete:** TypeScript suggests available properties on `data`
- **Type checking:** Catches errors at compile time
- **Error handling:** Type-safe error handling with `isNotFoundError()`, `isNetworkError()`, etc.

**Implementation:**
- Created `BaseQueryOptions<TData, TQueryKey>` with full generic support
- All hooks now have proper type inference
- Error types consistently use `ApiError` (or subclasses)

---

### 4. Centralized Base Types

**Problem:** Each hook had its own type definition, leading to inconsistency and duplication.

**Solution:** Created `react-query-types.ts` as a dedicated file for all React Query-related types:
- `BaseQueryOptions` - For `useQuery` hooks
- `BaseInfiniteQueryOptions` - For `useInfiniteQuery` hooks
- `BaseMutationOptions` - For `useMutation` hooks
- `SimpleQueryOptions` - Simplified options for common use cases
- `QueryKeyOf` - Helper to extract query key types

**Benefits:**
- **Single source of truth:** All type definitions in one place
- **Reduced boilerplate:** Hooks just reference base types
- **Easy maintenance:** Change once, update everywhere
- **Consistency:** All hooks follow the same pattern

**Key Insight:**
> Dedicating a whole file to React Query types might seem like overkill, but it pays off when you need to adapt to library changes or add new patterns.

---

### 5. SimpleQueryOptions Pattern

**Problem:** Full `UseQueryOptions` provides too many options, making it hard to:
- Understand what's actually needed
- Test effectively
- Maintain over time

**Solution:** Created `SimpleQueryOptions` with only essential fields:
```ts
export type SimpleQueryOptions<TData> = {
  enabled?: boolean;
  staleTime?: number;
  onError?: (error: ApiError) => void;
  onSuccess?: (data: TData) => void;
};
```

**Benefits:**
- **Focused API:** Only exposes what's commonly needed
- **Easier testing:** Fewer options to mock
- **Better DX:** Shorter IntelliSense suggestions
- **Future-proof:** Can extend without breaking changes

**Note:** For hooks that need full control, use `BaseQueryOptions` instead.

---

### 6. Input Validation Layer

**Problem:** Invalid data reaching API calls causes runtime errors that are hard to debug.

**Solution:** Created validation layer in `validation.ts`:
- `validateMonth()` - Ensures YYYY-MM format
- `validateAmount()` - Checks positive numbers
- `validateDate()` - Validates ISO date strings
- `validateTransactionType()` - Ensures income/expense
- All validation functions throw `ValidationError` (extends `ApiError`)

**Benefits:**
- **Early error detection:** Catch invalid data before API call
- **Better error messages:** Clear validation errors
- **Type safety:** Type guards ensure correct types
- **Consistency:** All validation follows same pattern

**Implementation:**
- Validation happens in API functions before `apiRequest()`
- Errors are properly typed and catchable
- Reduces risk of invalid data reaching backend

---

### 7. Application-Wide Error Types

**Problem:** Generic `Error` type doesn't provide enough information for proper error handling.

**Solution:** Created `api-errors.ts` with structured error hierarchy:
```ts
ApiError (base)
├── NetworkError
├── ValidationError
├── NotFoundError
├── UnauthorizedError
└── ForbiddenError
```

**Benefits:**
- **Structured errors:** Each error has `statusCode`, `code`, `details`
- **Type guards:** `isNotFoundError()`, `isNetworkError()`, etc.
- **Better UX:** Can show specific error messages based on error type
- **Monitoring:** Structured errors are easier to log and track

**Key Insight:**
> Define application-wide error types to ensure maintainability. All API errors should be mapped to `ApiError` or its subclasses.

---

### 8. Defensive Error Mapping

**Problem:** Raw fetch errors, network errors, and unknown errors need to be normalized.

**Solution:** Created `api-client.ts` with defensive error mapping:
```ts
try {
  // API call
} catch (error) {
  if (error instanceof ApiError) {
    throw error; // Re-throw as-is
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new NetworkError('Network request failed', error);
  }
  
  // Fallback: convert unknown errors to ApiError
  throw new ApiError(..., 'UNKNOWN_ERROR', error);
}
```

**Benefits:**
- **Consistency:** All errors are `ApiError` instances
- **Monitorable:** Unknown errors are captured with context
- **Type safety:** Hooks always receive `ApiError`, never raw errors
- **Debugging:** Original error preserved in `details` field

**Key Insight:**
> Defensive error mapping ensures that even unexpected errors are converted to monitorable `ApiError` instances, making error handling consistent across the app.

---

### 9. QueryKeyOf Helper

**Problem:** Using `ReturnType<typeof transactionKeys.monthly>` is verbose and not semantic.

**Solution:** Created `QueryKeyOf` helper type:
```ts
export type QueryKeyOf<T extends (...args: any[]) => readonly unknown[]> =
  ReturnType<T>;

// Usage
type Key = QueryKeyOf<typeof transactionKeys.monthly>;
// vs
type Key = ReturnType<typeof transactionKeys.monthly>;
```

**Benefits:**
- **Better semantics:** Name clearly indicates purpose
- **Extensibility:** Can add more logic later if needed
- **Readability:** Code is more self-documenting
- **Consistency:** Same pattern across all hooks

---

### 10. Error Type Consistency

**Problem:** Base types used `ApiError`, but hooks used `any`, losing type safety.

**Solution:** Ensured consistency:
- Base types: `BaseQueryOptions<TData, TQueryKey>` uses `ApiError`
- All hooks: `useQuery<Data, ApiError, ...>` uses `ApiError`
- All mutations: `useMutation<Data, ApiError, ...>` uses `ApiError`

**Why `ApiError` is safe:**
- All API calls go through `apiRequest()` wrapper
- Wrapper converts all errors to `ApiError` or subclasses
- Validation errors are `ValidationError` (extends `ApiError`)
- Network errors are `NetworkError` (extends `ApiError`)
- Unknown errors are wrapped in `ApiError`

**Key Insight:**
> While TypeScript can't guarantee 100% runtime behavior, our architecture ensures all errors are `ApiError` instances. Hardcoding `ApiError` in base types is safe and provides better type safety than `any`.

---

## Best Practices Established

### 1. Commit Strategy
> Should commit separately for small changes instead of batching into big features because it is hard to monitor and understand design mindset.

**Practice:** Make small, focused commits:
- One commit for query key factory
- One commit for base types
- One commit for error types
- etc.

**Benefit:** Easier to review, understand evolution, and rollback if needed.

### 2. Type-First Approach
- Define types before implementation
- Use base types to ensure consistency
- Leverage TypeScript for compile-time safety

### 3. Domain-Driven Design
- Organize by domain, not by page
- Query keys reflect data structure, not UI structure
- Makes code more reusable and maintainable

---

## Future Improvements (Add-on Later)

### 1. Explore SimpleQueryOptions Necessity
**Question:** Why is `SimpleQueryOptions` necessary to prevent long list suggestions?

**To explore:**
- Compare IntelliSense experience with full `UseQueryOptions` vs `SimpleQueryOptions`
- Measure developer productivity impact
- Document specific use cases where full options are needed

### 2. Understand Type Definition Syntax
**Question:** Deep dive into React Query type definitions

**To explore:**
- How `UseQueryOptions` generic parameters work
- Why certain parameters are required/optional
- How to extend types for custom use cases
- Type inference patterns in React Query

### 3. Error Type Generics (Optional)
**Consideration:** Make error type generic in base types:
```ts
export type BaseQueryOptions<
  TData,
  TQueryKey extends readonly unknown[],
  TError = ApiError, // Default, but can override
>
```

**Trade-off:**
- **Pro:** More flexible for edge cases
- **Con:** Adds complexity, may not be needed
- **Decision:** Keep `ApiError` hardcoded unless proven necessary

---

## Metrics & Impact

### Code Reduction
- **Before:** ~15 lines per hook for type definitions
- **After:** ~3 lines per hook using base types
- **Reduction:** ~80% less boilerplate

### Type Safety
- **Before:** Partial type safety, some `any` types
- **After:** Full type safety, all errors typed as `ApiError`
- **Impact:** Catch errors at compile time, better IntelliSense

### Maintainability
- **Before:** Changes require updating multiple files
- **After:** Changes in base types propagate automatically
- **Impact:** Easier to adapt to library updates


---

# AI agent's limits:
- Tôi kêu nó đặt tên queryKey, nó đặt theo tên page - bad practice - vì khi scale lên key by page sẽ bị khó hiểu và khó maintain

- Tôi kêu nó implement optimistic update, nó lấy tất cả key transaction bind vào một type specific, nhưng vấn đề là bên dưới key transaction có transaction.all, transaction detail, là những loại data khác nhau. Nó lấy item mới add lên đầu nhưng lỡ như trường hợp data filter trước một category, add vào một category khác sẽ làm list đó có thể hiện một category khác trong lúc filter và gây inconsistency

- Tôi kêu nó update API cho phần Monthly Summary, nó thêm field "summary" vào một API có sẵn GET /transactions?month và trả chung với data model của API đó, nhưng đó là một paginated API, nếu qua page 2 3 4 thì cái summary đó vẫn được trả chung không có gì mới. VỚi lại handle refetch cho React Query sẽ phiền phức hơn, và không đúng nguyên tắc separation of concerns

- Càng làm càng thấy nó là công cụ tuyệt vời nhưng chưa thay thế được. Nó không nắm domain, business


- Re-usable / Modular components: When implement components, should check if that component can be re-used accross pages, in the long run can save a lot of boilerplate and implementation efforts

## Conclusion

This refactoring establishes a solid foundation for React Query usage in the application. The patterns established here will make future development faster, safer, and more maintainable. Key takeaway: **think about scalability and maintainability from the start**, even if it means a bit more upfront work.

---

## Related Files

- `src/lib/query-keys.ts` - Query key factory
- `src/lib/react-query-types.ts` - Base types
- `src/lib/api-errors.ts` - Error types
- `src/lib/api-client.ts` - API wrapper with error mapping
- `src/lib/validation.ts` - Input validation
- `src/features/*/hooks/*.ts` - All refactored hooks



Feb 10th, 2026
### Prefetch (Phase 3) – UX & Performance
- **Perceived latency:**
  - Hover vào transaction trước khi click giúp **detail page thường load gần như instant** nếu user click trong vòng ~150–300ms.
  - Scroll gần cuối monthly list và prefetch tháng kế tiếp giúp chuyển tháng tiếp theo mượt hơn, hạn chế hard loading state.
- **Network behavior:**
  - Debounce/throttle + React Query dedupe giúp **giảm rõ rệt số lần gọi API thừa** khi hover/scroll nhanh hoặc khi Tabs tự xử lý focus lại.
  - Guard `range !== current` / `timeRange !== current` tránh prefetch lại tab đang active, giảm double-fetch trong các scenario click tab.
- **Maintainability:**
  - Đưa debounce vào `useDebouncedCallback` + prefetch hooks theo domain làm code **ít boilerplate** và dễ kiểm soát behavior hơn là gắn logic trực tiếp trong component.
  - Các hook prefetch (detail, nextMonth, dashboard ranges) có thể được bật/tắt hoặc tinh chỉnh delay/strategy mà không chạm vào UI components.

## Prefetch Journey Notes (React Query)

- Ban đầu nghĩ prefetch đơn giản là "gọi API sớm hơn một chút", nhưng thực tế phải gắn với **user intent**: hover vào item, scroll gần cuối list, chuyển tab, v.v.
- Nếu không cẩn thận về **staleTime** và trùng `queryKey`, prefetch rất dễ tạo cảm giác "double-call" dù dùng React Query: prefetch xong, `useQuery` với `staleTime: 0` vẫn refetch lại.
- Các pattern hữu ích khi làm thật:
  - Dùng **debounce / throttle** cho hover & scroll, nhưng gom logic vào một hook/util chung để tránh lặp timerRef/cancel ở từng hook.
  - Chỉ prefetch **data có xác suất cao sẽ dùng ngay sau đó**, không "prefetch cả thế giới" khi mount page.
  - Luôn nghĩ theo **domain** (transactions, financial, analytics) thay vì page khi thiết kế query key & prefetch strategy.
- Trải nghiệm này nhấn mạnh lại: React Query mạnh, nhưng **prefetch tốt hay không phụ thuộc vào thiết kế UX + domain knowledge**, chứ không chỉ là gọi đúng API của library.

# AI agent's limits and challenge in this task:
- tôi phải ngồi đọc rất nhiều từ vựng mới lạ, những topic chưa có dịp đụng: Parallel queries (useQueries for loops (for,map)), Dependent/Sequential queries (Query B run after Query A finished to retrieve data), Conditional queries with enabled (always use enabled for hook with params for ex: getUser(id)), independent queries
- throttle để chặn scroll to bottom trigger nhiều API calls, dùng debounce để chặn prefetch khi hover ngắn
- trade off strategy implementing prefetch giữa tách hook theo tính năng đơn giản và tránh làm code phức tạp vs gom về PREFETCH_STRATEGIES map làm cho code bị phức tạp nhưng được cái centralize logic
- tôi nhắc con AI rằng đừng quăng cả cái logic prefetch vào trong component mà nên move ra hook để abstract logic và declarative

## Related Files:
- usePrefetch(...)
- useDebouncedCallback

---

Feb 12th, 2026
### Phase 4: Error Handling & UX – Toast, ErrorBoundary, Skeleton, placeholderData

#### **1. Toast Notifications for Mutations**
- **Implementation:** Centralized toast system (`ToastProvider`) + integrated into mutation hooks (`useCreateTransaction`, `useUpdateTransaction`, `useDeleteTransaction`)
- **Pattern:** 
  - `onSuccess`: Show success toast immediately (optimistic update already done)
  - `onError`: Show error toast + rollback optimistic update
  - Error message extracted from `ApiError.message` for specific feedback
- **Key Learning:** 
  > Toast trong mutation hooks (không trong component) = DRY + consistent UX. Mọi nơi dùng hook đều có toast tự động.
- **Trade-off:** Toast phải đủ ngắn gọn để không làm phiền user, nhưng đủ chi tiết để user hiểu chuyện gì xảy ra.

#### **2. React Query ErrorBoundary Pattern**
- **Architecture decision:** Feature-level boundaries (không app-level)
  - Dashboard có riêng `<ReactQueryErrorBoundary>`
  - Transactions page có riêng boundary
  - TransactionDetail page có riêng boundary
- **Why feature-level?**
  - Dashboard lỗi → User vẫn navigate được sang Transactions (không bị trapped)
  - Header/Sidebar/Footer không bị ảnh hưởng → Partial failure thay vì full app crash
  - Error isolation: Bug ở một feature không phá hủy toàn bộ app
- **Implementation gotcha:**
  - Manual `throw error` trong component **KHÔNG phải production pattern**
  - Nên dùng `throwOnError: true` trong query options (React Query tự throw)
  - Hoặc handle local với `isError` state (simple approach)
- **Key Learning:**
  > ErrorBoundary nên wrap ở **feature level** (granular), không app level (monolithic). User cần escape route khi một feature fail.

#### **3. Skeleton Loaders (Granular Loading States)**
- **Created:**
  - `MonthlySummarySkeleton` - Skeleton cho summary card (3 metrics)
  - `DailyTransactionsSkeleton` - Skeleton cho transaction list (3-5 cards)
- **Pattern:** Match skeleton shape với content shape để transition mượt
- **Key Learning:**
  > Skeleton tốt hơn loading spinner vì giữ layout stability (no layout shift) và user có visual context về content sẽ hiện.
- **Implementation:** Dùng shadcn `Skeleton` component + match dimensions/spacing với real content

#### **4. placeholderData for Smooth Transitions**
- **Problem:** Khi đổi tháng (hoặc time range), `queryKey` thay đổi → React Query coi là query mới → `data = undefined` → nhảy về loading state
- **Solution:** `placeholderData: (previousData) => previousData`
- **Benefit:**
  - Đổi tháng: Data tháng cũ vẫn hiện → Smooth fade sang data tháng mới
  - Switch time range (week/month): Chart không nhảy, transition mượt
- **When to use:**
  - ✅ Same entity type, same user context (transactions tháng 1 → tháng 2)
  - ✅ Semantic similarity (week summary → month summary)
  - ❌ Different entity (user profile A → B) - sẽ hiện sai data trong vài giây!
  - ❌ Search/filter với keywords khác nhau - confusing UX
- **Key Learning:**
  > `placeholderData` phải **opt-in per query** (không set global default) để tránh security/UX issues khi data context thay đổi.

#### **5. Smart Retry Strategies**
- **Implementation:** Custom `shouldRetryOnError(failureCount, error)` trong `QueryProvider`
- **Logic:**
  - Network errors (`NetworkError`) → Retry 2 lần
  - 5xx server errors → Retry 2 lần
  - 4xx client errors / validation errors → **KHÔNG retry** (user error, không có ích)
  - Unknown errors → Không retry (defensive)
- **Benefit:** Tiết kiệm network bandwidth + server load, chỉ retry khi có ý nghĩa
- **Key Learning:**
  > Retry strategy phải dựa trên **error type**, không blindly retry tất cả. ValidationError retry = spam server + poor UX.

#### **6. staleTime vs gcTime vs placeholderData**
- **Confusion cleared:**
  - `staleTime: 0` → Data vẫn được cache (theo `gcTime`), nhưng React Query coi là stale ngay → Sẽ refetch background
  - `gcTime: 5 phút` → Data giữ trong cache 5 phút cho navigation back/forward
  - `placeholderData` → Giữ data cũ khi `queryKey` thay đổi (khác concept với staleTime)
- **App strategy:**
  - Financial data: `staleTime: 0` (always fresh) + `placeholderData` (smooth UX)
  - Dashboard summary: `staleTime: 30s` (ít thay đổi) + `placeholderData`
  - Analytics: `staleTime: 1 hour` + `placeholderData`
- **Key Learning:**
  > `staleTime` control refetch behavior, `placeholderData` control transition UX. Hai thứ độc lập nhau và kết hợp tốt.

#### **7. Manual throw vs throwOnError**
- **Tested pattern (không dùng production):**
  ```tsx
  const { isError, error } = useQuery(...);
  if (isError && error) throw error; // ← Manual throw để test
  ```
- **Production patterns:**
  - **Option A:** `throwOnError: true` trong query options → React Query tự throw lên ErrorBoundary
  - **Option B:** Handle local với `isError` state → Show error message trong component
- **Trade-off:**
  - `throwOnError: true` → Lỗi đi lên ErrorBoundary (global handling)
  - Local `isError` → Mỗi component tự handle (granular control)
- **Decision:** Dùng local `isError` cho app này (đơn giản, flexible hơn)

#### **8. Next.js Dev Overlay vs ErrorBoundary**
- **Challenge:** Next.js dev mode luôn hiện "Runtime Error" overlay che ErrorBoundary UI
- **Solution for testing:** 
  - Tạo test button throw error từ render phase
  - Đóng Next.js overlay (X) để thấy ErrorBoundary phía sau
  - Hoặc build production để test không có overlay
- **Key Learning:**
  > Dev overlay là feature của Next.js để debug, không phải bug của ErrorBoundary. Production sẽ chỉ show ErrorBoundary UI.

#### **9. Partial Data Rendering (Already Implemented)**
- **Pattern:** Tách queries để render độc lập
  ```tsx
  const { data: transactions } = useMonthlyTransactions(); // 0.5s
  const { data: summary } = useMonthlySummary(); // 2s
  
  // Transactions render sau 0.5s (không chờ summary)
  // Summary render sau 2s
  ```
- **vs Suspense (all-or-nothing):**
  - Suspense chờ TẤT CẢ queries → User chờ 2s mới thấy gì
  - Current approach → User thấy transactions sau 0.5s → Better UX
- **Decision:** Giữ current approach, không dùng Suspense
  - App đã có partial rendering tốt với `placeholderData`
  - Suspense sẽ block các queries độc lập (worse UX)
  - Refactoring cost cao, benefit không rõ ràng

#### **10. Testing Strategy**
- **Created:** `ErrorBoundaryTestButton` component
  - Button throw error từ render phase
  - Trigger ErrorBoundary fallback UI
  - Để demo cho stakeholders
- **Note:** Xóa button trước khi deploy production

---

## AI Agent's Limits & Challenges (Phase 4):

1. **ErrorBoundary architecture:**
   - AI đề xuất app-level boundary ban đầu
   - Phải giải thích về partial failure, user escape routes, error isolation
   - Feature-level boundaries là architectural decision cần domain knowledge

2. **placeholderData trade-offs:**
   - AI muốn set global default `placeholderData` trong `QueryProvider`
   - Không nhận ra security/UX issues (hiện data user A khi chuyển sang user B)
   - Phải phân tích từng use case: transactions (OK) vs user profile (NOT OK)

3. **Manual throw error:**
   - AI implement `if (isError) throw error` trong component để test
   - Đây là anti-pattern (render phase không nên throw)
   - Phải giải thích `throwOnError` option và trade-offs

4. **Suspense vs current approach:**
   - AI suggest Suspense vì "modern pattern"
   - Không analyze UX impact: all-or-nothing loading worse for this app
   - Architectural decision cần hiểu app behavior và user needs

5. **Testing trong dev mode:**
   - AI không biết Next.js dev overlay sẽ che ErrorBoundary
   - Phải tìm workaround (test button, console.log, production build)
   - Dev environment behavior khác production

---

## Metrics & Impact (Phase 4):

### UX Improvements:
- **Toast feedback:** User biết mutation success/fail ngay lập tức
- **Skeleton loaders:** Perceived performance tốt hơn ~30% (no layout shift)
- **placeholderData:** Chuyển tháng mượt hơn, không flash loading state
- **Error isolation:** Feature fail không crash toàn app

### Code Quality:
- **Centralized toast:** Toast logic trong hooks (DRY), không rải trong components
- **ErrorBoundary:** 3 boundaries cho 3 features (isolated failures)
- **Smart retry:** Chỉ retry network/5xx errors (reduce server load)

### Developer Experience:
- **Clear error messages:** Toast + ErrorBoundary fallback có context rõ ràng
- **Easy testing:** Test button cho demo ErrorBoundary
- **Type safety:** `ApiError` typed throughout

---

## Key Takeaways (Phase 4):

1. **Feature-level ErrorBoundary > App-level:** Partial failure better than full crash
2. **placeholderData is powerful but dangerous:** Must opt-in per query, not global default
3. **Toast in hooks > Toast in components:** DRY + consistent UX
4. **Skeleton > Spinner:** Layout stability + visual context
5. **Smart retry > Blind retry:** Save bandwidth, only retry when meaningful
6. **Manual throw is anti-pattern:** Use `throwOnError` or local `isError` handling
7. **Suspense is not always better:** All-or-nothing loading can hurt UX for independent queries
8. **Test in production mode:** Dev overlays hide real ErrorBoundary behavior

---

## Related Files (Phase 4):
- `src/components/ToastProvider.tsx` - Toast system
- `src/components/ReactQueryErrorBoundary.tsx` - Error boundary wrapper
- `src/features/transactions/components/*Skeleton.tsx` - Loading skeletons
- `src/components/QueryProvider.tsx` - Retry strategies
- `src/features/*/hooks/use*.ts` - placeholderData in queries

---

Feb 15th, 2026
### Phase 5: Performance & DevEx – DevTools, StaleTime Strategy, YAGNI Principles

#### **1. React Query DevTools Integration**
- **Implementation:** Added `@tanstack/react-query-devtools` package + integrated into `QueryProvider`
- **Usage:** Visual debugging tool (góc dưới phải) để inspect queries, mutations, cache state
- **Value:** Essential dev tool, auto tree-shaken trong production → Zero cost
- **Key Learning:**
  > DevTools là must-have. Nhìn thấy queries active/stale, cache data, refetch events → Debug nhanh hơn nhiều so với console.log

#### **2. STALE_TIME Constants Refactor**
- **Problem:** Inconsistent stale times scattered across hooks
  ```tsx
  // Before: Magic numbers, no clear strategy
  useBalance()           // 0 (default)
  useSummary()           // 30 * 1000 (hardcoded)
  useMostSpentExpenses() // 1000 * 60 * 60 * 1 (why 1 hour?)
  ```
- **Solution:** Centralized `STALE_TIME` constants trong `query-keys.ts`
- **Naming evolution:**
  - **First attempt:** Domain-based naming (`FINANCIAL`, `ANALYTICS`)
  - **Issue discovered:** Naming conflict với query keys (transactionKeys vs STALE_TIME.FINANCIAL)
  - **Final solution:** Behavior-based naming (`REALTIME`, `SHORT`, `MEDIUM`, `LONG`, `STATIC`)
- **Strategy:**
  ```tsx
  REALTIME: 0           // Balance, transactions list
  SHORT: 30s            // Dashboard metrics, analytics
  MEDIUM: 1min          // Detail views
  LONG: 5min            // Settings, configs
  STATIC: Infinity      // Categories, constants
  ```
- **Key Learning:**
  > Constants phải describe **behavior (how long fresh)** not **domain (what data)**. Tránh naming collision và clear hơn cho intent.

#### **3. Select & Transform - YAGNI Decision**
- **Evaluated:** React Query `select` option để optimize re-renders
- **Analysis:**
  - Current components dùng **full data** từ hooks
  - Data structures đơn giản (Balance, Summary nhỏ)
  - **No performance issues** measured
  - Select best for: "component chỉ cần 1 field từ object lớn"
- **Decision:** ❌ **Skip for now**
- **Reasoning:** Premature optimization. Wait for:
  - 3+ components dùng same pattern
  - Performance profiler shows wasted renders
  - Clear ROI > complexity cost
- **Key Learning:**
  > Don't add optimization without evidence. Measure first, optimize later. Code simplicity > theoretical performance.

#### **4. Custom Hooks with Built-in Optimizations - YAGNI**
- **Considered:** Create specialized hooks (`useBalanceAmount`, `useSummaryTotal`)
- **Analysis:**
  - No repeated patterns across codebase
  - Adds maintenance overhead
  - Less flexible khi cần full data
- **Decision:** ❌ **Keep it simple**
- **Key Learning:**
  > Custom hooks nên emerge từ **real usage patterns**, không tạo trước "just in case". Wait for 5+ duplicate patterns.

#### **5. Advanced Monitoring - Future Consideration**
- **Explored 3 advanced patterns:**
  1. **Cache Hit Rate tracking** - Measure queries from cache vs network
  2. **Performance Monitoring** - Track slow queries, error rates (APM integration)
  3. **A/B Testing stale times** - Data-driven optimization
- **Decision:** ❌ **Not needed yet**
- **When to implement:**
  - Cache Hit Rate: Khi nhiều navigation, high API costs
  - Performance Monitoring: Khi 1000+ production users
  - A/B Testing: Khi 10,000+ users, unclear optimal values
- **Key Learning:**
  > Advanced monitoring có ROI khi **scale lên**. Small app: DevTools đủ. Medium app: Basic metrics. Large app: Full APM + A/B testing.

#### **6. Naming Consistency Issue - Resolved**
- **Problem spotted:** Query keys (domain-based) vs stale times (behavior-based) caused confusion
  ```tsx
  // Confusing
  transactionKeys.monthly() + STALE_TIME.FINANCIAL
  // "transaction" vs "financial" - which one is it?
  ```
- **Solution:** Renamed constants to describe cache duration
  ```tsx
  // Clear intent
  transactionKeys.monthly() + STALE_TIME.REALTIME
  // "realtime data" - obvious!
  ```
- **Key Learning:**
  > Naming phải rõ ràng về **intent**. Query keys = WHAT (domain), Stale times = HOW LONG (duration). No overlap.

---

## AI Agent's Limits & Challenges (Phase 5):

1. **Over-engineering tendency:**
   - AI suggest tạo many custom hooks with optimizations upfront
   - Không understand YAGNI principle
   - Phải giải thích: wait for patterns to emerge, then abstract

2. **Premature optimization:**
   - AI muốn implement `select` everywhere "because best practice"
   - Không analyze actual performance data
   - Need guidance: measure first, optimize only when needed

3. **Global defaults dangerous:**
   - AI suggest `select` và `placeholderData` as global defaults
   - Không nhận ra security/UX issues (show wrong data when context changes)
   - Phải explain: opt-in per query, not global

4. **Naming conflicts:**
   - AI không catch domain-based vs behavior-based naming collision
   - Human had to identify: "FINANCIAL time" vs "financial keys" confusing
   - Architectural naming decisions need human judgment

5. **Cost-benefit analysis:**
   - AI không evaluate ROI của advanced monitoring
   - Suggest implement "because cool features"
   - Need human to assess: current app size, user count, actual needs

---

## Key Takeaways (Phase 5):

1. **DevTools is essential:** Free, huge value, auto tree-shaken. No reason not to use.
2. **STALE_TIME constants > Magic numbers:** Centralized, semantic, maintainable.
3. **Behavior-based naming > Domain-based:** Avoid naming conflicts, clearer intent.
4. **YAGNI principle:** Don't build what you don't need yet. Wait for patterns.
5. **Measure before optimize:** Performance optimization needs evidence, not guessing.
6. **Simple > Complex:** Current hooks clean & simple. Keep it that way until proven necessary.
7. **Advanced monitoring scales with app:** Small app: DevTools enough. Scale up: Add monitoring gradually.
8. **Consistent strategy > Scattered values:** Same data type = same stale time.

---

## Metrics & Impact (Phase 5):

### Code Quality:
- **Consistency:** 8 hooks now use `STALE_TIME` constants (0 magic numbers)
- **Clarity:** Naming describes behavior, not domain (no confusion)
- **Maintainability:** Change strategy in one place → all hooks update

### Developer Experience:
- **DevTools:** Visual debugging, inspect cache, no more console.log spam
- **Self-documenting:** `STALE_TIME.REALTIME` → intent clear immediately
- **Simple codebase:** No premature abstractions, easy to understand

### Decision Framework Established:
- ✅ Do: DevTools (free, essential)
- ✅ Do: STALE_TIME constants (simple, high value)
- ❌ Skip: Select/Transform (no use case yet)
- ❌ Skip: Custom optimized hooks (YAGNI)
- ⏳ Future: Advanced monitoring (when scale demands)

---

## Philosophy Reinforced:

**Start simple → Measure → Optimize**
- Not: Optimize → Hope it helps
- YAGNI > Premature optimization
- Complexity has cost → Add only when benefit clear

**Code simplicity is a feature**
- Current hooks: Clean, type-safe, flexible
- Resist urge to "make it better" without evidence
- Wait for pain points before adding abstractions

---

## Related Files (Phase 5):
- `src/components/QueryProvider.tsx` - DevTools integration
- `src/lib/query-keys.ts` - STALE_TIME constants
- `src/features/dashboard/hooks/*.ts` - Updated with STALE_TIME.REALTIME/SHORT
- `src/features/transactions/hooks/*.ts` - Updated with STALE_TIME.REALTIME/MEDIUM
- `docs/advanced-monitoring-guide.md` - Future monitoring patterns (reference)


AI agent's limits:
- AI viết JSDoc hơi cứng: Invalidates related queries (summary, balance, month) => Sau này update invalidation có thể sai và quên maintain JSDoc

---

Feb 16th, 2026
### Phase 6: Testing & Documentation – Production-Grade Testing Setup

#### **1. Test Utilities - Foundation for Testing**
- **Created:** `src/test/test-utils.tsx` với comprehensive testing helpers
- **Key utilities:**
  - `createTestQueryClient()` - Fresh QueryClient cho mỗi test
  - `TestWrapper` - QueryClientProvider wrapper
  - `renderWithClient()` - Custom render với React Query context
  - `mockFetch()` - Easy API mocking với proper Response object
  - `waitForQueryToFinish()` / `waitForMutationToFinish()` - Async helpers
  - `cleanupTests()` - Cleanup after each test
- **Configuration:**
  ```tsx
  createTestQueryClient() {
    retry: false,              // No retries → Faster, predictable tests
    refetchOnWindowFocus: false,  // No background refetches
    gcTime: 0,                 // No caching between tests
  }
  ```
- **Key Learning:**
  > Test utilities phải **disable production behaviors** (retry, refetch, caching) để tests nhanh và deterministic. Production config ≠ Test config.

#### **2. Testing React Query Hooks - Core Patterns**
- **Created tests:**
  - `useCreateTransaction.test.tsx` - Mutation với optimistic updates
  - `useTransactionDetail.test.tsx` - Query với conditional fetching
- **Test coverage:**
  - ✅ Loading states (`isLoading`, `isPending`, `isFetching`)
  - ✅ Success states (`isSuccess`, `data`)
  - ✅ Error states (`isError`, `error`)
  - ✅ Optimistic updates (immediate UI update)
  - ✅ Error rollback (revert on failure)
  - ✅ Selective cache updates (only affected month)
  - ✅ Conditional queries (`enabled: false` prevents fetch)
  - ✅ Cache usage (no fetch when cached)
  - ✅ Network errors vs API errors
- **Pattern established:**
  ```tsx
  describe("useQuery hook", () => {
    let queryClient: QueryClient;
    
    beforeEach(() => {
      queryClient = createTestQueryClient(); // Fresh client
      vi.clearAllMocks();
    });
    
    it("fetches successfully", async () => {
      mockFetch({ data: mockData });
      const { result } = renderHook(() => useHook(), {
        wrapper: ({ children }) => (
          <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
        ),
      });
      
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
    
    afterEach(() => {
      cleanupTests(queryClient);
    });
  });
  ```

#### **3. Testing Philosophy - Behavior Over Internals**
- **Do test:**
  - ✅ Hook return values (`result.current.data`, `isLoading`)
  - ✅ API calls (`expect(fetch).toHaveBeenCalled()`)
  - ✅ User-visible behavior (optimistic update, rollback)
  - ✅ Error handling (toast, error state)
- **Don't test:**
  - ❌ Cache internals (`queryClient.getQueryCache().getAll()`)
  - ❌ React Query implementation details
  - ❌ Library behavior (React Query already tested)
- **Key Learning:**
  > Test **what developers/users see** (public API), not **how it works internally** (implementation). Tests should survive refactoring.

#### **4. Mock Strategy - Full Response Objects**
- **Implementation:** `mockFetch()` returns complete Response object
  ```tsx
  mockFetch({ data, error, status }) {
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    
    return {
      ok: status >= 200 && status < 300,
      status,
      headers,
      json: async () => (error ? { error } : data),
      // ... full Response interface
    };
  }
  ```
- **Why full Response?**
  - `apiFetch()` checks `response.ok`, `response.headers`
  - Incomplete mocks cause runtime errors
  - Production code expects real Response behavior
- **Key Learning:**
  > Mock objects phải **match production behavior**. Partial mocks = brittle tests. Full Response object = robust tests.

#### **5. JSDoc Documentation - IntelliSense for Developers**
- **Added JSDoc to all major hooks:**
  - `useCreateTransaction` - Optimistic updates explained
  - `useTransactionDetail` - Conditional fetching
  - `useDeleteTransaction` - Rollback behavior
  - `useMonthlyTransactions` - Infinite scroll
  - `useSummary` - Time range switching
- **Pattern:**
  ```tsx
  /**
   * Hook for creating transactions with optimistic updates
   * 
   * @description
   * - Immediately adds transaction to UI (optimistic)
   * - Only updates affected month's cache
   * - Rolls back on error
   * - Shows toast notifications
   * 
   * @example
   * ```tsx
   * const { mutate, isPending } = useCreateTransaction();
   * mutate({ amount: 100, type: "expense", ... });
   * ```
   * 
   * @param options - Optional mutation configuration
   * @returns React Query mutation object
   */
  ```
- **Key Learning:**
  > JSDoc phải **explain behavior**, not repeat types. Include examples cho common use cases. Users đọc JSDoc trong VSCode, không mở docs.

#### **6. Comprehensive Documentation - Learning Resources**
- **Created:**
  - `docs/react-query-patterns.md` (750+ lines)
    - Query patterns (basic, conditional, infinite, parallel, dependent)
    - Mutation patterns (basic, async, callbacks)
    - Optimistic updates explained step-by-step
    - Error handling strategies
    - Common pitfalls và anti-patterns
    - Performance tips
    - 30+ code examples
  - `docs/testing-guide.md` (880+ lines)
    - Test setup và configuration
    - Test utilities documentation
    - Testing queries (success, error, loading)
    - Testing mutations (optimistic, rollback)
    - Testing error scenarios
    - Best practices (DO & DON'T)
    - Debugging guide
    - Common patterns
- **Key Learning:**
  > Docs phải **actionable**. Mỗi pattern có example code có thể copy-paste. Explain WHY, not just HOW. Include common mistakes.

#### **7. Testing Trade-offs - Learning vs Production**
- **Discussion:** How much testing for a learning project?
- **Analysis:**
  - **Learning project:** Focus on **concepts** > 100% coverage
  - **Interview prep:** Need **2-3 basic tests** + explain ability
  - **Production:** Need comprehensive coverage + edge cases
- **Recommendation cho learning:**
  - ✅ Keep 2-3 tests per hook (demonstrate understanding)
  - ✅ Test happy path + one error case
  - ❌ Don't stress về 100% coverage
  - ✅ Focus on: viết được test cơ bản + explain concepts
- **Key Learning:**
  > Testing depth phải **match project goals**. Learning = understand patterns. Production = prevent regressions. Interview = prove competence.

#### **8. Test Maintenance - Simplified Version**
- **Initial implementation:** 12 tests covering all edge cases
- **Feedback:** Too complex for learning project
- **Adjustment:** Rút gọn xuống core tests
  - Happy path (create/fetch success)
  - Error handling (rollback, error state)
  - Loading states (basic)
- **Trade-off:**
  - More tests = More confidence, harder to maintain
  - Fewer tests = Easier to understand, focus on concepts
- **Decision for this project:** Keep simplified tests (demonstrate knowledge, not production-ready)
- **Key Learning:**
  > Test suite complexity phải **phù hợp với project maturity**. Over-testing trong learning project = cognitive overload.

#### **9. Type Safety in Tests**
- **Challenge:** `PaginatedTransactionsResponse` type có field `pageSize`, không phải `limit`
- **Fix:** Update all test mocks để match type definition
- **Learning:**
  - Tests catch type mismatches
  - Mock data phải match production types
  - TypeScript errors trong tests = valuable feedback
- **Key Learning:**
  > Type-safe tests catch integration bugs. Mock data phải **exact match** production types, not "close enough".

#### **10. Testing Async Behavior - waitFor Pattern**
- **Pattern:** Always use `waitFor` for async assertions
  ```tsx
  // ❌ BAD - Race condition
  expect(result.current.isSuccess).toBe(true);
  
  // ✅ GOOD - Wait for async state
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true);
  });
  ```
- **Why necessary:**
  - React Query updates are async
  - Hook re-renders happen after state updates
  - Without `waitFor`: flaky tests
- **Key Learning:**
  > Async tests **always use waitFor**. Never assert on async state immediately. Race conditions = intermittent failures.

---

## AI Agent's Limits & Challenges (Phase 6):

1. **Over-comprehensive testing:**
   - AI viết 12 tests covering tất cả edge cases
   - Không nhận ra: learning project không cần production-level coverage
   - Phải discuss: balance giữa demonstrate knowledge vs over-engineering

2. **Mock complexity:**
   - AI ban đầu mock fetch with incomplete Response object
   - Không hiểu: `apiFetch()` expects full Response interface
   - Tests fail vì missing `headers`, `ok` properties
   - Phải build complete Response mock

3. **Type mismatches:**
   - AI dùng `limit` thay vì `pageSize` trong test mocks
   - TypeScript error: property doesn't exist
   - Phải fix để match `PaginatedTransactionsResponse` type

4. **Testing philosophy:**
   - AI suggest testing cache internals (`getQueryCache()`)
   - Anti-pattern: test behavior, not implementation
   - Phải explain: tests should survive refactoring

5. **Documentation scope:**
   - AI muốn viết docs cho EVERY possible scenario
   - Không evaluate: which patterns actually useful?
   - Need human judgment: common patterns > rare edge cases

6. **Interview context:**
   - AI không understand: testing for learning vs production vs interview
   - Different goals = different testing strategies
   - Phải explain: 2-3 tests + concepts > 100% coverage

---

## Metrics & Impact (Phase 6):

### Test Coverage:
- **12 tests total** (2 test files)
- **Core patterns covered:**
  - Queries: fetch success, errors, conditional, caching
  - Mutations: create success, optimistic updates, rollback
  - Loading states: isLoading, isPending, isFetching
- **All tests passing** ✅

### Documentation:
- **1,600+ lines** of documentation (patterns + testing guide)
- **30+ code examples** covering common scenarios
- **JSDoc on 5 major hooks** for IntelliSense
- **Best practices** và anti-patterns documented

### Developer Experience:
- **Test utilities:** Reusable across all tests
- **Clear patterns:** Easy to add more tests following same structure
- **IntelliSense:** Hover hooks → see docs + examples
- **Learning resource:** Docs serve as reference for future work

### Code Quality:
- **Type-safe tests:** Mock data matches production types
- **Deterministic:** No retries, no refetch, no flakiness
- **Fast:** Tests run in ~3-4 seconds
- **Maintainable:** Test behavior, not internals

---

## Key Takeaways (Phase 6):

1. **Test utilities are foundation:** Invest in good test setup → All tests benefit
2. **Disable production behaviors:** No retry, refetch, cache in tests → Faster & predictable
3. **Mock complete objects:** Full Response > Partial mock → Robust tests
4. **Test behavior, not internals:** Public API > Cache internals → Refactor-safe
5. **Always use waitFor:** Async assertions need explicit waiting → No race conditions
6. **JSDoc adds huge value:** IntelliSense > Separate docs → Developers use it
7. **Documentation must be actionable:** Code examples > Theory → Copy-paste friendly
8. **Testing depth matches goals:** Learning ≠ Production ≠ Interview → Different strategies
9. **Type-safe tests catch bugs:** Mock data types matter → Integration issues found early
10. **Simplicity over completeness:** 2-3 good tests > 12 complex tests for learning

---

## Testing Philosophy Established:

**For Learning Projects:**
- ✅ Understand concepts (how testing works)
- ✅ Write 2-3 basic tests (demonstrate competence)
- ✅ Focus on happy path + one error case
- ❌ Don't stress về 100% coverage
- 📚 Read tests as learning resource

**For Interview Prep:**
- ✅ Know how to write basic tests (render, assert, async)
- ✅ Understand mocking (API, components)
- ✅ Explain testing strategy (what to test, why)
- ✅ Have working examples in portfolio
- 💬 Can discuss trade-offs (coverage vs maintenance)

**For Production:**
- ✅ Comprehensive coverage (happy + edge cases)
- ✅ Integration tests + unit tests
- ✅ CI/CD integration
- ✅ Regression prevention
- 📊 Coverage metrics + monitoring

---

## Related Files (Phase 6):
- `src/test/test-utils.tsx` - Test utilities
- `src/features/transactions/hooks/*.test.tsx` - Hook tests
- `docs/react-query-patterns.md` - Comprehensive patterns guide
- `docs/testing-guide.md` - Complete testing guide
- All hooks - JSDoc documentation added

---

## Conclusion

Phase 6 completes the React Query refactoring journey with production-grade testing infrastructure và comprehensive documentation. Key achievement: **Balance giữa thoroughness và pragmatism** - extensive enough để demonstrate best practices, simple enough để learning project không bị overwhelmed.

**Testing infrastructure** established với reusable utilities, clear patterns, và type-safe mocks. **Documentation** provides learning resources cho future developers (và bản thân khi quay lại sau 6 tháng).

**Most important learning:** Testing strategy phải **match project context**. Learning project ≠ Production ≠ Interview prep. Each has different goals → Different testing approaches. Knowing **when to go deep** và **when to keep simple** là key skill.

---

**Total Impact Across All Phases (1-6):**

### Code Quality:
- **~80% less boilerplate** (base types)
- **Zero magic numbers** (STALE_TIME constants)
- **100% type-safe** (all hooks, queries, mutations)
- **Consistent patterns** (all hooks follow same structure)

### Developer Experience:
- **IntelliSense everywhere** (JSDoc + types)
- **Visual debugging** (React Query DevTools)
- **Self-documenting code** (semantic naming)
- **Easy testing** (test utilities + patterns)

### User Experience:
- **Instant feedback** (optimistic updates)
- **Smooth transitions** (placeholderData)
- **No layout shift** (skeleton loaders)
- **Error resilience** (feature-level boundaries)

### Performance:
- **Smart caching** (staleTime strategy)
- **Efficient prefetching** (user intent-based)
- **Reduced API calls** (dedupe + throttle)
- **Fast tests** (3-4 seconds for 12 tests)

### Maintainability:
- **Single source of truth** (query keys, types, constants)
- **Easy to extend** (add new hooks following patterns)
- **Safe refactoring** (type safety + tests)
- **Clear documentation** (1,600+ lines of guides)

**This refactoring journey demonstrates:** Production-grade React Query usage requires **architectural thinking**, **domain knowledge**, và **pragmatic trade-offs**. AI tools accelerate implementation, but **human judgment drives architecture decisions**.
