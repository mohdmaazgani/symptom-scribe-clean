import { describe, it, expect } from "vitest";
import {
  DEFAULT_DAILY_GOAL_ML,
  QUICK_ADD_OPTIONS_ML,
  summarizeDay,
  intakesOnSameDay,
  isAmountValid,
  isDailyGoalValid,
  type HydrationIntake,
} from "./hydration";

describe("isAmountValid", () => {
  it("accepts positive amounts up to 5000 ml", () => {
    expect(isAmountValid(200)).toBe(true);
    expect(isAmountValid(1)).toBe(true);
    expect(isAmountValid(5000)).toBe(true);
  });

  it("rejects zero, negatives, out-of-range, and non-finite values", () => {
    expect(isAmountValid(0)).toBe(false);
    expect(isAmountValid(-100)).toBe(false);
    expect(isAmountValid(5001)).toBe(false);
    expect(isAmountValid(NaN)).toBe(false);
  });
});

describe("isDailyGoalValid", () => {
  it("accepts goals between 250 and 20000 ml", () => {
    expect(isDailyGoalValid(250)).toBe(true);
    expect(isDailyGoalValid(2000)).toBe(true);
    expect(isDailyGoalValid(20000)).toBe(true);
  });

  it("rejects goals outside the supported range", () => {
    expect(isDailyGoalValid(249)).toBe(false);
    expect(isDailyGoalValid(20001)).toBe(false);
    expect(isDailyGoalValid(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("summarizeDay", () => {
  it("returns zeros when there are no intakes", () => {
    const summary = summarizeDay([]);
    expect(summary.totalMl).toBe(0);
    expect(summary.remainingMl).toBe(DEFAULT_DAILY_GOAL_ML);
    expect(summary.percentComplete).toBe(0);
    expect(summary.entries).toBe(0);
  });

  it("computes total, remaining, and percent against the default goal", () => {
    const summary = summarizeDay([
      { amountMl: 1000 },
      { amountMl: 500 },
    ]);
    expect(summary.totalMl).toBe(1500);
    expect(summary.remainingMl).toBe(500);
    expect(summary.percentComplete).toBe(75);
    expect(summary.entries).toBe(2);
  });

  it("caps percent at 100 when over the goal", () => {
    const summary = summarizeDay([
      { amountMl: 2500 },
      { amountMl: 500 },
    ]);
    expect(summary.percentComplete).toBe(100);
    expect(summary.remainingMl).toBe(0);
  });

  it("respects a custom daily goal", () => {
    const summary = summarizeDay([{ amountMl: 1500 }], 3000);
    expect(summary.percentComplete).toBe(50);
    expect(summary.remainingMl).toBe(1500);
  });
});

describe("intakesOnSameDay", () => {
  const now = new Date("2026-08-15T12:00:00Z");

  it("only keeps intakes recorded on the same calendar day", () => {
    // Built from local Date components so the assertion is timezone-independent.
    const sameDayMorning = new Date(2026, 7, 15, 8, 0, 0).toISOString();
    const sameDayEvening = new Date(2026, 7, 15, 22, 0, 0).toISOString();
    const previousDay = new Date(2026, 7, 14, 8, 0, 0).toISOString();

    const intakes: HydrationIntake[] = [
      { amountMl: 250, recordedAt: sameDayMorning },
      { amountMl: 500, recordedAt: sameDayEvening },
      { amountMl: 1000, recordedAt: previousDay },
    ];

    const today = intakesOnSameDay(intakes, now);
    expect(today).toHaveLength(2);
    expect(today.reduce((s, i) => s + i.amountMl, 0)).toBe(750);
  });

  it("excludes intakes without a timestamp", () => {
    const mixed = [{ amountMl: 250, recordedAt: "2026-08-15T09:00:00Z" }, { amountMl: 500 }];
    const today = intakesOnSameDay(mixed, now);
    expect(today.some((i) => i.recordedAt === undefined)).toBe(false);
  });
});

describe("QUICK_ADD_OPTIONS_ML", () => {
  it("exposes sensible quick-add amounts", () => {
    expect(QUICK_ADD_OPTIONS_ML).toEqual([200, 250, 500, 1000]);
  });
});
