import { useState, useEffect } from "react";
import { getTypedStorage, setTypedStorage } from "@/lib/storage";

export interface DigestiveTrackerEntry {
  id: string;
  value: string;
  notes: string;
  timestamp: string;
}

const STORAGE_KEY = "symptom_scribe_digestive_entries";

export const useDigestiveTracker = () => {
  const [inputValue, setInputValue] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<DigestiveTrackerEntry[]>(() =>
    getTypedStorage<DigestiveTrackerEntry[]>(STORAGE_KEY, [])
  );

  useEffect(() => {
    setTypedStorage(STORAGE_KEY, entries);
  }, [entries]);

  const addEntry = () => {
    if (!inputValue.trim()) return;
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), value: inputValue.trim(), notes: notes.trim(), timestamp: new Date().toLocaleString() },
    ]);
    setInputValue("");
    setNotes("");
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return { inputValue, setInputValue, notes, setNotes, entries, addEntry, removeEntry };
};

export default useDigestiveTracker;
