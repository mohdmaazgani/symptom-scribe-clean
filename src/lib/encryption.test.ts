import { describe, it, expect, vi, beforeEach } from "vitest";
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
} from "./encryption";

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
