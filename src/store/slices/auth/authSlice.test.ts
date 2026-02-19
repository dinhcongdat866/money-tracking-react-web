import { describe, it, expect } from 'vitest';
import authReducer, { setUser, clearUser, setError } from './authSlice';
import type { AuthState, User } from './authSlice';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastLoginAt: null,
  };

  describe('setUser', () => {
    it('should set user and mark as authenticated', () => {
      const user: User = {
        id: '1',
        email: 'test@test.com',
        name: 'Test User',
      };

      const nextState = authReducer(initialState, setUser(user));

      expect(nextState.user).toEqual(user);
      expect(nextState.isAuthenticated).toBe(true);
      expect(nextState.error).toBeNull();
    });
  });

  describe('clearUser', () => {
    it('should clear user and mark as unauthenticated', () => {
      const stateWithUser: AuthState = {
        ...initialState,
        user: { id: '1', email: 'test@test.com', name: 'Test' },
        isAuthenticated: true,
        lastLoginAt: Date.now(),
      };

      const nextState = authReducer(stateWithUser, clearUser());

      expect(nextState.user).toBeNull();
      expect(nextState.isAuthenticated).toBe(false);
      expect(nextState.lastLoginAt).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error and stop loading', () => {
      const stateWithLoading: AuthState = {
        ...initialState,
        isLoading: true,
      };

      const nextState = authReducer(stateWithLoading, setError('Login failed'));

      expect(nextState.error).toBe('Login failed');
      expect(nextState.isLoading).toBe(false);
    });
  });

  describe('initial state', () => {
    it('should return initial state when passed undefined', () => {
      const nextState = authReducer(undefined, { type: 'unknown' });

      expect(nextState).toEqual(initialState);
    });
  });
});

