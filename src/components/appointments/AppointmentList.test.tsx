import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AppointmentList, Appointment } from "./AppointmentList";

const mockAppointments: Appointment[] = [
  {
    id: "appt-1",
    user_id: "user-123",
    doctor_name: "Dr. Sarah Jenkins",
    specialty: "Cardiology",
    appointment_date: "2026-08-20T10:30:00Z",
    location: "City Hospital, Suite 400",
    notes: "Bring blood pressure log",
    status: "upcoming",
    file_url: "https://example.com/lab-result.pdf",
    file_name: "lab-result.pdf",
    symptom_history_id: null,
    reminder_sent: false,
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  },
];

describe("AppointmentList", () => {
  it("renders empty state when no appointments exist", () => {
    render(
      <AppointmentList
        appointments={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );

    expect(screen.getByText(/no appointments scheduled/i)).toBeInTheDocument();
  });

  it("renders appointment cards with details and attached files", () => {
    render(
      <AppointmentList
        appointments={mockAppointments}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onUpdateStatus={vi.fn()}
      />
    );

    expect(screen.getByText("Dr. Sarah Jenkins")).toBeInTheDocument();
    expect(screen.getByText("Cardiology")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText(/City Hospital, Suite 400/i)).toBeInTheDocument();
    expect(screen.getByText(/Attached File: lab-result.pdf/i)).toBeInTheDocument();
  });

  it("triggers onUpdateStatus when Mark Completed button is clicked", () => {
    const handleUpdateStatus = vi.fn();
    render(
      <AppointmentList
        appointments={mockAppointments}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onUpdateStatus={handleUpdateStatus}
      />
    );

    const markCompletedBtn = screen.getByRole("button", { name: /mark completed/i });
    fireEvent.click(markCompletedBtn);

    expect(handleUpdateStatus).toHaveBeenCalledWith("appt-1", "completed");
  });
});
