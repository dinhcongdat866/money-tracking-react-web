"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from "@tanstack/react-query";

type ReactQueryErrorBoundaryProps = {
  children: ReactNode;
};

function ReactQueryErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unknown error occurred";

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
      <p className="text-sm font-semibold text-destructive">
        Something went wrong while loading data.
      </p>
      <p className="text-xs text-muted-foreground max-w-sm">
        {errorMessage}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-1 inline-flex items-center rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm hover:brightness-110"
      >
        Try again
      </button>
    </div>
  );
}

export function ReactQueryErrorBoundary({
  children,
}: ReactQueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <QueryErrorResetBoundary>
      {() => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <ReactQueryErrorFallback
              error={error}
              resetErrorBoundary={resetErrorBoundary}
            />
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}


