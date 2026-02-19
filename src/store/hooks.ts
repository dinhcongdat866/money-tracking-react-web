/**
 * Typed Redux Hooks
 * 
 * Use these throughout the app instead of plain `useDispatch` and `useSelector`
 * for full TypeScript support and autocomplete
 */

import { useDispatch, useSelector, useStore } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch, AppStore } from './index';

/**
 * Use throughout your app instead of plain `useDispatch`
 * Provides correct types for thunks
 */
export const useAppDispatch: () => AppDispatch = useDispatch;

/**
 * Use throughout your app instead of plain `useSelector`
 * Provides type inference for state
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Use to access the store directly (rarely needed)
 */
export const useAppStore: () => AppStore = useStore;

