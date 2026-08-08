import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import FitnessPlanner from "./index";
import AllProviders from "@/test/AllProviders";

describe("FitnessPlanner Component", () => {
  it("renders lists and summary elements correctly", () => {
    render(
      <AllProviders>
        <FitnessPlanner />
      </AllProviders>
    );

    expect(screen.getByText(/Fitness Planner/i)).toBeInTheDocument();
    expect(screen.getByText("0 kcal")).toBeInTheDocument();
  });

  it("updates selected activity details on click", async () => {
    render(
      <AllProviders>
        <FitnessPlanner />
      </AllProviders>
    );

    const exerciseSelect = screen.getByText("Hatha Yoga / Stretching");
    fireEvent.click(exerciseSelect);

    expect(screen.getByText("MET index: 2.5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Commit Activity Log" })).toBeInTheDocument();
  });
});