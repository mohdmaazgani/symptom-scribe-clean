import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import StressLevel from "./index";
import AllProviders from "@/test/AllProviders";

describe("StressLevel Component", () => {
  it("renders stress tracker page with key elements", () => {
    render(
      <AllProviders>
        <StressLevel />
      </AllProviders>
    );
    expect(screen.getByText(/Stress & Burnout/i)).toBeInTheDocument();
    expect(screen.getByText(/Rate Your Stress/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Coping Strategies/i)[0]).toBeInTheDocument();
  });

  it("logs a stress entry and updates count", () => {
    render(
      <AllProviders>
        <StressLevel />
      </AllProviders>
    );
    fireEvent.click(screen.getByRole("button", { name: /Log Stress Level/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
