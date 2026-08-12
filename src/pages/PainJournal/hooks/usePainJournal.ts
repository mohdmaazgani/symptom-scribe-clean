import { useState } from "react";

export interface PainEntry {
  id: string;
  intensity: number;
  location: string;
  painType: string;
  duration: number;
  notes: string;
  timestamp: string;
}

export const usePainJournal = () => {
  const [entries, setEntries] = useState<PainEntry[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [location, setLocation] = useState("");
  const [painType, setPainType] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  const addEntry = () => {
    if (!location || !painType) return;
    const now = new Date();
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        intensity,
        location,
        painType,
        duration,
        notes,
        timestamp: now.toLocaleString(),
      },
    ]);
    setNotes("");
    setIntensity(5);
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return {
    entries, intensity, setIntensity, location, setLocation,
    painType, setPainType, duration, setDuration,
    notes, setNotes, addEntry, removeEntry,
  };
};

export default usePainJournal;
