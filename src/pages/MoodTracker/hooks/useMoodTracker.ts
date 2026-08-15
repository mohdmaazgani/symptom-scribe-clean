import { useState } from "react";

interface Mood {
  emoji: string;
  label: string;
  score: number;
  color: string;
  bg: string;
}

export interface MoodEntry {
  id: string;
  score: number;
  label: string;
  emoji: string;
  journal: string;
  timestamp: string;
}

export const useMoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  const logMood = () => {
    if (!selectedMood) return;
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        score: selectedMood.score,
        label: selectedMood.label,
        emoji: selectedMood.emoji,
        journal: journalEntry,
        timestamp: new Date().toLocaleString(),
      },
    ]);
    setSelectedMood(null);
    setJournalEntry("");
  };

  const averageMood =
    entries.length > 0
      ? entries.slice(-7).reduce((sum, e) => sum + e.score, 0) / Math.min(entries.length, 7)
      : null;

  return { selectedMood, setSelectedMood, journalEntry, setJournalEntry, entries, logMood, averageMood };
};

export default useMoodTracker;
