import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import CalorieBurn from "./index";
import AllProviders from "@/test/AllProviders";

describe("CalorieBurn Component", () => {
  it("renders the Calorie Burn Logger page correctly", () => {
    render(
      <AllProviders>
        <CalorieBurn />
      </AllProviders>
    );
    expect(screen.getAllByText(/Calorie Burn Logger/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <CalorieBurn />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Running" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Activity/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
