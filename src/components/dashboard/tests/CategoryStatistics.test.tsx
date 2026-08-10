import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CategoryStatistics } from "../CategoryStatistics";

describe("CategoryStatistics Component", () => {
  const mockSymptoms = [
    { id: "1", symptoms: "Coughing", category: "Respiratory", severity_level: "low", resolved: true },
    { id: "2", symptoms: "Asthma attack", category: "Respiratory", severity_level: "high", resolved: false },
    { id: "3", symptoms: "Stomach ache", category: "Digestive", severity_level: "moderate", resolved: false },
  ];

  it("returns null when symptoms array is empty", () => {
    const { container } = render(<CategoryStatistics symptoms={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders category counts and statistics correctly", () => {
    render(<CategoryStatistics symptoms={mockSymptoms} />);
    expect(screen.getByText("Category Statistics")).toBeInTheDocument();
    expect(screen.getByText("Respiratory")).toBeInTheDocument();
    expect(screen.getByText("Digestive")).toBeInTheDocument();
    expect(screen.getByText("3 Total Logged")).toBeInTheDocument();
  });

  it("triggers category selection callback on click", () => {
    const onSelectMock = vi.fn();
    render(<CategoryStatistics symptoms={mockSymptoms} onSelectCategoryFilter={onSelectMock} />);
    
    const respiratoryCard = screen.getByText("Respiratory").closest("div");
    if (respiratoryCard) {
      fireEvent.click(respiratoryCard);
      expect(onSelectMock).toHaveBeenCalled();
    }
  });
});
