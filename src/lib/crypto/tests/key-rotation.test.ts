import { describe, it, expect, beforeEach } from "vitest";
import { rotateUserEncryptionKeys } from "../key-rotation";

describe("Key Rotation Engine", () => {
  let oldKey: CryptoKey;
  let newKey: CryptoKey;

  beforeEach(async () => {
    oldKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    newKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  });

  it("should initialize key rotation parameters without throwing", async () => {
    const result = await rotateUserEncryptionKeys({
      oldKey,
      newKey,
    });
    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });
});
