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
});
