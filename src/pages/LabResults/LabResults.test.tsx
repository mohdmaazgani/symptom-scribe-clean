import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import LabResults from "./index";
import AllProviders from "@/test/AllProviders";

describe("LabResults Component", () => {
  it("renders the Lab Results Vault page correctly", () => {
    render(
      <AllProviders>
        <LabResults />
      </AllProviders>
    );
    expect(screen.getAllByText(/Lab Results Vault/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <LabResults />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "HbA1c" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Lab Result/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
