import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import HearingHealth from "./index";
import AllProviders from "@/test/AllProviders";

describe("HearingHealth Component", () => {
  it("renders the Hearing Health Monitor page correctly", () => {
    render(
      <AllProviders>
        <HearingHealth />
      </AllProviders>
    );
    expect(screen.getAllByText(/Hearing Health Monitor/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <HearingHealth />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "85 dB" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Hearing Data/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
