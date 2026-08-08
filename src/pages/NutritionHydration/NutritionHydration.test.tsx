import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import NutritionHydration from "./index";
import AllProviders from "@/test/AllProviders";

describe("NutritionHydration Component", () => {
  it("renders page layouts and intake defaults correctly", () => {
    render(
      <AllProviders>
        <NutritionHydration />
      </AllProviders>
    );

    expect(screen.getByText(/Nutrition & Hydration/i)).toBeInTheDocument();
    expect(screen.getByText("0 ml / 2000 ml")).toBeInTheDocument();
  });

  it("handles fluid increments correctly on click", async () => {
    render(
      <AllProviders>
        <NutritionHydration />
      </AllProviders>
    );

    const addBtn = screen.getByText("+250 ml (Cup)");
    fireEvent.click(addBtn);

    expect(screen.getByText("250 ml / 2000 ml")).toBeInTheDocument();
  });

  it("handles meal inputs and logs calories details", async () => {
    render(
      <AllProviders>
        <NutritionHydration />
      </AllProviders>
    );

    const descInput = screen.getByPlaceholderText(/Oatmeal with honey/i);
    const kcalInput = screen.getByPlaceholderText("e.g. 350");
    const submitBtn = screen.getByRole("button", { name: "Log Item" });

    fireEvent.change(descInput, { target: { value: "Protein Shake" } });
    fireEvent.change(kcalInput, { target: { value: "300" } });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Protein Shake")).toBeInTheDocument();
    expect(screen.getByText("300 kcal")).toBeInTheDocument();
  });
});