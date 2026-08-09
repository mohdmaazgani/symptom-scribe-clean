import { describe, it, expect } from "vitest";
import { generateSaltedBlindIndex, generateSecureSearchTokens } from "../blind-index";

describe("Blind Index & k-Anonymity Security Module", () => {
  const salt = "test_user_salt_12345";

  it("should generate deterministic blind index tokens for the same term and salt", async () => {
    const token1 = await generateSaltedBlindIndex("Headache", salt);
    const token2 = await generateSaltedBlindIndex("headache ", salt);
    expect(token1).toBe(token2);
    expect(token1).toHaveLength(32);
  });

  it("should generate different tokens for different salts", async () => {
    const token1 = await generateSaltedBlindIndex("Headache", salt);
    const token2 = await generateSaltedBlindIndex("Headache", "different_salt");
    expect(token1).not.toEqual(token2);
  });

  it("should include k-anonymity noise tokens", async () => {
    const tokens = await generateSecureSearchTokens(["Fever"], salt, 3);
    expect(tokens.length).toBeGreaterThanOrEqual(4);
  });
});
