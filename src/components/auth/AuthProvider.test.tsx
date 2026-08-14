/**
 * Tests for the AuthProvider (issue #1192).
 *
 * The provider initializes by subscribing to auth events first and using the
 * listener as the single source of truth for the session, with getSession()
 * kept only as a fallback for persisted sessions. These tests verify that:
 *
 *  1. `loading` resolves and the session is published when INITIAL_SESSION
 *     arrives (normal restore path).
 *  2. A persisted session is published through the getSession() fallback even
 *     when the initial event has not been delivered yet.
 *  3. A sign-out clears the session and resolves loading.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import { AuthProvider, useAuth } from "./AuthProvider";

// ---------------------------------------------------------------------------
// Mock the Supabase client. The onAuthStateChange callback is captured so
// tests can simulate auth events directly.
// ---------------------------------------------------------------------------
const { supabaseMock } = vi.hoisted(() => ({
  supabaseMock: {
    authStateChange: undefined as
      | ((event: string, session: unknown) => void)
      | undefined,
    getSession: vi.fn(),
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn((callback) => {
        supabaseMock.authStateChange = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: supabaseMock.getSession,
    },
    from: vi.fn(),
  },
}));

// A consumer that exposes the auth state so tests can assert on it.
const AuthStateProbe = () => {
  const { session, user, loading, initialized } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="initialized">{String(initialized)}</span>
      <span data-testid="session">{session?.access_token ?? "none"}</span>
      <span data-testid="user">{user?.id ?? "none"}</span>
    </div>
  );
};

const mockSession = {
  access_token: "mock-token",
  refresh_token: "mock-refresh",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "user-1", email: "user@example.com" },
};

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseMock.authStateChange = undefined;
    supabaseMock.getSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  // 1. Normal restore path: loading resolves once INITIAL_SESSION arrives.
  it("publishes the session and resolves loading when INITIAL_SESSION arrives", async () => {
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    // Auth is initializing — no session yet.
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    expect(screen.getByTestId("session")).toHaveTextContent("none");

    supabaseMock.authStateChange?.("INITIAL_SESSION", mockSession);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("initialized")).toHaveTextContent("true");
      expect(screen.getByTestId("session")).toHaveTextContent("mock-token");
      expect(screen.getByTestId("user")).toHaveTextContent("user-1");
    });
  });

  // 2. Fallback: a persisted session is published via getSession() even when
  //    the initial event is delayed (edge case from issue #1192).
  it("publishes a persisted session via getSession() when the initial event is delayed", async () => {
    supabaseMock.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("session")).toHaveTextContent("mock-token");
      expect(screen.getByTestId("user")).toHaveTextContent("user-1");
    });
  });

  // 3. The stale-snapshot race from issue #1192: getSession() must never
  //    overwrite a session the listener already published with a null value.
  it("does not clobber a published session with a stale getSession() snapshot", async () => {
    // The sign-in event arrives first and publishes the session...
    supabaseMock.getSession.mockResolvedValue({ data: { session: null }, error: null });

    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    supabaseMock.authStateChange?.("SIGNED_IN", mockSession);

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("mock-token");
    });
  });

  // 4. Sign-out clears the session.
  it("clears the session when SIGNED_OUT is emitted", async () => {
    render(
      <AuthProvider>
        <AuthStateProbe />
      </AuthProvider>
    );

    supabaseMock.authStateChange?.("INITIAL_SESSION", mockSession);

    await waitFor(() => {
      expect(screen.getByTestId("session")).toHaveTextContent("mock-token");
    });

    supabaseMock.authStateChange?.("SIGNED_OUT", null);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("session")).toHaveTextContent("none");
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
  });
});