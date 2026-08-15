export type HypertensionCategory =
  | "normal"
  | "elevated"
  | "stage1"
  | "stage2"
  | "crisis";

export interface HypertensionClassification {
  category: HypertensionCategory;
  label: string;
  description: string;
}

export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  recordedAt?: string;
  notes?: string | null;
}

const CATEGORY_META: Record<HypertensionCategory, HypertensionClassification> = {
  normal: {
    category: "normal",
    label: "Normal",
    description: "Less than 120/80 mmHg",
  },
  elevated: {
    category: "elevated",
    label: "Elevated",
    description: "Systolic 120-129 and diastolic below 80",
  },
  stage1: {
    category: "stage1",
    label: "Stage 1",
    description: "Systolic 130-139 or diastolic 80-89",
  },
  stage2: {
    category: "stage2",
    label: "Stage 2",
    description: "Systolic 140 or higher or diastolic 90 or higher",
  },
  crisis: {
    category: "crisis",
    label: "Hypertensive Crisis",
    description: "Systolic over 180 or diastolic over 120 — seek care",
  },
};

export function classifyBloodPressure(
  systolic: number,
  diastolic: number,
): HypertensionClassification {
  if (systolic > 180 || diastolic > 120) {
    return CATEGORY_META.crisis;
  }
  if (systolic >= 140 || diastolic >= 90) {
    return CATEGORY_META.stage2;
  }
  if (systolic >= 130 || diastolic >= 80) {
    return CATEGORY_META.stage1;
  }
  if (systolic >= 120 && diastolic < 80) {
    return CATEGORY_META.elevated;
  }
  return CATEGORY_META.normal;
}

export function isSystolicValid(systolic: number): boolean {
  return Number.isFinite(systolic) && systolic >= 50 && systolic <= 300;
}

export function isDiastolicValid(diastolic: number): boolean {
  return Number.isFinite(diastolic) && diastolic >= 30 && diastolic <= 200;
}

export interface BloodPressureSummary {
  averageSystolic: number | null;
  averageDiastolic: number | null;
  readingCount: number;
  mostRecentCategory: HypertensionClassification | null;
}

export function summarizeBloodPressure(
  readings: BloodPressureReading[],
): BloodPressureSummary {
  if (readings.length === 0) {
    return {
      averageSystolic: null,
      averageDiastolic: null,
      readingCount: 0,
      mostRecentCategory: null,
    };
  }

  const totalSystolic = readings.reduce((sum, r) => sum + r.systolic, 0);
  const totalDiastolic = readings.reduce((sum, r) => sum + r.diastolic, 0);

  const latest = readings.reduce((a, b) =>
    (b.recordedAt ?? "") > (a.recordedAt ?? "")
      ? b
      : a,
  );

  return {
    averageSystolic: Math.round(totalSystolic / readings.length),
    averageDiastolic: Math.round(totalDiastolic / readings.length),
    readingCount: readings.length,
    mostRecentCategory: classifyBloodPressure(
      latest.systolic,
      latest.diastolic,
    ),
  };
}

export function readingsWithinLastDays(
  readings: BloodPressureReading[],
  days: number,
  now: Date = new Date(),
): BloodPressureReading[] {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return readings.filter((r) => {
    if (!r.recordedAt) return false;
    return new Date(r.recordedAt).getTime() >= cutoff;
  });
}
