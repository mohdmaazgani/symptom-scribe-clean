import { useState } from "react";

interface BMIResult { bmi: number; category: string; color: string; healthyRange: string; tips: string[]; }

const getCategory = (bmi: number): Omit<BMIResult, "bmi" | "healthyRange"> => {
  if (bmi < 18.5) return { category: "Underweight", color: "#60a5fa", tips: ["Increase caloric intake with nutrient-dense foods.", "Consider strength training to build muscle mass.", "Consult a dietician for a personalized meal plan."] };
  if (bmi < 25) return { category: "Normal", color: "#22c55e", tips: ["Maintain your balanced diet and exercise routine.", "Schedule annual check-ups to monitor health markers.", "Focus on strength and cardiovascular fitness."] };
  if (bmi < 30) return { category: "Overweight", color: "#f59e0b", tips: ["Aim for 150 min/week of moderate aerobic activity.", "Reduce sugar and processed food intake.", "Consider a calorie deficit of 300–500 kcal/day."] };
  return { category: "Obese", color: "#ef4444", tips: ["Consult a physician before starting an exercise program.", "Focus on sustainable lifestyle changes, not crash diets.", "Track meals to identify and reduce hidden calorie sources."] };
};

export const useBMICalculator = () => {
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [age, setAge] = useState(0);
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [result, setResult] = useState<BMIResult | null>(null);

  const calculate = () => {
    if (!height || !weight) return;
    const hM = unit === "metric" ? height / 100 : height * 0.0254;
    const wK = unit === "metric" ? weight : weight * 0.453592;
    const bmi = parseFloat((wK / (hM * hM)).toFixed(1));
    const minW = (18.5 * hM * hM);
    const maxW = (24.9 * hM * hM);
    const conv = unit === "metric" ? 1 : 2.20462;
    const { category, color, tips } = getCategory(bmi);
    setResult({ bmi, category, color, tips, healthyRange: `${(minW * conv).toFixed(1)} – ${(maxW * conv).toFixed(1)}` });
  };

  return { height, setHeight, weight, setWeight, age, setAge, unit, setUnit, result, calculate };
};

export default useBMICalculator;
