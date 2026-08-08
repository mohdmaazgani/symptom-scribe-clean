import { useState } from "react";
import { Exercise } from "../components/WorkoutLibrary";

interface LogEntry {
  id: string;
  name: string;
  duration: number;
  burned: number;
}

export const useFitnessStats = () => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<LogEntry[]>([]);
  const dailyGoal = 400; // 400 kcal target
  const weightKg = 70; // Assumed average weight

  const handleLogWorkout = (mins: number) => {
    if (!selectedExercise) return;
    
    // Calorie formula: MET * 3.5 * weightKg / 200 * mins
    const burned = Math.round(selectedExercise.met * 3.5 * weightKg * mins / 200);

    setWorkoutLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: selectedExercise.name,
        duration: mins,
        burned,
      },
    ]);
  };

  const clearLogs = () => {
    setWorkoutLogs([]);
  };

  const totalCaloriesBurned = workoutLogs.reduce((sum, item) => sum + item.burned, 0);

  return {
    selectedExercise,
    setSelectedExercise,
    totalCaloriesBurned,
    dailyGoal,
    handleLogWorkout,
    workoutLogs,
    clearLogs,
  };
};

export default useFitnessStats;