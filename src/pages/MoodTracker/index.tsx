import React from "react";
import { useTranslation } from "react-i18next";
import { Smile, TrendingUp, BookOpen, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MoodTrendChart from "./components/MoodTrendChart";
import useMoodTracker from "./hooks/useMoodTracker";

const MOODS = [
  { emoji: "😄", label: "Great", score: 5, color: "text-green-500", bg: "bg-green-500/10 border-green-500" },
  { emoji: "🙂", label: "Good", score: 4, color: "text-lime-500", bg: "bg-lime-500/10 border-lime-500" },
  { emoji: "😐", label: "Okay", score: 3, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500" },
  { emoji: "😔", label: "Low", score: 2, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500" },
  { emoji: "😢", label: "Awful", score: 1, color: "text-red-500", bg: "bg-red-500/10 border-red-500" },
];

const MoodTracker: React.FC = () => {
  const { t } = useTranslation();
  const {
    selectedMood, setSelectedMood, journalEntry, setJournalEntry,
    entries, logMood, averageMood,
  } = useMoodTracker();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Smile className="h-8 w-8 text-amber-500" />
          {t("sidebar.items.moodTracker", "Mood Tracker")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your emotional well-being with daily mood check-ins, journal entries, and trend analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How are you feeling?</CardTitle>
              <CardDescription>Select your current mood to log it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-5 gap-2">
                {MOODS.map((mood) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                      selectedMood?.label === mood.label ? mood.bg : "border-transparent hover:border-border"
                    }`}
                    aria-label={mood.label}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <span className={`text-[10px] font-medium ${selectedMood?.label === mood.label ? mood.color : "text-muted-foreground"}`}>{mood.label}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">
                  <BookOpen className="inline h-3 w-3 mr-1" /> Journal Entry
                </label>
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="What's on your mind? Write freely..."
                  className="w-full min-h-[100px] p-3 bg-background/50 border rounded-md text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <Button
                onClick={logMood}
                disabled={!selectedMood}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                Log Today's Mood
              </Button>

              {averageMood !== null && (
                <div className="p-3 bg-muted/40 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">7-Day Average Mood</p>
                  <p className="text-2xl font-bold text-foreground">{averageMood.toFixed(1)} / 5</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <MoodTrendChart entries={entries} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Mood Log
                </CardTitle>
                <Badge variant="secondary">{entries.length} entries</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No moods logged yet. Start tracking above!</p>
              ) : (
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {entries.slice().reverse().map((entry) => {
                    const mood = MOODS.find((m) => m.score === entry.score);
                    return (
                      <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background hover:border-amber-500/20 transition-all">
                        <span className="text-2xl">{mood?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${mood?.color}`}>{mood?.label}</span>
                            <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                          </div>
                          {entry.journal && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.journal}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
