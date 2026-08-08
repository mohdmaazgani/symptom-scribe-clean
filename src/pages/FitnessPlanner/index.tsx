import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Plus, RefreshCw, Dumbbell, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import WorkoutLibrary from "./components/WorkoutLibrary";
import useFitnessStats from "./hooks/useFitnessStats";

const FitnessPlanner: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = useState("30");
  const {
    selectedExercise,
    setSelectedExercise,
    totalCaloriesBurned,
    dailyGoal,
    handleLogWorkout,
    workoutLogs,
    clearLogs,
  } = useFitnessStats();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-amber-500" />
            {t("sidebar.items.fitnessPlanner", "Fitness Planner")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Calculate estimated calories burned based on exercise metabolic indices.
          </p>
        </div>
        <div className="flex gap-2">
          {workoutLogs.length > 0 && (
            <Button variant="outline" onClick={clearLogs} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Clear Daily Logs
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log Activity</CardTitle>
              <CardDescription>Specify the minutes spent to compile energy outputs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedExercise ? (
                <div className="space-y-4">
                  <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground">{selectedExercise.name}</span>
                      <span className="text-xs block text-muted-foreground">MET index: {selectedExercise.met}</span>
                    </div>
                    <Badge className="bg-amber-600">Selected</Badge>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Duration (Minutes)</label>
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      min="1"
                    />
                  </div>

                  <Button
                    onClick={() => handleLogWorkout(parseInt(duration, 10))}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Commit Activity Log
                  </Button>
                </div>
              ) : (
                <div className="p-6 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  Select an exercise category from the list below to begin logging.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Daily Calorie Burn</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6 space-y-2">
              <span className="text-5xl font-extrabold text-amber-500 block">{totalCaloriesBurned} kcal</span>
              <p className="text-sm text-muted-foreground">Daily burn target: {dailyGoal} kcal</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <WorkoutLibrary
            selectedId={selectedExercise?.id || null}
            onSelect={setSelectedExercise}
          />
        </div>
      </div>
    </div>
  );
};

export default FitnessPlanner;