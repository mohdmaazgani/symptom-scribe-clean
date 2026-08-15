import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import DentalLog from "./index";
import AllProviders from "@/test/AllProviders";

describe("DentalLog Component", () => {
  it("renders the Dental Health Log page correctly", () => {
    render(
      <AllProviders>
        <DentalLog />
      </AllProviders>
    );
    expect(screen.getAllByText(/Dental Health Log/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <DentalLog />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Brushed" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Dental Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
