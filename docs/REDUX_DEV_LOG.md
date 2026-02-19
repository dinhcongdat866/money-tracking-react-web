# Redux Implementation Dev Log

**Date:** Feb 19, 2026  
**Goal:** Implement Redux Toolkit for mid-senior level interview preparation  
**Result:** 445 LOC Redux + 178 LOC tests, 36 tests passing

---

## 📋 **Implementation Summary**

### **Phase 1: Store Setup**
```
Files: store/index.ts, store/hooks.ts, app/providers.tsx
LOC: ~100 lines
```

**What:**
- Configured Redux store with TypeScript types
- Created typed hooks (`useAppDispatch`, `useAppSelector`)
- Wrapped app with `Provider`

**Key Decision:**
- Used `configureStore` from RTK (not legacy `createStore`)
- Enabled Redux DevTools for development only
- Set up serializableCheck middleware config

---

### **Phase 2: Auth Slice**
```
Files: 
  - authSlice.ts (97 lines)
  - authThunks.ts (63 lines)
  - authSelectors.ts (34 lines)
  - sessionMiddleware.ts (35 lines)
  - persistMiddleware.ts (49 lines)
  - useAuthSync.ts (38 lines)
  - API routes: login/logout (92 lines)
  - Tests: 7 tests passing

Total: ~450 lines
```

**Features Implemented:**
1. **Auth State Management**
   ```typescript
   interface AuthState {
     user: User | null;
     isAuthenticated: boolean;
     isLoading: boolean;
     error: string | null;
     lastLoginAt: number | null;
   }
   ```

2. **Async Thunks**
   - `loginThunk` - Login via API route
   - `logoutThunk` - Logout and clear cookies

3. **Middleware**
   - `sessionMiddleware` - Auto-check session expiration every action
   - `persistMiddleware` - Sync state to localStorage (filters, ui only)

4. **Server Sync Strategy**
   - `useAuthSync` hook syncs server session → Redux on mount
   - Server cookie = source of truth
   - Redux = fast client-side access

**Architecture Decision: API Routes vs Server Actions**

**Initial Approach (❌ Wrong):**
```typescript
// Redux thunk calling server action directly
const result = await serverLogin({}, formData);
// Problem: Server action redirects, client code never runs
```

**Final Approach (✅ Correct):**
```typescript
// Created API routes that return JSON
POST /api/auth/login → { user: {...} }
POST /api/auth/logout → { success: true }

// Redux thunks call API routes
const response = await fetch('/api/auth/login', {...});
const data = await response.json();
return data.user;
```

**Why:** Server actions auto-redirect, incompatible with client-side flow control.

---

### **Phase 3: UI Slice**
```
Files:
  - uiSlice.ts (76 lines)
  - uiSelectors.ts (24 lines)
  - Tests: 6 tests passing

Total: ~200 lines
```

**Features:**
```typescript
interface UIState {
  modals: {
    isAddTransactionOpen: boolean;
    isEditTransactionOpen: boolean;
  };
  editingTransaction: TransactionForEdit | null;
}
```

**Migrated from:**
```typescript
// Before: useState
const [isAddModalOpen, setIsAddModalOpen] = useState(false);
const [editingTransaction, setEditingTransaction] = useState(null);

// After: Redux
const dispatch = useAppDispatch();
const isAddModalOpen = useAppSelector(selectIsAddTransactionModalOpen);
const editingTransaction = useAppSelector(selectEditingTransaction);
```

**Trade-off:** Overkill for simple modal state, but good for learning.

---

## 🐛 **Issues Found & Fixed**

### **Issue 1: Memoized Selector with Date.now()**

**Problem Identified by User:**
```typescript
// ❌ BAD: selectIsSessionExpired with createSelector
export const selectIsSessionExpired = createSelector(
  [(state: RootState) => state.auth?.lastLoginAt],
  (lastLoginAt) => {
    if (!lastLoginAt) return false;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - lastLoginAt > SEVEN_DAYS; // ← Stale cache!
  }
);
```

**Why Wrong:**
- `createSelector` memoizes based on input (`lastLoginAt`)
- `Date.now()` changes every millisecond
- Cache never invalidates → returns stale "not expired" result

**Solution:**
```typescript
// ✅ GOOD: Plain selector (no memoization)
export const selectIsSessionExpired = (state: RootState): boolean => {
  const lastLoginAt = state.auth?.lastLoginAt;
  if (!lastLoginAt) return false;
  
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - lastLoginAt > SEVEN_DAYS;
};

// + Added sessionMiddleware to check on every action
```

**Learning:** Don't memoize selectors with time-based logic.

---

### **Issue 2: Redux Priority over Server Session**

**Problem Identified by User:**
```typescript
// ❌ BAD: Redux takes priority
const user = reduxUser || (serverUserEmail ? { email: serverUserEmail } : null);
```

**Why Wrong:**
- Server cookie = secure, auto-expires, source of truth
- Redux/localStorage = can be tampered, stale data
- Hydration mismatch: Server renders user A, client shows user B

**Solution:**
```typescript
// ✅ GOOD: Server → Redux sync
useAuthSync({ 
  serverUser: serverUserEmail ? { email: serverUserEmail } : null 
});

// Server has user → Sync to Redux (if different or missing)
if (serverUser?.email && (!reduxUser || reduxUser.email !== serverUser.email)) {
  dispatch(setUser({...}));
}

// Server has no user, but Redux has → Clear Redux (session expired)
if (!serverUser && reduxUser) {
  dispatch(clearUser());
}
```

**Architecture:**
```
Server Cookie (Source of Truth)
       ↓ useAuthSync on mount
Redux State (Synced, fast access)
       ↓
Components (Read from Redux)
```

**Learning:** Server session should always be source of truth for security.

---

### **Issue 3: Redundant Conditionals in useAuthSync**

**Problem Identified by User:**
```typescript
// ❌ Redundant: Case 1 and 3 do the same thing
// Case 1: Server có, Redux không
if (serverUser?.email && !reduxUser) {
  dispatch(setUser({...}));
}

// Case 3: Server có, Redux khác
if (serverUser?.email && reduxUser && serverUser.email !== reduxUser.email) {
  dispatch(setUser({...}));
}
```

**Why Wrong:**
- Both cases: "Server has user → Update Redux"
- Unnecessary code duplication

**Solution:**
```typescript
// ✅ Simplified: One condition
if (serverUser?.email && (!reduxUser || reduxUser.email !== serverUser.email)) {
  dispatch(setUser({...}));
}
```

**Learning:** Look for common patterns in conditionals, refactor to DRY.

---

### **Issue 4: Not Persisting Auth State**

**Original Implementation:**
```typescript
// persistMiddleware.ts
const PERSIST_KEYS = ['auth', 'filters'];
```

**Problem:** Auth state persisted to localStorage conflicts with server cookie.

**Final Implementation:**
```typescript
// ✅ Don't persist auth
const PERSIST_KEYS = ['filters', 'ui'];
// Server cookie is source of truth, useAuthSync handles sync
```

**Learning:** Don't persist security-sensitive state client-side.

---

## 📊 **Metrics (from baseline.json)**

### **Bundle Impact:**
```
Total Bundle: 1974KB
Gzipped: 658KB

Redux Toolkit: ~45KB (gzipped)
React Redux: ~5KB (gzipped)

Impact: +50KB gzipped (~7.6% increase)
```

### **Code Stats:**
```
Redux LOC: 445 lines
Test LOC: 178 lines
Total: 623 lines

useState Count: 20 (still using for local state)
useAppSelector Count: 9 (Redux usage)
```

### **Test Coverage:**
```
Total Coverage: 21.36%

Redux Slices:
- authSlice.ts: 70.31%
- uiSlice.ts: 100%
- authSelectors.ts: 58.82%
- authThunks.ts: 20% (API calls, hard to test)

Tests Passing: 36/36 ✅
- Auth tests: 7
- UI tests: 6
- Feature tests: 23
```

### **Build Performance:**
```
Build Time: 13.0s
Pages Generated: 16/16
Status: ✅ All passing
```

---

## 🎯 **Architecture Decisions**

### **1. Hybrid Approach: Redux + React Query**

**Decision:** Use both, not replace one with another.

**Rationale:**
- React Query: Server state (transactions, balance, etc.)
- Redux: Client state (auth, UI, filters)
- RTK Query: Not used (would duplicate React Query)

**Trade-off:**
- ✅ Best tool for each job
- ✅ React Query's caching for server data
- ✅ Redux for global client state
- ❌ Two state management libraries (+50KB bundle)
- ❌ More complexity

---

### **2. API Routes vs Server Actions**

**Decision:** Create API routes for Redux, keep server actions for forms.

**Rationale:**
```
Server Actions:
✅ Simple form submissions
✅ Progressive enhancement
✅ Built-in Next.js patterns

API Routes:
✅ Programmatic calls (Redux thunks)
✅ Return JSON (no redirect)
✅ Full control over response
```

**Trade-off:**
- ✅ Clear separation of concerns
- ✅ Redux has predictable flow
- ❌ Duplicate auth logic (2 endpoints)
- ❌ More files to maintain

---

### **3. Persistence Strategy**

**Decision:** Persist UI/filters, NOT auth.

**Rationale:**
```
Persist:
✅ filters - User preferences
✅ ui - Modal state, theme (if added)

Don't Persist:
❌ auth - Server cookie is source of truth
❌ Server data - React Query handles this
```

**Implementation:**
```typescript
const PERSIST_KEYS = ['filters', 'ui'] as const;

// Load on init (SSR-safe)
const preloadedState = typeof window !== 'undefined' 
  ? loadPersistedState() 
  : {};
```

---

### **4. Session Management**

**Decision:** Middleware-based auto-expiration check.

**Why:**
```typescript
// sessionMiddleware runs on EVERY action
export const sessionMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  const state = store.getState();
  const lastLoginAt = state.auth?.lastLoginAt;
  
  if (lastLoginAt && Date.now() - lastLoginAt > SEVEN_DAYS) {
    store.dispatch(clearUser()); // Auto logout
  }
  
  return result;
};
```

**Trade-off:**
- ✅ Automatic, no manual checks needed
- ✅ Runs on any user action
- ❌ Slight performance overhead (negligible)
- ❌ Can't logout while idle (needs action)

**Alternative Considered:** `setInterval` polling
- ✅ Works while idle
- ❌ More complex, needs cleanup
- ❌ Unnecessary battery drain

---

## 🤔 **Honest Assessment: Redux vs Server Actions**

### **Code Comparison:**

**Server Actions (Original):**
```typescript
// 50 lines total
export async function login(prevState, formData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  
  if (!email || !password) {
    return { error: "Required" };
  }
  
  const isValid = email === MOCK_USER.email && password === MOCK_USER.password;
  
  if (!isValid) {
    return { error: "Invalid" };
  }
  
  const token = await signAuthToken({...});
  cookies().set(cookieName, token, {...});
  
  redirect("/dashboard");
}

// LoginForm.tsx
const [state, formAction] = useActionState(login, {});
return (
  <form action={formAction}>
    {state.error && <p>{state.error}</p>}
    <button>Login</button>
  </form>
);
```

**Redux Approach (Current):**
```typescript
// 623 lines total (445 Redux + 178 tests)

// authSlice.ts (97 lines)
// authThunks.ts (63 lines)
// authSelectors.ts (34 lines)
// sessionMiddleware.ts (35 lines)
// persistMiddleware.ts (49 lines)
// useAuthSync.ts (38 lines)
// API routes (92 lines)
// LoginForm.tsx (99 lines)
// Tests (178 lines)
```

**Verbosity: 12.5x more code**

---

### **Is Redux Worth It?**

**For This App:** ❌ **Overkill**

This app doesn't need:
- ❌ Complex global state coordination
- ❌ Real-time features
- ❌ Optimistic updates
- ❌ Multi-step wizards
- ❌ Undo/redo

Server Actions + React Query + Zustand would be simpler.

---

**For Learning:** ✅ **Absolutely**

What I learned:
1. **Redux Toolkit patterns** (slices, thunks, middleware)
2. **Architecture trade-offs** (when NOT to use Redux)
3. **Security considerations** (server session vs client state)
4. **Middleware patterns** (session check, persistence)
5. **Testing strategies** (mocking async thunks, state tests)
6. **Memoization pitfalls** (time-based selectors)

---

**For Interviews:** ✅ **High Value**

Shows:
- ✅ State management at scale
- ✅ Architectural decision-making
- ✅ Trade-off analysis (not blindly following patterns)
- ✅ Security awareness (server session priority)
- ✅ Problem-solving (fixed memoization issue)
- ✅ Self-awareness ("This is overkill, but here's why I did it")


## 💡 **Lessons Learned**

1. **Complexity isn't always better** - Simple solutions (Server Actions) often win
2. **Security first** - Server state > Client state for auth
3. **Time-based logic breaks memoization** - Be careful with Date.now()
4. **Patterns have context** - Redux great for complex apps, overkill for simple ones
5. **Learning value ≠ Production value** - Sometimes you implement things just to learn
6. **Self-awareness matters** - Knowing WHEN NOT to use a tool is senior-level skill

---

**Patterns Applied:**
- Flux architecture
- Middleware pattern
- Selector pattern (memoization)
- Thunk pattern (async actions)
- Hydration sync pattern

**Total LOC:** 623 lines  
**Test Coverage:** 21.36% (Redux slices 70%+)  
**Bundle Impact:** +50KB gzipped  
