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

  const onSubmit = async (data: HealthMetricInput) => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        showError("Not signed in", "Please sign in again to log your metrics.");
        return;
      }

      const recordedAt = new Date().toISOString();

      // The `health_metrics` table stores one row per metric type, so each
      // field on the form becomes its own row rather than one wide row.
      const rows = [
        { metric_type: "steps", value: { value: data.steps } as Json },
        { metric_type: "hydration", value: { value: data.hydrationMl } as Json },
        { metric_type: "calories", value: { value: data.caloriesKcal } as Json },
      ].map((row) => ({
        user_id: user.id,
        recorded_at: recordedAt,
        ...row,
      }));

      const { error } = await supabase.from("health_metrics").insert(rows);
      if (error) throw error;

      showSuccess("Metrics logged", "Your steps, hydration, and calories were saved.");
      reset();
    } catch (error) {
      console.error("Failed to submit metrics:", error);
      showError(
        "Couldn't save metrics",
        error instanceof Error ? error.message : "Please try again.",
      );
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