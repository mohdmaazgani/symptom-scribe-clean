import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import BodyMap from "./index";
import AllProviders from "@/test/AllProviders";

describe("BodyMap Component", () => {
  it("renders guidelines and instructions when first loaded", () => {
    render(
      <AllProviders>
        <BodyMap />
      </AllProviders>
    );

    expect(screen.getByText(/Interactive Anatomy Visualizer/i)).toBeInTheDocument();
    expect(screen.getByText(/Click on the biological areas/i)).toBeInTheDocument();
  });

  it("changes region lists when head region is selected", async () => {
    render(
      <AllProviders>
        <BodyMap />
      </AllProviders>
    );

    const headRegion = screen.getByTestId("body-region-head");
    fireEvent.click(headRegion);

    expect(screen.getByText(/head Region/i)).toBeInTheDocument();
    expect(screen.getByText(/Headaches \/ Migraines/i)).toBeInTheDocument();
  });

  it("handles toggling front and back views", () => {
    render(
      <AllProviders>
        <BodyMap />
      </AllProviders>
    );

    const toggleButton = screen.getByText(/Show Back View/i);
    fireEvent.click(toggleButton);

    expect(screen.getByText(/Show Front View/i)).toBeInTheDocument();
  });
});