import { describe, it, expect } from "vitest";
import {
  classifyBloodPressure,
  summarizeBloodPressure,
  readingsWithinLastDays,
  isSystolicValid,
  isDiastolicValid,
  type BloodPressureReading,
} from "./hypertension";

describe("classifyBloodPressure", () => {
  it("classifies normal readings below 120/80", () => {
    expect(classifyBloodPressure(110, 70).category).toBe("normal");
  });

  it("classifies elevated when systolic is 120-129 and diastolic under 80", () => {
    expect(classifyBloodPressure(120, 75).category).toBe("elevated");
    expect(classifyBloodPressure(128, 79).category).toBe("elevated");
  });

  it("classifies stage 1 when systolic is 130-139 or diastolic 80-89", () => {
    expect(classifyBloodPressure(130, 75).category).toBe("stage1");
    expect(classifyBloodPressure(135, 85).category).toBe("stage1");
    expect(classifyBloodPressure(118, 85).category).toBe("stage1");
  });

  it("classifies stage 2 when systolic >= 140 or diastolic >= 90", () => {
    expect(classifyBloodPressure(140, 80).category).toBe("stage2");
    expect(classifyBloodPressure(120, 95).category).toBe("stage2");
  });

  it("classifies crisis when systolic > 180 or diastolic > 120", () => {
    expect(classifyBloodPressure(181, 90).category).toBe("crisis");
    expect(classifyBloodPressure(120, 121).category).toBe("crisis");
  });
});

describe("isSystolicValid / isDiastolicValid", () => {
  it("accepts values within the supported range", () => {
    expect(isSystolicValid(120)).toBe(true);
    expect(isSystolicValid(50)).toBe(true);
    expect(isSystolicValid(300)).toBe(true);
    expect(isDiastolicValid(80)).toBe(true);
    expect(isDiastolicValid(30)).toBe(true);
    expect(isDiastolicValid(200)).toBe(true);
  });

  it("rejects out-of-range and non-finite values", () => {
    expect(isSystolicValid(49)).toBe(false);
    expect(isSystolicValid(301)).toBe(false);
    expect(isSystolicValid(NaN)).toBe(false);
    expect(isDiastolicValid(29)).toBe(false);
    expect(isDiastolicValid(201)).toBe(false);
    expect(isDiastolicValid(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("summarizeBloodPressure", () => {
  it("returns a null summary when there are no readings", () => {
    const summary = summarizeBloodPressure([]);
    expect(summary.readingCount).toBe(0);
    expect(summary.averageSystolic).toBeNull();
    expect(summary.averageDiastolic).toBeNull();
    expect(summary.mostRecentCategory).toBeNull();
  });

  it("computes averages and latest category from readings", () => {
    const readings: BloodPressureReading[] = [
      { systolic: 120, diastolic: 80, recordedAt: "2026-08-01T09:00:00Z" },
      { systolic: 130, diastolic: 85, recordedAt: "2026-08-02T09:00:00Z" },
      { systolic: 140, diastolic: 90, recordedAt: "2026-08-03T09:00:00Z" },
    ];

    const summary = summarizeBloodPressure(readings);

    expect(summary.readingCount).toBe(3);
    expect(summary.averageSystolic).toBe(130);
    expect(summary.averageDiastolic).toBe(85);
    expect(summary.mostRecentCategory?.category).toBe("stage2");
  });

  it("falls back to the first reading when timestamps are missing", () => {
    const summary = summarizeBloodPressure([
      { systolic: 110, diastolic: 70 },
      { systolic: 125, diastolic: 80 },
    ]);

    expect(summary.averageSystolic).toBe(118);
    expect(summary.mostRecentCategory?.category).toBe("normal");
  });
});

describe("readingsWithinLastDays", () => {
  const now = new Date("2026-08-15T12:00:00Z");
  const readings: BloodPressureReading[] = [
    { systolic: 110, diastolic: 70, recordedAt: "2026-08-14T09:00:00Z" },
    { systolic: 120, diastolic: 80, recordedAt: "2026-08-01T09:00:00Z" },
    { systolic: 130, diastolic: 85, recordedAt: "2026-07-01T09:00:00Z" },
  ];

  it("only keeps readings within the requested window", () => {
    const recent = readingsWithinLastDays(readings, 7, now);
    expect(recent).toHaveLength(1);
    expect(recent[0].systolic).toBe(110);
  });

  it("excludes readings without a timestamp", () => {
    const mixed = [...readings, { systolic: 100, diastolic: 60 }];
    const recent = readingsWithinLastDays(mixed, 7, now);
    expect(recent.some((r) => r.recordedAt === undefined)).toBe(false);
  });
});
