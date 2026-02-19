import { createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from './authSlice';

/**
 * Login thunk
 * Calls /api/auth/login endpoint
 * Returns user data on success
 */
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Login failed');
      }

      return data.user as User;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Network error'
      );
    }
  }
);

/**
 * Logout thunk
 * Calls /api/auth/logout endpoint to clear cookies
 */
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.error || 'Logout failed');
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Network error'
      );
    }
  }
);

