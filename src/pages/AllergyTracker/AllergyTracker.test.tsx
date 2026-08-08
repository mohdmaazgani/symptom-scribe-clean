import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import AllergyTracker from "./index";
import AllProviders from "@/test/AllProviders";

describe("AllergyTracker Component", () => {
  it("renders default layout and warning text", () => {
    render(
      <AllProviders>
        <AllergyTracker />
      </AllProviders>
    );

    expect(screen.getByText(/Allergy Diary/i)).toBeInTheDocument();
    expect(screen.getByText(/Low allergen exposure logged/i)).toBeInTheDocument();
  });

  it("handles logging reactions and updates risk badge rating", async () => {
    render(
      <AllProviders>
        <AllergyTracker />
      </AllProviders>
    );

    const logBtn = screen.getByRole("button", { name: "Log Reaction Entry" });
    fireEvent.click(logBtn);

    expect(screen.getAllByText("Tree Pollen").length).toBeGreaterThan(0);
    expect(screen.getByText(/medium Risk/i)).toBeInTheDocument();
  });
});