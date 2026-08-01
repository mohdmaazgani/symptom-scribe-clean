import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AccessibilityProvider, useAccessibility } from "./AccessibilityContext";
import { AccessibilityPanel } from "./AccessibilityPanel";

const TestConsumer = () => {
  const {
    settings,
    setFontSize,
    setHighContrast,
    setDyslexiaFont,
    setIncreasedSpacing,
    setFocusHighlight,
    resetDefaults,
    announcement,
  } = useAccessibility();

  return (
    <div>
      <span data-testid="font-size">{settings.fontSize}</span>
      <span data-testid="high-contrast">{settings.highContrast ? "true" : "false"}</span>
      <span data-testid="dyslexia-font">{settings.dyslexiaFont ? "true" : "false"}</span>
      <span data-testid="spacing">{settings.increasedSpacing ? "true" : "false"}</span>
      <span data-testid="focus">{settings.focusHighlight ? "true" : "false"}</span>
      <span data-testid="announcement">{announcement}</span>

      <button onClick={() => setFontSize("large")}>Set Large Font</button>
      <button onClick={() => setHighContrast(true)}>Enable High Contrast</button>
      <button onClick={() => setDyslexiaFont(true)}>Enable Dyslexia Font</button>
      <button onClick={() => setIncreasedSpacing(true)}>Enable Spacing</button>
      <button onClick={() => setFocusHighlight(true)}>Enable Focus Ring</button>
      <button onClick={resetDefaults}>Reset</button>
    </div>
  );
};

describe("AccessibilityContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("provides default accessibility settings", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("font-size").textContent).toBe("normal");
    expect(screen.getByTestId("high-contrast").textContent).toBe("false");
    expect(screen.getByTestId("dyslexia-font").textContent).toBe("false");
    expect(screen.getByTestId("spacing").textContent).toBe("false");
    expect(screen.getByTestId("focus").textContent).toBe("false");
  });

  it("updates font size and adds CSS class to document root", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("Set Large Font"));

    expect(screen.getByTestId("font-size").textContent).toBe("large");
    expect(document.documentElement.classList.contains("a11y-font-large")).toBe(true);
  });

  it("toggles high contrast mode and updates document class", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("Enable High Contrast"));

    expect(screen.getByTestId("high-contrast").textContent).toBe("true");
    expect(document.documentElement.classList.contains("a11y-high-contrast")).toBe(true);
  });

  it("toggles dyslexia font option and updates document class", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("Enable Dyslexia Font"));

    expect(screen.getByTestId("dyslexia-font").textContent).toBe("true");
    expect(document.documentElement.classList.contains("a11y-dyslexia-font")).toBe(true);
  });

  it("toggles increased spacing and focus highlight", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("Enable Spacing"));
    fireEvent.click(screen.getByText("Enable Focus Ring"));

    expect(document.documentElement.classList.contains("a11y-increased-spacing")).toBe(true);
    expect(document.documentElement.classList.contains("a11y-focus-highlight")).toBe(true);
  });

  it("resets accessibility settings to defaults", () => {
    render(
      <AccessibilityProvider>
        <TestConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByText("Set Large Font"));
    fireEvent.click(screen.getByText("Enable High Contrast"));
    fireEvent.click(screen.getByText("Reset"));

    expect(screen.getByTestId("font-size").textContent).toBe("normal");
    expect(screen.getByTestId("high-contrast").textContent).toBe("false");
    expect(document.documentElement.classList.contains("a11y-high-contrast")).toBe(false);
  });

  it("renders AccessibilityPanel with interactive controls", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityPanel />
      </AccessibilityProvider>
    );

    expect(screen.getByText("Accessibility Mode")).toBeInTheDocument();
    expect(screen.getByText("Normal")).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("High-Contrast Mode")).toBeInTheDocument();
    expect(screen.getByText("Dyslexia-Friendly Font")).toBeInTheDocument();
  });
});
