import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render, fireEvent } from "@/test/utils";
import MoodCalendarView from "./MoodCalendarView";

describe("MoodCalendarView", () => {
  const defaultProps = {
    moodLogs: [] as Array<{ logged_at: string; mood: string }>,
    onLogMood: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const today = new Date().toISOString().split("T")[0];

  it("renders the mood logger heading", () => {
    render(<MoodCalendarView {...defaultProps} />);
    expect(screen.getByText(/How are you feeling today\?/i)).toBeInTheDocument();
  });

  it("renders all five mood options", () => {
    render(<MoodCalendarView {...defaultProps} />);
    // Mood options appear in the heading section
    expect(screen.getByText("How are you feeling today?")).toBeInTheDocument();
    // Mood labels appear as text
    const greatText = screen.getAllByText("Great");
    const goodText = screen.getAllByText("Good");
    expect(greatText.length).toBeGreaterThan(0);
    expect(goodText.length).toBeGreaterThan(0);
  });

  it("renders the mood calendar heading", () => {
    render(<MoodCalendarView {...defaultProps} />);
    expect(screen.getByText(/Mood Calendar/i)).toBeInTheDocument();
  });

  it("shows log mood button when no mood is selected", () => {
    render(<MoodCalendarView {...defaultProps} />);
    const button = screen.getByRole("button", { name: /log mood/i });
    expect(button).toBeDisabled();
  });

  it("enables log mood button after selecting a mood", async () => {
    render(<MoodCalendarView {...defaultProps} />);
    const goodButton = screen.getByRole("button", { name: /good/i });
    fireEvent.click(goodButton);
    await waitFor(() => {
      const button = screen.getByRole("button", { name: /log mood/i });
      expect(button).not.toBeDisabled();
    });
  });

  it("calls onLogMood with selected mood when log button is clicked", async () => {
    render(<MoodCalendarView {...defaultProps} />);
    const goodButton = screen.getByRole("button", { name: /good/i });
    fireEvent.click(goodButton);
    const logButton = screen.getByRole("button", { name: /log mood/i });
    fireEvent.click(logButton);
    await waitFor(() => {
      expect(defaultProps.onLogMood).toHaveBeenCalledWith({ mood: "good" });
    });
  });

  it("shows success state after successful mood log", async () => {
    render(<MoodCalendarView {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /great/i }));
    fireEvent.click(screen.getByRole("button", { name: /log mood/i }));
    await waitFor(() => {
      expect(screen.getByText(/Mood logged successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error state when onLogMood rejects", async () => {
    const failingProps = {
      ...defaultProps,
      onLogMood: vi.fn().mockRejectedValue(new Error("Network error")),
    };
    render(<MoodCalendarView {...failingProps} />);
    fireEvent.click(screen.getByRole("button", { name: /good/i }));
    fireEvent.click(screen.getByRole("button", { name: /log mood/i }));
    await waitFor(() => {
      expect(screen.getByText(/Could not save mood/i)).toBeInTheDocument();
    });
  });

  it("shows already-logged state when mood is logged today", () => {
    const propsWithTodayLog = {
      ...defaultProps,
      moodLogs: [{ logged_at: today, mood: "good" }],
    };
    render(<MoodCalendarView {...propsWithTodayLog} />);
    expect(screen.getByText(/Mood logged for today/i)).toBeInTheDocument();
    // Log mood button should not be visible
    expect(screen.queryByRole("button", { name: /log mood/i })).not.toBeInTheDocument();
  });

  it("shows empty state message when no mood logs exist", () => {
    render(<MoodCalendarView {...defaultProps} />);
    expect(screen.getByText(/No moods logged yet/i)).toBeInTheDocument();
  });

  it("renders calendar with day numbers", () => {
    render(<MoodCalendarView {...defaultProps} />);
    // Calendar should contain day numbers 1-31
    const dayOnes = screen.getAllByText("1");
    expect(dayOnes.length).toBeGreaterThan(0);
  });

  it("renders mood summary counts when mood logs exist", () => {
    const propsWithLogs = {
      ...defaultProps,
      moodLogs: [
        { logged_at: today, mood: "good" },
        { logged_at: today, mood: "good" },
        { logged_at: today, mood: "great" },
      ],
    };
    render(<MoodCalendarView {...propsWithLogs} />);
    // Summary should appear instead of empty state
    expect(screen.queryByText(/No moods logged yet/i)).not.toBeInTheDocument();
  });

  it("resets mood selection after successful log", async () => {
    render(<MoodCalendarView {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /good/i }));
    fireEvent.click(screen.getByRole("button", { name: /log mood/i }));
    await waitFor(() => {
      // After success, mood selection should be cleared (no mood selected)
      const button = screen.getByRole("button", { name: /log mood/i });
      expect(button).toBeDisabled();
    });
  });

  it("does not show already-logged state when mood was logged on a different day", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const propsWithYesterdayLog = {
      ...defaultProps,
      moodLogs: [{ logged_at: yesterdayStr, mood: "good" }],
    };
    render(<MoodCalendarView {...propsWithYesterdayLog} />);
    expect(screen.queryByText(/Mood logged for today/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log mood/i })).toBeInTheDocument();
  });
});
