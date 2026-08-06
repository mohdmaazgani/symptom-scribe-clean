// src/components/forms/MetricsForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { healthMetricSchema, HealthMetricInput } from "../../schemas/healthMetricSchema";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Json } from "@/integrations/supabase/types";

export const MetricsForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HealthMetricInput>({
    resolver: zodResolver(healthMetricSchema),
  });

  const isValidNumber = (n: unknown): n is number =>
    typeof n === "number" && Number.isFinite(n);

  const onSubmit = async (data: HealthMetricInput) => {
    try {
      const {
        data: userData,
        error: authError,
      } = await supabase.auth.getUser();

      const user = userData?.user ?? null;
      if (authError || !user) {
        showError("Not signed in", "Please sign in again to log your metrics.");
        return;
      }

      const recordedAt = new Date().toISOString();

      // Map input fields to metric rows but only include finite numbers (allows 0).
      const metricInputs: Array<{ metric_type: string; value: unknown }> = [
        { metric_type: "steps", value: data.steps },
        { metric_type: "hydration", value: data.hydrationMl },
        { metric_type: "calories", value: data.caloriesKcal },
      ];

      const rows = metricInputs.reduce<Array<{ user_id: string; recorded_at: string; metric_type: string; value: Json }>>((acc, m) => {
        if (isValidNumber(m.value)) {
          acc.push({
            user_id: user.id,
            recorded_at: recordedAt,
            metric_type: m.metric_type,
            value: { value: m.value } as Json,
          });
        }
        return acc;
      }, []);

      if (rows.length === 0) {
        showError("No metrics provided", "Please enter at least one numeric metric before submitting.");
        return;
      }

      const { error: insertError } = await supabase.from("health_metrics").insert(rows);
      if (insertError) {
        // Log full error for debugging/observability, but show a user-friendly message.
        console.error("Failed to insert health_metrics rows:", insertError);
        showError("Couldn't save metrics", "An error occurred while saving your metrics. Please try again.");
        return;
      }

      showSuccess("Metrics logged", "Your steps, hydration, and calories were saved.");
      reset();
    } catch (err) {
      // Unexpected runtime errors: log detail and show generic message.
      console.error("Failed to submit metrics:", err);
      showError("Couldn't save metrics", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto p-4">
      {/* --- STEPS INPUT --- */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="steps">Steps</Label>
        <Input
          id="steps"
          type="number"
          placeholder="e.g., 8000"
          aria-invalid={!!errors.steps}
          {...register("steps", { valueAsNumber: true })}
        />
        {errors.steps && (
          <span className="text-destructive text-sm font-medium">{errors.steps.message}</span>
        )}
      </div>

      {/* --- HYDRATION INPUT --- */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="hydrationMl">Hydration (ml)</Label>
        <Input
          id="hydrationMl"
          type="number"
          placeholder="e.g., 2000"
          aria-invalid={!!errors.hydrationMl}
          {...register("hydrationMl", { valueAsNumber: true })}
        />
        {errors.hydrationMl && (
          <span className="text-destructive text-sm font-medium">
            {errors.hydrationMl.message}
          </span>
        )}
      </div>

      {/* --- CALORIES INPUT --- */}
      <div className="flex flex-col gap-1">
        <Label htmlFor="caloriesKcal">Calories (kcal)</Label>
        <Input
          id="caloriesKcal"
          type="number"
          placeholder="e.g., 2500"
          aria-invalid={!!errors.caloriesKcal}
          {...register("caloriesKcal", { valueAsNumber: true })}
        />
        {errors.caloriesKcal && (
          <span className="text-destructive text-sm font-medium">
            {errors.caloriesKcal.message}
          </span>
        )}
      </div>

      {/* --- SUBMIT BUTTON --- */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Logging..." : "Log Metrics"}
      </Button>
    </form>
  );
};
