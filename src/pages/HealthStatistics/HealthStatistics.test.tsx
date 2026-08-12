import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import HealthStatistics from "./index";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-id" } } }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// Mock ResizeObserver for Recharts
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

// Mock html-to-image
vi.mock("html-to-image", () => ({
  toPng: vi.fn().mockResolvedValue("data:image/png;base64,mock"),
}));

describe("HealthStatistics Dashboard", () => {
  it("renders the dashboard title and description", () => {
    render(<HealthStatistics />);
    expect(screen.getByText("Health Statistics Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(/Summarized insights based on your symptom history/i)
    ).toBeInTheDocument();
  });

  it("renders the metric cards", () => {
    render(<HealthStatistics />);
    expect(screen.getByText("Total Symptom Entries")).toBeInTheDocument();
    expect(screen.getByText("Average Severity")).toBeInTheDocument();
    expect(screen.getByText("Most Frequent")).toBeInTheDocument();
  });

  it("renders the chart container title", () => {
    render(<HealthStatistics />);
    expect(screen.getByText("Monthly Activity Trends")).toBeInTheDocument();
    expect(screen.getByText("Frequency of symptoms logged per month")).toBeInTheDocument();
  });
});
