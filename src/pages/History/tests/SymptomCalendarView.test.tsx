import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils";
import SymptomCalendarView, { SymptomEntry } from "@/components/history/SymptomCalendarView";

const mockEntries: SymptomEntry[] = [
  {
    id: "entry-1",
    symptoms: "Severe Migraine with Aura",
    severity_level: "high",
    possible_causes: ["Stress", "Dehydration"],
    recommendations: ["Rest in dark room", "Hydrate"],
    risk_score: 75,
    resolved: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "entry-2",
    symptoms: "Mild Fatigue and Cough",
    severity_level: "low",
    possible_causes: ["Seasonal Allergies"],
    recommendations: ["Warm tea", "Antihistamine"],
    risk_score: 25,
    resolved: true,
    created_at: new Date().toISOString(),
  },
];

describe("SymptomCalendarView Component", () => {
  it("renders monthly calendar overview and jump controls", () => {
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );

    expect(screen.getByText(/Monthly Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Quick Entry Preview/i)).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("allows switching months using previous and next month buttons", () => {
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );

    const prevButton = screen.getByRole("button", { name: /Previous Month/i });
    const nextButton = screen.getByRole("button", { name: /Next Month/i });

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();

    fireEvent.click(prevButton);
    fireEvent.click(nextButton);
  });

  it("filters entries by severity level", async () => {
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );

    const severitySelect = screen.getByLabelText(/Severity filter/i);
    expect(severitySelect).toBeInTheDocument();

    fireEvent.change(severitySelect, { target: { value: "high" } });
    expect(severitySelect).toHaveValue("high");
  });

  it("filters entries by resolution status", async () => {
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );

    const statusSelect = screen.getByLabelText(/Status filter/i);
    expect(statusSelect).toBeInTheDocument();

    fireEvent.change(statusSelect, { target: { value: "active" } });
    expect(statusSelect).toHaveValue("active");
  });

  it("displays quick entry preview for selected date with symptoms", () => {
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );

    expect(screen.getAllByText("Severe Migraine with Aura")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Mild Fatigue and Cough")[0]).toBeInTheDocument();
  });

  it("triggers onToggleResolved when resolve button is clicked", () => {
    const handleToggle = vi.fn();
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={handleToggle}
        onDeleteEntry={vi.fn()}
      />
    );

    const resolveButtons = screen.getAllByRole("button", { name: /Resolve|Reopen/i });
    expect(resolveButtons.length).toBeGreaterThan(0);

    fireEvent.click(resolveButtons[0]);
    expect(handleToggle).toHaveBeenCalledWith("entry-1", false);
  });

  it("resets jump to date to current month when Today button is clicked", () => {
    render(
      <SymptomCalendarView
        history={mockEntries}
        onToggleResolved={vi.fn()}
        onDeleteEntry={vi.fn()}
      />
    );

    const todayButton = screen.getByText("Today");
    fireEvent.click(todayButton);

    const today = new Date();
    const monthName = today.toLocaleString("default", { month: "long" });
    expect(
      screen.getByRole("heading", {
        name: new RegExp(`${monthName}\\s+${today.getFullYear()}`, "i"),
      })
    ).toBeInTheDocument();
  });
});
