import { describe, it, expect } from "vitest";
import { calculateWeeklyHealthScore } from "./score-calculator";
import type { OfflineSymptom, OfflineMetric } from "./offline-db";

describe("calculateWeeklyHealthScore", () => {
  it("returns baseline score with empty symptoms and metrics", () => {
    const result = calculateWeeklyHealthScore([], []);
    // Baseline: no consistency (0 pts) + no symptoms (30 pts) + no metrics (15 pts) = 45
    expect(result.totalScore).toBe(45);
    expect(result.streakDays).toBe(0);
    expect(result.loggingDaysLastWeek).toBe(0);
    expect(result.breakdown).toHaveLength(3);
  });

  it("returns full symptom points when no symptoms are recorded", () => {
    const result = calculateWeeklyHealthScore([], []);
    const symptomItem = result.breakdown.find((b) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(30);
    expect(symptomItem?.completed).toBe(true);
  });

  it("awards full biometric points when no metrics are recorded", () => {
    const result = calculateWeeklyHealthScore([], []);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(15);
  });

  it("awards biometric points for optimal heart rate range (60-100 bpm)", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "heart_rate",
        value: { value: 75 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
    expect(biometricItem?.description).toBe("1 of 1 vital readings in optimal range");
  });

  it("awards zero biometric points for suboptimal heart rate", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "heart_rate",
        value: { value: 45 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(0);
    expect(biometricItem?.description).toBe("0 of 1 vital readings in optimal range");
  });

  it("awards biometric points for optimal blood pressure", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "blood_pressure",
        value: { systolic: 120, diastolic: 78 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("awards partial biometric points for mixed optimal and suboptimal metrics", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "heart_rate",
        value: { value: 75 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
      {
        id: "m2",
        user_id: "u1",
        metric_type: "heart_rate",
        value: { value: 45 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(15);
  });

  it("awards biometric points for optimal steps (>= 5000)", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "steps",
        value: { value: 8000 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("awards biometric points for optimal sleep (>= 6 hours)", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "sleep",
        value: { value: 7.5 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("awards biometric points for optimal blood sugar (70-140 mg/dL)", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "blood_sugar",
        value: { value: 100 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("awards biometric points for optimal temperature (97-99.5 F)", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "temperature",
        value: { value: 98.6 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("awards biometric points for optimal oxygen saturation (>= 95)", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "oxygen_saturation",
        value: { value: 98 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.points).toBe(30);
  });

  it("skips metrics with pending_delete flag", () => {
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "heart_rate",
        value: { value: 75 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 1,
      },
    ];
    const result = calculateWeeklyHealthScore([], metrics);
    const biometricItem = result.breakdown.find((b) => b.id === "biometric_stability");
    expect(biometricItem?.description).toBe("No vital metric logs recorded yet");
    expect(biometricItem?.points).toBe(15);
  });

  it("awards symptom points based on resolved ratio", () => {
    const symptoms: OfflineSymptom[] = [
      {
        id: "s1",
        user_id: "u1",
        symptoms: "headache",
        severity_level: "mild",
        possible_causes: null,
        recommendations: null,
        risk_score: null,
        resolved: true,
        created_at: "2026-07-20T10:00:00Z",
        pending_sync: 0,
        pending_update: 0,
        pending_delete: 0,
      },
      {
        id: "s2",
        user_id: "u1",
        symptoms: "cough",
        severity_level: "moderate",
        possible_causes: null,
        recommendations: null,
        risk_score: null,
        resolved: false,
        created_at: "2026-07-20T10:00:00Z",
        pending_sync: 0,
        pending_update: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore(symptoms, []);
    const symptomItem = result.breakdown.find((b) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(15);
    expect(symptomItem?.description).toBe("1 of 2 recent symptoms resolved");
  });

  it("awards full symptom points for all resolved symptoms", () => {
    const symptoms: OfflineSymptom[] = [
      {
        id: "s1",
        user_id: "u1",
        symptoms: "headache",
        severity_level: "mild",
        possible_causes: null,
        recommendations: null,
        risk_score: null,
        resolved: true,
        created_at: "2026-07-20T10:00:00Z",
        pending_sync: 0,
        pending_update: 0,
        pending_delete: 0,
      },
      {
        id: "s2",
        user_id: "u1",
        symptoms: "cough",
        severity_level: "moderate",
        possible_causes: null,
        recommendations: null,
        risk_score: null,
        resolved: true,
        created_at: "2026-07-20T10:00:00Z",
        pending_sync: 0,
        pending_update: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore(symptoms, []);
    const symptomItem = result.breakdown.find((b) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(30);
    expect(symptomItem?.completed).toBe(true);
  });

  it("awards zero symptom points for all unresolved symptoms", () => {
    const symptoms: OfflineSymptom[] = [
      {
        id: "s1",
        user_id: "u1",
        symptoms: "headache",
        severity_level: "mild",
        possible_causes: null,
        recommendations: null,
        risk_score: null,
        resolved: false,
        created_at: "2026-07-20T10:00:00Z",
        pending_sync: 0,
        pending_update: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore(symptoms, []);
    const symptomItem = result.breakdown.find((b) => b.id === "symptom_resolution");
    expect(symptomItem?.points).toBe(0);
    expect(symptomItem?.completed).toBe(false);
  });

  it("caps total score at 100", () => {
    const symptoms: OfflineSymptom[] = [
      {
        id: "s1",
        user_id: "u1",
        symptoms: "headache",
        severity_level: "mild",
        possible_causes: null,
        recommendations: null,
        risk_score: null,
        resolved: true,
        created_at: "2026-07-20T10:00:00Z",
        pending_sync: 0,
        pending_update: 0,
        pending_delete: 0,
      },
    ];
    const metrics: OfflineMetric[] = [
      {
        id: "m1",
        user_id: "u1",
        metric_type: "heart_rate",
        value: { value: 75 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
      {
        id: "m2",
        user_id: "u1",
        metric_type: "steps",
        value: { value: 8000 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
      {
        id: "m3",
        user_id: "u1",
        metric_type: "sleep",
        value: { value: 8 },
        notes: null,
        recorded_at: "2026-07-28T10:00:00Z",
        pending_sync: 0,
        pending_delete: 0,
      },
    ];
    const result = calculateWeeklyHealthScore(symptoms, metrics);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  it("returns correct breakdown item structure", () => {
    const result = calculateWeeklyHealthScore([], []);
    for (const item of result.breakdown) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("label");
      expect(item).toHaveProperty("points");
      expect(item).toHaveProperty("maxPoints");
      expect(item).toHaveProperty("description");
      expect(item).toHaveProperty("completed");
      expect(typeof item.points).toBe("number");
      expect(typeof item.completed).toBe("boolean");
    }
  });
});
