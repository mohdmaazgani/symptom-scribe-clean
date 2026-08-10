import { describe, it, expect } from "vitest";
import { generateCaregiverKeyPair, exportPublicKeyJwk } from "../key-exchange";

describe("Caregiver Co-Monitoring Cryptographic Stream", () => {
  it("should generate ECDH key pairs for caregiver authorization", async () => {
    const pair = await generateCaregiverKeyPair();
    expect(pair.publicKey).toBeDefined();
    expect(pair.privateKey).toBeDefined();

    const jwk = await exportPublicKeyJwk(pair.publicKey);
    expect(jwk.kty).toBe("EC");
    expect(jwk.crv).toBe("P-256");
  });
});
