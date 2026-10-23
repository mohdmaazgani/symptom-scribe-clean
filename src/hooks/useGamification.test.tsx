import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMoodLogs, useLogMood, getMoodStorageKey } from "./useGamification";
import { getTypedStorage, setTypedStorage } from "@/lib/storage";

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Mood Persistence in useGamification", () => {
  const mockLocalStorage = createStorageMock();

  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
        configurable: true,
      });
    }
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe("getMoodStorageKey", () => {
    it("returns user-specific storage key when userId is present", () => {
      expect(getMoodStorageKey("user-123")).toBe("symptom_scribe_mood_logs_user-123");
    });

    it("returns local fallback storage key when userId is absent or null", () => {
      expect(getMoodStorageKey(null)).toBe("symptom_scribe_mood_logs_local");
      expect(getMoodStorageKey(undefined)).toBe("symptom_scribe_mood_logs_local");
    });
  });

  describe("useLogMood and useMoodLogs local fallback", () => {
    it("persists mood entry to localStorage even when offline or unauthenticated", async () => {
      const wrapper = createWrapper();
      const { result: logMoodResult } = renderHook(() => useLogMood(), { wrapper });

      await act(async () => {
        await logMoodResult.current.mutateAsync({ mood: "great", note: "Feeling awesome" });
      });

      const today = new Date().toISOString().split("T")[0];
      const stored = getTypedStorage<Array<{ mood: string; note: string | null; logged_at: string }>>(
        getMoodStorageKey(null),
        []
      );

      expect(stored).toHaveLength(1);
      expect(stored[0].mood).toBe("great");
      expect(stored[0].note).toBe("Feeling awesome");
      expect(stored[0].logged_at).toBe(today);
    });

    it("updates existing mood entry for the same day without duplicating entries", async () => {
      const wrapper = createWrapper();
      const { result: logMoodResult } = renderHook(() => useLogMood(), { wrapper });

      await act(async () => {
        await logMoodResult.current.mutateAsync({ mood: "neutral" });
      });

      await act(async () => {
        await logMoodResult.current.mutateAsync({ mood: "good", note: "Improved after a walk" });
      });

      const stored = getTypedStorage<Array<{ mood: string; note: string | null }>>(
        getMoodStorageKey(null),
        []
      );

      expect(stored).toHaveLength(1);
      expect(stored[0].mood).toBe("good");
      expect(stored[0].note).toBe("Improved after a walk");
    });

    it("initializes useMoodLogs with cached entries from localStorage", async () => {
      const today = new Date().toISOString().split("T")[0];
      const initialLogs = [{ id: "test-1", mood: "good", note: null, logged_at: today }];
      setTypedStorage(getMoodStorageKey(null), initialLogs);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useMoodLogs(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ mood: "good", logged_at: today }),
          ])
        );
      });
    });
  });
});
