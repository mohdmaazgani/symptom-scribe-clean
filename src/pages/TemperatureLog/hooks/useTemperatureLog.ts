import { useState } from "react";

export interface TemperatureLogEntry { id: string; value: string; notes: string; timestamp: string; }

export const useTemperatureLog = () => {
  const [inputValue, setInputValue] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<TemperatureLogEntry[]>([]);

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

export default useTemperatureLog;
