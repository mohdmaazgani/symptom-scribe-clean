import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import EmergencyContacts from "./index";
import AllProviders from "@/test/AllProviders";

describe("EmergencyContacts Component", () => {
  it("renders the Emergency Contacts page correctly", () => {
    render(
      <AllProviders>
        <EmergencyContacts />
      </AllProviders>
    );
    expect(screen.getAllByText(/Emergency Contacts/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Log New Entry/i)[0]).toBeInTheDocument();
  });

  it("adds an entry when form is filled and submitted", () => {
    render(
      <AllProviders>
        <EmergencyContacts />
      </AllProviders>
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Dr. Smith" } });
    fireEvent.click(screen.getByRole("button", { name: /Save Contact/i }));
    expect(screen.getByText(/1 entries/i)).toBeInTheDocument();
  });
});
