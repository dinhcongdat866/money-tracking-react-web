"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Debounce a callback with built-in cancellation and unmount cleanup.
 *
 * - `schedule(...args)`: (re)starts the timer
 * - `cancel()`: clears any pending timer
 *
 * Uses a ref to always call the latest `callback` without re-creating timers.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (...args: TArgs) => {
      cancel();
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [cancel, delayMs],
  );

  // Cleanup on unmount
  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}


