import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import StepCounter from "./index";
import AllProviders from "@/test/AllProviders";

describe("StepCounter Component", () => {
  it("renders the Step Counter page correctly", () => {
    render(
      <AllProviders>
        <StepCounter />
      </AllProviders>
    );
    expect(screen.getAllByText(/Step Counter/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <StepCounter />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "8000" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Step Count/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
