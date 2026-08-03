import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { getRejectionMessage, useSubmitGuard } from "./useSubmitGuard";

describe("useSubmitGuard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("runs the task and hands back its result", async () => {
    const { result } = renderHook(() => useSubmitGuard());
    const task = vi.fn().mockResolvedValue("analysis");

    await expect(result.current(task)).resolves.toEqual({
      status: "accepted",
      result: "analysis",
    });
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("rejects a second submission while the first is still in flight", async () => {
    const { result } = renderHook(() => useSubmitGuard({ cooldownMs: 0 }));

    let releaseFirst: (() => void) | undefined;
    const firstTask = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          releaseFirst = () => resolve("first");
        })
    );
    const secondTask = vi.fn().mockResolvedValue("second");

    const firstOutcome = result.current(firstTask);

    // The ref flips synchronously, so the double-click is turned away before
    // the loading state has had a chance to re-render the button.
    await expect(result.current(secondTask)).resolves.toEqual({
      status: "rejected",
      reason: "in-flight",
      retryAfterMs: 0,
    });
    expect(secondTask).not.toHaveBeenCalled();

    releaseFirst?.();
    await expect(firstOutcome).resolves.toEqual({ status: "accepted", result: "first" });
  });

  it("enforces the cooldown between two accepted submissions", async () => {
    const { result } = renderHook(() =>
      useSubmitGuard({ cooldownMs: 1500, maxRequests: 10, windowMs: 60_000 })
    );

    await result.current(async () => "first");

    await expect(result.current(async () => "second")).resolves.toEqual({
      status: "rejected",
      reason: "cooldown",
      retryAfterMs: 1500,
    });

    vi.advanceTimersByTime(1500);

    await expect(result.current(async () => "third")).resolves.toEqual({
      status: "accepted",
      result: "third",
    });
  });

  it("enforces the rolling request quota and recovers once the window rolls over", async () => {
    const { result } = renderHook(() =>
      useSubmitGuard({ cooldownMs: 0, maxRequests: 2, windowMs: 1000 })
    );

    await result.current(async () => 1);
    await result.current(async () => 2);

    const blocked = await result.current(async () => 3);
    expect(blocked).toEqual({ status: "rejected", reason: "quota", retryAfterMs: 1000 });

    vi.advanceTimersByTime(1000);

    await expect(result.current(async () => 4)).resolves.toEqual({ status: "accepted", result: 4 });
  });

  it("releases the in-flight flag when the task throws", async () => {
    const { result } = renderHook(() => useSubmitGuard({ cooldownMs: 0 }));

    await expect(
      result.current(async () => {
        throw new Error("network down");
      })
    ).rejects.toThrow("network down");

    await expect(result.current(async () => "recovered")).resolves.toEqual({
      status: "accepted",
      result: "recovered",
    });
  });
});

describe("getRejectionMessage", () => {
  it("explains an overlapping request", () => {
    expect(getRejectionMessage("in-flight", 0)).toContain("still being analyzed");
  });

  it("rounds the cooldown wait up to whole seconds", () => {
    expect(getRejectionMessage("cooldown", 1200)).toBe(
      "Please wait 2s before sending another request."
    );
  });

  it("reports the wait once the quota is exhausted", () => {
    expect(getRejectionMessage("quota", 30_000)).toBe(
      "You have reached the request limit. Please try again in 30s."
    );
  });
});
