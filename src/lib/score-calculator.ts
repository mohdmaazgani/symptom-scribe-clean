import type { OfflineSymptom, OfflineMetric } from "./offline-db";

export interface ScoreBreakdownItem {
  id: string;
  label: string;
  points: number;
  maxPoints: number;
  description: string;
  completed: boolean;
}

export interface WeeklyHealthScoreResult {
  totalScore: number;
  streakDays: number;
  loggingDaysLastWeek: number;
  breakdown: ScoreBreakdownItem[];
}

export function calculateWeeklyHealthScore(
  symptoms: OfflineSymptom[] = [],
  metrics: OfflineMetric[] = []
): WeeklyHealthScoreResult {
  // Collect all unique date strings (YYYY-MM-DD)
  const loggedDateSet = new Set<string>();

  symptoms.forEach((s) => {
    if (s.created_at) {
      const d = new Date(s.created_at).toISOString().split("T")[0];
      loggedDateSet.add(d);
    }
  });

  metrics.forEach((m) => {
    if (m.recorded_at && m.pending_delete !== 1) {
      const d = new Date(m.recorded_at).toISOString().split("T")[0];
      loggedDateSet.add(d);
    }
  });

  // Calculate Streak
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let streakDays = 0;
  let checkDate = new Date();

  // If no entry today, start checking from yesterday if yesterday has an entry
  if (!loggedDateSet.has(todayStr) && loggedDateSet.has(yesterdayStr)) {
    checkDate = yesterday;
  }

  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (loggedDateSet.has(dateStr)) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 1. Logging Consistency (Last 7 Days - Max 40 points)
  let loggingDaysLastWeek = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split("T")[0];
    if (loggedDateSet.has(dStr)) {
      loggingDaysLastWeek++;
    }
  }

  const consistencyMax = 40;
  const consistencyPoints = Math.round((loggingDaysLastWeek / 7) * consistencyMax);

  // 2. Symptom Control & Resolution (Max 30 points)
  const symptomMax = 30;
  let symptomPoints = symptomMax;
  let symptomDesc = "No active symptom burden recorded";

  if (symptoms.length > 0) {
    const resolvedCount = symptoms.filter((s) => s.resolved).length;
    const resolvedRatio = resolvedCount / symptoms.length;
    symptomPoints = Math.round(resolvedRatio * symptomMax);
    symptomDesc = `${resolvedCount} of ${symptoms.length} recent symptoms resolved`;
  }

  // 3. Biometric Stability (Max 30 points)
  const biometricMax = 30;
  let biometricPoints = 15; // default baseline if no metrics
  let biometricDesc = "No vital metric logs recorded yet";

  const validMetrics = metrics.filter((m) => m.pending_delete !== 1);

  if (validMetrics.length > 0) {
    let optimalCount = 0;

    validMetrics.forEach((m) => {
      const val = m.value as { value?: number; systolic?: number; diastolic?: number } | null;
      if (!val) return;

      switch (m.metric_type) {
        case "heart_rate":
          if (val.value && val.value >= 60 && val.value <= 100) optimalCount++;
          break;
        case "temperature":
          if (val.value && val.value >= 97 && val.value <= 99.5) optimalCount++;
          break;
        case "oxygen_saturation":
          if (val.value && val.value >= 95) optimalCount++;
          break;
        case "blood_sugar":
          if (val.value && val.value >= 70 && val.value <= 140) optimalCount++;
          break;
        case "blood_pressure":
          if (val.systolic && val.diastolic && val.systolic < 130 && val.diastolic < 85) {
            optimalCount++;
          }
          break;
        case "sleep":
          if (val.value && val.value >= 6) optimalCount++;
          break;
        case "steps":
          if (val.value && val.value >= 5000) optimalCount++;
          break;
        default:
          optimalCount++;
          break;
      }
    });

    const optimalRatio = optimalCount / validMetrics.length;
    biometricPoints = Math.round(optimalRatio * biometricMax);
    biometricDesc = `${optimalCount} of ${validMetrics.length} vital readings in optimal range`;
  }

  const totalScore = Math.min(
    100,
    Math.max(0, consistencyPoints + symptomPoints + biometricPoints)
  );

  const breakdown: ScoreBreakdownItem[] = [
    {
      id: "consistency",
      label: "Logging Consistency",
      points: consistencyPoints,
      maxPoints: consistencyMax,
      description: `Logged entries on ${loggingDaysLastWeek} of the last 7 days`,
      completed: loggingDaysLastWeek >= 5,
    },
    {
      id: "symptom_resolution",
      label: "Symptom Control",
      points: symptomPoints,
      maxPoints: symptomMax,
      description: symptomDesc,
      completed: symptomPoints >= 20,
    },
    {
      id: "biometric_stability",
      label: "Biometric Stability",
      points: biometricPoints,
      maxPoints: biometricMax,
      description: biometricDesc,
      completed: biometricPoints >= 20,
    },
  ];

  return {
    totalScore,
    streakDays,
    loggingDaysLastWeek,
    breakdown,
  };
}
