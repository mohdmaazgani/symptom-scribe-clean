import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import SleepQuality from "./index";
import AllProviders from "@/test/AllProviders";

describe("SleepQuality Component", () => {
  it("renders the Sleep Quality Log page correctly", () => {
    render(
      <AllProviders>
        <SleepQuality />
      </AllProviders>
    );
    expect(screen.getAllByText(/Sleep Quality Log/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <SleepQuality />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "7.5 hours" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Sleep Quality/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
