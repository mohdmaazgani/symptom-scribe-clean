import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import HydrationTracker from "@/pages/Health/Hydration";
import { showError } from "@/lib/toast-helpers";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("@/lib/toast-helpers", () => ({
  showError: vi.fn(),
  showInfo: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
  showLoading: vi.fn(),
}));

vi.mock("@/lib/cached-queries", () => ({
  getCachedData: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/encryption", () => ({
  whenEncryptionReady: vi.fn().mockResolvedValue({}),
  whenKeysReady: vi.fn().mockResolvedValue({ encryptionKey: {}, searchKey: {} }),
  whenSearchReady: vi.fn().mockResolvedValue({}),
  generateSearchTokens: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/offline-db", () => ({
  db: {
    healthMetrics: {
      clear: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
      bulkPut: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      where: vi.fn(),
    },
    symptomHistory: {
      clear: vi.fn(),
      toArray: vi.fn().mockResolvedValue([]),
      bulkPut: vi.fn(),
      put: vi.fn(),
    },
  },
  decryptSymptom: vi.fn((s) => s),
  decryptMetric: vi.fn((m) => m),
  encryptSymptom: vi.fn((s) => s),
  encryptMetric: vi.fn((m) => m),
  syncOfflineData: vi.fn().mockResolvedValue(false),
}));

import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/offline-db";

const mockUser = { id: "test-user-id", email: "test@example.com" };

function mockAuthUser(user: typeof mockUser | null = mockUser) {
  (supabase.auth.getUser as Mock).mockResolvedValue({ data: { user } });
}

const sampleRecords = [
  {
    id: "hyd-1",
    user_id: mockUser.id,
    metric_type: "hydration",
    value: { value: 1000 },
    notes: null,
    recorded_at: new Date().toISOString(),
    pending_sync: 0,
    pending_delete: 0,
  },
  {
    id: "hyd-2",
    user_id: mockUser.id,
    metric_type: "hydration",
    value: { value: 500 },
    notes: "After lunch",
    recorded_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    pending_sync: 0,
    pending_delete: 0,
  },
  {
    id: "steps-1",
    user_id: mockUser.id,
    metric_type: "steps",
    value: { value: 8000 },
    notes: null,
    recorded_at: new Date().toISOString(),
    pending_sync: 0,
    pending_delete: 0,
  },
];

function mockWhereRecords(records: unknown[]) {
  (db.healthMetrics.where as Mock).mockReturnValue({
    equals: vi.fn().mockReturnValue({
      filter: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(records),
      }),
      toArray: vi.fn().mockResolvedValue(records),
    }),
  });
}

describe("HydrationTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser();
    mockWhereRecords(sampleRecords);
  });

  it("renders the page title", async () => {
    render(<HydrationTracker />);
    expect(
      screen.getByRole("heading", { name: /Hydration Tracker/i }),
    ).toBeInTheDocument();
  });

  it("shows today's total and percent complete", async () => {
    render(<HydrationTracker />);
    await waitFor(() => {
      expect(screen.getByText(/1500 \/ 2000 ml/i)).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("500 ml remaining to hit today's goal")).toBeInTheDocument();
    });
  });

  it("shows today's summary card totals", async () => {
    render(<HydrationTracker />);
    await waitFor(() => {
      expect(screen.getByText("ml today")).toBeInTheDocument();
      expect(screen.getByText("intakes today")).toBeInTheDocument();
    });
  });

  it("renders history rows with amounts and notes", async () => {
    render(<HydrationTracker />);
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "1000 ml" })).toBeInTheDocument();
      expect(screen.getByRole("cell", { name: "500 ml" })).toBeInTheDocument();
      expect(screen.getByRole("cell", { name: "After lunch" })).toBeInTheDocument();
    });
  });

  it("pre-fills the amount when a quick-add option is clicked", async () => {
    const user = userEvent.setup();
    render(<HydrationTracker />);

    await user.click(screen.getByRole("button", { name: /250 ml/i }));
    expect(screen.getByLabelText(/Amount \(ml\)/i)).toHaveValue(250);
  });

  it("rejects invalid amounts with an error toast", async () => {
    const user = userEvent.setup();
    render(<HydrationTracker />);

    await user.type(screen.getByLabelText(/Amount \(ml\)/i), "0");
    await user.click(screen.getByRole("button", { name: /Log Intake/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(
        "Invalid Amount",
        expect.stringContaining("between 1 and 5000 ml"),
      );
    });
  });

  it("shows the empty state when there are no hydration intakes", async () => {
    mockWhereRecords([]);
    render(<HydrationTracker />);
    await waitFor(() => {
      expect(
        screen.getByText(/No water intakes logged yet/i),
      ).toBeInTheDocument();
    });
  });
});
