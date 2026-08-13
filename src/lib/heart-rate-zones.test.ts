import { describe, expect, it } from "vitest";
import { calculateMaxHeartRate, classifyHeartRate } from "./heart-rate-zones";

describe("heart-rate zone calculations", () => {
  it("calculates age-adjusted maximum heart rate", () => {
    expect(calculateMaxHeartRate(40)).toBe(180);
  });

  it.each([
    [80, "Resting"],
    [100, "Fat Burn"],
    [120, "Aerobic"],
    [140, "Threshold"],
    [160, "Peak"],
  ] as const)("classifies %s BPM for a 40-year-old as %s", (bpm, expectedZone) => {
    expect(classifyHeartRate(bpm, 40).zone.name).toBe(expectedZone);
  });
});
