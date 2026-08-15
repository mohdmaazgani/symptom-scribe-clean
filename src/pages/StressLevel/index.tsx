import React from "react";
import { useTranslation } from "react-i18next";
import { Zap, TrendingDown, Brain } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StressGauge from "./components/StressGauge";
import useStressLevel from "./hooks/useStressLevel";

const COPING_TIPS: Record<string, string[]> = {
  low: ["Keep up your mindfulness practice.", "Maintain regular sleep schedule.", "Continue your current self-care routines."],
  moderate: ["Try 10 min of deep breathing or meditation.", "Take short breaks every 90 minutes.", "Limit caffeine intake after noon."],
  high: ["Prioritize urgent tasks only — delegate the rest.", "Exercise for at least 20 minutes today.", "Talk to a friend or therapist about what's overwhelming you."],
  critical: ["Seek professional support if stress persists more than 2 weeks.", "Immediately reduce workload wherever possible.", "Focus on basic needs: sleep, nutrition, hydration."],
};

const StressLevel: React.FC = () => {
  const { t } = useTranslation();
  const { level, setLevel, symptom, setSymptom, entries, logStress, weeklyAvg } = useStressLevel();

  const SYMPTOMS = ["Headache", "Irritability", "Fatigue", "Insomnia", "Muscle tension", "Poor concentration", "Overeating", "Anxiety"];
  const levelCategory = level <= 3 ? "low" : level <= 5 ? "moderate" : level <= 8 ? "high" : "critical";
  const levelColor = { low: "text-green-500", moderate: "text-amber-500", high: "text-orange-500", critical: "text-red-500" }[levelCategory];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Zap className="h-8 w-8 text-orange-500" />
          {t("sidebar.items.stressLevel", "Stress & Burnout")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor daily stress levels, identify burnout warning signs, and discover personalized coping strategies.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rate Your Stress</CardTitle>
              <CardDescription>How stressed do you feel right now?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3 text-center">
                <p className={`text-5xl font-extrabold ${levelColor}`}>{level}</p>
                <p className={`text-sm font-semibold capitalize ${levelColor}`}>{levelCategory} Stress</p>
                <input
                  type="range" min={1} max={10} value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full accent-orange-500"
                  aria-label="Stress level slider"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Calm</span><span>Crisis</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Current Symptoms</label>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map((s) => (
                    <button key={s} type="button" onClick={() => setSymptom(s === symptom ? "" : s)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${symptom === s ? "bg-orange-500 text-white border-orange-500" : "border-border hover:border-orange-500/50"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={logStress} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                Log Stress Level
              </Button>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Brain className="h-4 w-4 text-orange-500" /> Coping Strategies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {COPING_TIPS[levelCategory].map((tip, i) => (
                <div key={i} className="flex gap-2 text-sm"><span className="text-orange-500 mt-0.5 flex-shrink-0">→</span><span>{tip}</span></div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <StressGauge entries={entries} weeklyAvg={weeklyAvg} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><TrendingDown className="h-5 w-5" /> Stress Log</CardTitle>
                <Badge variant="secondary">{entries.length} entries</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No stress entries yet. Start tracking above.</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {entries.slice().reverse().map((entry) => {
                    const cat = entry.level <= 3 ? "low" : entry.level <= 5 ? "moderate" : entry.level <= 8 ? "high" : "critical";
                    const color = { low: "bg-green-500", moderate: "bg-amber-500", high: "bg-orange-500", critical: "bg-red-500" }[cat];
                    return (
                      <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                        <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{entry.level}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs capitalize font-medium">{cat} stress</span>
                            {entry.symptom && <Badge variant="outline" className="text-xs">{entry.symptom}</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StressLevel;
