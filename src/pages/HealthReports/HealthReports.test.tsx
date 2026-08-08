import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import HealthReports from "./index";
import AllProviders from "@/test/AllProviders";

describe("HealthReports Component", () => {
  it("renders configuration form correctly by default", () => {
    render(
      <AllProviders>
        <HealthReports />
      </AllProviders>
    );

    expect(screen.getByText(/Health Reports/i)).toBeInTheDocument();
    expect(screen.getByText(/Report Settings/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download PDF Report/i })).toBeInTheDocument();
  });

  it("handles toggling of report categories correctly", async () => {
    render(
      <AllProviders>
        <HealthReports />
      </AllProviders>
    );

    const metricsToggle = screen.getByText("Vital Signs & Trends");
    
    fireEvent.click(metricsToggle);
    expect(screen.getByText(/Metrics chart visualization is disabled/i)).toBeInTheDocument();

    fireEvent.click(metricsToggle);
    expect(screen.queryByText(/Metrics chart visualization is disabled/i)).not.toBeInTheDocument();
  });

  it("changes selected date range when options are clicked", () => {
    render(
      <AllProviders>
        <HealthReports />
      </AllProviders>
    );

    const sevenDaysBtn = screen.getByRole("button", { name: "7 Days" });
    fireEvent.click(sevenDaysBtn);

    expect(screen.getByText("7 Days Period")).toBeInTheDocument();
  });
});