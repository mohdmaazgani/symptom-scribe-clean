import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen, render } from "@/test/utils";
import MoodCalendarView from "./MoodCalendarView";

const isoDateDaysAgo = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

describe("MoodCalendarView", () => {
  it("saves a selected mood together with an optional journal entry", async () => {
    const user = userEvent.setup();
    const onLogMood = vi.fn().mockResolvedValue(undefined);

    render(<MoodCalendarView moodLogs={[]} onLogMood={onLogMood} />);

    await user.click(screen.getByRole("button", { name: /great/i }));
    await user.type(screen.getByLabelText(/journal entry/i), "A peaceful walk helped today.");
    await user.click(screen.getByRole("button", { name: /save check-in/i }));

    expect(onLogMood).toHaveBeenCalledWith({
      mood: "great",
      note: "A peaceful walk helped today.",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Mood logged successfully");
  });

  it("shows the last 14 entries in the trend, a seven-day average, and dated history", () => {
    const moods = ["great", "good", "neutral", "bad", "terrible"];
    const moodLogs = Array.from({ length: 16 }, (_, index) => ({
      id: `log-${index}`,
      logged_at: isoDateDaysAgo(15 - index),
      mood: moods[index % moods.length],
      note: index === 15 ? "Most recent journal entry" : null,
    }));

    render(<MoodCalendarView moodLogs={moodLogs} onLogMood={vi.fn()} />);

    expect(screen.getAllByTestId("mood-trend-bar")).toHaveLength(14);
    expect(screen.getByText("3.0 / 5")).toBeInTheDocument();
    expect(screen.getByText("Most recent journal entry")).toBeInTheDocument();
    expect(screen.getByLabelText("Mood log history")).toHaveTextContent("Great");
  });
});
