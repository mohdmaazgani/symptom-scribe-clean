import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import SleepTracker from "./index";
import AllProviders from "@/test/AllProviders";

describe("SleepTracker Component", () => {
  it("renders clock elements and checklists correctly", () => {
    render(
      <AllProviders>
        <SleepTracker />
      </AllProviders>
    );

    expect(screen.getByText(/Sleep Advisor/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Wakeup Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Sleep Hygiene Assessment/i)).toBeInTheDocument();
  });

  it("calculates bedtimes and updates lists on checklist clicking", () => {
    render(
      <AllProviders>
        <SleepTracker />
      </AllProviders>
    );

    const checklistItem = screen.getByText(/No caffeine within 6 hours/i);
    expect(screen.getByText("0%")).toBeInTheDocument();

    fireEvent.click(checklistItem);
    expect(screen.getByText("20%")).toBeInTheDocument();
  });
});