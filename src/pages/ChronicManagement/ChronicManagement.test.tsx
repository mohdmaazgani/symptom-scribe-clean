import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import ChronicManagement from "./index";
import AllProviders from "@/test/AllProviders";

describe("ChronicManagement Component", () => {
  it("renders logs status and default values", () => {
    render(
      <AllProviders>
        <ChronicManagement />
      </AllProviders>
    );

    expect(screen.getByText(/Chronic Management/i)).toBeInTheDocument();
    expect(screen.getByText(/No vital signs recorded today/i)).toBeInTheDocument();
  });

  it("adds vital metrics entries and triggers spikes warnings", async () => {
    render(
      <AllProviders>
        <ChronicManagement />
      </AllProviders>
    );

    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "190" } });

    const submitBtn = screen.getByRole("button", { name: "Save vital sign entry" });
    fireEvent.click(submitBtn);

    expect(screen.getAllByText(/190 mg\/dL/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Spike")).toBeInTheDocument();
  });
});