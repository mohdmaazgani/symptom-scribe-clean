import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import TriggerAnalyzer from "./index";
import AllProviders from "@/test/AllProviders";

describe("TriggerAnalyzer Component", () => {
  it("renders the Symptom Trigger Analyzer page correctly", () => {
    render(
      <AllProviders>
        <TriggerAnalyzer />
      </AllProviders>
    );
    expect(screen.getAllByText(/Symptom Trigger Analyzer/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <TriggerAnalyzer />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Headache" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Trigger Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
