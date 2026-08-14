import { useState } from "react";

export interface HearingHealthEntry { id: string; value: string; notes: string; timestamp: string; }

export const useHearingHealth = () => {
  const [inputValue, setInputValue] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<HearingHealthEntry[]>([]);

  const addEntry = () => {
    if (!inputValue) return;
    setEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), value: inputValue, notes, timestamp: new Date().toLocaleString() },
    ]);
    setInputValue("");
    setNotes("");
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return { inputValue, setInputValue, notes, setNotes, entries, addEntry, removeEntry };
};

export default useHearingHealth;
