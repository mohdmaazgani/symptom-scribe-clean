import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import VisionTracker from "./index";
import AllProviders from "@/test/AllProviders";

describe("VisionTracker Component", () => {
  it("renders the Vision Health page correctly", () => {
    render(
      <AllProviders>
        <VisionTracker />
      </AllProviders>
    );
    expect(screen.getAllByText(/Vision Health/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <VisionTracker />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "20/20" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Vision Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
