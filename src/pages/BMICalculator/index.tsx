import React from "react";
import { useTranslation } from "react-i18next";
import { Scale, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BMIGauge from "./components/BMIGauge";
import useBMICalculator from "./hooks/useBMICalculator";

const BMICalculator: React.FC = () => {
  const { t } = useTranslation();
  const { height, setHeight, weight, setWeight, age, setAge, unit, setUnit, result, calculate } = useBMICalculator();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Scale className="h-8 w-8 text-purple-500" />
          {t("sidebar.items.bmiCalculator", "BMI Calculator")}
        </h1>
        <p className="text-muted-foreground mt-1">Calculate your Body Mass Index and understand your body composition category.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Measurements</CardTitle>
            <CardDescription>Enter your details to calculate BMI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              {["metric", "imperial"].map((u) => (
                <button key={u} type="button" onClick={() => setUnit(u as "metric" | "imperial")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${unit === u ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
                  {u}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">Height ({unit === "metric" ? "cm" : "inches"})</label>
              <Input type="number" value={height || ""} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} placeholder={unit === "metric" ? "e.g. 175" : "e.g. 69"} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">Weight ({unit === "metric" ? "kg" : "lbs"})</label>
              <Input type="number" value={weight || ""} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} placeholder={unit === "metric" ? "e.g. 70" : "e.g. 154"} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase block">Age</label>
              <Input type="number" value={age || ""} onChange={(e) => setAge(parseInt(e.target.value) || 0)} placeholder="e.g. 30" />
            </div>
            <Button onClick={calculate} disabled={!height || !weight} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <BarChart3 className="h-4 w-4 mr-2" /> Calculate BMI
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6">
            <BMIGauge result={result} />
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Your BMI</p>
                  <p className="text-5xl font-extrabold" style={{ color: result.color }}>{result.bmi}</p>
                  <Badge className="mt-2" style={{ backgroundColor: result.color }} >{result.category}</Badge>
                </div>
                <div className="p-4 bg-muted/40 rounded-lg text-sm">
                  <p className="font-semibold mb-2">Healthy weight for your height:</p>
                  <p className="text-muted-foreground">{result.healthyRange} {unit === "metric" ? "kg" : "lbs"}</p>
                </div>
                {result.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-purple-500 mt-0.5">•</span><span>{tip}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BMICalculator;
