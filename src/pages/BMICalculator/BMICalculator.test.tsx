import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import BMICalculator from "./index";
import AllProviders from "@/test/AllProviders";

describe("BMICalculator Component", () => {
  it("renders BMI Calculator page correctly", () => {
    render(
      <AllProviders>
        <BMICalculator />
      </AllProviders>
    );
    expect(screen.getByText(/BMI Calculator/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Measurements/i)).toBeInTheDocument();
  });

  it("calculates BMI and shows result category", () => {
    render(
      <AllProviders>
        <BMICalculator />
      </AllProviders>
    );
    const inputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(inputs[0], { target: { value: "175" } });
    fireEvent.change(inputs[1], { target: { value: "70" } });
    fireEvent.click(screen.getByRole("button", { name: /Calculate BMI/i }));
    expect(screen.getAllByText(/Normal/i)[0]).toBeInTheDocument();
  });
});
