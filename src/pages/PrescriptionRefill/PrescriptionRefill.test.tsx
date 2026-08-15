import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import PrescriptionRefill from "./index";
import AllProviders from "@/test/AllProviders";

describe("PrescriptionRefill Component", () => {
  it("renders the Prescription Refill Tracker page correctly", () => {
    render(
      <AllProviders>
        <PrescriptionRefill />
      </AllProviders>
    );
    expect(screen.getAllByText(/Prescription Refill Tracker/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <PrescriptionRefill />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Lisinopril" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Prescription Info/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
