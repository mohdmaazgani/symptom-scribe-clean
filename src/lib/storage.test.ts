import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getSafeLocalStorage,
  setSafeLocalStorage,
  getTypedStorage,
  setTypedStorage,
  removeSafeStorage,
  clearSafeStorage,
  setValidatedStorage,
} from "./storage";

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

describe("Storage Utilities", () => {
  const mockLocalStorage = createStorageMock();
  const mockSessionStorage = createStorageMock();

  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.stubGlobal("sessionStorage", mockSessionStorage);
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  describe("getSafeLocalStorage / setSafeLocalStorage", () => {
    it("should write and read from local storage", () => {
      setSafeLocalStorage("test_key", "hello");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test_key", "hello");

      const val = getSafeLocalStorage("test_key", "fallback");
      expect(val).toBe("hello");
    });

    it("should return fallback when key does not exist", () => {
      const val = getSafeLocalStorage("non_existent", "fallback");
      expect(val).toBe("fallback");
    });
  });

  describe("getTypedStorage / setTypedStorage", () => {
    it("should handle objects with optional TTL", () => {
      const data = { theme: "dark", size: 12 };
      setTypedStorage("config", data);
      
      const loaded = getTypedStorage("config", { theme: "light", size: 10 });
      expect(loaded).toEqual(data);
    });

    it("should respect TTL expiration", () => {
      const data = { token: "123" };
      setTypedStorage("temp_token", data, -1000); // Expired 1 second ago

      const loaded = getTypedStorage("temp_token", null);
      expect(loaded).toBeNull();
    });
  });

  describe("setValidatedStorage", () => {
    it("should reject invalid keys", () => {
      const emptyResult = setValidatedStorage("", "value");
      expect(emptyResult).toBe(false);

      const longKey = "a".repeat(101);
      const longResult = setValidatedStorage(longKey, "value");
      expect(longResult).toBe(false);
    });

    it("should accept valid keys", () => {
      const result = setValidatedStorage("valid_key", "value");
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("valid_key", "value");
    });
  });
});
