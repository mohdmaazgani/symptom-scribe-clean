import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CategoryBadge } from "../CategoryBadge";

describe("CategoryBadge Component", () => {
  it("renders default General category when none provided", () => {
    render(<CategoryBadge />);
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("renders specific category name correctly", () => {
    render(<CategoryBadge category="Respiratory" />);
    expect(screen.getByText("Respiratory")).toBeInTheDocument();
  });

  it("renders custom category with proper styling", () => {
    render(<CategoryBadge category="Neurological" className="test-custom-class" />);
    const badge = screen.getByText("Neurological").closest("span");
    expect(badge).toHaveClass("test-custom-class");
  });
});
