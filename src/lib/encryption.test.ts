import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setKeys,
  getKey,
  getSearchKey,
  whenKeysReady,
  encryptText,
  decryptText,
  deriveKeyFromToken,
  getP2PSigningKeys,
  signPayload,
  verifyPayload,
} from "./encryption";

describe("Encryption Key Persistence & Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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

  it("generates a P2P signing keypair when no key material exists", async () => {
    const p2pKeys = await getP2PSigningKeys();

    expect(p2pKeys.privateKey).toBeDefined();
    expect(p2pKeys.publicKey).toBeDefined();

    const publicJwk = await crypto.subtle.exportKey("jwk", p2pKeys.publicKey);

    await expect(crypto.subtle.exportKey("jwk", p2pKeys.privateKey)).rejects.toThrow();
    expect(publicJwk.kty).toBe("EC");
  });

  it("shares a single in-flight P2P key generation across concurrent callers", async () => {
    const [firstKeys, secondKeys] = await Promise.all([getP2PSigningKeys(), getP2PSigningKeys()]);

    expect(firstKeys.privateKey).toBe(secondKeys.privateKey);
    expect(firstKeys.publicKey).toBe(secondKeys.publicKey);
  });

  it("cleans up legacy P2P key entries and returns usable keys", async () => {
    localStorage.setItem("symptom_scribe_p2p_private_key", "fake-unencrypted-private-key");
    localStorage.setItem("symptom_scribe_p2p_enc_private_key", "fake-encrypted-private-key");
    localStorage.setItem("symptom_scribe_p2p_public_key", "fake-public-key");

    const p2pKeys = await getP2PSigningKeys();
    expect(p2pKeys.privateKey).toBeDefined();
    expect(p2pKeys.publicKey).toBeDefined();

    expect(localStorage.getItem("symptom_scribe_p2p_private_key")).toBeNull();
    expect(localStorage.getItem("symptom_scribe_p2p_enc_private_key")).toBeNull();
    expect(localStorage.getItem("symptom_scribe_p2p_public_key")).toBeNull();
  });

  it("reuses cached P2P signing keys on repeated calls", async () => {
    const firstKeys = await getP2PSigningKeys();
    const secondKeys = await getP2PSigningKeys();

    expect(secondKeys.privateKey).toBe(firstKeys.privateKey);
    expect(secondKeys.publicKey).toBe(firstKeys.publicKey);
  });

  it("signs and verifies emergency mesh payloads using P2P keypair", async () => {
    const p2pKeys = await getP2PSigningKeys();
    const payload = "EMERGENCY_ALERT:SOS_LAT_37_LON_122";

    const signature = await signPayload(payload, p2pKeys.privateKey);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe("string");

    const publicJwk = await crypto.subtle.exportKey("jwk", p2pKeys.publicKey);
    const isValid = await verifyPayload(payload, signature, publicJwk);
    expect(isValid).toBe(true);

    const isTamperedValid = await verifyPayload(payload + "_TAMPERED", signature, publicJwk);
    expect(isTamperedValid).toBe(false);
  });
});
