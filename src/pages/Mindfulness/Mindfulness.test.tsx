import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import Mindfulness from "./index";
import AllProviders from "@/test/AllProviders";

describe("Mindfulness Component", () => {
  it("renders headers and select cards correctly", () => {
    render(
      <AllProviders>
        <Mindfulness />
      </AllProviders>
    );

    expect(screen.getByText(/Guided Breathing/i)).toBeInTheDocument();
    expect(screen.getByText("Completed Cycles this session")).toBeInTheDocument();
  });

  it("handles starting and toggling breathing guide states", () => {
    render(
      <AllProviders>
        <Mindfulness />
      </AllProviders>
    );

    const startBtn = screen.getByRole("button", { name: "Start Guide" });
    fireEvent.click(startBtn);

    expect(screen.getByRole("button", { name: "Pause Guide" })).toBeInTheDocument();
  });
});