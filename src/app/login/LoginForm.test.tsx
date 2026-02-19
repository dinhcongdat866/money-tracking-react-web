import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LoginForm } from './LoginForm';
import authReducer from '@/store/slices/auth/authSlice';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('LoginForm - Redux Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
  });

  it('should render form fields', () => {
    render(
      <Provider store={store}>
        <LoginForm />
      </Provider>
    );

    expect(screen.getByPlaceholderText('demo@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('password123')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show loading state from Redux', () => {
    const storeWithLoading = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
          lastLoginAt: null,
        },
      },
    });

    render(
      <Provider store={storeWithLoading}>
        <LoginForm />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: /signing in/i });
    const emailInput = screen.getByPlaceholderText('demo@example.com');
    
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing in...');
    expect(emailInput).toBeDisabled();
  });

  it('should display error from Redux state', () => {
    // Pre-populate store with error
    const storeWithError = configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Invalid credentials',
          lastLoginAt: null,
        },
      },
    });

    render(
      <Provider store={storeWithError}>
        <LoginForm />
      </Provider>
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});

