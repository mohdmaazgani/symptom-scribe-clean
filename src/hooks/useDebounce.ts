import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that is only published once `value` has stayed
 * unchanged for `delay` milliseconds.
 *
 * Used to collapse a burst of rapid updates (typing, re-renders, a symptom list
 * that is decrypted in stages) into a single downstream effect, so an expensive
 * call such as the `symptom-analyzer` edge function runs once instead of once
 * per intermediate value.
 *
 * @param value Value to debounce.
 * @param delay Idle time in milliseconds before the value is published.
 * @returns The most recent value that has been stable for the full delay.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // Clearing on every change (and on unmount) means the timer only ever
    // fires for the last value of a burst.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
