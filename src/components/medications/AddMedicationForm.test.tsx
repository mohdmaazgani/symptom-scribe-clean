import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddMedicationForm } from "./AddMedicationForm";

describe("AddMedicationForm", () => {
  it("renders form inputs correctly", () => {
    render(<AddMedicationForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/medication name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dosage \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date \*/i)).toBeInTheDocument();
  });

  it("displays validation error when required fields are empty on submit", async () => {
    const handleSubmit = vi.fn();
    render(<AddMedicationForm onSubmit={handleSubmit} />);

    const submitBtn = screen.getByRole("button", { name: /add medication/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/medication name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/dosage is required/i)).toBeInTheDocument();
    });

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits form data successfully when valid inputs are provided", async () => {
    const handleSubmit = vi.fn();
    render(<AddMedicationForm onSubmit={handleSubmit} />);

    fireEvent.change(screen.getByLabelText(/medication name \*/i), {
      target: { value: "Amoxicillin" },
    });
    fireEvent.change(screen.getByLabelText(/dosage \*/i), {
      target: { value: "500mg" },
    });
    fireEvent.change(screen.getByLabelText(/start date \*/i), {
      target: { value: "2026-08-10" },
    });

    const submitBtn = screen.getByRole("button", { name: /add medication/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Amoxicillin",
          dosage: "500mg",
          start_date: "2026-08-10",
        })
      );
    });
  });
});
