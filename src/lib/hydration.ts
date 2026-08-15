export const DEFAULT_DAILY_GOAL_ML = 2000;

export const QUICK_ADD_OPTIONS_ML = [200, 250, 500, 1000];

export interface HydrationIntake {
  amountMl: number;
  recordedAt?: string;
  notes?: string | null;
}

export function isAmountValid(amountMl: number): boolean {
  return Number.isFinite(amountMl) && amountMl > 0 && amountMl <= 5000;
}

export function isDailyGoalValid(goalMl: number): boolean {
  return Number.isFinite(goalMl) && goalMl >= 250 && goalMl <= 20000;
}

export interface HydrationDaySummary {
  totalMl: number;
  remainingMl: number;
  percentComplete: number;
  entries: number;
}

export function summarizeDay(
  intakes: HydrationIntake[],
  dailyGoalMl: number = DEFAULT_DAILY_GOAL_ML,
): HydrationDaySummary {
  const totalMl = intakes.reduce((sum, i) => sum + i.amountMl, 0);
  const percentComplete =
    dailyGoalMl > 0 ? Math.min(100, Math.round((totalMl / dailyGoalMl) * 100)) : 0;

  return {
    totalMl,
    remainingMl: Math.max(0, dailyGoalMl - totalMl),
    percentComplete,
    entries: intakes.length,
  };
}

export function intakesOnSameDay(
  intakes: HydrationIntake[],
  now: Date = new Date(),
): HydrationIntake[] {
  return intakes.filter((i) => {
    if (!i.recordedAt) return false;
    const d = new Date(i.recordedAt);
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });
}
