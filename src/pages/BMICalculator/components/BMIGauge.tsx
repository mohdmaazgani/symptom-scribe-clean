import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface BMIResult { bmi: number; category: string; color: string; healthyRange: string; tips: string[]; }

const RANGES = [
  { label: "Underweight", range: "<18.5", color: "#60a5fa" },
  { label: "Normal", range: "18.5–24.9", color: "#22c55e" },
  { label: "Overweight", range: "25–29.9", color: "#f59e0b" },
  { label: "Obese", range: "≥30", color: "#ef4444" },
];

const BMIGauge: React.FC<{ result: BMIResult }> = ({ result }) => (
  <Card>
    <CardContent className="pt-4 space-y-2">
      {RANGES.map(({ label, range, color }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm flex-1">{label}</span>
          <span className="text-xs text-muted-foreground">{range}</span>
          {result.category === label && <span className="text-xs font-bold" style={{ color }}>← You</span>}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default BMIGauge;
