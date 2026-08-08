import { useState } from "react";

interface FoodLog {
  id: string;
  food: string;
  calories: number;
}

export const useNutritionData = () => {
  const [waterIntake, setWaterIntake] = useState(0);
  const waterGoal = 2000;
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const calorieGoal = 2200;

  const incrementWater = (amount: number) => {
    setWaterIntake((prev) => prev + amount);
  };

  const addFoodItem = (food: string, calories: number) => {
    setFoodLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        food,
        calories,
      },
    ]);
  };

  const resetWater = () => {
    setWaterIntake(0);
    setFoodLogs([]);
  };

  const totalCalories = foodLogs.reduce((sum, item) => sum + item.calories, 0);

  return {
    waterIntake,
    waterGoal,
    foodLogs,
    totalCalories,
    calorieGoal,
    incrementWater,
    addFoodItem,
    resetWater,
  };
};

export default useNutritionData;