/**
 * Unit tests for browser environment validation (src/lib/env.ts)
 *
 * This module gates application startup: when the required Supabase variables
 * are missing it reports `diagnostics.isValid = false`, which is what surfaces
 * the "Startup configuration required" screen (see issue #461). Because the
 * module reads `import.meta.env` at load time, each scenario stubs the env and
 * re-imports the module via `vi.resetModules()`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const URL_KEY = "VITE_SUPABASE_URL";
const PUBLISHABLE_KEY = "VITE_SUPABASE_PUBLISHABLE_KEY";
const LEGACY_KEY = "VITE_SUPABASE_ANON_KEY";

const VALID_URL = "https://example.supabase.co";
const VALID_PUBLISHABLE = "publishable-key-123";
const VALID_LEGACY = "legacy-anon-key-456";

/** Stub env vars, reset the module cache, and import a fresh copy of env.ts. */
async function loadEnv(vars: Record<string, string | undefined>) {
  vi.resetModules();
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) vi.stubEnv(key, value);
  }
  return import("@/lib/env");
}

describe("browserEnv", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe("valid configuration", () => {
    it("is valid when both required variables are present", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: VALID_URL,
        [PUBLISHABLE_KEY]: VALID_PUBLISHABLE,
      });

      expect(browserEnv.diagnostics.isValid).toBe(true);
      expect(browserEnv.diagnostics.missingRequired).toEqual([]);
      expect(browserEnv.diagnostics.warnings).toEqual([]);
      expect(browserEnv.diagnostics.legacyKeyUsed).toBe(false);
      expect(browserEnv.supabaseUrl).toBe(VALID_URL);
      expect(browserEnv.supabasePublishableKey).toBe(VALID_PUBLISHABLE);
    });

    it("trims surrounding whitespace from values", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: `  ${VALID_URL}  `,
        [PUBLISHABLE_KEY]: `\t${VALID_PUBLISHABLE}\n`,
      });

      expect(browserEnv.supabaseUrl).toBe(VALID_URL);
      expect(browserEnv.supabasePublishableKey).toBe(VALID_PUBLISHABLE);
      expect(browserEnv.diagnostics.isValid).toBe(true);
    });
  });

  describe("missing required variables (issue #461)", () => {
    it("flags a missing Supabase URL", async () => {
      const { browserEnv } = await loadEnv({
        [PUBLISHABLE_KEY]: VALID_PUBLISHABLE,
      });

      expect(browserEnv.diagnostics.isValid).toBe(false);
      expect(browserEnv.diagnostics.missingRequired).toContain(URL_KEY);
    });

    it("flags a missing publishable key", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: VALID_URL,
      });

      expect(browserEnv.diagnostics.isValid).toBe(false);
      expect(browserEnv.diagnostics.missingRequired).toContain(PUBLISHABLE_KEY);
    });

    it("flags both variables when neither is configured", async () => {
      const { browserEnv } = await loadEnv({});

      expect(browserEnv.diagnostics.isValid).toBe(false);
      expect(browserEnv.diagnostics.missingRequired).toEqual([
        URL_KEY,
        PUBLISHABLE_KEY,
      ]);
    });

    it("treats whitespace-only values as missing", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: "   ",
        [PUBLISHABLE_KEY]: "   ",
      });

      expect(browserEnv.diagnostics.isValid).toBe(false);
      expect(browserEnv.diagnostics.missingRequired).toEqual([
        URL_KEY,
        PUBLISHABLE_KEY,
      ]);
    });
  });

  describe("legacy anon key fallback", () => {
    it("uses the legacy key and remains valid when publishable key is absent", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: VALID_URL,
        [LEGACY_KEY]: VALID_LEGACY,
      });

      expect(browserEnv.diagnostics.isValid).toBe(true);
      expect(browserEnv.supabasePublishableKey).toBe(VALID_LEGACY);
      expect(browserEnv.diagnostics.legacyKeyUsed).toBe(true);
      expect(browserEnv.diagnostics.warnings).toHaveLength(1);
      expect(browserEnv.diagnostics.warnings[0]).toMatch(/legacy/i);
    });

    it("prefers the publishable key over the legacy key when both exist", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: VALID_URL,
        [PUBLISHABLE_KEY]: VALID_PUBLISHABLE,
        [LEGACY_KEY]: VALID_LEGACY,
      });

      expect(browserEnv.supabasePublishableKey).toBe(VALID_PUBLISHABLE);
      expect(browserEnv.diagnostics.legacyKeyUsed).toBe(false);
      expect(browserEnv.diagnostics.warnings).toEqual([]);
    });
  });

  describe("getSupabaseFunctionUrl", () => {
    it("builds a function URL relative to the Supabase URL", async () => {
      const { browserEnv } = await loadEnv({
        [URL_KEY]: VALID_URL,
        [PUBLISHABLE_KEY]: VALID_PUBLISHABLE,
      });

      expect(browserEnv.getSupabaseFunctionUrl("symptom-analyzer")).toBe(
        "https://example.supabase.co/functions/v1/symptom-analyzer"
      );
    });
  });
});
