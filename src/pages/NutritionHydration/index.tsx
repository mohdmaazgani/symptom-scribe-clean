import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Droplet, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import WaterIntakeWidget from "./components/WaterIntakeWidget";
import useNutritionData from "./hooks/useNutritionData";

const NutritionHydration: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [foodInput, setFoodInput] = useState("");
  const [calorieInput, setCalorieInput] = useState("");

  const {
    waterIntake,
    waterGoal,
    foodLogs,
    totalCalories,
    calorieGoal,
    incrementWater,
    addFoodItem,
    resetWater,
  } = useNutritionData();

  const handleFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput || !calorieInput) return;
    addFoodItem(foodInput, parseInt(calorieInput, 10));
    setFoodInput("");
    setCalorieInput("");
    toast({
      title: "Item Logged",
      description: "Successfully recorded calorie intake entry.",
    });
  };

  const handleWaterClick = (amount: number) => {
    incrementWater(amount);
    if (waterIntake + amount >= waterGoal && waterIntake < waterGoal) {
      import("canvas-confetti").then((module) => {
        const confetti = module.default;
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      });
      toast({
        title: "Hydration Target Met! 🎉",
        description: "Excellent job hitting your daily fluid requirements.",
      });
    }
  };

  const caloriePercentage = Math.min(Math.round((totalCalories / calorieGoal) * 100), 100);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Droplet className="h-8 w-8 text-sky-500" />
            {t("sidebar.items.nutritionHydration", "Nutrition & Hydration Tracker")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Log your water consumption and calorie breakdown to maintain a biological equilibrium.
          </p>
        </div>
        <Button variant="outline" onClick={resetWater} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset Today's Logs
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <Card className="flex flex-col items-center">
            <CardHeader className="w-full text-center">
              <CardTitle className="text-lg flex justify-between items-center w-full">
                <span>Fluid Intake Summary</span>
                <Badge variant="outline" className="text-sky-500 border-sky-500/20">
                  {waterIntake} ml / {waterGoal} ml
                </Badge>
              </CardTitle>
              <CardDescription>Track daily water and record updates.</CardDescription>
            </CardHeader>
            <CardContent className="py-6 flex flex-col items-center justify-center space-y-8 w-full">
              <WaterIntakeWidget intake={waterIntake} goal={waterGoal} />
              
              <div className="grid grid-cols-3 gap-3 w-full">
                <Button variant="outline" onClick={() => handleWaterClick(250)} className="text-xs">
                  +250 ml (Cup)
                </Button>
                <Button variant="outline" onClick={() => handleWaterClick(500)} className="text-xs">
                  +500 ml (Bottle)
                </Button>
                <Button variant="outline" onClick={() => handleWaterClick(750)} className="text-xs">
                  +750 ml (Flask)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calorie Tracker</CardTitle>
              <CardDescription>Monitor your daily food energy totals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Daily Target</span>
                  <span className="text-muted-foreground">{totalCalories} kcal / {calorieGoal} kcal ({caloriePercentage}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${caloriePercentage}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleFoodSubmit} className="flex flex-col sm:flex-row gap-3 items-end border-t pt-4">
                <div className="flex-1 space-y-2 w-full">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Food Description</label>
                  <Input
                    placeholder="e.g. Oatmeal with honey"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    required
                  />
                </div>
                <div className="w-full sm:w-[150px] space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Calories (kcal)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 350"
                    value={calorieInput}
                    onChange={(e) => setCalorieInput(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto">
                  Log Item
                </Button>
              </form>

              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold text-sm">Today's Meals</h4>
                {foodLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                    No food entries recorded yet today. Keep track above!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {foodLogs.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-background/50 hover:bg-background transition-all">
                        <span className="font-medium text-sm">{item.food}</span>
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 font-semibold">
                          {item.calories} kcal
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NutritionHydration;