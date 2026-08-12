import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import PainJournal from "./index";
import AllProviders from "@/test/AllProviders";

describe("PainJournal Component", () => {
  it("renders the pain journal page with all key UI elements", () => {
    render(
      <AllProviders>
        <PainJournal />
      </AllProviders>
    );
    expect(screen.getByText(/Pain Journal/i)).toBeInTheDocument();
    expect(screen.getByText(/Log Pain Entry/i)).toBeInTheDocument();
    expect(screen.getByText(/Pain History/i)).toBeInTheDocument();
  });

  it("allows adding a pain entry by selecting location and pain type", () => {
    render(
      <AllProviders>
        <PainJournal />
      </AllProviders>
    );
    fireEvent.click(screen.getByText("Head"));
    fireEvent.click(screen.getByText("Aching"));
    fireEvent.click(screen.getByRole("button", { name: /Log Pain Entry/i }));
    expect(screen.getByText(/1 Entries/i)).toBeInTheDocument();
  });
});
