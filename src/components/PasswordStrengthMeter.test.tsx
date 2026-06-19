/**
 * Tests for the PasswordStrengthMeter component.
 *
 * This component encapsulates meaningful application logic:
 *  - Password strength evaluation
 *  - Requirements checklist (8+ chars, uppercase, numbers, symbols)
 *  - Show / hide password toggle
 *  - Generate strong password button
 *  - Copy to clipboard interaction
 *
 * ## Mocking strategy
 *
 * `navigator.clipboard` is mocked via `vi.stubGlobal` because jsdom does not
 * implement it. The `generateStrongPassword` utility is tested separately in
 * password-strength.test.ts; here we only verify the component reacts
 * correctly to its output.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test/utils";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

// ---------------------------------------------------------------------------
// Clipboard mock
// ---------------------------------------------------------------------------
const writeTextMock = vi.fn().mockResolvedValue(undefined);

function mockClipboard() {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextMock },
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderMeter(value: string, onChange = vi.fn()) {
  return render(<PasswordStrengthMeter value={value} onChange={onChange} />);
}

function getPasswordInput() {
  return screen.getByLabelText(/password/i, { selector: "input" });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("PasswordStrengthMeter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard();
  });

  // 1. Basic rendering
  it("renders the password label and input", () => {
    renderMeter("");
    expect(getPasswordInput()).toBeInTheDocument();
  });

  // 2. Strength meter is hidden when the field is empty
  it("does not render the strength bar when the input is empty", () => {
    renderMeter("");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  // 3. Strength meter appears when the user starts typing
  it("shows the strength bar when a value is provided", () => {
    renderMeter("hello");
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  // 4. Show / hide toggle changes the input type
  it("toggles password visibility when the eye button is clicked", async () => {
    const user = userEvent.setup();
    renderMeter("secret123");

    const input = getPasswordInput();
    expect(input).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: /show password/i });
    await user.click(toggleBtn);

    expect(input).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: /hide password/i })
    ).toBeInTheDocument();
  });

  // 5. onChange is called with the new value
  it("calls onChange when the user types into the input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordStrengthMeter value="" onChange={onChange} />);

    await user.type(getPasswordInput(), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  // 6. Generate password button calls onChange with a non-empty string
  it("generates a password and calls onChange when the generate button is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordStrengthMeter value="" onChange={onChange} />);

    await user.click(
      screen.getByRole("button", { name: /generate strong password/i })
    );
    expect(onChange).toHaveBeenCalledWith(expect.any(String));
    const generated = onChange.mock.calls[0][0] as string;
    expect(generated.length).toBeGreaterThan(0);
  });

  // 7. Copy button copies the current value to the clipboard
  it("copies the current password to the clipboard when the copy button is clicked", async () => {
    renderMeter("MyStr0ng!Pass");

    const copyBtn = screen.getByRole("button", { name: /copy generated password/i });
    // userEvent.click sometimes has issues with stubbed globals, use fireEvent
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("MyStr0ng!Pass");
    });
  });

  // 8. Weak password shows an error message
  it("shows a validation error for a weak password", () => {
    renderMeter("weak");
    expect(
      screen.getByRole("alert")
    ).toHaveTextContent(/does not meet all requirements/i);
  });

  // 9. Strong password hides the error message
  it("does not show a validation error for a strong password", () => {
    renderMeter("Str0ng!Password#2024");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  // 10. Requirements checklist is rendered for non-empty values
  it("renders the requirements checklist when a value is present", () => {
    renderMeter("partial");
    expect(screen.getByText("Requirements:")).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  // 11. Custom label is rendered correctly
  it("renders a custom label when the label prop is provided", () => {
    render(
      <PasswordStrengthMeter
        value=""
        onChange={vi.fn()}
        label="New Password"
      />
    );
    expect(screen.getByText(/new password/i)).toBeInTheDocument();
  });
});
