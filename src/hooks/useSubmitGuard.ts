import { useCallback, useRef } from "react";

/** Why a submission was turned away by the guard. */
export type SubmitGuardRejectionReason = "in-flight" | "cooldown" | "quota";

export interface SubmitGuardOptions {
  /** Minimum gap, in milliseconds, between two accepted submissions. */
  cooldownMs?: number;
  /** Maximum number of accepted submissions inside `windowMs`. */
  maxRequests?: number;
  /** Length, in milliseconds, of the rolling window used for `maxRequests`. */
  windowMs?: number;
}

/**
 * Result of a guarded submission. A string discriminant is used instead of a
 * boolean flag because this project compiles with `strictNullChecks` disabled,
 * where TypeScript cannot narrow a union on a boolean literal.
 */
export type SubmitGuardOutcome<T> =
  | { status: "accepted"; result: T }
  | { status: "rejected"; reason: SubmitGuardRejectionReason; retryAfterMs: number };

/** One and a half seconds is long enough to swallow a double-click. */
const DEFAULT_COOLDOWN_MS = 1500;
/** Mirrors the per-minute budget enforced by the `symptom-analyzer` function. */
const DEFAULT_MAX_REQUESTS = 8;
const DEFAULT_WINDOW_MS = 60_000;

/**
 * Builds a guarded runner that keeps a user (or a script driving the UI) from
 * flooding the symptom analysis endpoints.
 *
 * It applies three checks before the task is allowed to run:
 * 1. **In-flight guard** — a `useRef` flag rejects a second submission while the
 *    first request is still awaiting a response. This closes the gap that a
 *    `useState` loading flag leaves open, because the ref updates synchronously
 *    while a state update only lands on the next render.
 * 2. **Cooldown** — a minimum delay between two accepted submissions.
 * 3. **Rolling quota** — at most `maxRequests` accepted submissions per window.
 *
 * The guard never throws for a rejection; callers inspect `status` and can
 * surface {@link getRejectionMessage} to the user. Errors raised by the task
 * itself still propagate, and the in-flight flag is always released.
 *
 * @param options Cooldown, quota, and window overrides.
 * @returns A runner that executes `task` only when the limits allow it.
 */
export function useSubmitGuard(options: SubmitGuardOptions = {}) {
  const {
    cooldownMs = DEFAULT_COOLDOWN_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW_MS,
  } = options;

  const isSubmittingRef = useRef(false);
  const lastAcceptedAtRef = useRef(0);
  const acceptedAtRef = useRef<number[]>([]);

  return useCallback(
    async <T>(task: () => Promise<T>): Promise<SubmitGuardOutcome<T>> => {
      if (isSubmittingRef.current) {
        return { status: "rejected", reason: "in-flight", retryAfterMs: 0 };
      }

      const now = Date.now();
      const sinceLastAccepted = now - lastAcceptedAtRef.current;

      if (lastAcceptedAtRef.current > 0 && sinceLastAccepted < cooldownMs) {
        return {
          status: "rejected",
          reason: "cooldown",
          retryAfterMs: cooldownMs - sinceLastAccepted,
        };
      }

      // Drop the timestamps that have aged out of the rolling window.
      const recentAccepted = acceptedAtRef.current.filter(
        (timestamp) => now - timestamp < windowMs
      );
      acceptedAtRef.current = recentAccepted;

      if (recentAccepted.length >= maxRequests) {
        return {
          status: "rejected",
          reason: "quota",
          retryAfterMs: windowMs - (now - recentAccepted[0]),
        };
      }

      isSubmittingRef.current = true;
      lastAcceptedAtRef.current = now;
      recentAccepted.push(now);

      try {
        return { status: "accepted", result: await task() };
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [cooldownMs, maxRequests, windowMs]
  );
}

/**
 * Turns a rejection into a message that can be dropped straight into a toast.
 *
 * @param reason Why the submission was rejected.
 * @param retryAfterMs How long the caller should wait before retrying.
 */
export function getRejectionMessage(
  reason: SubmitGuardRejectionReason,
  retryAfterMs: number
): string {
  if (reason === "in-flight") {
    return "Your previous request is still being analyzed. Please wait for it to finish.";
  }

  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

  return reason === "cooldown"
    ? `Please wait ${seconds}s before sending another request.`
    : `You have reached the request limit. Please try again in ${seconds}s.`;
}
