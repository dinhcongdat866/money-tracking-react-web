import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export const selectUI = (state: RootState) => state.ui;
export const selectModals = (state: RootState) => state.ui?.modals;
export const selectIsAddTransactionModalOpen = (state: RootState) => 
  state.ui?.modals?.isAddTransactionOpen ?? false;
export const selectIsEditTransactionModalOpen = (state: RootState) => 
  state.ui?.modals?.isEditTransactionOpen ?? false;
export const selectEditingTransaction = (state: RootState) => 
  state.ui?.editingTransaction;

// Memoized selector - is any modal open?
export const selectIsAnyModalOpen = createSelector(
  [selectIsAddTransactionModalOpen, selectIsEditTransactionModalOpen],
  (isAddOpen, isEditOpen) => isAddOpen || isEditOpen
);

