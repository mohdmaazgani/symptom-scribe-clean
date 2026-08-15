import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import WaterReminder from "./index";
import AllProviders from "@/test/AllProviders";

describe("WaterReminder Component", () => {
  it("renders the Water Reminder page correctly", () => {
    render(
      <AllProviders>
        <WaterReminder />
      </AllProviders>
    );
    expect(screen.getAllByText(/Water Reminder/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <WaterReminder />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "250" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Water Intake/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
