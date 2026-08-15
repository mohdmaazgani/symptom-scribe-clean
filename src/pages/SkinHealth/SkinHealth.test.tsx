import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import SkinHealth from "./index";
import AllProviders from "@/test/AllProviders";

describe("SkinHealth Component", () => {
  it("renders the Skin Health Tracker page correctly", () => {
    render(
      <AllProviders>
        <SkinHealth />
      </AllProviders>
    );
    expect(screen.getAllByText(/Skin Health Tracker/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <SkinHealth />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Acne" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Skin Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
