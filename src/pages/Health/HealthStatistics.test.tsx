import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HealthStatistics from "./HealthStatistics";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "s1",
            user_id: "test-user-id",
            symptoms: "Headache",
            severity_level: "high",
            risk_score: 70,
            resolved: false,
            created_at: new Date().toISOString(),
          },
          {
            id: "s2",
            user_id: "test-user-id",
            symptoms: "Headache",
            severity_level: "medium",
            risk_score: 45,
            resolved: true,
            created_at: new Date().toISOString(),
          },
          {
            id: "s3",
            user_id: "test-user-id",
            symptoms: "Fever",
            severity_level: "low",
            risk_score: 20,
            resolved: true,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    }),
  },
}));

// Mock encryption helpers
vi.mock("@/lib/encryption", () => ({
  whenKeysReady: vi.fn().mockResolvedValue({ encryptionKey: {} }),
}));

// Mock cached queries
vi.mock("@/lib/cached-queries", () => ({
  getCachedData: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

// Mock offline DB
vi.mock("@/lib/offline-db", () => ({
  db: {
    symptomHistory: {
      where: vi.fn().mockReturnValue({
        equals: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    },
  },
  decryptSymptom: vi.fn((x) => Promise.resolve(x)),
}));

// Mock html-to-image to prevent canvas issues in test DOM
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

// Mock Recharts ResponsiveContainer for test rendering
vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

describe("HealthStatistics Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dashboard header and title", async () => {
    render(<HealthStatistics />);
    expect(screen.getByText("Health Record Statistics")).toBeInTheDocument();
    expect(
      screen.getByText(/Summarized insights, symptom frequency analytics, and activity trends/i)
    ).toBeInTheDocument();
  });

  it("calculates and displays key statistics cards after fetching data", async () => {
    render(<HealthStatistics />);

    await waitFor(() => {
      expect(screen.getByText("Total Logged Entries")).toBeInTheDocument();
    });

    // 3 total entries mocked
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2 Resolved")).toBeInTheDocument();
    expect(screen.getByText("1 Active")).toBeInTheDocument();

    // Top symptom should be Headache
    expect(screen.getAllByText("Headache").length).toBeGreaterThan(0);
  });

  it("allows switching timeframe filters", async () => {
    render(<HealthStatistics />);

    await waitFor(() => {
      expect(screen.getByText("Total Logged Entries")).toBeInTheDocument();
    });

    const filterTrigger = screen.getByRole("combobox");
    expect(filterTrigger).toBeInTheDocument();
  });
});
