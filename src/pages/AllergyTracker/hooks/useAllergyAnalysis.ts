import { useState, useEffect } from "react";

interface AllergyEntry {
  id: string;
  allergen: string;
  severity: string;
  timestamp: string;
}

export const useAllergyAnalysis = () => {
  const [allergyLogs, setAllergyLogs] = useState<AllergyEntry[]>([]);
  const [riskRating, setRiskRating] = useState<"low" | "medium" | "high">("low");
  const [riskAdvice, setRiskAdvice] = useState("Low allergen exposure logged. Safe to practice outdoor activities.");

  const handleAddLog = (allergen: string, severity: string) => {
    setAllergyLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        allergen,
        severity,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const clearLogs = () => {
    setAllergyLogs([]);
  };

  useEffect(() => {
    if (allergyLogs.length === 0) {
      setRiskRating("low");
      setRiskAdvice("Low allergen exposure logged. Safe to practice outdoor activities.");
      return;
    }

    const hasSevere = allergyLogs.some((l) => l.severity === "severe");
    const count = allergyLogs.length;

    if (hasSevere || count >= 3) {
      setRiskRating("high");
      setRiskAdvice("High allergy burden reported. Limit outdoor exposure and consider antihistamine therapy.");
    } else if (count >= 1) {
      setRiskRating("medium");
      setRiskAdvice("Moderate trigger reports. Keep windows closed and check regional pollen indices.");
    } else {
      setRiskRating("low");
      setRiskAdvice("Low allergen exposure logged. Safe to practice outdoor activities.");
    }
  }, [allergyLogs]);

  return {
    allergyLogs,
    riskRating,
    riskAdvice,
    handleAddLog,
    clearLogs,
  };
};

export default useAllergyAnalysis;