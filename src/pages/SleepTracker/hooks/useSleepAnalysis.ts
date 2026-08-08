import { useState, useEffect } from "react";

interface Bedtime {
  time: string;
  duration: number;
  cycles: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export const useSleepAnalysis = (wakeTime: string) => {
  const [optimalBedtimes, setOptimalBedtimes] = useState<Bedtime[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    { id: "1", label: "No caffeine within 6 hours of bedtime", completed: false },
    { id: "2", label: "Avoided bright screens 1 hour before sleep", completed: false },
    { id: "3", label: "Set bedroom temperature to cool (18-20°C)", completed: false },
    { id: "4", label: "Practiced 5 mins of guided breathing", completed: false },
    { id: "5", label: "Refrained from heavy meals late at night", completed: false },
  ]);

  const calculateSleepCycles = () => {
    if (!wakeTime) return;

    const [hours, minutes] = wakeTime.split(":").map(Number);
    const wakeDate = new Date();
    wakeDate.setHours(hours, minutes, 0, 0);

    const list: Bedtime[] = [];
    const cycleDurations = [6, 5];

    cycleDurations.forEach((cycles) => {
      const durationMin = cycles * 90;
      const bedDate = new Date(wakeDate.getTime() - durationMin * 60 * 1000 - 15 * 60 * 1000);
      
      const formattedTime = bedDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      list.push({
        time: formattedTime,
        duration: (cycles * 90) / 60,
        cycles: cycles,
      });
    });

    setOptimalBedtimes(list);
  };

  useEffect(() => {
    calculateSleepCycles();
  }, [wakeTime]);

  const toggleChecklistItem = (id: string) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const hygieneScore = Math.round(
    (checklistItems.filter((i) => i.completed).length / checklistItems.length) * 100
  );

  return {
    optimalBedtimes,
    hygieneScore,
    checklistItems,
    toggleChecklistItem,
    calculateSleepCycles,
  };
};

export default useSleepAnalysis;