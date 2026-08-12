import { useState } from "react";

interface LogItem {
  id: string;
  type: "glucose" | "systolic";
  value: number;
  warning: boolean;
  timestamp: string;
}

export const useChronicLogs = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);

  const handleLogItem = (type: "glucose" | "systolic", value: number) => {
    let warning = false;
    if (type === "glucose" && (value < 70 || value > 140)) warning = true;
    if (type === "systolic" && (value < 90 || value > 130)) warning = true;

    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        type,
        value,
        warning,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const glucoseLogs = logs.filter((l) => l.type === "glucose");
  const bpLogs = logs.filter((l) => l.type === "systolic");

  const averageGlucose = glucoseLogs.length > 0
    ? Math.round(glucoseLogs.reduce((sum, item) => sum + item.value, 0) / glucoseLogs.length)
    : 0;

  const averageBp = bpLogs.length > 0
    ? Math.round(bpLogs.reduce((sum, item) => sum + item.value, 0) / bpLogs.length)
    : 0;

  return {
    logs,
    averageGlucose,
    averageBp,
    handleLogItem,
    clearLogs,
  };
};

export default useChronicLogs;