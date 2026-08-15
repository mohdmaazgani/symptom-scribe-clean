import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import BloodPressureDiary from "./index";
import AllProviders from "@/test/AllProviders";

describe("BloodPressureDiary Component", () => {
  it("renders the Blood Pressure Diary page correctly", () => {
    render(
      <AllProviders>
        <BloodPressureDiary />
      </AllProviders>
    );
    expect(screen.getAllByText(/Blood Pressure Diary/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <BloodPressureDiary />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "120/80" } });
    fireEvent.click(screen.getByRole("button", { name: /Log BP Reading/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
