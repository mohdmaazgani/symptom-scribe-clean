import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddAppointmentForm } from "./AddAppointmentForm";

describe("AddAppointmentForm", () => {
  it("renders form inputs correctly", () => {
    render(<AddAppointmentForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/doctor \/ provider name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/specialty \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date & time \*/i)).toBeInTheDocument();
  });

  it("displays validation error when required inputs are missing", async () => {
    const handleSubmit = vi.fn();
    render(<AddAppointmentForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole("button", { name: /add appointment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/healthcare provider name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/specialty is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid appointment data", async () => {
    const handleSubmit = vi.fn();
    render(<AddAppointmentForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/doctor \/ provider name \*/i), {
      target: { value: "Dr. Sarah Jenkins" },
    });
    fireEvent.change(screen.getByLabelText(/specialty \*/i), {
      target: { value: "Cardiology" },
    });
    fireEvent.change(screen.getByLabelText(/date & time \*/i), {
      target: { value: "2026-08-20T10:30" },
    });

    const submitBtn = screen.getByRole("button", { name: /add appointment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          doctor_name: "Dr. Sarah Jenkins",
          specialty: "Cardiology",
          appointment_date: "2026-08-20T10:30",
        }),
        null
      );
    });
  });
});
