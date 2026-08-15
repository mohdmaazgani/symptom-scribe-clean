import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import OxygenSaturation from "./index";
import AllProviders from "@/test/AllProviders";

describe("OxygenSaturation Component", () => {
  it("renders the SpO2 Monitor page correctly", () => {
    render(
      <AllProviders>
        <OxygenSaturation />
      </AllProviders>
    );
    expect(screen.getAllByText(/SpO2 Monitor/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <OxygenSaturation />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "98%" } });
    fireEvent.click(screen.getByRole("button", { name: /Log SpO2 Reading/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
