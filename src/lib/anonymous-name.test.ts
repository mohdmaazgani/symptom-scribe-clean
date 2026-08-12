import { describe, it, expect } from "vitest";
import { generateAnonymousAlias, generateRandomAlias } from "./anonymous-name";

describe("anonymous-name generator", () => {
  it("generates deterministic alias for a given user and group", () => {
    const alias1 = generateAnonymousAlias("user-123", "group-abc");
    const alias2 = generateAnonymousAlias("user-123", "group-abc");
    expect(alias1).toBe(alias2);
    expect(alias1.length).toBeGreaterThan(5);
  });

  it("generates different aliases for different groups or users", () => {
    const alias1 = generateAnonymousAlias("user-123", "group-abc");
    const alias2 = generateAnonymousAlias("user-123", "group-xyz");
    expect(alias1).not.toBe(alias2);
  });

  it("generates random aliases", () => {
    const randomAlias = generateRandomAlias();
    expect(randomAlias).toBeTruthy();
    expect(typeof randomAlias).toBe("string");
  });
});
