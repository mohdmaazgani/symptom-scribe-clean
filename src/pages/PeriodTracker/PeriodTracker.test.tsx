import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import PeriodTracker from "./index";
import AllProviders from "@/test/AllProviders";

describe("PeriodTracker Component", () => {
  it("renders the Cycle Tracker page correctly", () => {
    render(
      <AllProviders>
        <PeriodTracker />
      </AllProviders>
    );
    expect(screen.getAllByText(/Cycle Tracker/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <PeriodTracker />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Day 1" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Cycle Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
