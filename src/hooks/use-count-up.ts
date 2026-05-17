import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  /** Target value to count up to */
  end: number;
  /** Animation duration in ms. Default 1400. */
  duration?: number;
  /** Starting value. Default 0. */
  start?: number;
  /** Decimal places to display. Default 0. */
  decimals?: number;
  /** Only starts animating when true (controlled by IntersectionObserver) */
  enabled?: boolean;
}

/**
 * Animates a number from `start` → `end` using a cubic ease-out curve.
 * Returns the current interpolated value. Restarts whenever `end` changes.
 */
export function useCountUp({
  end,
  duration = 1400,
  start = 0,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions): number {
  const [value, setValue] = useState<number>(enabled ? start : end);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // If not enabled yet, snap to end immediately (no animation)
    if (!enabled) {
      setValue(end);
      return;
    }

    // Reset start time so animation starts fresh
    startTimeRef.current = null;
    setValue(start);

    // Short-circuit for zero values
    if (end === 0 && start === 0) {
      setValue(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Cubic ease-out: slow down as we approach the target
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;

      setValue(parseFloat(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(end); // snap to exact value at the end
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, start, duration, decimals, enabled]);

  return value;
}
