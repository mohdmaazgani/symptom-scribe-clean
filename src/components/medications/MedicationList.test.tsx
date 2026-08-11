import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MedicationList, Medication } from "./MedicationList";

const mockMedications: Medication[] = [
  {
    id: "med-1",
    user_id: "user-123",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "daily",
    times: ["08:00"],
    start_date: "2026-08-01",
    end_date: null,
    notes: "Take in the morning",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
];

describe("MedicationList", () => {
  it("renders empty state when no medications are provided", () => {
    render(
      <MedicationList
        medications={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLogDose={vi.fn()}
      />
    );

    expect(screen.getByText(/no medications added/i)).toBeInTheDocument();
  });

  it("renders medication list cards correctly", () => {
    render(
      <MedicationList
        medications={mockMedications}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLogDose={vi.fn()}
      />
    );

    expect(screen.getByText("Lisinopril")).toBeInTheDocument();
    expect(screen.getByText("10mg")).toBeInTheDocument();
    expect(screen.getByText(/Take in the morning/i)).toBeInTheDocument();
  });

  it("triggers onLogDose with 'taken' when Mark Taken button is clicked", () => {
    const handleLogDose = vi.fn();
    render(
      <MedicationList
        medications={mockMedications}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLogDose={handleLogDose}
      />
    );

    const markTakenBtn = screen.getByRole("button", { name: /mark taken/i });
    fireEvent.click(markTakenBtn);

    expect(handleLogDose).toHaveBeenCalledWith("med-1", "taken");
  });

  it("triggers onLogDose with 'skipped' when Mark Skipped button is clicked", () => {
    const handleLogDose = vi.fn();
    render(
      <MedicationList
        medications={mockMedications}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLogDose={handleLogDose}
      />
    );

    const markSkippedBtn = screen.getByRole("button", { name: /mark skipped/i });
    fireEvent.click(markSkippedBtn);

    expect(handleLogDose).toHaveBeenCalledWith("med-1", "skipped");
  });
});
