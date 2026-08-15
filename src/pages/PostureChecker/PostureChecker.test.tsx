import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import PostureChecker from "./index";
import AllProviders from "@/test/AllProviders";

describe("PostureChecker Component", () => {
  it("renders the Posture Health Check page correctly", () => {
    render(
      <AllProviders>
        <PostureChecker />
      </AllProviders>
    );
    expect(screen.getAllByText(/Posture Health Check/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <PostureChecker />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Slouching" } });
    fireEvent.click(screen.getByRole("button", { name: /Log Posture Entry/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
