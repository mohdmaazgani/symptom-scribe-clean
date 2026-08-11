import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import MedicationChecker from "./index";
import AllProviders from "@/test/AllProviders";

describe("MedicationChecker Component", () => {
  it("renders search box and shows instructions when list is empty", () => {
    render(
      <AllProviders>
        <MedicationChecker />
      </AllProviders>
    );

    expect(screen.getByPlaceholderText(/Ibuprofen, Warfarin, Aspirin/i)).toBeInTheDocument();
    expect(screen.getByText(/Awaiting Analysis/i)).toBeInTheDocument();
  });

  it("handles searching, selecting and showing interactions between Aspirin and Warfarin", async () => {
    render(
      <AllProviders>
        <MedicationChecker />
      </AllProviders>
    );

    const input = screen.getByPlaceholderText(/Ibuprofen, Warfarin, Aspirin/i);

    fireEvent.change(input, { target: { value: "Warfarin" } });
    const warfarinOption = await screen.findByText("Warfarin");
    fireEvent.click(warfarinOption);

    fireEvent.change(input, { target: { value: "Aspirin" } });
    const aspirinOption = await screen.findByText("Aspirin");
    fireEvent.click(aspirinOption);

    expect(screen.getByText("2 Added")).toBeInTheDocument();
    expect(screen.getByText(/Potential Issues Flagged/i)).toBeInTheDocument();
    expect(screen.getByText(/Severe Danger/i)).toBeInTheDocument();
    expect(screen.getByText(/GI mucosa/i)).toBeInTheDocument();
  });
});