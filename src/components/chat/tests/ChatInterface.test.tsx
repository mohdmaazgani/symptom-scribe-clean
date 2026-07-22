import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import ChatInterface from "../ChatInterface";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-123", email: "user@example.com" } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "session-1",
              user_id: "test-user-123",
              title: "Headache consultation",
              messages: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      }),
    }),
  },
}));

// Mock toast helpers
vi.mock("@/lib/toast-helpers", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showLoading: vi.fn().mockReturnValue({ dismiss: vi.fn() }),
  showWarning: vi.fn(),
}));

// Mock cached queries & encryption
vi.mock("@/lib/cached-queries", () => ({
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/encryption", () => ({
  whenKeysReady: vi.fn().mockResolvedValue({
    encryptionKey: {},
    searchKey: {},
  }),
}));

vi.mock("@/lib/offline-db", () => ({
  db: {
    symptomHistory: {
      put: vi.fn().mockResolvedValue(true),
    },
  },
  encryptSymptom: vi.fn().mockResolvedValue({}),
}));

describe("ChatInterface Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("renders the chat panel with ARIA live region and role log", async () => {
    render(<ChatInterface />);

    const logRegion = screen.getByRole("log");
    expect(logRegion).toBeInTheDocument();
    expect(logRegion).toHaveAttribute("aria-live", "polite");
    expect(logRegion).toHaveAttribute(
      "aria-label",
      "Chat conversation with AI health assistant"
    );
  });

  it("provides accessible labels for new chat buttons and inputs", async () => {
    render(<ChatInterface />);

    const textarea = screen.getByRole("textbox", {
      name: /Describe your symptoms to the AI health assistant/i,
    });
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("aria-keyshortcuts", "Control+Enter");

    const newChatButtons = screen.getAllByRole("button", {
      name: /Create new consultation/i,
    });
    expect(newChatButtons.length).toBeGreaterThan(0);
  });

  it("supports keyboard submission using Ctrl+Enter", async () => {
    const user = userEvent.setup();
    render(<ChatInterface />);

    const textarea = screen.getByRole("textbox", {
      name: /Describe your symptoms to the AI health assistant/i,
    });

    await user.type(textarea, "I have a sore throat");
    expect(textarea).toHaveValue("I have a sore throat");

    // Press Ctrl+Enter
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

    // Textarea input clears after send invocation
    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("renders screen-reader accessible sender tags for chat messages", async () => {
    render(<ChatInterface />);

    await waitFor(() => {
      expect(screen.getByText("AI Health Assistant:")).toBeInTheDocument();
    });
  });
});
