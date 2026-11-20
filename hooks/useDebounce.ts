import { useState, useEffect } from 'react';

/**
 * Custom React hook that delays updating the state value until
 * after a specified delay period has elapsed since the last change.
 *
 * @param value - The fast-changing state value (e.g. search input).
 * @param delayMs - Debounce duration in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
