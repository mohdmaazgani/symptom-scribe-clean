import { describe, it, expect, vi } from "vitest";
import { hydrateOfflineDatabase } from "./offline-db";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}));

vi.mock("./encryption", () => ({
  whenEncryptionReady: vi.fn().mockResolvedValue({
    encryptionKey: {} as CryptoKey,
    searchKey: {} as CryptoKey,
  }),
  encryptText: vi.fn().mockImplementation((text) => Promise.resolve(`enc:${text}`)),
  generateSearchTokens: vi.fn().mockResolvedValue([]),
}));

describe("Cross-Device Synchronization Unit Tests", () => {
  it("hydrateOfflineDatabase returns false if offline", async () => {
    const originalOnline = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const result = await hydrateOfflineDatabase("user-123");
    expect(result).toBe(false);

    Object.defineProperty(navigator, "onLine", { value: originalOnline, configurable: true });
  });

  it("hydrateOfflineDatabase returns false if no userId is provided", async () => {
    const result = await hydrateOfflineDatabase("");
    expect(result).toBe(false);
  });
});
