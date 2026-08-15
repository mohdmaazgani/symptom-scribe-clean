import { useState } from "react";

interface Zone { label: string; color: string; description: string; }
interface HREntry { id: string; bpm: number; age: number; context: string; zone: Zone; timestamp: string; }

const getZone = (bpm: number, age: number): Zone => {
  const maxHR = 220 - age;
  const pct = (bpm / maxHR) * 100;
  if (pct < 50) return { label: "Resting", color: "#6366f1", description: "Below aerobic training range. Good for recovery." };
  if (pct < 60) return { label: "Warm-Up", color: "#22c55e", description: "Light activity zone. Builds endurance base." };
  if (pct < 70) return { label: "Fat Burn", color: "#84cc16", description: "Optimal fat oxidation zone. Low-moderate intensity." };
  if (pct < 80) return { label: "Aerobic", color: "#f59e0b", description: "Improves cardiovascular fitness and endurance." };
  if (pct < 90) return { label: "Threshold", color: "#f97316", description: "Pushing lactate threshold. Improves performance." };
  return { label: "Peak", color: "#ef4444", description: "Maximum effort. Short bursts only — monitor closely." };
};

export const useHeartRateMonitor = () => {
  const [bpm, setBpm] = useState(0);
  const [age, setAge] = useState(0);
  const [context, setContext] = useState("");
  const [entries, setEntries] = useState<HREntry[]>([]);

  const zone = bpm > 0 && age > 0 ? getZone(bpm, age) : null;

  const addReading = () => {
    if (!bpm || !context) return;
    const z = age > 0 ? getZone(bpm, age) : { label: "Unknown", color: "#6b7280", description: "Set age for zone calculation." };
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), bpm, age, context, zone: z, timestamp: new Date().toLocaleString() }]);
    setBpm(0);
  };

  const removeReading = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  return { bpm, setBpm, age, setAge, context, setContext, entries, addReading, removeReading, zone };
};

export default useHeartRateMonitor;
