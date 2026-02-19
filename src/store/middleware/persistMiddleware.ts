/**
 * Persist Middleware
 * 
 */

import { Middleware } from '@reduxjs/toolkit';

const PERSIST_KEYS = ['filters', 'ui'] as const;

export const persistMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // After action is processed, persist state
  const state = store.getState();

  PERSIST_KEYS.forEach((key) => {
    if (state[key]) {
      try {
        localStorage.setItem(`redux_${key}`, JSON.stringify(state[key]));
      } catch (error) {
        console.error(`Failed to persist ${key}:`, error);
      }
    }
  });

  return result;
};

/**
 * Load persisted state from localStorage on init
 */
export const loadPersistedState = () => {
  const persistedState: Record<string, unknown> = {};

  PERSIST_KEYS.forEach((key) => {
    try {
      const serialized = localStorage.getItem(`redux_${key}`);
      if (serialized) {
        persistedState[key] = JSON.parse(serialized);
      }
    } catch (error) {
      console.error(`Failed to load ${key}:`, error);
    }
  });

  return persistedState;
};

