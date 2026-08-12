import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExportDataModal } from "./ExportDataModal";
import { TooltipProvider } from "@/components/ui/tooltip";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: "test-user-id" } } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          order: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: new Blob(["test"], { type: "application/pdf" }), error: null }),
    },
  },
}));

describe("ExportDataModal Component", () => {
  it("renders export modal title and format selection options when open", () => {
    render(
      <TooltipProvider>
        <ExportDataModal open={true} />
      </TooltipProvider>
    );

    expect(screen.getByText(/Export Health Data/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF Summary Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Raw CSV Data/i)).toBeInTheDocument();
  });

  it("displays data categories checklist and download button", () => {
    render(
      <TooltipProvider>
        <ExportDataModal open={true} />
      </TooltipProvider>
    );

    expect(screen.getByText(/Symptom Consultations & AI History/i)).toBeInTheDocument();
    expect(screen.getByText(/Vitals & Health Metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/Download Report/i)).toBeInTheDocument();
  });
});
