import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setKeys,
  getKey,
  getSearchKey,
  whenKeysReady,
  encryptText,
  decryptText,
  deriveKeyFromToken,
} from "./encryption";

describe("Encryption Key Persistence", () => {
  const USER_ID = "user-123";
  const MASTER_SEED = "stable-master-seed";

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("successfully encrypts and decrypts text using derived keys", async () => {
    const key = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    const plaintext = "Sensitive health note";

    const ciphertext = await encryptText(plaintext, key);

    expect(ciphertext).toBeDefined();
    expect(ciphertext).toContain(":");

    const decrypted = await decryptText(ciphertext, key);

    expect(decrypted).toBe(plaintext);
  });

  it("resolves whenKeysReady when active keys are set", async () => {
    const key = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    setKeys(key, key);

    const keys = await whenKeysReady();

    expect(keys.encryptionKey).toBe(key);
    expect(keys.searchKey).toBe(key);

    expect(getKey()).toBe(key);
    expect(getSearchKey()).toBe(key);
  });
});

describe("Regression Tests - Persisted Encryption State", () => {
  const USER_ID = "user-123";
  const MASTER_SEED = "stable-master-seed";

  const SEED_KEY = `symptom_scribe_master_seed_${USER_ID}`;
  const SALT_KEY = `symptom_scribe_pbkdf2_salt_${USER_ID}`;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("handles missing persisted seed gracefully", async () => {
    localStorage.removeItem(SEED_KEY);

    const key = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    expect(key).toBeDefined();
  });

  it("handles corrupted persisted seed without unexpected exceptions", async () => {
    const originalKey = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    const plaintext = "Sensitive health note";

    const ciphertext = await encryptText(plaintext, originalKey);

    localStorage.setItem(SEED_KEY, "%%%%%%INVALID-SEED%%%%%%");

    const corruptedKey = await deriveKeyFromToken(
      "%%%%%%INVALID-SEED%%%%%%",
      USER_ID
    );

    await expect(
      decryptText(ciphertext, corruptedKey)
    ).rejects.toThrow();
  });

  it("handles missing persisted salt gracefully", async () => {
    localStorage.removeItem(SALT_KEY);

    const key = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    expect(key).toBeDefined();

    expect(localStorage.getItem(SALT_KEY)).not.toBeNull();
  });

  it("handles corrupted persisted salt without crashing", async () => {
    const originalKey = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    const plaintext = "Sensitive health note";

    const ciphertext = await encryptText(plaintext, originalKey);

    localStorage.setItem(SALT_KEY, "ZZZZZZZZZZ");

    const corruptedKey = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    await expect(
      decryptText(ciphertext, corruptedKey)
    ).rejects.toThrow();
  });

  it("gracefully rejects malformed encrypted text", async () => {
    const key = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    await expect(
      decryptText("this-is-not-valid", key)
    ).rejects.toThrow();
  });

  it("gracefully rejects truncated ciphertext", async () => {
    const key = await deriveKeyFromToken(MASTER_SEED, USER_ID);

    await expect(
      decryptText("1234567890abcdef:", key)
    ).rejects.toThrow();
  });

  it("fails gracefully when decrypting with a different key", async () => {
    const key1 = await deriveKeyFromToken("seed-one", USER_ID);

    const key2 = await deriveKeyFromToken("seed-two", USER_ID);

    const encrypted = await encryptText("Top Secret", key1);

    await expect(
      decryptText(encrypted, key2)
    ).rejects.toThrow();
  });

  it("does not throw unexpected exceptions for malformed persisted state", async () => {
    localStorage.setItem(SEED_KEY, "@@@@@@@");
    localStorage.setItem(SALT_KEY, "######");

    await expect(
      deriveKeyFromToken("@@@@@@@", USER_ID)
    ).resolves.toBeDefined();
  });
});
