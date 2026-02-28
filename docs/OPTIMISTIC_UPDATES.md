# Optimistic Updates Implementation

**Topic:** Optimistic updates for drag & drop

**Context:** Kanban board drag-and-drop with instant UI feedback and graceful rollback on failures.

---

## Problem Statement

### Without Optimistic Updates

```
User drags transaction → Wait for API (200-500ms) → UI updates
                                   ↓
                         User sees laggy, unresponsive UI
```

| Action | User Experience | Technical Issue |
|--------|-----------------|-----------------|
| Drag card | Card freezes during API call | Poor UX, feels broken |
| Network slow (3G) | 2-5 second delay | Unusable |
| API error | Card snaps back without explanation | Confusing |
| Multiple drags | Queue builds up, feel sluggish | Frustrating |

### Why This Matters

1. **User Perception:**
   - 0-100ms: Feels instant
   - 100-300ms: Noticeable delay
   - 300ms+: Feels broken

2. **Mobile/3G Networks:**
   - 500-1000ms API latency common
   - Without optimistic updates: Unusable
   - With optimistic updates: Still feels instant

3. **Competitive Advantage:**
   - Modern apps (Trello, Asana) use optimistic updates
   - Users expect instant feedback
   - Sets professional quality bar

---

## Solution: Three-Phase Mutation Pattern

### Phase 1: onMutate (Optimistic Update)

**Runs BEFORE the API call**

```typescript
onMutate: async ({ transactionId, oldCategory, newCategory, transaction }) => {
  // ========================================================================
  // STEP 1: Cancel Outgoing Queries (Prevent Race Conditions)
  // ========================================================================
  await queryClient.cancelQueries({
    queryKey: transactionKeys.all,
  });
  
  // Why? If a background refetch completes after our optimistic update,
  // it would overwrite our optimistic state with stale server data
  
  // ========================================================================
  // STEP 2: Snapshot Current State (For Rollback)
  // ========================================================================
  const previousOldCategoryData = queryClient.getQueryData<TransactionItem[]>(
    transactionKeys.byCategory(oldCategory)
  );
  const previousNewCategoryData = queryClient.getQueryData<TransactionItem[]>(
    transactionKeys.byCategory(newCategory)
  );
  
  // ========================================================================
  // STEP 3: Update Cache Optimistically
  // ========================================================================
  
  // Remove from old category
  queryClient.setQueryData<TransactionItem[]>(
    transactionKeys.byCategory(oldCategory),
    (old) => old?.filter(t => t.id !== transactionId) ?? []
  );
  
  // Add to new category
  const updatedTransaction = {
    ...transaction,
    category: { id: newCategory, name: getCategoryName(newCategory) }
  };
  
  queryClient.setQueryData<TransactionItem[]>(
    transactionKeys.byCategory(newCategory),
    (old) => [updatedTransaction, ...(old ?? [])]
  );
  
  // ========================================================================
  // STEP 4: Return Context for Error Handler
  // ========================================================================
  return {
    previousOldCategoryData,
    previousNewCategoryData,
    oldCategory,
    newCategory,
    transactionId,
  };
}
```

**Key Points:**

1. **Why cancel queries?**
   - Prevents race condition where refetch overwrites optimistic update
   - Example: Drag at t=0ms, background refetch returns at t=50ms
   - Without cancel: Refetch would undo optimistic update

2. **Why snapshot?**
   - Need original state to rollback on error
   - Can't rely on cache after optimistic update
   - Must capture before any mutations

3. **Why return context?**
   - onError and onSuccess need access to rollback data
   - TypeScript ensures type safety across phases
   - Clean separation of concerns

### Phase 2: onError (Rollback)

**Runs if API call fails**

```typescript
onError: (error, variables, context) => {
  console.error('Failed to update category:', error);
  
  // ========================================================================
  // ROLLBACK: Restore Previous State
  // ========================================================================
  if (context?.previousOldCategoryData) {
    queryClient.setQueryData(
      transactionKeys.byCategory(context.oldCategory),
      context.previousOldCategoryData
    );
  }
  
  if (context?.previousNewCategoryData) {
    queryClient.setQueryData(
      transactionKeys.byCategory(context.newCategory),
      context.previousNewCategoryData
    );
  }
  
  // ========================================================================
  // USER FEEDBACK: Show Error Notification
  // ========================================================================
  toast.error('Failed to move transaction. Changes reverted.');
}
```

**Key Interview Points:**

1. **Always provide user feedback:**
   - User needs to know why card moved back
   - Show specific error message
   - Offer retry button

2. **Atomic rollback:**
   - Either all changes revert or none
   - Can't leave cache in inconsistent state
   - Transaction appears in exactly one category

3. **Error types to handle:**
   ```typescript
   if (error.code === 'NETWORK_ERROR') {
     // Queue for retry when back online
     queueMutation(variables)
   } else if (error.code === 'VALIDATION_ERROR') {
     // Show validation message, don't retry
     toast.error(error.message)
   } else if (error.code === 'CONFLICT') {
     // Transaction was updated by another device
     showConflictModal()
   }
   ```

### Phase 3: onSuccess (Sync with Server)

**Runs after successful API response**

```typescript
onSuccess: (data, variables, context) => {
  // ========================================================================
  // INVALIDATE: Refetch to Sync Server State
  // ========================================================================
  queryClient.invalidateQueries({
    queryKey: transactionKeys.byCategory(variables.newCategory),
  });
  
  queryClient.invalidateQueries({
    queryKey: transactionKeys.byCategory(variables.oldCategory),
  });
  
  // Invalidate financial summaries (balance, totals changed)
  void invalidateAllFinancial(queryClient);
  
  // ========================================================================
  // USER FEEDBACK: Success Notification
  // ========================================================================
  toast.success('Transaction moved!');
}
```

**Key Interview Points:**

1. **Why invalidate after success?**
   - Server might have additional changes (timestamps, computed fields)
   - Other users might have made changes
   - Ensures cache matches server reality

2. **Granular invalidation:**
   - Only invalidate affected categories
   - Don't invalidate entire transaction list
   - Minimizes unnecessary refetches

3. **Fire and forget:**
   - Use `void` for invalidation (don't await)
   - Background refetch won't block UI
   - User already sees optimistic update

---

## Race Conditions & Edge Cases

### 1. Concurrent Mutations

**Problem:** User drags transaction A, then immediately drags transaction B

```
t=0ms:   Drag A (Food → Transport)
         - Optimistic: Remove from Food cache
         - API call starts
         
t=100ms: Drag B (Food → Shopping)
         - Optimistic: Remove from Food cache
         - Problem: A is already gone, B removal works
         
t=200ms: API for A returns
         - Refetch Food category
         - Problem: B is back in Food (stale data!)
```

**Solution: Version-Based Updates**

```typescript
// Add version number to transactions
type TransactionItem = {
  id: string
  version: number // Incremented on each update
  // ...other fields
}

// In onMutate
const updatedTransaction = {
  ...transaction,
  version: transaction.version + 1,
  category: newCategory,
}

// In onSuccess
onSuccess: (data) => {
  // Use server version (source of truth)
  queryClient.setQueryData(
    transactionKeys.byCategory(newCategory),
    (old) => old?.map(t => 
      t.id === data.id ? data : t
    )
  )
}
```

### 2. WebSocket Updates During Drag

**Problem:** User drags transaction while WebSocket receives update for same transaction

```
t=0ms:   User starts drag (transaction #123)
t=100ms: WebSocket: "#123 category changed to X"
t=200ms: User drops in category Y
         
Which wins? User action or WebSocket update?
```

**Solution: Lock During Mutation**

```typescript
// Track active mutations
const activeMutations = useRef(new Set<string>())

// In handleDragStart
activeMutations.current.add(transactionId)

// In WebSocket handler
if (activeMutations.current.has(transaction.id)) {
  // Queue update to apply after mutation completes
  queueUpdate(transaction)
  return // Ignore for now
}

// In handleDragEnd (finally block)
activeMutations.current.delete(transactionId)
processQueuedUpdates(transactionId) // Apply queued WebSocket updates
```

**Note:** We prioritize user actions over WebSocket updates during active drag operations, then reconcile queued updates after the drag completes.

### 3. API Timeout

**Problem:** API call takes 10+ seconds or times out

```typescript
// Add timeout to mutation
mutationFn: async (variables) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)
  
  try {
    return await updateTransaction(variables.transactionId, {
      category: variables.newCategory,
    }, {
      signal: controller.signal
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
```

**UX Strategy:**

```typescript
// Show loading indicator after 2 seconds
const [isStuckLoading, setIsStuckLoading] = useState(false)

useEffect(() => {
  if (updateCategory.isPending) {
    const timer = setTimeout(() => setIsStuckLoading(true), 2000)
    return () => clearTimeout(timer)
  }
}, [updateCategory.isPending])

{isStuckLoading && (
  <Banner>
    Taking longer than expected... 
    <button onClick={retry}>Retry</button>
  </Banner>
)}
```

### 4. Offline Mode

**Problem:** User drags while offline

**Solution: Queue Mutations**

```typescript
// Check network status
const isOnline = useOnlineStatus()

const handleDragEnd = async (event: DragEndEvent) => {
  if (!isOnline) {
    // Queue mutation in IndexedDB
    await queueMutation({
      type: 'update-category',
      variables,
      timestamp: Date.now(),
    })
    
    toast.info('Saved offline. Will sync when reconnected.')
    return
  }
  
  // Normal optimistic update
  await updateCategory.mutateAsync(variables)
}

// Process queue when back online
useEffect(() => {
  if (isOnline) {
    processQueuedMutations()
  }
}, [isOnline])
```

---

## Complex Scenarios

### Scenario 1: Multiple Simultaneous Updates

**Problem:** User drags Transaction A while WebSocket updates Transaction B in the same category

```typescript
// Solution: Fine-grained cache updates
queryClient.setQueryData(
  transactionKeys.byCategory(category),
  (old) => {
    return old?.map(t => {
      // Update only specific transaction
      if (t.id === updatedId) return updatedTransaction
      return t
    })
  }
)

// Note: Update individual items rather than replacing entire array
// This prevents conflicts when multiple transactions update simultaneously
```

### Scenario 2: Drag Chain

**Problem:** User drags A → B → C in rapid succession before APIs complete

```
t=0ms:   Drag A (Food → Transport), API started
t=100ms: Drag A (Transport → Shopping), API started
t=150ms: Drag A (Shopping → Utilities), API started
t=200ms: API 1 completes (A → Transport)
t=220ms: API 2 completes (A → Shopping)
t=240ms: API 3 completes (A → Utilities)
```

**Solution: Request ID Tracking**

```typescript
const latestRequestId = useRef<Record<string, number>>({})

onMutate: async (variables) => {
  const requestId = Date.now()
  latestRequestId.current[variables.transactionId] = requestId
  
  return { ...context, requestId }
}

onSuccess: (data, variables, context) => {
  // Only apply if this is the latest request
  if (latestRequestId.current[variables.transactionId] !== context.requestId) {
    console.log('Ignoring stale response')
    return
  }
  
  // Proceed with invalidation
  queryClient.invalidateQueries(...)
}
```

### Scenario 3: Partial Failures

**Problem:** Transaction moved, but balance update failed

```typescript
mutationFn: async (variables) => {
  // Two API calls - one might fail
  const transaction = await updateTransactionCategory(...)
  const balance = await recalculateBalance()
  
  return { transaction, balance }
}

onError: (error, variables, context) => {
  if (error.code === 'BALANCE_CALCULATION_FAILED') {
    // Transaction update succeeded but balance failed
    // Don't rollback transaction, just refetch balance
    queryClient.invalidateQueries({ queryKey: ['balance'] })
    
    toast.warning('Transaction moved but balance may be incorrect. Refreshing...')
    return
  }
  
  // Full rollback for other errors
  rollbackOptimisticUpdate(context)
}
```

---

## Performance Optimizations

### 1. Batching Updates

**Problem:** User drags 10 transactions rapidly

```typescript
// Without batching: 10 separate mutations, 10 API calls
// With batching: 1 mutation, 1 API call

const pendingUpdates = useRef<UpdateCategoryVariables[]>([])
const batchTimer = useRef<NodeJS.Timeout>()

const handleDragEnd = (event: DragEndEvent) => {
  const variables = extractVariables(event)
  
  // Add to batch
  pendingUpdates.current.push(variables)
  
  // Clear existing timer
  if (batchTimer.current) clearTimeout(batchTimer.current)
  
  // Set new timer - wait 100ms for more drags
  batchTimer.current = setTimeout(async () => {
    // Send all updates in one API call
    await updateCategoriesBatch(pendingUpdates.current)
    pendingUpdates.current = []
  }, 100)
}
```

### 2. Debouncing Invalidation

**Problem:** Many mutations trigger many invalidations

```typescript
// Create debounced invalidation function
const debouncedInvalidate = useMemo(
  () => debounce((category: string) => {
    queryClient.invalidateQueries({
      queryKey: transactionKeys.byCategory(category)
    })
  }, 500),
  [queryClient]
)

onSuccess: (data, variables) => {
  // Instead of immediate invalidation
  debouncedInvalidate(variables.newCategory)
}
```

### 3. Selective Re-renders

**Problem:** Updating cache triggers re-render of entire board

```typescript
// Use React.memo to prevent unnecessary re-renders
export const KanbanColumn = React.memo(({ category, transactions, ... }) => {
  // Only re-renders when transactions or category changes
}, (prevProps, nextProps) => {
  return (
    prevProps.transactions === nextProps.transactions &&
    prevProps.category.id === nextProps.category.id &&
    prevProps.count === nextProps.count
  )
})
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('useUpdateCategory', () => {
  it('updates cache optimistically before API call', async () => {
    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createQueryWrapper(),
    })
    
    // Set initial cache state
    queryClient.setQueryData(transactionKeys.byCategory('food'), [transaction1])
    queryClient.setQueryData(transactionKeys.byCategory('transport'), [])
    
    // Trigger mutation
    result.current.mutate({
      transactionId: transaction1.id,
      oldCategory: 'food',
      newCategory: 'transport',
      transaction: transaction1,
    })
    
    // Check cache was updated immediately (before API resolves)
    await waitFor(() => {
      const foodData = queryClient.getQueryData(transactionKeys.byCategory('food'))
      const transportData = queryClient.getQueryData(transactionKeys.byCategory('transport'))
      
      expect(foodData).toHaveLength(0) // Removed
      expect(transportData).toHaveLength(1) // Added
    })
  })
  
  it('rolls back on API error', async () => {
    // Mock API to throw error
    mockUpdateTransaction.mockRejectedValueOnce(new Error('API Error'))
    
    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createQueryWrapper(),
    })
    
    // Set initial state
    queryClient.setQueryData(transactionKeys.byCategory('food'), [transaction1])
    
    // Trigger mutation
    await result.current.mutateAsync(variables)
    
    // Check cache was rolled back
    const foodData = queryClient.getQueryData(transactionKeys.byCategory('food'))
    expect(foodData).toContainEqual(transaction1) // Restored
  })
})
```

### Integration Tests

```typescript
describe('Kanban Drag & Drop', () => {
  it('moves transaction between columns optimistically', async () => {
    render(<KanbanBoard />)
    
    // Find transaction in Food column
    const card = screen.getByTestId('transaction-123')
    const foodColumn = screen.getByTestId('column-food')
    const transportColumn = screen.getByTestId('column-transport')
    
    // Drag from Food to Transport
    await dragAndDrop(card, transportColumn)
    
    // Check UI updated immediately (don't wait for API)
    await waitFor(() => {
      expect(within(foodColumn).queryByTestId('transaction-123')).not.toBeInTheDocument()
      expect(within(transportColumn).getByTestId('transaction-123')).toBeInTheDocument()
    }, { timeout: 50 }) // Should happen in <50ms
  })
  
  it('rolls back on network error', async () => {
    // Simulate network error
    mockAPI.mockNetworkError()
    
    render(<KanbanBoard />)
    
    const card = screen.getByTestId('transaction-123')
    const transportColumn = screen.getByTestId('column-transport')
    
    await dragAndDrop(card, transportColumn)
    
    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/failed to move/i)).toBeInTheDocument()
    })
    
    // Check card returned to original column
    const foodColumn = screen.getByTestId('column-food')
    expect(within(foodColumn).getByTestId('transaction-123')).toBeInTheDocument()
  })
})
```

### Manual Testing Checklist

- [ ] Drag feels instant (no perceived lag)
- [ ] Card moves smoothly to new column
- [ ] Totals update immediately
- [ ] Error shows toast + card returns to original column
- [ ] Multiple rapid drags don't break UI
- [ ] Works offline (queues mutation)
- [ ] No duplicate transactions in any column
- [ ] Undo/redo works correctly
- [ ] Keyboard navigation preserves drag state

---

## Discussion Points

### "Why not just await the API call?"

**Bad approach:**
```typescript
const handleDragEnd = async (event) => {
  setLoading(true)
  await updateTransaction(...) // Wait 200-500ms
  setLoading(false)
  refetchData()
}
```

**Problems:**
- 200-500ms lag feels broken
- Can't drag multiple items quickly
- Loading spinners are distracting
- Unusable on slow networks

**Our approach:**
```typescript
const handleDragEnd = async (event) => {
  // UI updates in <16ms (1 frame)
  updateCategory.mutate(variables) // Fire and forget
}
```

**Benefits:**
- Instant UI feedback
- Users can drag multiple items rapidly
- Graceful error handling with rollback
- Works smoothly on 3G networks

### "What if multiple users edit the same transaction?"

**Scenario:** User A and User B both drag transaction #123

```
t=0ms:   User A drags #123 to "Food"
         - Optimistic update on A's device
         - API call starts
         
t=50ms:  User B drags #123 to "Transport"
         - Optimistic update on B's device
         - API call starts
         
t=200ms: API calls complete
         - Server accepts last write (User B)
         - User A sees #123 jump to "Transport" via WebSocket
```

**Solution 1: Last-Write-Wins**

```typescript
// Simple, works for most cases
// Server determines winner based on timestamp
// Loser sees their change revert via WebSocket
```

**Solution 2: Optimistic Locking**

```typescript
// Include version in API call
await updateTransaction(id, {
  category: newCategory,
  expectedVersion: transaction.version
})

// Server rejects if version doesn't match
if (transaction.version !== expectedVersion) {
  throw new ConflictError('Transaction was updated by another user')
}

// Client shows conflict modal
onError: (error) => {
  if (error.code === 'CONFLICT') {
    showConflictModal({
      title: 'Transaction was updated elsewhere',
      options: ['Keep my change', 'Accept their change'],
    })
  }
}
```

**Solution 3: CRDT (Conflict-free Replicated Data Type)**

```typescript
// For complex merges (e.g., collaborative notes)
// Use CRDT library like Yjs
// Automatic conflict resolution
// Both users' changes preserved

// Interview point: "For simple categorical changes, 
// last-write-wins is sufficient. For collaborative editing, 
// I'd use CRDTs like Yjs or Automerge."
```

### "How do you test optimistic updates?"

**Unit Test Strategy:**

1. **Test onMutate:**
   ```typescript
   it('updates cache before API call', () => {
     // Verify cache changes immediately
     // Don't wait for API
   })
   ```

2. **Test onError:**
   ```typescript
   it('rolls back on error', () => {
     // Mock API error
     // Verify cache restored to previous state
   })
   ```

3. **Test onSuccess:**
   ```typescript
   it('invalidates queries on success', () => {
     // Verify correct queries invalidated
     // Verify user feedback shown
   })
   ```

**Integration Test Strategy:**

1. **Happy path:**
   - Drag, verify immediate update, verify API called

2. **Error path:**
   - Drag, mock API error, verify rollback

3. **Race conditions:**
   - Multiple rapid drags, verify final state correct

4. **Network failure:**
   - Drag while offline, verify queued, verify syncs when online

---

## Common Pitfalls & Solutions

### Pitfall 1: Not Canceling Queries

❌ **Bad:**
```typescript
onMutate: async (variables) => {
  // Don't cancel queries
  queryClient.setQueryData(...) // Optimistic update
}
```

**Problem:** Background refetch overwrites optimistic update

✅ **Good:**
```typescript
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: transactionKeys.all })
  queryClient.setQueryData(...) // Safe optimistic update
}
```

### Pitfall 2: Not Snapshotting State

❌ **Bad:**
```typescript
onMutate: async (variables) => {
  queryClient.setQueryData(...) // Optimistic update
  return {} // No snapshot!
}

onError: () => {
  // Can't rollback - don't have previous state!
}
```

✅ **Good:**
```typescript
onMutate: async (variables) => {
  const previousData = queryClient.getQueryData(key)
  queryClient.setQueryData(...)
  return { previousData } // Save for rollback
}

onError: (err, vars, context) => {
  queryClient.setQueryData(key, context.previousData)
}
```

### Pitfall 3: Invalidating Too Broadly

❌ **Bad:**
```typescript
onSuccess: () => {
  // Refetches ALL transaction queries (expensive!)
  queryClient.invalidateQueries({ queryKey: transactionKeys.all })
}
```

✅ **Good:**
```typescript
onSuccess: (data, variables) => {
  // Only refetch affected categories
  queryClient.invalidateQueries({
    queryKey: transactionKeys.byCategory(variables.newCategory)
  })
  queryClient.invalidateQueries({
    queryKey: transactionKeys.byCategory(variables.oldCategory)
  })
}
```

### Pitfall 4: Not Handling Version Conflicts

❌ **Bad:**
```typescript
// Apply every WebSocket update blindly
onMessage: (event) => {
  queryClient.setQueryData(key, event.data) // Could be stale!
}
```

✅ **Good:**
```typescript
onMessage: (event) => {
  const cached = queryClient.getQueryData(key)
  
  // Check version before applying
  if (cached && cached.version > event.data.version) {
    console.warn('Ignoring stale WebSocket update')
    return
  }
  
  queryClient.setQueryData(key, event.data)
}
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        User Action                          │
│                    (Drag transaction)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1: onMutate                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Cancel outgoing queries                           │   │
│  │ 2. Snapshot current state                            │   │
│  │ 3. Update React Query cache                          │   │
│  │ 4. UI re-renders instantly (<16ms)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │    API Call Starts    │
              │   (Fire & Forget)     │
              └──────────┬────────────┘
                         │
        ┌────────────────┴─────────────────┐
        │                                  │
        ▼                                  ▼
┌───────────────────┐            ┌──────────────────┐
│  API Returns 2xx  │            │ API Returns Error│
│  (Success)        │            │  (4xx/5xx/Timeout)
└────────┬──────────┘            └────────┬─────────┘
         │                                │
         ▼                                ▼
┌─────────────────────┐         ┌────────────────────────┐
│ PHASE 3: onSuccess  │         │  PHASE 2: onError      │
│ ┌─────────────────┐ │         │ ┌────────────────────┐ │
│ │ 1. Invalidate   │ │         │ │ 1. Restore snapshot│ │
│ │    queries      │ │         │ │ 2. Show error toast│ │
│ │ 2. Refetch to   │ │         │ │ 3. Log for debug   │ │
│ │    sync server  │ │         │ └────────────────────┘ │
│ │ 3. Show success │ │         └────────────────────────┘
│ │    toast        │ │
│ └─────────────────┘ │
└─────────────────────┘
```

---

## Summary

### Quick Explanation

"When users drag a transaction between categories, we use optimistic updates for instant UI feedback. First, we cancel outgoing queries to prevent race conditions. Then we snapshot the current cache state for rollback. We immediately update the React Query cache by removing the transaction from the old category and adding it to the new category. The API call happens in the background. If it fails, we restore the snapshot and show an error. If it succeeds, we invalidate queries to sync with the server. This pattern gives users instant feedback while maintaining data consistency."

### If Asked: "What's the hardest part?"

**Answer:** "Race conditions and concurrent updates. You need to handle: 
1. User dragging while background refetch completes
2. Multiple rapid drags before APIs finish
3. WebSocket updates arriving during active drag
4. Version conflicts from simultaneous edits

The solution is careful mutation orchestration: cancel queries, lock during mutations, use version numbers, and queue conflicting updates."

### If Asked: "When would you NOT use optimistic updates?"

**Don't use optimistic updates for:**

1. **Financial transactions** (payments, transfers)
   - Risk of showing incorrect balance
   - Must wait for server confirmation
   - Rollback could cause user panic

2. **Irreversible actions** (delete account, cancel subscription)
   - Too risky if rollback needed
   - Better to show loading state

3. **Complex calculations** (tax, interest)
   - Client can't reliably predict result
   - Server calculation is source of truth

4. **Security-sensitive** (permissions, access control)
   - Must verify server-side
   - Optimistic update could mislead user

**Good for:**
- ✅ UI state changes (category, status, priority)
- ✅ Drag & drop reordering
- ✅ Simple CRUD operations
- ✅ Text edits (notes, descriptions)

### If Asked: "How does this scale?"

**Current implementation:**
- Handles 100s of transactions per category
- Optimistic update in <16ms (1 frame)
- Works well for single user, multiple devices

**Scaling to 1000s of users:**

1. **Server-side:**
   - Use Redis pub/sub for WebSocket scaling
   - Implement rate limiting (max 10 drags/second)
   - Add idempotency keys to prevent duplicates

2. **Client-side:**
   - Batch multiple drags into single API call
   - Implement request deduplication
   - Add optimistic update queue (max 20 pending)

3. **Conflict resolution:**
   - Add version numbers to all transactions
   - Implement three-way merge for complex fields
   - Show conflict UI when versions diverge

4. **Monitoring:**
   - Track optimistic update success rate
   - Alert on high rollback rate (>5%)
   - Monitor mutation queue size

---

## Code Examples

### Basic Optimistic Update

```typescript
const mutation = useMutation({
  mutationFn: updateItem,
  
  onMutate: async (newItem) => {
    await queryClient.cancelQueries({ queryKey: ['items'] })
    const previous = queryClient.getQueryData(['items'])
    
    queryClient.setQueryData(['items'], (old) => 
      old?.map(item => item.id === newItem.id ? newItem : item)
    )
    
    return { previous }
  },
  
  onError: (err, newItem, context) => {
    queryClient.setQueryData(['items'], context.previous)
  },
  
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})
```

### Optimistic Update with Multiple Caches

```typescript
onMutate: async (variables) => {
  // Update multiple related caches
  
  // 1. Update detail view
  queryClient.setQueryData(['transaction', id], updatedTransaction)
  
  // 2. Update list view
  queryClient.setQueryData(['transactions'], (old) => 
    old?.map(t => t.id === id ? updatedTransaction : t)
  )
  
  // 3. Update aggregation
  queryClient.setQueryData(['balance'], (old) => ({
    ...old,
    total: old.total + delta
  }))
  
  // Return ALL snapshots
  return { detailSnapshot, listSnapshot, balanceSnapshot }
}
```

---

## Resources

- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [React Query Best Practices](https://tkdodo.eu/blog/react-query-best-practices)
- [Optimistic UI - Luke Wroblewski](https://www.lukew.com/ff/entry.asp?1797)
- [Conflict Resolution Strategies](https://martin.kleppmann.com/2020/07/06/crdt-hard-parts-hydra.html)
- [Building Offline-First Apps](https://offlinefirst.org/)

---

**Last Updated:** 2026-02-27  
**Project:** Money Tracking App - Kanban Board
