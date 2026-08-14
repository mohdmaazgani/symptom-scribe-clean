/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { describe, it, beforeEach, vi, expect } from "vitest";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user1" } } }) },
    from: vi.fn(() => ({ insert: vi.fn(), delete: vi.fn(), update: vi.fn() })),
  },
}));

// Mock encryption readiness
vi.mock("./encryption", () => ({
  whenEncryptionReady: vi.fn().mockResolvedValue({}),
  registerEncryptionHooks: vi.fn(() => {}),
  registerP2PKeyStorage: vi.fn(() => {}),
  encryptMetric: (r: any) => r,
  decryptMetric: (r: any) => r,
  encryptSymptom: (r: any) => r,
  decryptSymptom: (r: any) => r,
  getSearchKey: () => null,
  generateSearchTokens: async () => [],
}));

// Import the module under test after mocks are registered
import * as offline from "./offline-db";

describe("syncOfflineData retry behavior", () => {
  let originalNavigator: any;
  beforeEach(() => {
    vi.clearAllMocks();
    // ensure online by default
    originalNavigator = global.navigator;
    // @ts-ignore
    global.navigator = { onLine: true };

    // Replace DB tables with spies (where() will be configured per-test)
    (offline.db as any).healthMetrics = {
      where: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      clear: vi.fn(),
      toArray: vi.fn(),
    };

    (offline.db as any).symptomHistory = {
      where: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      put: vi.fn(),
      clear: vi.fn(),
      toArray: vi.fn(),
    };
  });

  afterEach(() => {
    // restore navigator
    // @ts-ignore
    global.navigator = originalNavigator;
  });

  it("skips sync when offline", async () => {
    // @ts-ignore
    global.navigator = { onLine: false };
    const res = await offline.syncOfflineData();
    expect(res).toBe(false);
  });

  it("schedules retry on network failure for inserts", async () => {
    const record = { id: "m1", pending_sync: 1, retry_attempts: 0 } as any;
    // make where(...).equals(1).toArray return our record
    (offline.db as any).healthMetrics.where.mockImplementation((field: string) => ({ equals: vi.fn((val: any) => ({ toArray: vi.fn().mockResolvedValue(field === "pending_sync" ? [record] : []) })) }));

    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const insertMock = vi.fn().mockResolvedValue({ error: { message: "Network failure" } });
    supabase.from.mockReturnValue({
      insert: insertMock,
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    });

    await offline.syncOfflineData();

    // First update call should mark an attempt
    expect((offline.db as any).healthMetrics.update).toHaveBeenCalled();
    // The update after failure should write last_sync_error and next_retry_at
    const calls = (offline.db as any).healthMetrics.update.mock.calls;
    const lastCallArgs = calls[calls.length - 1][1];
    expect(lastCallArgs).toHaveProperty("last_sync_error");
    expect(lastCallArgs).toHaveProperty("next_retry_at");
  });

  it("treats 5xx as retryable and schedules next_retry_at", async () => {
    const record = { id: "m2", pending_sync: 1, retry_attempts: 1 } as any;
    (offline.db as any).healthMetrics.where.mockImplementation((field: string) => ({ equals: vi.fn((val: any) => ({ toArray: vi.fn().mockResolvedValue(field === "pending_sync" ? [record] : []) })) }));

    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const insertMock = vi.fn().mockResolvedValue({ error: { status: 502, message: "Bad gateway" } });
    supabase.from.mockReturnValue({
      insert: insertMock,
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    });

    await offline.syncOfflineData();

    const lastCallArgs = (offline.db as any).healthMetrics.update.mock.calls.pop()[1];
    expect(lastCallArgs).toHaveProperty("next_retry_at");
  });

  it("treats 4xx as permanent and clears next_retry_at", async () => {
    const record = { id: "m3", pending_sync: 1, retry_attempts: 2 } as any;
    (offline.db as any).healthMetrics.where.mockImplementation((field: string) => ({ equals: vi.fn((val: any) => ({ toArray: vi.fn().mockResolvedValue(field === "pending_sync" ? [record] : []) })) }));

    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const insertMock = vi.fn().mockResolvedValue({ error: { status: 400, message: "Bad request" } });
    supabase.from.mockReturnValue({
      insert: insertMock,
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    });

    await offline.syncOfflineData();

    const lastCallArgs = (offline.db as any).healthMetrics.update.mock.calls.pop()[1];
    expect(lastCallArgs.next_retry_at).toBeNull();
    expect(lastCallArgs).toHaveProperty("last_sync_error");
  });

  it("resets retry metadata on success", async () => {
    const record = { id: "m4", pending_sync: 1, retry_attempts: 3, last_sync_error: "err" } as any;
    (offline.db as any).healthMetrics.where.mockImplementation((field: string) => ({ equals: vi.fn((val: any) => ({ toArray: vi.fn().mockResolvedValue(field === "pending_sync" ? [record] : []) })) }));

    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({
      insert: insertMock,
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    });

    await offline.syncOfflineData();

    const lastCallArgs = (offline.db as any).healthMetrics.update.mock.calls.pop()[1];
    expect(lastCallArgs.pending_sync).toBe(0);
    expect(lastCallArgs.retry_attempts).toBe(0);
    expect(lastCallArgs.next_retry_at).toBeNull();
    expect(lastCallArgs.last_sync_error).toBeNull();
  });

  it("skips records whose next_retry_at is in the future", async () => {
    const future = Date.now() + 1000000;
    const record = { id: "m5", pending_sync: 1, next_retry_at: future } as any;
    (offline.db as any).healthMetrics.where.mockImplementation((field: string) => ({ equals: vi.fn((val: any) => ({ toArray: vi.fn().mockResolvedValue(field === "pending_sync" ? [record] : []) })) }));

    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert: insertMock });

    await offline.syncOfflineData();

    // insert should not be called because record is skipped
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("ensures single-flight: concurrent calls only trigger one sync pass", async () => {
    const record = { id: "m6", pending_sync: 1 } as any;
    (offline.db as any).healthMetrics.where.mockReturnValue({ equals: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([record]) })) });

    const supabase = (await import("@/integrations/supabase/client")).supabase;
    // insert returns a promise that resolves after a tick
    const insertMock = vi.fn().mockImplementation(() => new Promise((res) => setTimeout(() => res({ error: null }), 10)));
    supabase.from.mockReturnValue({
      insert: insertMock,
      delete: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })),
    });

    const p1 = offline.syncOfflineData();
    const p2 = offline.syncOfflineData();

    await Promise.all([p1, p2]);

    // insert should be called only once
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
