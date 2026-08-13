import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { MoodType } from "@/hooks/useGamification";

interface MoodLog {
  id?: string;
  logged_at: string;
  mood: string;
  note?: string | null;
}

interface Props {
  moodLogs: MoodLog[];
  onLogMood: (data: { mood: MoodType; note?: string }) => Promise<unknown> | void;
}

const MOODS: Array<{ key: MoodType; label: string; emoji: string; color: string; score: number }> =
  [
    { key: "great", label: "Great", emoji: "😄", color: "#22c55e", score: 5 },
    { key: "good", label: "Good", emoji: "🙂", color: "#84cc16", score: 4 },
    { key: "neutral", label: "Okay", emoji: "😐", color: "#eab308", score: 3 },
    { key: "bad", label: "Low", emoji: "😞", color: "#f97316", score: 2 },
    { key: "terrible", label: "Awful", emoji: "😢", color: "#ef4444", score: 1 },
  ];

const MOOD_BY_KEY = Object.fromEntries(MOODS.map((mood) => [mood.key, mood]));

function getLocalDateString(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function MoodCalendarView({ moodLogs, onLogMood }: Props) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [note, setNote] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const [logStatus, setLogStatus] = useState<"idle" | "success" | "error">("idle");
  const today = getLocalDateString();
  const alreadyLoggedToday = moodLogs.some((log) => log.logged_at === today);

  const { trendEntries, historyEntries, sevenDayAverage } = useMemo(() => {
    const chronological = [...moodLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    const trendEntries = chronological.slice(-14);
    const historyEntries = [...chronological].reverse();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const startDate = getLocalDateString(sevenDaysAgo);
    const recentEntries = chronological.filter(
      (log) => log.logged_at >= startDate && log.logged_at <= today && MOOD_BY_KEY[log.mood]
    );
    const sevenDayAverage = recentEntries.length
      ? recentEntries.reduce((total, log) => total + MOOD_BY_KEY[log.mood].score, 0) /
        recentEntries.length
      : null;

    return { trendEntries, historyEntries, sevenDayAverage };
  }, [moodLogs, today]);

  const handleLog = async () => {
    if (!selectedMood) return;

    setIsLogging(true);
    setLogStatus("idle");
    try {
      await onLogMood({ mood: selectedMood, ...(note.trim() ? { note: note.trim() } : {}) });
      setSelectedMood(null);
      setNote("");
      setLogStatus("success");
    } catch {
      setLogStatus("error");
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <div className="space-y-6">
      <section
        className="rounded-xl border border-border bg-card p-6 space-y-5"
        aria-labelledby="mood-check-in-heading"
      >
        <div>
          <h3 id="mood-check-in-heading" className="font-semibold text-foreground">
            How are you feeling today?
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a mood and add an optional journal entry.
          </p>
        </div>

        {alreadyLoggedToday ? (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-primary">Mood logged for today!</p>
              <p className="text-xs text-muted-foreground">
                Come back tomorrow for your next check-in.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-2" aria-label="Mood selector">
              {MOODS.map((mood) => (
                <button
                  key={mood.key}
                  type="button"
                  aria-pressed={selectedMood === mood.key}
                  onClick={() => {
                    setSelectedMood(mood.key);
                    setLogStatus("idle");
                  }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                    selectedMood === mood.key
                      ? "border-primary bg-primary/10 scale-105"
                      : "border-transparent hover:border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="text-3xl" aria-hidden="true">
                    {mood.emoji}
                  </span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="mood-note" className="text-sm font-medium text-foreground">
                Journal entry <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="mood-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="What influenced your mood today?"
                maxLength={1000}
              />
            </div>

            {logStatus === "error" && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Could not save mood. Please try again.</span>
              </div>
            )}
            {logStatus === "success" && (
              <div
                role="status"
                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Mood logged successfully!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLog}
              disabled={!selectedMood || isLogging}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/80 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50"
            >
              {isLogging ? "Logging..." : "Save check-in"}
            </button>
          </>
        )}
      </section>

      <section
        className="rounded-xl border border-border bg-card p-6 space-y-4"
        aria-labelledby="mood-trends-heading"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 id="mood-trends-heading" className="font-semibold text-foreground">
              Mood trend
            </h3>
            <p className="text-sm text-muted-foreground">Your last 14 mood check-ins.</p>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-right">
            <p className="text-xs text-muted-foreground">7-day average</p>
            <p className="text-lg font-semibold text-foreground">
              {sevenDayAverage === null ? "—" : `${sevenDayAverage.toFixed(1)} / 5`}
            </p>
          </div>
        </div>

        {trendEntries.length ? (
          <div
            className="flex h-44 items-end gap-2 border-b border-border pt-4"
            role="img"
            aria-label="Mood trend for the last 14 entries"
          >
            {trendEntries.map((log, index) => {
              const mood = MOOD_BY_KEY[log.mood];
              if (!mood) return null;
              return (
                <div
                  key={log.id ?? `${log.logged_at}-${index}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <div
                    data-testid="mood-trend-bar"
                    title={`${formatDate(log.logged_at)}: ${mood.label} (${mood.score}/5)`}
                    className="w-full rounded-t-md"
                    style={{ height: `${mood.score * 20}%`, backgroundColor: mood.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {log.logged_at.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-lg bg-muted/20 text-sm text-muted-foreground">
            Log a mood to start seeing your trend.
          </div>
        )}
      </section>

      <section
        className="rounded-xl border border-border bg-card p-6 space-y-4"
        aria-labelledby="mood-history-heading"
      >
        <div>
          <h3 id="mood-history-heading" className="font-semibold text-foreground">
            Mood history
          </h3>
          <p className="text-sm text-muted-foreground">
            Your recent check-ins and journal entries.
          </p>
        </div>

        {historyEntries.length ? (
          <ul className="divide-y divide-border" aria-label="Mood log history">
            {historyEntries.map((log, index) => {
              const mood = MOOD_BY_KEY[log.mood];
              return (
                <li
                  key={log.id ?? `${log.logged_at}-${index}`}
                  className="flex gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="text-2xl" aria-hidden="true">
                    {mood?.emoji ?? "🙂"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-foreground">{mood?.label ?? log.mood}</p>
                      <time dateTime={log.logged_at} className="text-xs text-muted-foreground">
                        {formatDate(log.logged_at)}
                      </time>
                    </div>
                    {log.note && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                        {log.note}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            No moods logged yet — start with today&apos;s check-in.{" "}
            <Smile className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </section>
    </div>
  );
}
