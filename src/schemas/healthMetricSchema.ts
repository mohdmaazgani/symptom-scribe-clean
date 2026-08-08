// src/schemas/healthMetricSchema.ts
import { z } from "zod";

// Optional numeric metric fields. `valueAsNumber` in react-hook-form produces
// NaN for empty inputs, which must be allowed so users can submit any subset
// of the three metrics (the form itself rejects submissions with no valid
// values).
const optionalMetricValue = z
  .number({ invalid_type_error: "Must be a number" })
  .min(0, "Must be 0 or greater")
  .or(z.nan())
  .optional();

export const healthMetricSchema = z.object({
  steps: optionalMetricValue,
  hydrationMl: optionalMetricValue,
  caloriesKcal: optionalMetricValue,
});

export type HealthMetricInput = z.infer<typeof healthMetricSchema>;
