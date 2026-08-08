import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSafeLocalStorage,
  setSafeLocalStorage,
  getSafeSessionStorage,
  setSafeSessionStorage,
  getTypedStorage,
  setTypedStorage,
  removeSafeStorage,
  clearSafeStorage,
  setValidatedStorage,
  isStorageAvailable,
  getStorageSize,
  getStorageSizeFormatted,
  getAllStorageKeys,
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

  describe("getSafeSessionStorage / setSafeSessionStorage", () => {
    it("should write and read from session storage", () => {
      setSafeSessionStorage("session_key", "hello");
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith("session_key", "hello");

      const val = getSafeSessionStorage("session_key", "fallback");
      expect(val).toBe("hello");
    });

    it("should return fallback when key does not exist", () => {
      const val = getSafeSessionStorage("non_existent", "fallback");
      expect(val).toBe("fallback");
    });

    it("should return fallback when the stored value is empty", () => {
      setSafeSessionStorage("empty_key", "");

      expect(getSafeSessionStorage("empty_key", "fallback")).toBe("fallback");
    });

    it("should keep session and local storage separate", () => {
      setSafeSessionStorage("shared_key", "session_value");

      expect(getSafeLocalStorage("shared_key", "fallback")).toBe("fallback");
    });
  });
});

/**
 * Safari in private browsing mode — and any browser with site data blocked —
 * throws on storage access instead of returning null. Every helper in this
 * module is expected to degrade gracefully: warn, and hand back the fallback
 * rather than letting the exception escape and take a render down with it.
 */
describe("Storage Utilities — restricted storage environments", () => {
  const accessDenied = new DOMException("The operation is insecure.", "QuotaExceededError");

  const createThrowingStorageMock = () => ({
    getItem: vi.fn(() => {
      throw accessDenied;
    }),
    setItem: vi.fn(() => {
      throw accessDenied;
    }),
    removeItem: vi.fn(() => {
      throw accessDenied;
    }),
    clear: vi.fn(() => {
      throw accessDenied;
    }),
    get length(): number {
      throw accessDenied;
    },
    key: vi.fn(() => {
      throw accessDenied;
    }),
  });

  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal("localStorage", createThrowingStorageMock());
    vi.stubGlobal("sessionStorage", createThrowingStorageMock());
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  describe("session storage", () => {
    it("returns the fallback when sessionStorage.getItem throws", () => {
      expect(() => getSafeSessionStorage("theme", "light")).not.toThrow();
      expect(getSafeSessionStorage("theme", "light")).toBe("light");
      expect(warnSpy).toHaveBeenCalled();
    });

    it("swallows the error when sessionStorage.setItem throws", () => {
      expect(() => setSafeSessionStorage("theme", "dark")).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
    });

    it("swallows the error when removing a session key", () => {
      expect(() => removeSafeStorage("theme", "session")).not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("local storage", () => {
    it("returns the fallback when localStorage.getItem throws", () => {
      expect(getSafeLocalStorage("theme", "light")).toBe("light");
      expect(warnSpy).toHaveBeenCalled();
    });

    it("swallows the error when localStorage.setItem throws", () => {
      expect(() => setSafeLocalStorage("theme", "dark")).not.toThrow();
    });

    it("swallows the error when removing a local key", () => {
      expect(() => removeSafeStorage("theme")).not.toThrow();
    });
  });

  describe("typed storage", () => {
    it("returns the fallback when the underlying read throws", () => {
      const fallback = { theme: "light" };

      expect(getTypedStorage("config", fallback)).toBe(fallback);
    });

    it("swallows the error when the underlying write throws", () => {
      expect(() => setTypedStorage("config", { theme: "dark" }, 1000)).not.toThrow();
    });
  });

  describe("validated and bulk helpers", () => {
    it("reports failure instead of throwing on a validated write", () => {
      expect(setValidatedStorage("valid_key", "value")).toBe(false);
    });

    it("clears both storages without propagating either failure", () => {
      expect(() => clearSafeStorage()).not.toThrow();
      // One warning per storage — neither failure short-circuits the other.
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("reports storage as unavailable", () => {
      expect(isStorageAvailable("localStorage")).toBe(false);
      expect(isStorageAvailable("sessionStorage")).toBe(false);
    });

    it("reports a zero size rather than throwing", () => {
      expect(getStorageSize("sessionStorage")).toBe(0);
      expect(getStorageSizeFormatted("sessionStorage")).toBe("0 B");
    });

    it("returns no keys rather than throwing", () => {
      expect(getAllStorageKeys("sessionStorage")).toEqual([]);
    });
  });
});
