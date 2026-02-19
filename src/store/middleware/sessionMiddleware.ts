/**
 * Session Middleware
 * 
 * Automatically checks session expiration on every action
 * and clears auth state if expired
 */

import { Middleware } from '@reduxjs/toolkit';
import { clearUser } from '../slices/auth/authSlice';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export const sessionMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // After every action, check if session is expired
  const state = store.getState();
  const lastLoginAt = state.auth?.lastLoginAt;

  if (lastLoginAt && Date.now() - lastLoginAt > SEVEN_DAYS) {
    // Session expired - auto logout
    console.warn('Session expired - auto logout');
    store.dispatch(clearUser());
    
    // Optionally: redirect to login
    if (typeof window !== 'undefined') {
      // Show toast or redirect
      // window.location.href = '/login';
    }
  }

  return result;
};

