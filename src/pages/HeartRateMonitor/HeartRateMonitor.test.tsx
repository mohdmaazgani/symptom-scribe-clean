import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import HeartRateMonitor from "./index";
import AllProviders from "@/test/AllProviders";

describe("HeartRateMonitor Component", () => {
  it("renders the heart rate monitor page correctly", () => {
    render(
      <AllProviders>
        <HeartRateMonitor />
      </AllProviders>
    );
    expect(screen.getByText(/Heart Rate Monitor/i)).toBeInTheDocument();
    expect(screen.getByText(/Record Heart Rate/i)).toBeInTheDocument();
  });

  it("logs a heart rate reading when BPM and context are provided", () => {
    render(
      <AllProviders>
        <HeartRateMonitor />
      </AllProviders>
    );
    fireEvent.change(document.querySelector('input[type="number"]')!, { target: { value: "72" } });
    fireEvent.click(screen.getByText("Resting"));
    fireEvent.click(screen.getByRole("button", { name: /Log Heart Rate/i }));
    expect(screen.getByText(/1 readings/i)).toBeInTheDocument();
  });
});
