export type HeartRateZoneName = "Resting" | "Fat Burn" | "Aerobic" | "Threshold" | "Peak";

export interface HeartRateZone {
  name: HeartRateZoneName;
  minPercent: number;
  maxPercent: number;
  color: string;
  description: string;
}

export const HEART_RATE_ZONES: HeartRateZone[] = [
  {
    name: "Resting",
    minPercent: 0,
    maxPercent: 49,
    color: "#64748b",
    description: "Recovery and everyday activity",
  },
  {
    name: "Fat Burn",
    minPercent: 50,
    maxPercent: 59,
    color: "#22c55e",
    description: "Comfortable, sustainable effort",
  },
  {
    name: "Aerobic",
    minPercent: 60,
    maxPercent: 69,
    color: "#06b6d4",
    description: "Improves cardiovascular endurance",
  },
  {
    name: "Threshold",
    minPercent: 70,
    maxPercent: 84,
    color: "#f59e0b",
    description: "Challenging, high-intensity effort",
  },
  {
    name: "Peak",
    minPercent: 85,
    maxPercent: 100,
    color: "#ef4444",
    description: "Near-maximum effort; use briefly",
  },
];

export function calculateMaxHeartRate(age: number) {
  return 220 - age;
}

export function classifyHeartRate(bpm: number, age: number) {
  const maxHeartRate = calculateMaxHeartRate(age);
  const percentage = Math.round((bpm / maxHeartRate) * 100);
  const zone =
    HEART_RATE_ZONES.find((candidate) => percentage <= candidate.maxPercent) ??
    HEART_RATE_ZONES.at(-1)!;

  return { maxHeartRate, percentage, zone };
}
