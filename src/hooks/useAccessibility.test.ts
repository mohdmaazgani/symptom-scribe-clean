import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAccessibility } from "./useAccessibility";

describe("useAccessibility", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    vi.restoreAllMocks();
  });

  it("loads default settings when localStorage is empty", () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings).toEqual({
      fontSize: "normal",
      highContrast: false,
      dyslexiaFont: false,
      reducedMotion: false,
      improvedSpacing: false,
    });
  });

  it("loads persisted settings from localStorage", () => {
    localStorage.setItem(
      "symptom-scribe-accessibility",
      JSON.stringify({
        fontSize: "large",
        highContrast: true,
      })
    );

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings.fontSize).toBe("large");
    expect(result.current.settings.highContrast).toBe(true);
    expect(result.current.settings.dyslexiaFont).toBe(false);
  });

  it("falls back to defaults when localStorage contains invalid JSON", () => {
    localStorage.setItem(
      "symptom-scribe-accessibility",
      "{invalid json"
    );

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings.fontSize).toBe("normal");
    expect(result.current.settings.highContrast).toBe(false);
  });

  it("updates an accessibility setting", () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updateSetting("highContrast", true);
    });

    expect(result.current.settings.highContrast).toBe(true);
  });

  it("persists updated settings to localStorage", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updateSetting("fontSize", "x-large");
    });

    expect(spy).toHaveBeenCalled();

    expect(localStorage.getItem("symptom-scribe-accessibility")).toContain(
      '"fontSize":"x-large"'
    );
  });

  it("applies accessibility classes to the document root", () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updateSetting("fontSize", "large");
      result.current.updateSetting("highContrast", true);
    });

    expect(document.documentElement.classList.contains("a11y-font-large")).toBe(true);
    expect(document.documentElement.classList.contains("a11y-high-contrast")).toBe(true);
  });

  it("removes obsolete classes when settings change", () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updateSetting("fontSize", "large");
    });

    expect(document.documentElement.classList.contains("a11y-font-large")).toBe(true);

    act(() => {
      result.current.updateSetting("fontSize", "x-large");
    });

    expect(document.documentElement.classList.contains("a11y-font-large")).toBe(false);
    expect(document.documentElement.classList.contains("a11y-font-x-large")).toBe(true);
  });

  it("resets all settings back to defaults", () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updateSetting("highContrast", true);
      result.current.updateSetting("fontSize", "x-large");
    });

    act(() => {
      result.current.resetSettings();
    });

    expect(result.current.settings).toEqual({
      fontSize: "normal",
      highContrast: false,
      dyslexiaFont: false,
      reducedMotion: false,
      improvedSpacing: false,
    });
  });

  it("falls back to the default font size for invalid persisted values", () => {
    localStorage.setItem(
      "symptom-scribe-accessibility",
      JSON.stringify({
        fontSize: "huge",
      })
    );

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings.fontSize).toBe("normal");
  });

  it("ignores non-boolean persisted accessibility settings", () => {
    localStorage.setItem(
      "symptom-scribe-accessibility",
      JSON.stringify({
        highContrast: "true",
        dyslexiaFont: 1,
        reducedMotion: {},
        improvedSpacing: null,
      })
    );

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings.highContrast).toBe(false);
    expect(result.current.settings.dyslexiaFont).toBe(false);
    expect(result.current.settings.reducedMotion).toBe(false);
    expect(result.current.settings.improvedSpacing).toBe(false);
  });

  it("ignores unknown persisted properties", () => {
    localStorage.setItem(
      "symptom-scribe-accessibility",
      JSON.stringify({
        unknownSetting: true,
      })
    );

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.settings).not.toHaveProperty("unknownSetting");
  });
});