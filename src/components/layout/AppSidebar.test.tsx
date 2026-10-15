import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import AllProviders from "@/test/AllProviders";

describe("AppSidebar Component", () => {
  it("renders the Digestive Tracker navigation item with valid title and link", () => {
    render(
      <AllProviders>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </AllProviders>
    );

    const digestiveLink = screen.getByRole("link", { name: /Digestive Tracker/i });
    expect(digestiveLink).toBeInTheDocument();
    expect(digestiveLink).toHaveAttribute("href", "/digestive-tracker");
  });
});
