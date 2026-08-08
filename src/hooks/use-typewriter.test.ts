import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTypewriter } from "./use-typewriter";

describe("useTypewriter hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the full text immediately if disabled", () => {
    const { result } = renderHook(() => useTypewriter("Hello world", 25, false));
    expect(result.current.displayedText).toBe("Hello world");
    expect(result.current.isFinished).toBe(true);
  });

  it("should progressively type out the text when enabled", () => {
    const { result } = renderHook(() => useTypewriter("Hello world", 25, true));
    
    // Initial state: starts empty
    expect(result.current.displayedText).toBe("");
    expect(result.current.isFinished).toBe(false);

    // Advance timer to trigger first token ("Hello")
    act(() => {
      vi.advanceTimersByTime(25);
    });
    expect(result.current.displayedText).toBe("Hello");
    expect(result.current.isFinished).toBe(false);

    // Advance timer to trigger next token (" ")
    act(() => {
      vi.advanceTimersByTime(25);
    });
    expect(result.current.displayedText).toBe("Hello ");

    // Advance timer to trigger last token ("world")
    act(() => {
      vi.advanceTimersByTime(25);
    });
    expect(result.current.displayedText).toBe("Hello world");
    expect(result.current.isFinished).toBe(true);
  });

  it("should skip animation and show full text when skip is called", () => {
    const { result } = renderHook(() => useTypewriter("Hello world", 25, true));
    
    expect(result.current.displayedText).toBe("");
    expect(result.current.isFinished).toBe(false);

    act(() => {
      result.current.skip();
    });

    expect(result.current.displayedText).toBe("Hello world");
    expect(result.current.isFinished).toBe(true);
  });

  it("should immediately update displayedText when text grows (active SSE streaming)", () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text, 25, true),
      { initialProps: { text: "Hello" } }
    );

    // Let first render run its effect to set base catch-up
    expect(result.current.displayedText).toBe("");
    
    // Advance timer to finish first word
    act(() => {
      vi.advanceTimersByTime(25);
    });
    expect(result.current.displayedText).toBe("Hello");

    // Rerender with extended text (simulating SSE append)
    rerender({ text: "Hello world" });
    
    // It should instantly catch up to "Hello world" without animation lag
    expect(result.current.displayedText).toBe("Hello world");
    expect(result.current.isFinished).toBe(true);
  });

  it("should strip READY_FOR_ANALYSIS tags from displayedText", () => {
    const textWithTag = `READY_FOR_ANALYSIS { "symptom": "headache" }\n\nBased on assessment:`;
    const { result } = renderHook(() => useTypewriter(textWithTag, 25, false));
    expect(result.current.displayedText).toBe("\n\nBased on assessment:");
    expect(result.current.isFinished).toBe(true);
  });

  it("should strip partial READY_FOR_ANALYSIS tags from displayedText during stream", () => {
    const partialText = `READY_FOR_ANALYSIS { "symptom": "head`;
    const { result } = renderHook(() => useTypewriter(partialText, 25, false));
    expect(result.current.displayedText).toBe("");
    expect(result.current.isFinished).toBe(true);
  });
});
