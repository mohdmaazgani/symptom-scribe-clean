import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import PageFooter from "./PageFooter";

describe("PageFooter", () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <PageFooter />
      </MemoryRouter>
    );

  it("renders footer branding", () => {
    renderFooter();

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByText("Symptom Scribe")).toBeInTheDocument();
    expect(
      screen.getByText("Health insights with clarity and care.")
    ).toBeInTheDocument();
  });

  it("preserves all legal links", () => {
    renderFooter();

    const links = [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Disclaimer", "/disclaimer"],
      ["Accessibility", "/accessibility"],
    ];

    links.forEach(([name, href]) => {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    });
  });

  it("has accessible legal navigation", () => {
    renderFooter();

    expect(
      screen.getByRole("navigation", { name: /legal footer navigation/i })
    ).toBeInTheDocument();
  });

  it("renders exactly four footer links", () => {
    renderFooter();

    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});