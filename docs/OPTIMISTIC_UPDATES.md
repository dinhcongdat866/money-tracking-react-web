# Optimistic Updates (Kanban)

**Problem:** Dragging cards on the kanban board feels slow and janky if the UI waits 200–500ms for the API before moving anything.

**Solution:** TanStack Query optimistic updates: move the card instantly in the UI, run the API call in the background, rollback on failure, and invalidate on success.

## 3‑Phase Pattern

```ts
// Simplified pseudo‑code
useMutation({
  async onMutate(variables) {
    await queryClient.cancelQueries({ queryKey: transactionKeys.categories() })

    const prevOld = queryClient.getQueryData(
      transactionKeys.byCategory(variables.oldCategory),
    )
    const prevNew = queryClient.getQueryData(
      transactionKeys.byCategory(variables.newCategory),
    )

    // Remove from old column
    queryClient.setQueryData(
      transactionKeys.byCategory(variables.oldCategory),
      (old: Transaction[] = []) => old.filter(t => t.id !== variables.id),
    )

    // Add to new column
    queryClient.setQueryData(
      transactionKeys.byCategory(variables.newCategory),
      (old: Transaction[] = []) => [
        { ...variables.transaction, category: variables.newCategory },
        ...old,
      ],
    )

    return { prevOld, prevNew }
  },
  onError(_error, variables, ctx) {
    // Rollback
    if (ctx?.prevOld) {
      queryClient.setQueryData(
        transactionKeys.byCategory(variables.oldCategory),
        ctx.prevOld,
      )
    }
    if (ctx?.prevNew) {
      queryClient.setQueryData(
        transactionKeys.byCategory(variables.newCategory),
        ctx.prevNew,
      )
    }
  },
  onSuccess(_data, variables) {
    // Sync with server
    queryClient.invalidateQueries({
      queryKey: transactionKeys.byCategory(variables.oldCategory),
    })
    queryClient.invalidateQueries({
      queryKey: transactionKeys.byCategory(variables.newCategory),
    })
    // Optionally also invalidate balance / analytics
  },
})
```

## Key Ideas

- **Cancel queries before mutating** so background refetches do not overwrite optimistic state.
- **Snapshot cache** and return it as context so `onError` can rollback precisely.
- **Targeted invalidation** (the two affected columns plus financial summaries) instead of invalidating the whole app.

## When to Use / Not Use

- **Use it for:** kanban drag & drop, status changes, list re‑ordering, simple CRUD.
- **Avoid it for:** real money movements, irreversible actions, or complex financial calculations.

## Results

- UI responds in under 16ms, feeling “instant” like a native app.
- Users can drag many cards quickly, even on slower networks.
- Easy to explain in 1–2 minutes during interviews.
