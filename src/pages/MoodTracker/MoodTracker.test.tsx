import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import MoodTracker from "./index";
import AllProviders from "@/test/AllProviders";

describe("MoodTracker Component", () => {
  it("renders the mood tracker page with all key UI elements", () => {
    render(
      <AllProviders>
        <MoodTracker />
      </AllProviders>
    );
    expect(screen.getByText(/Mood Tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/How are you feeling/i)).toBeInTheDocument();
    expect(screen.getByText(/Mood Log/i)).toBeInTheDocument();
  });

  it("logs a mood entry when a mood is selected and button clicked", () => {
    render(
      <AllProviders>
        <MoodTracker />
      </AllProviders>
    );
    fireEvent.click(screen.getByLabelText("Great"));
    fireEvent.click(screen.getByRole("button", { name: /Log Today's Mood/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
