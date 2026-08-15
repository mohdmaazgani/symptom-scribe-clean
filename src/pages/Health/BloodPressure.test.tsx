import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import BloodPressureDiary from "@/pages/Health/BloodPressure";
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
    id: "bp-1",
    user_id: mockUser.id,
    metric_type: "blood_pressure",
    value: { systolic: 118, diastolic: 76 },
    notes: null,
    recorded_at: new Date().toISOString(),
    pending_sync: 0,
    pending_delete: 0,
  },
  {
    id: "bp-2",
    user_id: mockUser.id,
    metric_type: "blood_pressure",
    value: { systolic: 142, diastolic: 92 },
    notes: "Morning reading",
    recorded_at: "2026-08-01T09:00:00Z",
    pending_sync: 0,
    pending_delete: 0,
  },
  {
    id: "hr-1",
    user_id: mockUser.id,
    metric_type: "heart_rate",
    value: { value: 72 },
    notes: null,
    recorded_at: "2026-08-01T09:05:00Z",
    pending_sync: 0,
    pending_delete: 0,
  },
];

describe("BloodPressureDiary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser();
    (db.healthMetrics.where as Mock).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        filter: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(sampleRecords),
        }),
        toArray: vi.fn().mockResolvedValue(sampleRecords),
      }),
    });
  });

  it("renders the page title", async () => {
    render(<BloodPressureDiary />);
    expect(
      screen.getByRole("heading", { name: /Blood Pressure Diary/i }),
    ).toBeInTheDocument();
  });

  it("shows the weekly summary with data from the last 7 days", async () => {
    render(<BloodPressureDiary />);
    await waitFor(() => {
      // Only bp-1 (today) falls within the 7-day window
      expect(screen.getByText("118")).toBeInTheDocument();
      expect(screen.getByText("76")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  it("renders the most recent classification badge", async () => {
    render(<BloodPressureDiary />);
    await waitFor(() => {
      expect(screen.getAllByText("Normal").length).toBeGreaterThan(0);
    });
  });

  it("renders history rows and classifies each reading", async () => {
    render(<BloodPressureDiary />);
    await waitFor(() => {
      expect(screen.getByText("118/76 mmHg")).toBeInTheDocument();
      expect(screen.getByText("142/92 mmHg")).toBeInTheDocument();
      expect(screen.getAllByText(/Stage 2/i).length).toBeGreaterThan(0);
    });
  });

  it("rejects out-of-range readings and shows an error", async () => {
    const user = userEvent.setup();
    render(<BloodPressureDiary />);

    await user.type(screen.getByLabelText(/Systolic \(mmHg\)/i), "400");
    await user.type(screen.getByLabelText(/Diastolic \(mmHg\)/i), "500");
    await user.click(screen.getByRole("button", { name: /Record Reading/i }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(
        "Invalid Reading",
        expect.stringContaining("Systolic must be 50-300"),
      );
    });
  });

  it("shows the empty state when there are no blood pressure readings", async () => {
    (db.healthMetrics.where as Mock).mockReturnValue({
      equals: vi.fn().mockReturnValue({
        filter: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
        toArray: vi.fn().mockResolvedValue([]),
      }),
    });
    render(<BloodPressureDiary />);
    await waitFor(() => {
      expect(
        screen.getByText(/No blood pressure readings yet/i),
      ).toBeInTheDocument();
    });
  });
});
