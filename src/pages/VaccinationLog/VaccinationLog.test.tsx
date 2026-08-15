import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import VaccinationLog from "./index";
import AllProviders from "@/test/AllProviders";

describe("VaccinationLog Component", () => {
  it("renders the vaccination log page correctly", () => {
    render(
      <AllProviders>
        <VaccinationLog />
      </AllProviders>
    );
    expect(screen.getByText(/Vaccination Log/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Immunization History/i)[0]).toBeInTheDocument();
  });

  it("adds a vaccination record when form is filled and submitted", () => {
    render(
      <AllProviders>
        <VaccinationLog />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "COVID-19" } });
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: "2025-01-15" } });
    fireEvent.click(screen.getByRole("button", { name: /Add Vaccination Record/i }));
    expect(screen.getByText("COVID-19")).toBeInTheDocument();
  });
});
