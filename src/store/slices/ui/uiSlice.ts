/**
 * UI Slice
 * 
 * Manages client-side UI state:
 * - Modal visibility
 * - Editing state
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TransactionForEdit {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: {
    id: string;
    name: string;
    icon?: string;
  };
  date: string;
  note?: string;
}

export interface UIState {
  modals: {
    isAddTransactionOpen: boolean;
    isEditTransactionOpen: boolean;
  };
  editingTransaction: TransactionForEdit | null;
}

const initialState: UIState = {
  modals: {
    isAddTransactionOpen: false,
    isEditTransactionOpen: false,
  },
  editingTransaction: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Add transaction modal
    openAddTransactionModal: (state) => {
      state.modals.isAddTransactionOpen = true;
    },
    closeAddTransactionModal: (state) => {
      state.modals.isAddTransactionOpen = false;
    },
    
    // Edit transaction modal
    openEditTransactionModal: (state, action: PayloadAction<TransactionForEdit>) => {
      state.modals.isEditTransactionOpen = true;
      state.editingTransaction = action.payload;
    },
    closeEditTransactionModal: (state) => {
      state.modals.isEditTransactionOpen = false;
      state.editingTransaction = null;
    },
    
    // Clear all UI state (useful for logout)
    clearUIState: (state) => {
      state.modals.isAddTransactionOpen = false;
      state.modals.isEditTransactionOpen = false;
      state.editingTransaction = null;
    },
  },
});

export const {
  openAddTransactionModal,
  closeAddTransactionModal,
  openEditTransactionModal,
  closeEditTransactionModal,
  clearUIState,
} = uiSlice.actions;

export default uiSlice.reducer;

