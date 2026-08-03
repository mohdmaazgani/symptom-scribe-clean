import { describe, it, expect } from "vitest";
import { calculateWeeklyHealthScore } from "./score-calculator";
import type { OfflineSymptom, OfflineMetric } from "./offline-db";

const makeSymptom = (overrides: Partial<OfflineSymptom> = {}): OfflineSymptom => ({
  id: "sym-1",
  user_id: "user-1",
  symptoms: "headache",
  severity_level: "mild",
  possible_causes: null,
  recommendations: null,
  risk_score: null,
  resolved: false,
  created_at: new Date().toISOString(),
  pending_sync: 0,
  pending_update: 0,
  pending_delete: 0,
  ...overrides,
});

const makeMetric = (overrides: Partial<OfflineMetric> = {}): OfflineMetric => ({
  id: "met-1",
  user_id: "user-1",
  metric_type: "heart_rate",
  value: { value: 72 },
  notes: null,
  recorded_at: new Date().toISOString(),
  pending_sync: 0,
  pending_delete: 0,
  ...overrides,
});

describe("calculateWeeklyHealthScore", () => {
  it("returns a result with all required fields", () => {
    const result = calculateWeeklyHealthScore([], []);
    expect(result).toHaveProperty("totalScore");
    expect(result).toHaveProperty("streakDays");
    expect(result).toHaveProperty("loggingDaysLastWeek");
    expect(result).toHaveProperty("breakdown");
    expect(Array.isArray(result.breakdown)).toBe(true);
    expect(result.breakdown).toHaveLength(3);
  });

  it("totalScore is clamped between 0 and 100", () => {
    const result = calculateWeeklyHealthScore([], []);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it("breakdown has consistency, symptom_resolution, and biometric_stability items", () => {
    const result = calculateWeeklyHealthScore([], []);
    const ids = result.breakdown.map((b: any) => b.id);
    expect(ids).toContain("consistency");
    expect(ids).toContain("symptom_resolution");
    expect(ids).toContain("biometric_stability");
  });

  it("symptoms with resolved=true earn full symptom points", () => {
    const resolved = makeSymptom({ resolved: true });
    const result = calculateWeeklyHealthScore([resolved], []);
    const symptomItem = result.breakdown.find((b: any) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(30);
  });

  it("symptoms with resolved=false earn zero symptom points", () => {
    const unresolved = makeSymptom({ resolved: false });
    const result = calculateWeeklyHealthScore([unresolved], []);
    const symptomItem = result.breakdown.find((b: any) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(0);
  });

  it("mixed resolved/unresolved symptoms earn proportional points", () => {
    const resolved = makeSymptom({ id: "s1", resolved: true });
    const unresolved = makeSymptom({ id: "s2", resolved: false });
    const result = calculateWeeklyHealthScore([resolved, unresolved], []);
    const symptomItem = result.breakdown.find((b: any) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(15);
  });

  it("pending_delete=1 metrics are excluded from biometric calculation", () => {
    const valid = makeMetric({ id: "m1", metric_type: "heart_rate", value: { value: 72 }, pending_delete: 0 });
    const deleted = makeMetric({ id: "m2", metric_type: "heart_rate", value: { value: 72 }, pending_delete: 1 });
    const result = calculateWeeklyHealthScore([], [valid, deleted]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("heart_rate within 60-100 range earns biometric points", () => {
    const metric = makeMetric({ metric_type: "heart_rate", value: { value: 80 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("heart_rate outside range earns zero biometric points", () => {
    const metric = makeMetric({ metric_type: "heart_rate", value: { value: 50 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(0);
  });

  it("temperature within 97-99.5 earns biometric points", () => {
    const metric = makeMetric({ metric_type: "temperature", value: { value: 98.5 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("oxygen_saturation >= 95 earns biometric points", () => {
    const metric = makeMetric({ metric_type: "oxygen_saturation", value: { value: 97 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("blood_sugar within 70-140 earns biometric points", () => {
    const metric = makeMetric({ metric_type: "blood_sugar", value: { value: 100 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("blood_pressure optimal values earn biometric points", () => {
    const metric = makeMetric({ metric_type: "blood_pressure", value: { systolic: 120, diastolic: 80 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("sleep >= 6 hours earns biometric points", () => {
    const metric = makeMetric({ metric_type: "sleep", value: { value: 7 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("steps >= 5000 earns biometric points", () => {
    const metric = makeMetric({ metric_type: "steps", value: { value: 8000 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("unknown metric type defaults to optimal", () => {
    const metric = makeMetric({ metric_type: "unknown_metric", value: { value: 0 } });
    const result = calculateWeeklyHealthScore([], [metric]);
    const biometricItem = result.breakdown.find((b: any) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("null value skips the metric without crashing", () => {
    const metric = makeMetric({ metric_type: "heart_rate", value: null });
    const result = calculateWeeklyHealthScore([], [metric]);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
  });

  it("consistency completed is false when no recent logs", () => {
    const result = calculateWeeklyHealthScore([], []);
    const consistencyItem = result.breakdown.find((b: any) => b.id === "consistency");
    expect(consistencyItem?.completed).toBe(false);
  });

  it("symptom_resolution completed is true when points >= 20", () => {
    const r1 = makeSymptom({ id: "s1", resolved: true });
    const r2 = makeSymptom({ id: "s2", resolved: true });
    const r3 = makeSymptom({ id: "s3", resolved: true });
    const result = calculateWeeklyHealthScore([r1, r2, r3], []);
    const symptomItem = result.breakdown.find((b: any) => b.id === "symptom_resolution");
    expect(symptomItem?.completed).toBe(true);
  });
});
