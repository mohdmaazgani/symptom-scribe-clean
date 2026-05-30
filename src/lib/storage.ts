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