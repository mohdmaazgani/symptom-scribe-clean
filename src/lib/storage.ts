// storage.ts

// ─── 1. STORAGE KEY REGISTRY ──────────────────────────────────────────────────
export const STORAGE_KEYS = {
  USER_THEME: "user_theme",
  AUTH_TOKEN: "auth_token",
  LANG: "lang",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ─── 2. AVAILABILITY CHECK ────────────────────────────────────────────────────
export const isStorageAvailable = (type: "localStorage" | "sessionStorage"): boolean => {
  try {
    const storage = window[type];
    const testKey = "__storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

// ─── 3. TTL WRAPPER TYPE ──────────────────────────────────────────────────────
interface StorageEntry<T> {
  value: T;
  expiresAt: number | null;
}

// ─── 4. LOCAL STORAGE ─────────────────────────────────────────────────────────
export const getSafeLocalStorage = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn("Storage access denied:", error);
    return fallback;
  }
};

export const setSafeLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn("Storage write denied:", error);
  }
};

// ─── 5. TYPED GET/SET WITH TTL ────────────────────────────────────────────────
export const setTypedStorage = <T>(key: string, value: T, ttlMs?: number): void => {
  try {
    const entry: StorageEntry<T> = {
      value,
      expiresAt: ttlMs != null ? Date.now() + ttlMs : null,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.warn("Storage write denied:", error);
  }
};

export const getTypedStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const entry: StorageEntry<T> = JSON.parse(raw);

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return fallback;
    }

    return entry.value;
  } catch (error) {
    console.warn("Storage read error:", error);
    return fallback;
  }
};

// ─── 6. SESSION STORAGE ───────────────────────────────────────────────────────
export const getSafeSessionStorage = (key: string, fallback: string): string => {
  try {
    return sessionStorage.getItem(key) || fallback;
  } catch (error) {
    console.warn("SessionStorage access denied:", error);
    return fallback;
  }
};

export const setSafeSessionStorage = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.warn("SessionStorage write denied:", error);
  }
};

// ─── 7. SINGLE KEY REMOVAL ────────────────────────────────────────────────────
export const removeSafeStorage = (key: string, storage: "local" | "session" = "local"): void => {
  try {
    (storage === "local" ? localStorage : sessionStorage).removeItem(key);
  } catch (error) {
    console.warn(`Storage remove denied [${storage}]:`, error);
  }
};

// ─── 8. CLEAR BOTH STORAGES ───────────────────────────────────────────────────
export const clearSafeStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.warn("localStorage clear denied:", error);
  }
  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn("sessionStorage clear denied:", error);
  }
};

// ─── 9. CONSTANTS ─────────────────────────────────────────────────────────────
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_LENGTH = 5 * 1024 * 1024; // 5MB

// ─── 10. VALIDATE KEY ─────────────────────────────────────────────────────────
const isValidKey = (key: string): boolean => {
  if (!key || typeof key !== "string") return false;
  if (key.trim().length === 0) return false;
  if (key.length > MAX_KEY_LENGTH) return false;
  return true;
};

// ─── 11. STORAGE SIZE CHECKER ─────────────────────────────────────────────────
export const getStorageSize = (type: "localStorage" | "sessionStorage"): number => {
  try {
    const storage = window[type];
    let total = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i) || "";
      const value = storage.getItem(key) || "";
      total += key.length + value.length;
    }
    return total; // in bytes
  } catch (error) {
    console.warn("Could not calculate storage size:", error);
    return 0;
  }
};

// ─── 12. STORAGE SIZE IN KB/MB ────────────────────────────────────────────────
export const getStorageSizeFormatted = (type: "localStorage" | "sessionStorage"): string => {
  const bytes = getStorageSize(type);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// ─── 13. VALIDATED SET ────────────────────────────────────────────────────────
export const setValidatedStorage = (key: string, value: string): boolean => {
  if (!isValidKey(key)) {
    console.warn(`Invalid storage key: "${key}"`);
    return false;
  }
  if (value.length > MAX_VALUE_LENGTH) {
    console.warn(`Value too large for key: "${key}"`);
    return false;
  }
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn("Storage write denied:", error);
    return false;
  }
};

// ─── 14. GET ALL KEYS ─────────────────────────────────────────────────────────
export const getAllStorageKeys = (type: "localStorage" | "sessionStorage"): string[] => {
  try {
    const storage = window[type];
    return Array.from({ length: storage.length }, (_, i) => storage.key(i) || "").filter(Boolean);
  } catch (error) {
    console.warn("Could not retrieve storage keys:", error);
    return [];
  }
};