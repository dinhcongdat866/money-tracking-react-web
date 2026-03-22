import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiRequest } from '@/lib/api-client';
import { ApiError } from '@/lib/api-errors';
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
      const data = await apiRequest<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return data.user;
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
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
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue(
        error instanceof Error ? error.message : 'Network error'
      );
    }
  }
);

