import { describe, it, expect } from 'vitest';
import uiReducer, {
  openAddTransactionModal,
  closeAddTransactionModal,
  openEditTransactionModal,
  closeEditTransactionModal,
  clearUIState,
} from './uiSlice';
import type { UIState, TransactionForEdit } from './uiSlice';

describe('uiSlice', () => {
  const initialState: UIState = {
    modals: {
      isAddTransactionOpen: false,
      isEditTransactionOpen: false,
    },
    editingTransaction: null,
  };

  it('should return initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should open add transaction modal', () => {
    const state = uiReducer(initialState, openAddTransactionModal());
    expect(state.modals.isAddTransactionOpen).toBe(true);
    expect(state.modals.isEditTransactionOpen).toBe(false);
  });

  it('should close add transaction modal', () => {
    const openState: UIState = {
      ...initialState,
      modals: {
        ...initialState.modals,
        isAddTransactionOpen: true,
      },
    };
    const state = uiReducer(openState, closeAddTransactionModal());
    expect(state.modals.isAddTransactionOpen).toBe(false);
  });

  it('should open edit transaction modal with data', () => {
    const transaction: TransactionForEdit = {
      id: '1',
      amount: 100,
      type: 'expense',
      category: {
        id: 'food',
        name: 'Food',
      },
      date: '2024-01-01',
      note: 'Test transaction',
    };

    const state = uiReducer(initialState, openEditTransactionModal(transaction));
    expect(state.modals.isEditTransactionOpen).toBe(true);
    expect(state.editingTransaction).toEqual(transaction);
  });

  it('should close edit transaction modal and clear editing data', () => {
    const openState: UIState = {
      modals: {
        isAddTransactionOpen: false,
        isEditTransactionOpen: true,
      },
      editingTransaction: {
        id: '1',
        amount: 100,
        type: 'expense',
        category: {
          id: 'food',
          name: 'Food',
        },
        date: '2024-01-01',
        note: 'Test',
      },
    };

    const state = uiReducer(openState, closeEditTransactionModal());
    expect(state.modals.isEditTransactionOpen).toBe(false);
    expect(state.editingTransaction).toBeNull();
  });

  it('should clear all UI state', () => {
    const dirtyState: UIState = {
      modals: {
        isAddTransactionOpen: true,
        isEditTransactionOpen: true,
      },
      editingTransaction: {
        id: '1',
        amount: 100,
        type: 'expense',
        category: {
          id: 'food',
          name: 'Food',
        },
        date: '2024-01-01',
        note: 'Test',
      },
    };

    const state = uiReducer(dirtyState, clearUIState());
    expect(state).toEqual(initialState);
  });
});

