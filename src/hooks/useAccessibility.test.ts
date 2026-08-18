import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAccessibility } from "./useAccessibility";

const STORAGE_KEY = "symptom-scribe-accessibility";

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

describe("useAccessibility", () => {
  let mockLocalStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    mockLocalStorage = createLocalStorageMock();
    vi.stubGlobal("localStorage", mockLocalStorage);
    document.documentElement.className = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  const getAppliedClasses = (): DOMTokenList => {
    return document.documentElement.classList;
  };

  describe("initial load", () => {
    it("loads default settings when nothing is stored", () => {
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
      mockLocalStorage.getItem.mockReturnValueOnce(
        JSON.stringify({ fontSize: "large", highContrast: true, dyslexiaFont: false, reducedMotion: true, improvedSpacing: false })
      );

      const { result } = renderHook(() => useAccessibility());
      expect(result.current.settings.fontSize).toBe("large");
      expect(result.current.settings.highContrast).toBe(true);
      expect(result.current.settings.reducedMotion).toBe(true);
    });

    it("gracefully handles malformed localStorage data", () => {
      mockLocalStorage.getItem.mockReturnValueOnce("not valid json");

      const { result } = renderHook(() => useAccessibility());
      expect(result.current.settings).toEqual({
        fontSize: "normal",
        highContrast: false,
        dyslexiaFont: false,
        reducedMotion: false,
        improvedSpacing: false,
      });
    });

    it("partial localStorage data fills missing keys with defaults", () => {
      mockLocalStorage.getItem.mockReturnValueOnce(
        JSON.stringify({ fontSize: "x-large" })
      );

      const { result } = renderHook(() => useAccessibility());
      expect(result.current.settings.fontSize).toBe("x-large");
      expect(result.current.settings.highContrast).toBe(false);
    });
  });

  describe("applying CSS classes", () => {
    it("applies a11y-high-contrast class when highContrast is true", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("highContrast", true);
      });
      expect(getAppliedClasses().contains("a11y-high-contrast")).toBe(true);
    });

    it("removes a11y-high-contrast class when highContrast is set to false", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("highContrast", true);
      });
      act(() => {
        result.current.updateSetting("highContrast", false);
      });
      expect(getAppliedClasses().contains("a11y-high-contrast")).toBe(false);
    });

    it("applies a11y-reduced-motion class when reducedMotion is true", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("reducedMotion", true);
      });
      expect(getAppliedClasses().contains("a11y-reduced-motion")).toBe(true);
    });

    it("removes a11y-reduced-motion class when reducedMotion is set to false", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("reducedMotion", true);
      });
      act(() => {
        result.current.updateSetting("reducedMotion", false);
      });
      expect(getAppliedClasses().contains("a11y-reduced-motion")).toBe(false);
    });

    it("applies a11y-dyslexia-font class when dyslexiaFont is true", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("dyslexiaFont", true);
      });
      expect(getAppliedClasses().contains("a11y-dyslexia-font")).toBe(true);
    });

    it("removes a11y-dyslexia-font class when dyslexiaFont is set to false", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("dyslexiaFont", true);
      });
      act(() => {
        result.current.updateSetting("dyslexiaFont", false);
      });
      expect(getAppliedClasses().contains("a11y-dyslexia-font")).toBe(false);
    });

    it("applies a11y-improved-spacing class when improvedSpacing is true", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("improvedSpacing", true);
      });
      expect(getAppliedClasses().contains("a11y-improved-spacing")).toBe(true);
    });

    it("removes a11y-improved-spacing class when improvedSpacing is set to false", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("improvedSpacing", true);
      });
      act(() => {
        result.current.updateSetting("improvedSpacing", false);
      });
      expect(getAppliedClasses().contains("a11y-improved-spacing")).toBe(false);
    });

    it("applies a11y-font-large class when fontSize is 'large'", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("fontSize", "large");
      });
      expect(getAppliedClasses().contains("a11y-font-large")).toBe(true);
      expect(getAppliedClasses().contains("a11y-font-x-large")).toBe(false);
    });

    it("applies a11y-font-x-large class when fontSize is 'x-large'", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("fontSize", "x-large");
      });
      expect(getAppliedClasses().contains("a11y-font-x-large")).toBe(true);
      expect(getAppliedClasses().contains("a11y-font-large")).toBe(false);
    });

    it("removes font size classes when fontSize is 'normal'", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("fontSize", "large");
      });
      expect(getAppliedClasses().contains("a11y-font-large")).toBe(true);

      act(() => {
        result.current.updateSetting("fontSize", "normal");
      });
      expect(getAppliedClasses().contains("a11y-font-large")).toBe(false);
      expect(getAppliedClasses().contains("a11y-font-x-large")).toBe(false);
    });

    it("does not apply any font size class when fontSize is 'normal'", () => {
      const { result } = renderHook(() => useAccessibility());
      expect(getAppliedClasses().contains("a11y-font-large")).toBe(false);
      expect(getAppliedClasses().contains("a11y-font-x-large")).toBe(false);
    });
  });

  describe("persisting settings", () => {
    it("persists updated settings back to localStorage", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("highContrast", true);
      });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({
          fontSize: "normal",
          highContrast: true,
          dyslexiaFont: false,
          reducedMotion: false,
          improvedSpacing: false,
        })
      );
    });

    it("persists fontSize change to localStorage", () => {
      const { result } = renderHook(() => useAccessibility());
      act(() => {
        result.current.updateSetting("fontSize", "x-large");
      });
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        STORAGE_KEY,
        expect.stringContaining('"fontSize":"x-large"')
      );
    });
  });

  describe("resetSettings", () => {
    it("resets all settings to their defaults", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.updateSetting("highContrast", true);
        result.current.updateSetting("reducedMotion", true);
        result.current.updateSetting("fontSize", "x-large");
        result.current.updateSetting("dyslexiaFont", true);
        result.current.updateSetting("improvedSpacing", true);
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

    it("removes CSS classes after reset", () => {
      const { result } = renderHook(() => useAccessibility());

      act(() => {
        result.current.updateSetting("highContrast", true);
        result.current.updateSetting("fontSize", "large");
        result.current.updateSetting("dyslexiaFont", true);
        result.current.updateSetting("reducedMotion", true);
        result.current.updateSetting("improvedSpacing", true);
      });

      act(() => {
        result.current.resetSettings();
      });

      expect(getAppliedClasses().contains("a11y-high-contrast")).toBe(false);
      expect(getAppliedClasses().contains("a11y-font-large")).toBe(false);
      expect(getAppliedClasses().contains("a11y-dyslexia-font")).toBe(false);
      expect(getAppliedClasses().contains("a11y-reduced-motion")).toBe(false);
      expect(getAppliedClasses().contains("a11y-improved-spacing")).toBe(false);
    });
  });
});
