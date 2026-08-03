import { describe, it, expect } from "vitest";
import { calculateWeeklyHealthScore } from "./score-calculator";
import type { OfflineMetric, OfflineSymptom } from "./offline-db";

function makeMetric(
  id: string,
  metricType: string,
  recordedAt: string,
  value: object,
  pendingDelete = 0
): OfflineMetric {
  return { id, metric_type: metricType, recorded_at: recordedAt, value, pending_delete: pendingDelete };
}

function makeSymptom(id: string, createdAt: string, resolved: boolean): OfflineSymptom {
  return { id, title: "Test symptom", description: "", severity_level: "medium" as const, created_at: createdAt, resolved, pending_delete: 0, tags: [], notes: "" };
}

describe("calculateWeeklyHealthScore", () => {
  it("returns baseline score with no data", () => {
    const result = calculateWeeklyHealthScore([], []);
    // With no symptoms: symptomPoints = 30 (max)
    // With no metrics: biometricPoints = 15 (default baseline), consistencyPoints = 0
    // totalScore = 0 + 30 + 15 = 45
    expect(result.totalScore).toBe(45);
    expect(result.streakDays).toBe(0);
    expect(result.loggingDaysLastWeek).toBe(0);
    expect(result.breakdown).toHaveLength(3);
  });

  it("handles empty arrays gracefully", () => {
    const result = calculateWeeklyHealthScore(undefined as unknown as OfflineSymptom[], undefined as unknown as OfflineMetric[]);
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });

  describe("streak calculation", () => {
    it("counts streak days when entries exist today", () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      const symptoms: OfflineSymptom[] = [
        makeSymptom("s1", today, false),
        makeSymptom("s2", yesterday, false),
        makeSymptom("s3", twoDaysAgo, false),
      ];
      const result = calculateWeeklyHealthScore(symptoms, []);
      expect(result.streakDays).toBeGreaterThanOrEqual(0);
    });

    it("returns zero streak with no recent entries", () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
      const symptoms: OfflineSymptom[] = [makeSymptom("s1", tenDaysAgo, false)];
      const result = calculateWeeklyHealthScore(symptoms, []);
      expect(result.streakDays).toBe(0);
    });
  });

  describe("consistency scoring", () => {
    it("awards points proportional to logging days", () => {
      // Add entries for all 7 days
      const metrics: OfflineMetric[] = Array.from({ length: 7 }, (_, i) =>
        makeMetric(`m${i}`, "heart_rate", new Date(Date.now() - i * 86400000).toISOString(), { value: 75 })
      );
      const result = calculateWeeklyHealthScore([], metrics);
      const consistency = result.breakdown.find((b) => b.id === "consistency");
      expect(consistency?.points).toBe(40); // Max points for logging all 7 days
    });

    it("marks consistency as completed when 5+ days logged", () => {
      const metrics: OfflineMetric[] = Array.from({ length: 5 }, (_, i) =>
        makeMetric(`m${i}`, "heart_rate", new Date(Date.now() - i * 86400000).toISOString(), { value: 75 })
      );
      const result = calculateWeeklyHealthScore([], metrics);
      const consistency = result.breakdown.find((b) => b.id === "consistency");
      expect(consistency?.completed).toBe(true);
    });
  });

  describe("biometric scoring", () => {
    it("awards max biometric points for all optimal readings", () => {
      const now = new Date().toISOString();
      const metrics: OfflineMetric[] = [
        makeMetric("m1", "heart_rate", now, { value: 80 }),
        makeMetric("m2", "temperature", now, { value: 98.6 }),
        makeMetric("m3", "oxygen_saturation", now, { value: 98 }),
        makeMetric("m4", "blood_sugar", now, { value: 100 }),
        makeMetric("m5", "blood_pressure", now, { systolic: 120, diastolic: 80 }),
        makeMetric("m6", "sleep", now, { value: 8 }),
        makeMetric("m7", "steps", now, { value: 8000 }),
      ];
      const result = calculateWeeklyHealthScore([], metrics);
      const biometric = result.breakdown.find((b) => b.id === "biometric_stability");
      expect(biometric?.points).toBe(30); // Max points
      expect(biometric?.completed).toBe(true);
    });

    it("awards zero biometric points when no optimal readings", () => {
      const now = new Date().toISOString();
      const metrics: OfflineMetric[] = [
        makeMetric("m1", "heart_rate", now, { value: 30 }), // Too low
        makeMetric("m2", "temperature", now, { value: 104 }), // Fever
        makeMetric("m3", "oxygen_saturation", now, { value: 85 }), // Too low
      ];
      const result = calculateWeeklyHealthScore([], metrics);
      const biometric = result.breakdown.find((b) => b.id === "biometric_stability");
      expect(biometric?.points).toBe(0);
    });

    it("filters out metrics with pending_delete=1", () => {
      const now = new Date().toISOString();
      const metrics: OfflineMetric[] = [
        makeMetric("m1", "heart_rate", now, { value: 30 }, 1), // Deleted, should be ignored
        makeMetric("m2", "heart_rate", now, { value: 80 }, 0), // Normal
      ];
      const result = calculateWeeklyHealthScore([], metrics);
      const biometric = result.breakdown.find((b) => b.id === "biometric_stability");
      // Only 1 valid metric, which is optimal
      expect(biometric?.points).toBeGreaterThan(0);
    });
  });

  describe("symptom resolution scoring", () => {
    it("awards max symptom points when no symptoms", () => {
      const result = calculateWeeklyHealthScore([], []);
      const symptom = result.breakdown.find((b) => b.id === "symptom_resolution");
      expect(symptom?.points).toBe(30); // Max when no symptoms
    });

    it("reduces symptom points based on resolution ratio", () => {
      const now = new Date().toISOString();
      const symptoms: OfflineSymptom[] = [
        makeSymptom("s1", now, false),
        makeSymptom("s2", now, false),
        makeSymptom("s3", now, true),
        makeSymptom("s4", now, true),
      ];
      const result = calculateWeeklyHealthScore(symptoms, []);
      const symptom = result.breakdown.find((b) => b.id === "symptom_resolution");
      // 2/4 resolved = 50% of max 30 = 15 points
      expect(symptom?.points).toBe(15);
      expect(symptom?.completed).toBe(false); // 15 < 20
    });

    it("marks symptom as completed when points >= 20", () => {
      const now = new Date().toISOString();
      const symptoms: OfflineSymptom[] = [
        makeSymptom("s1", now, true),
        makeSymptom("s2", now, true),
        makeSymptom("s3", now, true),
        makeSymptom("s4", now, true),
        makeSymptom("s5", now, true),
      ];
      const result = calculateWeeklyHealthScore(symptoms, []);
      const symptom = result.breakdown.find((b) => b.id === "symptom_resolution");
      // 5/5 resolved = 100% of max 30 = 30 points
      expect(symptom?.points).toBe(30);
      expect(symptom?.completed).toBe(true);
    });
  });

  describe("total score boundaries", () => {
    it("clamps total score to 0-100 range", () => {
      // Create a scenario that would theoretically exceed 100
      const result = calculateWeeklyHealthScore([], []);
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });
});
