/**
 * Tests for the Dashboard component.
 *
 * ## What is tested
 *
 * The Dashboard fetches live data from Supabase on mount. In tests we fully
 * mock the Supabase client so no network request is ever made. This lets us
 * exercise the component's real rendering and state-management logic without
 * needing a database connection.
 *
 * Test plan:
 *  1. Loading state  – skeleton / spinner is visible before data arrives.
 *  2. Empty state    – when the user has no symptom history the correct
 *                      prompt is shown.
 *  3. Stat cards     – when data exists the four stat cards render with the
 *                      right labels.
 *  4. Recent history – history items are rendered with severity colour logic.
 *  5. Error state    – Supabase query errors are handled gracefully.
 *  6. Unauthenticated – when no user session exists the component loads
 *                       without crashing.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@/test/utils";
import Dashboard from "@/pages/Dashboard";

// ---------------------------------------------------------------------------
// Mock the Supabase client
// ---------------------------------------------------------------------------
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock toast helpers so we don't need a Toaster provider in tests
vi.mock("@/lib/toast-helpers", () => ({
  showError: vi.fn(),
  showInfo: vi.fn(),
}));

// Mock cached query helper so tests do not call Supabase Edge Functions
vi.mock("@/lib/cached-queries", () => ({
  getCachedData: vi.fn(),
}));

// Mock encryption and offline-db to prevent blocking promises in tests
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

// Mock react-countup so it renders plain numbers synchronously (avoids
// animation timers interfering with assertions)
vi.mock("react-countup", () => ({
  __esModule: true,
  default: ({ end }: { end: number }) => <span>{end}</span>,
}));

import { supabase } from "@/integrations/supabase/client";
import { getCachedData } from "@/lib/cached-queries";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const mockUser = { id: "test-user-id", email: "test@example.com" };

/** Returns a fully resolved cached query stub. */
function mockCachedSymptoms(data: unknown[] | null, error: unknown = null) {
  (getCachedData as Mock).mockResolvedValue({ data, error });
}

function mockAuthUser(user: typeof mockUser | null = mockUser) {
  (supabase.auth.getUser as Mock).mockResolvedValue({ data: { user } });
}

// ---------------------------------------------------------------------------
// Sample fixture data
// ---------------------------------------------------------------------------
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 3); // within last 7 days

const sampleSymptoms = [
  {
    id: "1",
    symptoms: "Persistent headache with nausea and light sensitivity",
    severity_level: "high",
    risk_score: 75,
    resolved: false,
    created_at: sevenDaysAgo.toISOString(),
    user_id: mockUser.id,
  },
  {
    id: "2",
    symptoms: "Mild sore throat and runny nose since yesterday morning",
    severity_level: "low",
    risk_score: 25,
    resolved: true,
    created_at: new Date("2024-01-01").toISOString(),
    user_id: mockUser.id,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Loading state
  it("shows a loading state before data resolves", () => {
    mockAuthUser();
    // Never resolve the query during this test
    (getCachedData as Mock).mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);
    // The loading skeleton should be present while awaiting the query
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  // 2. Empty state
  it("renders the empty-state prompt when the user has no history", async () => {
    mockAuthUser();
    mockCachedSymptoms([]);

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/No symptom history yet/i)
      ).toBeInTheDocument();
    });
  });

  // 3. Stat cards render correct labels
  it("renders all four stat card labels", async () => {
    mockAuthUser();
    mockCachedSymptoms(sampleSymptoms);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Total Consultations/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Active Issues/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Overall Wellness/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Recent Activity/i })).toBeInTheDocument();
    });
  });

  // 4. Stat values are calculated correctly
  it("calculates and displays the correct stat values from symptom data", async () => {
    mockAuthUser();
    mockCachedSymptoms(sampleSymptoms);

    render(<Dashboard />);

    await waitFor(() => {
      // Check that "2" appears somewhere near "Lifetime symptom checks"
      const lifetimeText = screen.getByText(/Lifetime symptom checks/i);
      expect(lifetimeText.closest("div")).toHaveTextContent("2");
      
      const followupText = screen.getByText(/Requiring follow-up/i);
      expect(followupText.closest("div")).toHaveTextContent("1");
    });
  });

  // 5. Recent history items are rendered
  it("renders recent symptom history items", async () => {
    mockAuthUser();
    mockCachedSymptoms(sampleSymptoms);

    render(<Dashboard />);

    await waitFor(() => {
      // Use a function matcher to find text across elements
      expect(
        screen.getByText((content, element) => {
          const hasText = element?.textContent?.includes("Persistent headache with nausea") ?? false;
          const hasChildren = element ? element.children.length === 0 : false;
          return hasText && hasChildren;
        })
      ).toBeInTheDocument();
    });
  });

  // 6. Severity colour logic – "high" severity items use the destructive class
  it("applies the correct severity colour for high-severity items", async () => {
    mockAuthUser();
    mockCachedSymptoms(sampleSymptoms);

    render(<Dashboard />);

    await waitFor(() => {
      // Find the element containing "high" and check its class
      const elements = screen.getAllByText(/high/i);
      const highBadge = elements.find(el => el.classList.contains("text-destructive"));
      expect(highBadge).toBeInTheDocument();
    });
  });

  // 7. Supabase error is handled gracefully
  it("handles Supabase fetch errors without crashing", async () => {
    mockAuthUser();
    mockCachedSymptoms(null, { message: "Network error" });

    render(<Dashboard />);

    // The component should still load (not throw)
    await waitFor(() => {
      expect(screen.getByText("Health Dashboard")).toBeInTheDocument();
    });
  });

  // 8. Unauthenticated user – no crash, no data fetch
  it("renders without crashing when no user session exists", async () => {
    mockAuthUser(null);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Health Dashboard")).toBeInTheDocument();
    });
  });
});
