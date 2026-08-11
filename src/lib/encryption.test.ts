import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setKeys,
  getKey,
  getSearchKey,
  whenKeysReady,
  encryptText,
  decryptText,
  deriveKeyFromToken,
  deriveSearchKeyFromToken,
  rotateKeysToNewPassword,
  initializeEncryption,
  subscribeEncryptionLock,
  unlockEncryptionWithPassword,
  registerLegacyKeyProbe,
} from "./encryption";

// Mock the Supabase client used by the session/unlock flows (issue #1056).
const mockSupabase = vi.hoisted(() => {
  const chain = (finalValue?: unknown) => {
    const obj = {
      select: () => obj,
      eq: () => obj,
      or: () => obj,
      order: () => obj,
      limit: () => obj,
      maybeSingle: async () => finalValue,
      single: async () => finalValue,
      upsert: async () => ({ error: null }),
    };
    return obj;
  };
  return {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      updateUser: vi.fn(),
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => chain({ data: null, error: null })),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mockSupabase,
}));

describe("Encryption Key Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully encrypts and decrypts text using derived keys", async () => {
    const key = await deriveKeyFromToken("stable-master-seed", "user-123");
    const plaintext = "Sensitive health note";

    const ciphertext = await encryptText(plaintext, key);
    expect(ciphertext).toBeDefined();
    expect(ciphertext).toContain(":");

    const decrypted = await decryptText(ciphertext, key);
    expect(decrypted).toBe(plaintext);
  });

  it("resolves whenKeysReady when active keys are set", async () => {
    const key = await deriveKeyFromToken("stable-master-seed", "user-123");
    setKeys(key, key);

    const keys = await whenKeysReady();
    expect(keys.encryptionKey).toBe(key);
    expect(keys.searchKey).toBe(key);
    expect(getKey()).toBe(key);
    expect(getSearchKey()).toBe(key);
  });

  it("re-derives keys from a new password and reports a successful rotation", async () => {
    const oldKey = await deriveKeyFromToken("old-seed", "user-123");
    const oldSearchKey = await deriveSearchKeyFromToken("old-seed", "user-123");
    setKeys(oldKey, oldSearchKey);

    const rotated = await rotateKeysToNewPassword("new-password", "user@example.com", "user-123");

    expect(rotated).toBe(true);
    expect(getKey()).not.toBe(oldKey);
    expect(getKey()).not.toBeNull();
    expect(getSearchKey()).not.toBe(oldSearchKey);
    // The new seed must be persisted so keys can be re-derived after a reload.
    expect(localStorage.getItem("symptom_scribe_master_seed_user-123")).toBeTruthy();
  });

  it("activates new keys but reports no rotation when no old key was active", async () => {
    setKeys(null, null);

    const rotated = await rotateKeysToNewPassword("new-password", "user@example.com", "user-123");

    expect(rotated).toBe(false);
    // The new seed/keys are still set up so the session can encrypt new data.
    expect(getKey()).not.toBeNull();
    expect(getSearchKey()).not.toBeNull();
    expect(localStorage.getItem("symptom_scribe_master_seed_user-123")).toBeTruthy();
  });
});

describe("Encryption lock & unlock (issue #1056)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setKeys(null, null);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });
  });

  afterEach(() => {
    // Remove any probe registered by a test so it cannot leak into others.
    registerLegacyKeyProbe(() => Promise.resolve(false));
  });

  it("locks the keys (no userId-derived fallback) when a session has no persisted seed", async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-123", email: "user@example.com" },
          access_token: "token-abc",
        },
      },
      error: null,
    });

    const states: boolean[] = [];
    const unsubscribe = subscribeEncryptionLock((locked) => states.push(locked));

    initializeEncryption();

    await vi.waitFor(() => {
      expect(states[states.length - 1]).toBe(true);
    });
    // No key may be derived from public material alone.
    expect(getKey()).toBeNull();
    expect(getSearchKey()).toBeNull();

    unsubscribe();
  });

  it("unlocks with a correct password and persists the seed", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-123" }, session: {} },
      error: null,
    });

    const result = await unlockEncryptionWithPassword("correct-password");

    expect(result.ok).toBe(true);
    expect(result.migratedLegacy).toBe(false);
    expect(getKey()).not.toBeNull();
    expect(getSearchKey()).not.toBeNull();
    expect(localStorage.getItem("symptom_scribe_master_seed_user-123")).toBeTruthy();
  });

  it("rejects an incorrect password without deriving or persisting keys", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await unlockEncryptionWithPassword("wrong-password");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid login credentials");
    expect(getKey()).toBeNull();
    expect(getSearchKey()).toBeNull();
    expect(localStorage.getItem("symptom_scribe_master_seed_user-123")).toBeNull();
  });

  it("migrates legacy pre-seed records onto the new key when detected", async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-123" }, session: {} },
      error: null,
    });
    registerLegacyKeyProbe(() => Promise.resolve(true));

    const result = await unlockEncryptionWithPassword("correct-password");

    expect(result.ok).toBe(true);
    expect(result.migratedLegacy).toBe(true);
    expect(localStorage.getItem("symptom_scribe_master_seed_user-123")).toBeTruthy();
  });

  it("returns an error when no session user is available", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await unlockEncryptionWithPassword("any-password");

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
    expect(getKey()).toBeNull();
  });
});
