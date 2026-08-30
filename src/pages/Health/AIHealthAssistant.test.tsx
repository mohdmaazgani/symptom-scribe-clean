import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import AIHealthAssistant from "./AIHealthAssistant";

// ---------------------------------------------------------------------------
// Mock Supabase
// ---------------------------------------------------------------------------
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "mock-token" } },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-123", email: "user@example.com" } },
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// ---------------------------------------------------------------------------
// Mock toast helpers
// ---------------------------------------------------------------------------
vi.mock("@/lib/toast-helpers", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showLoading: vi.fn().mockReturnValue({ dismiss: vi.fn() }),
  showWarning: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock environment variables
// ---------------------------------------------------------------------------
vi.mock("@/lib/env", () => ({
  browserEnv: {
    supabasePublishableKey: "mock-anon-key",
    getSupabaseFunctionUrl: vi
      .fn()
      .mockReturnValue("https://mock.supabase.co/functions/v1/symptom-analyzer"),
  },
}));

// ---------------------------------------------------------------------------
// Mock cached queries, encryption, and offline db
// ---------------------------------------------------------------------------
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

describe("AIHealthAssistant XSS Prevention Regression Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
  });

  const createMockStreamResponse = (chunks: string[]) => {
    const encoder = new TextEncoder();
    let index = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (index < chunks.length) {
          const payload = `data: ${JSON.stringify({
            choices: [{ delta: { content: chunks[index] } }],
          })}\n\n`;
          controller.enqueue(encoder.encode(payload));
          index++;
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  it("renders user messages with HTML payloads as escaped text, not executable DOM elements", async () => {
    const user = userEvent.setup();

    // Mock fetch to simulate streaming response
    global.fetch = vi
      .fn()
      .mockResolvedValue(
        createMockStreamResponse(["I understand your concern. Please see a doctor."])
      );

    const { container } = render(<AIHealthAssistant />);

    const textarea = screen.getByPlaceholderText(/Describe your symptoms…/i);
    const sendButton = screen.getByRole("button", { name: /Send/i });

    const xssPayload = '<img src="x" onerror="alert(1)">';
    await user.type(textarea, xssPayload);
    expect(textarea).toHaveValue(xssPayload);

    await user.click(sendButton);

    // Verify user message appears in DOM as literal escaped text
    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes('<img src="x" onerror="alert(1)">'))
      ).toBeInTheDocument();
    });

    // Ensure no <img> tag with src="x" was created in the DOM
    const imgElement = container.querySelector('img[src="x"]');
    expect(imgElement).toBeNull();
  });

  it("renders assistant messages with malicious HTML payloads as literal text without creating script or img elements", async () => {
    const user = userEvent.setup();

    const maliciousAssistantChunks = [
      "### Safe Advice\n",
      '<script>alert("xss")</script>\n',
      "<img src=x onerror=\"alert('attack')\">\n",
      '<iframe src="javascript:alert(1)"></iframe>\n',
      "Always consult a doctor.",
    ];

    global.fetch = vi.fn().mockResolvedValue(createMockStreamResponse(maliciousAssistantChunks));

    const { container } = render(<AIHealthAssistant />);

    const textarea = screen.getByPlaceholderText(/Describe your symptoms…/i);
    const sendButton = screen.getByRole("button", { name: /Send/i });

    await user.type(textarea, "I have a headache");
    await user.click(sendButton);

    // Verify assistant heading and text are rendered
    await waitFor(() => {
      expect(screen.getByText(/Safe Advice/i)).toBeInTheDocument();
    });

    // Assert that raw script, img, iframe elements are NOT in the DOM
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector('img[src="x"]')).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();

    // Assert that the text content contains the escaped representation
    expect(container.textContent).toContain('<script>alert("xss")</script>');
    expect(container.textContent).toContain("<img src=x onerror=\"alert('attack')\">");
    expect(container.textContent).toContain('<iframe src="javascript:alert(1)"></iframe>');
  });

  it("handles suggestion button click and renders safely", async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockStreamResponse(["Rest and drink fluids."]));

    const { container } = render(<AIHealthAssistant />);

    const feverSuggestion = screen.getByRole("button", { name: /I have a fever/i });
    await userEvent.click(feverSuggestion);

    await waitFor(() => {
      expect(screen.getByText("I have a fever")).toBeInTheDocument();
      expect(screen.getByText(/Rest and drink fluids/i)).toBeInTheDocument();
    });

    expect(container.querySelector("img[src='x']")).toBeNull();
  });
});
