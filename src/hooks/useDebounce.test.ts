import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value straight away", () => {
    const { result } = renderHook(() => useDebounce("fever", 300));

    expect(result.current).toBe("fever");
  });

  it("keeps the previous value until the delay has fully elapsed", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "fever" },
    });

    rerender({ value: "fever and cough" });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("fever");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("fever and cough");
  });

  it("publishes only the last value of a rapid burst", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "abc" });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // The timer restarted on every change, so nothing has been published yet.
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("abc");
  });

  it("cancels a pending update when the component unmounts", () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const { unmount, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    });

    rerender({ value: "b" });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
