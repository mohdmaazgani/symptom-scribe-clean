/**
 * Tests for the Auth page.
 *
 * ## What is tested
 *
 * Auth handles sign-in, client-side validation, the "forgot password" flow,
 * and switching to the sign-up tab. The Supabase client and toast system are
 * fully mocked so no network request is ever made and we can assert on what
 * was called without needing a <Toaster /> in the tree.
 *
 * Test plan:
 *  1. Renders the sign-in form by default.
 *  2. Blocks submission and surfaces a validation toast for an invalid email.
 *  3. Calls supabase.auth.signInWithPassword with the entered credentials.
 *  4. Shows a "Redirecting..." state after a successful sign-in.
 *  5. Surfaces an error toast when sign-in fails and re-enables the form.
 *  6. Toggles password visibility.
 *  7. Switches to the sign-up tab and updates the tabs' aria-selected state.
 *  8. Forgot password: requires an email before calling Supabase.
 *  9. Forgot password: calls resetPasswordForEmail and shows a success toast.
 *  10. Forgot password: shows a "Reset Failed" toast when Supabase returns an error.
 *  11. Redirects to /dashboard when onAuthStateChange reports an existing session.
 *  12. Redirects to /reset-password when the URL signals a recovery flow.
 */
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import Auth from "@/pages/Auth";

// ---------------------------------------------------------------------------
// Mock react-router-dom's useNavigate while keeping everything else (like
// MemoryRouter, used by the AllProviders test wrapper) real.
// ---------------------------------------------------------------------------
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------------------------------------------------------------------
// Mock the Supabase client. The onAuthStateChange callback is captured so
// tests can invoke it directly to simulate an existing session on mount.
// ---------------------------------------------------------------------------
const { authStateChangeHolder } = vi.hoisted(() => ({
  authStateChangeHolder: {
    current: undefined as
      | ((event: string, session: unknown) => void)
      | undefined,
  },
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn((callback) => {
        authStateChangeHolder.current = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
    },
  },
}));

// Mock the toast hook. toast-helpers.ts imports `toast` from this same
// module, so mocking it here also covers showSuccess/showError calls made
// from Auth.tsx via toast-helpers.
// `vi.mock` factories are hoisted above the rest of the file, so the mock
// function itself must be created via `vi.hoisted` to avoid a
// "Cannot access before initialization" error.
const { mockToast } = vi.hoisted(() => ({ mockToast: vi.fn() }));
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
  toast: mockToast,
}));

// MultiStepSignUp pulls in its own validation/Supabase logic that's out of
// scope for the sign-in page tests, so it's replaced with a light stub.
vi.mock("@/components/registration/forms/MultiStepSignUp", () => ({
  default: () => <div>Sign Up Form</div>,
}));

import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("Auth", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    authStateChangeHolder.current = undefined;
  });

  afterEach(() => {
    // Restore window.location in case a test overrode it to simulate a
    // password-recovery deep link.
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  // 1. Renders sign-in form by default
  it("renders the sign-in form by default", () => {
    render(<Auth />);

    expect(screen.getByText("Symptom Scribe")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  // 2. Validation blocks submission for an invalid email
  it("shows a validation error and does not call Supabase for an invalid email", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    const emailInput = screen.getByLabelText("Email");
    await user.type(emailInput, "not-an-email");
    await user.type(screen.getByLabelText("Password"), "password123");

    // The email input has `type="email"` + `required`, so a native click on
    // the submit button is intercepted by the browser's built-in constraint
    // validation before React's onSubmit ever runs. Dispatching `submit`
    // directly on the form mirrors how the app's own validation (handleSignIn
    // -> validateSignIn) is reached in this scenario.
    const form = emailInput.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Validation Error",
          variant: "destructive",
        })
      );
    });
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  // 3. Valid submit calls Supabase with the entered credentials
  it("calls signInWithPassword with the entered email and password", async () => {
    const user = userEvent.setup();
    (supabase.auth.signInWithPassword as Mock).mockResolvedValue({ error: null });

    render(<Auth />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "correct-password",
      });
    });
  });

  // 4. Successful sign-in shows a redirecting state
  it("shows a redirecting state after a successful sign-in", async () => {
    const user = userEvent.setup();
    (supabase.auth.signInWithPassword as Mock).mockResolvedValue({ error: null });

    render(<Auth />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
    });
  });

  // 5. Failed sign-in surfaces an error toast and re-enables the form
  it("shows an error toast when sign-in fails", async () => {
    const user = userEvent.setup();
    (supabase.auth.signInWithPassword as Mock).mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    render(<Auth />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sign In Failed",
          description: "Invalid login credentials",
          variant: "destructive",
        })
      );
    });
    // Form should be usable again, not stuck in a loading/redirecting state
    expect(screen.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  // 6. Password visibility toggle
  it("toggles password visibility when the eye icon is clicked", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // 7. Switching tabs renders the sign-up form and updates aria-selected state
  it("renders the sign-up form and updates tab aria-selected state when Sign Up is selected", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    const signInTab = screen.getByRole("tab", { name: /sign in/i });
    const signUpTab = screen.getByRole("tab", { name: /sign up/i });

    // Sign In is the default active tab
    expect(signInTab).toHaveAttribute("aria-selected", "true");
    expect(signUpTab).toHaveAttribute("aria-selected", "false");

    await user.click(signUpTab);

    await waitFor(() => {
      expect(screen.getByText("Sign Up Form")).toBeInTheDocument();
    });
    expect(signUpTab).toHaveAttribute("aria-selected", "true");
    expect(signInTab).toHaveAttribute("aria-selected", "false");
  });

  // 8. Forgot password requires an email first
  it("requires an email before requesting a password reset", async () => {
    const user = userEvent.setup();
    render(<Auth />);

    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Email Required" })
      );
    });
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  // 9. Forgot password sends the reset email and shows a success toast
  it("sends a password reset email and shows a success toast", async () => {
    const user = userEvent.setup();
    (supabase.auth.resetPasswordForEmail as Mock).mockResolvedValue({ error: null });

    render(<Auth />);

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        "user@example.com",
        expect.objectContaining({ redirectTo: expect.any(String) })
      );
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Reset Email Sent" })
      );
    });
  });

  // 10. Forgot password shows a "Reset Failed" toast when Supabase errors
  it("shows a Reset Failed toast when resetPasswordForEmail returns an error", async () => {
    const user = userEvent.setup();
    (supabase.auth.resetPasswordForEmail as Mock).mockResolvedValue({
      error: { message: "User not found" },
    });

    render(<Auth />);

    await user.type(screen.getByLabelText("Email"), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: /forgot password/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Reset Failed",
          description: "User not found",
        })
      );
    });
  });

  // 11. Redirects to /dashboard when a session already exists on mount
  it("redirects to /dashboard when onAuthStateChange reports an existing session", () => {
    render(<Auth />);

    expect(authStateChangeHolder.current).toBeDefined();
    authStateChangeHolder.current?.("SIGNED_IN", { user: { id: "user-1" } });

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  // 12. Redirects to /reset-password when the URL signals a recovery flow
  it("redirects to /reset-password when the session change is a recovery link", () => {
    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        href: "https://example.com/auth?type=recovery",
      },
      writable: true,
    });

    render(<Auth />);

    expect(authStateChangeHolder.current).toBeDefined();
    authStateChangeHolder.current?.("PASSWORD_RECOVERY", {
      user: { id: "user-1" },
    });

    expect(mockNavigate).toHaveBeenCalledWith("/reset-password");
    expect(mockNavigate).not.toHaveBeenCalledWith("/dashboard");
  });

  // 13. Does not navigate when onAuthStateChange reports no session (e.g. sign-out)
  it("does not navigate when there is no session", () => {
    render(<Auth />);

    expect(authStateChangeHolder.current).toBeDefined();
    authStateChangeHolder.current?.("SIGNED_OUT", null);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});