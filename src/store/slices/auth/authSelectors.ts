/**
 * Auth Selectors
 * 
 * Memoized selectors for auth state
 */

import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

// Basic selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth?.user;
export const selectIsAuthenticated = (state: RootState) =>
    state.auth?.isAuthenticated ?? false;
export const selectAuthLoading = (state: RootState) =>
    state.auth?.isLoading ?? false;
export const selectAuthError = (state: RootState) => state.auth?.error;


export const selectIsSessionExpired = (state: RootState): boolean => {
    const lastLoginAt = state.auth?.lastLoginAt;
    if (!lastLoginAt) return false;

    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - lastLoginAt > SEVEN_DAYS;
};

// Memoized derived selectors
export const selectUserDisplayName = createSelector([selectUser], (user) =>
    user ? user.name || user.email || 'Guest' : 'Guest'
);


