import { describe, it, expect } from "vitest";
import { calculateNextRetryDelayMs, MAX_RETRY_ATTEMPTS, isRetryableError } from "./sync-retry";

describe("sync-retry policy", () => {
  it("calculates exponential backoff and caps at 30s", () => {
    expect(calculateNextRetryDelayMs(1)).toBe(1000);
    expect(calculateNextRetryDelayMs(2)).toBe(2000);
    expect(calculateNextRetryDelayMs(3)).toBe(4000);
    expect(calculateNextRetryDelayMs(4)).toBe(8000);
    expect(calculateNextRetryDelayMs(5)).toBe(16000);
    expect(calculateNextRetryDelayMs(6)).toBe(30000);
    expect(calculateNextRetryDelayMs(10)).toBe(30000);
  });

  it("classifies typical errors as retryable or not", () => {
    const err5xx = { status: 502, message: "Bad gateway" };
    const err4xx = { status: 400, message: "Bad request" };
    const netErr = new TypeError("Failed to fetch");

    expect(isRetryableError(err5xx)).toBe(true);
    expect(isRetryableError(err4xx)).toBe(false);
    expect(isRetryableError(netErr)).toBe(true);
    expect(isRetryableError(null)).toBe(false);
  });
});
