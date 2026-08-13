import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import DigestiveTracker from "./index";
import AllProviders from "@/test/AllProviders";

describe("DigestiveTracker Component", () => {
  it("renders the Digestive Tracker page correctly", () => {
    render(
      <AllProviders>
        <DigestiveTracker />
      </AllProviders>
    );
    expect(screen.getAllByText(/Digestive Tracker/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <DigestiveTracker />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Type 4 - Normal" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Digestive Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
