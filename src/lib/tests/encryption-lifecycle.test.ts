import { describe, it, expect, beforeEach } from "vitest";
import { setKeys, getKey, getSearchKey, destroyKeys, whenKeysReady } from "../encryption";

describe("Encryption Lifecycle & Memory Cleanup", () => {
  beforeEach(() => {
    destroyKeys();
  });

  it("should securely clear active keys and reset state on destroyKeys", async () => {
    const key1 = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const searchKey1 = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256", length: 256 },
      true,
      ["sign", "verify"]
    );

    setKeys(key1, searchKey1);
    expect(getKey()).toBe(key1);
    expect(getSearchKey()).toBe(searchKey1);

    destroyKeys();

    expect(getKey()).toBeNull();
    expect(getSearchKey()).toBeNull();
  });

  it("should reset ready promises dynamically during re-authentication", async () => {
    destroyKeys();
    let isResolved = false;

    whenKeysReady().then(() => {
      isResolved = true;
    });

    expect(isResolved).toBe(false);

    const dummyKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const dummySearchKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256", length: 256 },
      true,
      ["sign", "verify"]
    );

    setKeys(dummyKey, dummySearchKey);
    const keys = await whenKeysReady();
    expect(keys.encryptionKey).toBe(dummyKey);
    expect(keys.searchKey).toBe(dummySearchKey);
  });
});
