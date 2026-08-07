import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { calculateWeeklyHealthScore } from "./score-calculator";
import type { OfflineSymptom, OfflineMetric } from "./offline-db";

/**
 * The calculator derives its day boundaries from `toISOString()`, i.e. from the
 * UTC date. Freezing the clock at mid-day UTC, far from any daylight-saving
 * transition worldwide, keeps every "N days ago" fixture on the UTC day the
 * test intends regardless of the timezone the suite runs in.
 */
const NOW = new Date("2026-05-15T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days: number): string => new Date(NOW.getTime() - days * DAY_MS).toISOString();

const makeSymptom = (overrides: Partial<OfflineSymptom> = {}): OfflineSymptom => ({
  id: "symptom-1",
  user_id: "user-1",
  symptoms: "headache",
  severity_level: "low",
  possible_causes: null,
  recommendations: null,
  risk_score: null,
  resolved: false,
  created_at: daysAgo(0),
  pending_sync: 0,
  pending_update: 0,
  pending_delete: 0,
  ...overrides,
});

const makeMetric = (overrides: Partial<OfflineMetric> = {}): OfflineMetric => ({
  id: "metric-1",
  user_id: "user-1",
  metric_type: "heart_rate",
  value: { value: 72 },
  notes: null,
  recorded_at: daysAgo(0),
  pending_sync: 0,
  pending_delete: 0,
  ...overrides,
});

const pointsFor = (
  result: ReturnType<typeof calculateWeeklyHealthScore>,
  id: string
): number | undefined => result.breakdown.find((item) => item.id === id)?.points;

describe("calculateWeeklyHealthScore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("empty input", () => {
    it("falls back to the neutral baseline when called with no arguments", () => {
      const result = calculateWeeklyHealthScore();

      // 0 consistency + 30 symptom (nothing to treat) + 15 biometric baseline
      expect(result.totalScore).toBe(45);
      expect(result.streakDays).toBe(0);
      expect(result.loggingDaysLastWeek).toBe(0);
    });

    it("returns the same baseline for explicitly empty arrays", () => {
      expect(calculateWeeklyHealthScore([], [])).toEqual(calculateWeeklyHealthScore());
    });

    it("reports the three breakdown categories with their maximums", () => {
      const { breakdown } = calculateWeeklyHealthScore();

      expect(breakdown.map((item) => item.id)).toEqual([
        "consistency",
        "symptom_resolution",
        "biometric_stability",
      ]);
      expect(breakdown.map((item) => item.maxPoints)).toEqual([40, 30, 30]);
      expect(breakdown.map((item) => item.completed)).toEqual([false, true, false]);
      expect(breakdown[1].description).toBe("No active symptom burden recorded");
      expect(breakdown[2].description).toBe("No vital metric logs recorded yet");
    });
  });

  describe("streak calculation", () => {
    it("counts consecutive days ending today", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ created_at: daysAgo(0) }),
        makeSymptom({ created_at: daysAgo(1) }),
        makeSymptom({ created_at: daysAgo(2) }),
      ]);

      expect(result.streakDays).toBe(3);
    });

    it("starts from yesterday when today has no entry yet", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ created_at: daysAgo(1) }),
        makeSymptom({ created_at: daysAgo(2) }),
      ]);

      expect(result.streakDays).toBe(2);
    });

    it("returns zero when neither today nor yesterday has an entry", () => {
      const result = calculateWeeklyHealthScore([makeSymptom({ created_at: daysAgo(3) })]);

      expect(result.streakDays).toBe(0);
    });

    it("stops at the first missing day", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ created_at: daysAgo(0) }),
        makeSymptom({ created_at: daysAgo(1) }),
        // day 2 missing — the streak must not jump the gap
        makeSymptom({ created_at: daysAgo(3) }),
      ]);

      expect(result.streakDays).toBe(2);
    });

    it("counts a day logged only through a metric", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ recorded_at: daysAgo(0) }), makeMetric({ recorded_at: daysAgo(1) })]
      );

      expect(result.streakDays).toBe(2);
    });

    it("treats several entries on the same day as one day", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ id: "a", created_at: daysAgo(0) }),
        makeSymptom({ id: "b", created_at: daysAgo(0) }),
      ]);

      expect(result.streakDays).toBe(1);
    });

    it("continues counting consecutive days beyond the seven-day window", () => {
      const symptoms = Array.from({ length: 10 }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i) })
      );

      const result = calculateWeeklyHealthScore(symptoms);

      // The streak is unbounded, while the consistency window is capped at 7 days.
      expect(result.streakDays).toBe(10);
      expect(result.loggingDaysLastWeek).toBe(7);
    });

    it("does not count days logged only by pending-delete metrics", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ recorded_at: daysAgo(0), pending_delete: 1 })]
      );

      expect(result.streakDays).toBe(0);
    });
  });

  describe("logging consistency", () => {
    it("awards the full 40 points for logging on all seven days", () => {
      const symptoms = Array.from({ length: 7 }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i) })
      );

      const result = calculateWeeklyHealthScore(symptoms);

      expect(result.loggingDaysLastWeek).toBe(7);
      expect(pointsFor(result, "consistency")).toBe(40);
      expect(result.breakdown[0].completed).toBe(true);
      expect(result.breakdown[0].description).toBe("Logged entries on 7 of the last 7 days");
    });

    it("prorates and rounds partial weeks", () => {
      const symptoms = Array.from({ length: 4 }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i) })
      );

      const result = calculateWeeklyHealthScore(symptoms);

      expect(result.loggingDaysLastWeek).toBe(4);
      // (4 / 7) * 40 = 22.857… → 23
      expect(pointsFor(result, "consistency")).toBe(23);
    });

    it.each([
      { days: 1, expected: 6 }, // (1 / 7) * 40 = 5.71… → 6
      { days: 3, expected: 17 }, // (3 / 7) * 40 = 17.14… → 17
      { days: 6, expected: 34 }, // (6 / 7) * 40 = 34.28… → 34
    ])("rounds $days logged days to $expected consistency points", ({ days, expected }) => {
      const symptoms = Array.from({ length: days }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i) })
      );

      const result = calculateWeeklyHealthScore(symptoms);

      expect(pointsFor(result, "consistency")).toBe(expected);
    });

    it("marks the category complete only from five logged days", () => {
      const fourDays = Array.from({ length: 4 }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i) })
      );
      const fiveDays = Array.from({ length: 5 }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i) })
      );

      expect(calculateWeeklyHealthScore(fourDays).breakdown[0].completed).toBe(false);
      expect(calculateWeeklyHealthScore(fiveDays).breakdown[0].completed).toBe(true);
    });

    it("ignores entries older than the seven day window", () => {
      const result = calculateWeeklyHealthScore([makeSymptom({ created_at: daysAgo(8) })]);

      expect(result.loggingDaysLastWeek).toBe(0);
      expect(pointsFor(result, "consistency")).toBe(0);
    });

    it("ignores symptoms without a created_at timestamp", () => {
      const result = calculateWeeklyHealthScore([makeSymptom({ created_at: "" })]);

      expect(result.loggingDaysLastWeek).toBe(0);
      expect(result.streakDays).toBe(0);
    });

    it("ignores metrics that are pending deletion", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ recorded_at: daysAgo(0), pending_delete: 1 })]
      );

      expect(result.loggingDaysLastWeek).toBe(0);
      // Falls back to the no-metrics baseline rather than scoring the reading.
      expect(pointsFor(result, "biometric_stability")).toBe(15);
    });
  });

  describe("symptom resolution", () => {
    it("awards the full 30 points when every symptom is resolved", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ id: "a", resolved: true }),
        makeSymptom({ id: "b", resolved: true }),
      ]);

      expect(pointsFor(result, "symptom_resolution")).toBe(30);
      expect(result.breakdown[1].description).toBe("2 of 2 recent symptoms resolved");
    });

    it("scales with the resolved ratio", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ id: "a", resolved: true }),
        makeSymptom({ id: "b", resolved: false }),
      ]);

      expect(pointsFor(result, "symptom_resolution")).toBe(15);
      expect(result.breakdown[1].description).toBe("1 of 2 recent symptoms resolved");
    });

    it("awards nothing when no symptom is resolved", () => {
      const result = calculateWeeklyHealthScore([makeSymptom({ resolved: false })]);

      expect(pointsFor(result, "symptom_resolution")).toBe(0);
      expect(result.breakdown[1].completed).toBe(false);
    });

    it("rounds the resolved ratio and flips the completion flag at 20 points", () => {
      const oneOfThree = calculateWeeklyHealthScore([
        makeSymptom({ id: "a", resolved: true }),
        makeSymptom({ id: "b", resolved: false }),
        makeSymptom({ id: "c", resolved: false }),
      ]);
      const twoOfThree = calculateWeeklyHealthScore([
        makeSymptom({ id: "a", resolved: true }),
        makeSymptom({ id: "b", resolved: true }),
        makeSymptom({ id: "c", resolved: false }),
      ]);

      // (1 / 3) * 30 = 10 → not complete
      expect(pointsFor(oneOfThree, "symptom_resolution")).toBe(10);
      expect(oneOfThree.breakdown[1].completed).toBe(false);
      // (2 / 3) * 30 = 20 → exactly at the completion threshold
      expect(pointsFor(twoOfThree, "symptom_resolution")).toBe(20);
      expect(twoOfThree.breakdown[1].completed).toBe(true);
    });

    it("still applies the resolved ratio to entries older than the week window", () => {
      const result = calculateWeeklyHealthScore([
        makeSymptom({ created_at: daysAgo(10), resolved: false }),
      ]);

      // Symptom scoring is not windowed: the old unresolved entry still drops the
      // score from the 30-point no-symptom baseline down to 0.
      expect(pointsFor(result, "symptom_resolution")).toBe(0);
    });
  });

  describe("biometric stability", () => {
    const optimalReadings = [
      { metric_type: "heart_rate", value: { value: 72 } },
      { metric_type: "temperature", value: { value: 98.6 } },
      { metric_type: "oxygen_saturation", value: { value: 98 } },
      { metric_type: "blood_sugar", value: { value: 90 } },
      { metric_type: "blood_pressure", value: { systolic: 118, diastolic: 78 } },
      { metric_type: "sleep", value: { value: 8 } },
      { metric_type: "steps", value: { value: 10000 } },
    ];

    const outOfRangeReadings = [
      { metric_type: "heart_rate", value: { value: 45 } },
      { metric_type: "temperature", value: { value: 101.4 } },
      { metric_type: "oxygen_saturation", value: { value: 91 } },
      { metric_type: "blood_sugar", value: { value: 210 } },
      { metric_type: "blood_pressure", value: { systolic: 150, diastolic: 95 } },
      { metric_type: "sleep", value: { value: 4 } },
      { metric_type: "steps", value: { value: 1200 } },
    ];

    it.each(optimalReadings)("scores an in-range $metric_type reading as optimal", (reading) => {
      const result = calculateWeeklyHealthScore([], [makeMetric(reading)]);

      expect(pointsFor(result, "biometric_stability")).toBe(30);
      expect(result.breakdown[2].completed).toBe(true);
      expect(result.breakdown[2].description).toBe("1 of 1 vital readings in optimal range");
    });

    it.each(outOfRangeReadings)(
      "scores an out-of-range $metric_type reading as sub-optimal",
      (reading) => {
        const result = calculateWeeklyHealthScore([], [makeMetric(reading)]);

        expect(pointsFor(result, "biometric_stability")).toBe(0);
        expect(result.breakdown[2].completed).toBe(false);
        expect(result.breakdown[2].description).toBe("0 of 1 vital readings in optimal range");
      }
    );

    it.each([
      // heart rate: optimal when 60–100 inclusive
      { metric_type: "heart_rate", value: { value: 60 }, optimal: true },
      { metric_type: "heart_rate", value: { value: 100 }, optimal: true },
      { metric_type: "heart_rate", value: { value: 59 }, optimal: false },
      { metric_type: "heart_rate", value: { value: 101 }, optimal: false },
      // temperature: optimal when 97–99.5 inclusive
      { metric_type: "temperature", value: { value: 97 }, optimal: true },
      { metric_type: "temperature", value: { value: 99.5 }, optimal: true },
      { metric_type: "temperature", value: { value: 96.9 }, optimal: false },
      { metric_type: "temperature", value: { value: 99.6 }, optimal: false },
      // oxygen saturation: optimal when >= 95
      { metric_type: "oxygen_saturation", value: { value: 95 }, optimal: true },
      { metric_type: "oxygen_saturation", value: { value: 94 }, optimal: false },
      // blood sugar: optimal when 70–140 inclusive
      { metric_type: "blood_sugar", value: { value: 70 }, optimal: true },
      { metric_type: "blood_sugar", value: { value: 140 }, optimal: true },
      { metric_type: "blood_sugar", value: { value: 69 }, optimal: false },
      { metric_type: "blood_sugar", value: { value: 141 }, optimal: false },
      // blood pressure: optimal only when both components are below threshold
      { metric_type: "blood_pressure", value: { systolic: 129, diastolic: 84 }, optimal: true },
      { metric_type: "blood_pressure", value: { systolic: 130, diastolic: 84 }, optimal: false },
      { metric_type: "blood_pressure", value: { systolic: 129, diastolic: 85 }, optimal: false },
      // sleep: optimal when >= 6
      { metric_type: "sleep", value: { value: 6 }, optimal: true },
      { metric_type: "sleep", value: { value: 5.9 }, optimal: false },
      // steps: optimal when >= 5000
      { metric_type: "steps", value: { value: 5000 }, optimal: true },
      { metric_type: "steps", value: { value: 4999 }, optimal: false },
    ])(
      "treats a $metric_type reading at the exact threshold boundary as $optimal",
      ({ metric_type, value, optimal }) => {
        const result = calculateWeeklyHealthScore([], [makeMetric({ metric_type, value })]);

        expect(pointsFor(result, "biometric_stability")).toBe(optimal ? 30 : 0);
      }
    );

    it("treats an unrecognised metric type as optimal", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ metric_type: "mood", value: { value: 3 } })]
      );

      expect(pointsFor(result, "biometric_stability")).toBe(30);
    });

    it("skips readings with a null value but still counts them in the total", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ id: "a", value: null }), makeMetric({ id: "b", value: { value: 72 } })]
      );

      // Only the heart rate reading is optimal, out of two logged readings.
      expect(pointsFor(result, "biometric_stability")).toBe(15);
      expect(result.breakdown[2].description).toBe("1 of 2 vital readings in optimal range");
    });

    it("treats a zero value as sub-optimal without crashing", () => {
      const result = calculateWeeklyHealthScore([], [makeMetric({ value: { value: 0 } })]);

      expect(pointsFor(result, "biometric_stability")).toBe(0);
    });

    it("treats a metric with an empty value object as sub-optimal without crashing", () => {
      const result = calculateWeeklyHealthScore([], [makeMetric({ value: {} })]);

      expect(pointsFor(result, "biometric_stability")).toBe(0);
    });

    it("requires both blood pressure components to be present", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ metric_type: "blood_pressure", value: { systolic: 118 } })]
      );

      expect(pointsFor(result, "biometric_stability")).toBe(0);
    });

    it("excludes pending-delete metrics from the optimal ratio", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [
          makeMetric({ id: "a", value: { value: 72 } }),
          makeMetric({ id: "b", value: { value: 45 } }),
          makeMetric({ id: "c", value: { value: 55 }, pending_delete: 1 }),
        ]
      );

      // Only the two valid readings count: 1 of 2 in range → 15 points.
      expect(pointsFor(result, "biometric_stability")).toBe(15);
      expect(result.breakdown[2].description).toBe("1 of 2 vital readings in optimal range");
    });

    it("still scores entries older than the week window", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [makeMetric({ recorded_at: daysAgo(10), value: { value: 72 } })]
      );

      // Biometric scoring is not windowed: a 10-day-old optimal reading still scores.
      expect(pointsFor(result, "biometric_stability")).toBe(30);
    });

    it("scales with the ratio of optimal readings", () => {
      const result = calculateWeeklyHealthScore(
        [],
        [
          makeMetric({ id: "a", value: { value: 72 } }),
          makeMetric({ id: "b", value: { value: 45 } }),
        ]
      );

      expect(pointsFor(result, "biometric_stability")).toBe(15);
    });
  });

  describe("total score boundaries", () => {
    it("reaches exactly 100 for a perfect week without exceeding the cap", () => {
      const symptoms = Array.from({ length: 7 }, (_, i) =>
        makeSymptom({ id: `symptom-${i}`, created_at: daysAgo(i), resolved: true })
      );
      const metrics = Array.from({ length: 7 }, (_, i) =>
        makeMetric({ id: `metric-${i}`, recorded_at: daysAgo(i), value: { value: 72 } })
      );

      const result = calculateWeeklyHealthScore(symptoms, metrics);

      expect(result.totalScore).toBe(100);
      expect(result.streakDays).toBe(7);
      expect(result.breakdown.every((item) => item.completed)).toBe(true);
    });

    it("bottoms out at 0 when nothing is logged, resolved, or in range", () => {
      const result = calculateWeeklyHealthScore(
        [makeSymptom({ created_at: daysAgo(10), resolved: false })],
        [makeMetric({ recorded_at: daysAgo(10), value: { value: 45 } })]
      );

      expect(result.totalScore).toBe(0);
    });

    it("keeps the total equal to the sum of its breakdown", () => {
      const result = calculateWeeklyHealthScore(
        [makeSymptom({ created_at: daysAgo(1), resolved: true })],
        [makeMetric({ recorded_at: daysAgo(2), value: { value: 72 } })]
      );

      const sum = result.breakdown.reduce((acc, item) => acc + item.points, 0);
      expect(result.totalScore).toBe(sum);
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });
});
