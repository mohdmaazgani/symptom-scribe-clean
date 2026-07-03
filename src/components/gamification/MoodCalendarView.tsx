import { useState } from "react";

interface MoodLog {
  logged_at: string;
  mood: string;
}

interface Props {
  moodLogs: MoodLog[];
  onLogMood: (data: { mood: string; note?: string }) => void;
}

const MOODS = [
  { key: "great", label: "Great", emoji: "😄", color: "#22c55e" },
  { key: "good", label: "Good", emoji: "🙂", color: "#84cc16" },
  { key: "neutral", label: "Neutral", emoji: "😐", color: "#eab308" },
  { key: "bad", label: "Bad", emoji: "😞", color: "#f97316" },
  { key: "terrible", label: "Terrible", emoji: "😢", color: "#ef4444" },
];

const MOOD_COLOR: Record<string, string> = {
  great: "#22c55e",
  good: "#84cc16",
  neutral: "#eab308",
  bad: "#f97316",
  terrible: "#ef4444",
};
 

export default function MoodCalendarView({ moodLogs, onLogMood }: Props) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logStatus, setLogStatus] = useState<"idle" | "success" | "error">("idle");

  const today = new Date().toISOString().split("T")[0];
  const alreadyLoggedToday = moodLogs.some((m) => m.logged_at === today);

  const handleLog = async () => {
    if (!selectedMood) return;
    setIsLogging(true);
    setLogStatus("idle");
    try {
      await onLogMood({ mood: selectedMood });
      setSelectedMood(null);
      setLogStatus("success");
    } catch {
      setLogStatus("error");
    } finally {
      setIsLogging(false);
    }
  };

  const days: { date: string; dayNum: number; mood?: string }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const log = moodLogs.find((m) => m.logged_at === dateStr);
    days.push({ date: dateStr, dayNum: d.getDate(), mood: log?.mood });
  }

  const firstDow = new Date(days[0].date).getDay();
  const paddedDays: (typeof days[0] | null)[] = [...Array(firstDow).fill(null), ...days];

  const moodCounts: Record<string, number> = {};
  moodLogs.forEach((m) => { moodCounts[m.mood] = (moodCounts[m.mood] ?? 0) + 1; });

  return (
    <div className="space-y-6">

      {/* Mood Logger card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-foreground">How are you feeling today?</h3>
          <p className="text-sm text-muted-foreground">Log your mood once a day</p>
        </div>

        {alreadyLoggedToday ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-medium text-primary">Mood logged for today!</p>
              <p className="text-xs text-muted-foreground">Come back tomorrow to log again.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-4">
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setSelectedMood(m.key); setLogStatus("idle"); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selectedMood === m.key
                      ? "border-primary scale-110 bg-primary/10"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>

            {logStatus === "error" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                <span>⚠️</span>
                <span>Could not save mood. Please try again.</span>
              </div>
            )}
            {logStatus === "success" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
                <span>✅</span>
                <span>Mood logged successfully!</span>
              </div>
            )}

            <button
              onClick={handleLog}
              disabled={!selectedMood || isLogging}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${
                selectedMood && !isLogging
                  ? "bg-primary hover:bg-primary/80 active:bg-primary/70 text-primary-foreground cursor-pointer shadow-md hover:shadow-lg transition-all"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              }`}
            >
              {isLogging ? "Logging..." : "Log Mood"}
            </button>
          </>
        )}
      </div>

      {/* Mood Calendar card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Mood Calendar — Last 30 Days</h3>
          <p className="text-sm text-muted-foreground">See how your mood has changed over the past month</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {MOODS.map((m) => (
            <span key={m.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: m.color }} />
              {m.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
          ))}
          {paddedDays.map((day, i) =>
            day === null ? <div key={`pad-${i}`} /> : (
              <div
                key={day.date}
                title={day.mood ? `${day.date}: ${day.mood}` : day.date}
                className={`h-10 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  day.date === today ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                }`}
                style={{
                  backgroundColor: day.mood ? MOOD_COLOR[day.mood] + "33" : "rgba(255,255,255,0.05)",
                  color: day.mood ? MOOD_COLOR[day.mood] : "rgb(156,163,175)",
                  border: day.mood ? `1px solid ${MOOD_COLOR[day.mood]}66` : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {day.dayNum}
              </div>
            )
          )}
        </div>

        {moodLogs.length > 0 ? (
          <div className="grid grid-cols-5 gap-2 pt-2">
            {MOODS.map((m) => (
              <div key={m.key} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/20">
                <span className="text-xl">{m.emoji}</span>
                <span className="text-base font-bold text-foreground">{moodCounts[m.key] ?? 0}</span>
                <span className="text-xs text-muted-foreground text-center leading-tight">{m.label} days</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No moods logged yet — start by logging today's mood above! 😊
          </div>
        )}
      </div>
    </div>
  );
}
