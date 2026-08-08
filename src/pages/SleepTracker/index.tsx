import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SleepCycleWheel from "./components/SleepCycleWheel";
import useSleepAnalysis from "./hooks/useSleepAnalysis";

const SleepTracker: React.FC = () => {
  const { t } = useTranslation();
  const [wakeTime, setWakeTime] = useState("07:00");
  const {
    optimalBedtimes,
    hygieneScore,
    checklistItems,
    toggleChecklistItem,
    calculateSleepCycles,
  } = useSleepAnalysis(wakeTime);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Moon className="h-8 w-8 text-violet-500" />
          {t("sidebar.items.sleepTracker", "Sleep Cycle Advisor")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Calculate optimal times to sleep or wake up based on natural 90-minute circadian sleep cycles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Circadian Calculator</CardTitle>
              <CardDescription>
                Input your desired wakeup time to identify the best times to fall asleep.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end max-w-md">
                <div className="space-y-2 flex-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Target Wakeup Time
                  </label>
                  <Input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full text-lg"
                  />
                </div>
                <Button
                  onClick={calculateSleepCycles}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Recalculate Cycles
                </Button>
              </div>

              {optimalBedtimes.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Recommended Bedtimes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {optimalBedtimes.map((opt, idx) => (
                      <Card
                        key={idx}
                        className={`transition-all hover:scale-[1.01] ${
                          idx === 0
                            ? "border-violet-500/30 bg-violet-500/5"
                            : "border-slate-800"
                        }`}
                      >
                        <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold text-foreground">{opt.time}</span>
                            <Badge variant={idx === 0 ? "default" : "outline"} className={idx === 0 ? "bg-violet-600" : ""}>
                              {opt.cycles} Cycles ({opt.duration} hrs)
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {idx === 0
                              ? "Highly recommended. Excellent combination of deep REM sleep and natural waking."
                              : "Good alternative. Fits natural circadian thresholds comfortably."}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Understanding Sleep Cycles</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/80 space-y-4">
              <p>
                A standard sleep cycle lasts approximately <strong>90 minutes</strong>, transitioning through light sleep, deep sleep, and REM (Dream) phases.
              </p>
              <p>
                Waking up in the middle of a cycle causes grogginess (sleep inertia), whereas waking up at the completion of a cycle leaves you feeling fully refreshed and energized.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="flex flex-col">
            <CardHeader className="text-center bg-violet-500/5">
              <CardTitle className="text-lg">Sleep Hygiene Assessment</CardTitle>
              <CardDescription>Evaluate your daily patterns for optimal circadian sync.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6 flex-1">
              <div className="flex justify-center py-4">
                <SleepCycleWheel score={hygieneScore} />
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Daily Checklists
                </span>
                <div className="space-y-2">
                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-violet-500/5 hover:border-violet-500/20 cursor-pointer transition-all"
                    >
                      <div
                        className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                          item.completed
                            ? "bg-violet-600 border-violet-600 text-white"
                            : "border-slate-500"
                        }`}
                      >
                        {item.completed && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <span className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/20 text-xs text-muted-foreground p-4 flex gap-2">
              <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
              <span>Aim for a hygiene score above 80% to ensure deeper, restorative cycles.</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SleepTracker;