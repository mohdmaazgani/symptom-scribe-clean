import { useState } from "react";

export interface StressEntry { id: string; level: number; symptom: string; timestamp: string; }

export const useStressLevel = () => {
  const [level, setLevel] = useState(5);
  const [symptom, setSymptom] = useState("");
  const [entries, setEntries] = useState<StressEntry[]>([]);

  const logStress = () => {
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), level, symptom, timestamp: new Date().toLocaleString() }]);
    setSymptom("");
  };

  const weeklyAvg = entries.length > 0 ? entries.slice(-7).reduce((s, e) => s + e.level, 0) / Math.min(entries.length, 7) : null;

  return { level, setLevel, symptom, setSymptom, entries, logStress, weeklyAvg };
};

export default useStressLevel;
