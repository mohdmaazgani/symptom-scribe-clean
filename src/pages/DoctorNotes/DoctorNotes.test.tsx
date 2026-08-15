import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import DoctorNotes from "./index";
import AllProviders from "@/test/AllProviders";

describe("DoctorNotes Component", () => {
  it("renders the Doctor Visit Notes page correctly", () => {
    render(
      <AllProviders>
        <DoctorNotes />
      </AllProviders>
    );
    expect(screen.getAllByText(/Doctor Visit Notes/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <DoctorNotes />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Annual check-up" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Doctor Note/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
