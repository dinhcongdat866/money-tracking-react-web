"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { ToastProvider } from "./ToastProvider";
import {
  ApiError,
  NetworkError,
  ValidationError,
} from "@/lib/api-errors";

function shouldRetryOnError(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;

  // Network errors: allow a couple of retries
  if (error instanceof NetworkError) return true;

  if (error instanceof ApiError) {
    // Do not retry client / validation errors
    if (
      error instanceof ValidationError ||
      (error.statusCode && error.statusCode >= 400 && error.statusCode < 500)
    ) {
      return false;
    }

    // Retry 5xx errors
    if (error.statusCode && error.statusCode >= 500) {
      return true;
    }
  }

  // Fallback: no aggressive retry for unknown errors
  return false;
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Financial data: always refetch from server, no caching
            staleTime: 0, // Always consider data stale, refetch immediately
            gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes for navigation
            refetchOnWindowFocus: true, // Refetch when user returns to tab
            refetchOnReconnect: true, // Refetch when network reconnects
            retry: shouldRetryOnError,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Only retry mutations on network / 5xx via the same logic
            retry: shouldRetryOnError,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}