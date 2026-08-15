import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import TemperatureLog from "./index";
import AllProviders from "@/test/AllProviders";

describe("TemperatureLog Component", () => {
  it("renders the Temperature Log page correctly", () => {
    render(
      <AllProviders>
        <TemperatureLog />
      </AllProviders>
    );
    expect(screen.getAllByText(/Temperature Log/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <TemperatureLog />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "37.2" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Temperature/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
