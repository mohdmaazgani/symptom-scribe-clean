import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wind, Play, Pause, RefreshCw, Sparkles, Brain } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BreathingCircle from "./components/BreathingCircle";
import useMindfulnessTimer from "./hooks/useMindfulnessTimer";

const Mindfulness: React.FC = () => {
  const { t } = useTranslation();
  const [activePattern, setActivePattern] = useState("box");
  
  const {
    phase,
    secondsLeft,
    cyclesCompleted,
    isActive,
    toggleTimer,
    resetTimer,
  } = useMindfulnessTimer(activePattern);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wind className="h-8 w-8 text-sky-400" />
            {t("sidebar.items.mindfulness", "Mindfulness Breathing Assistant")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Perform guided box breathing cycles to lower heart rate and reduce stress indices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetTimer}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6 flex flex-col items-center">
          <Card className="w-full flex flex-col items-center justify-center p-6 min-h-[380px]">
            <CardHeader className="text-center w-full">
              <Badge variant="outline" className="mx-auto text-sky-400 border-sky-400/20 capitalize font-bold text-sm">
                Phase: {phase}
              </Badge>
              <CardDescription className="mt-2 text-sm">
                Follow the visual cues to sync your breathing patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6 w-full">
              <BreathingCircle phase={phase} />
              
              <div className="text-center">
                <span className="text-4xl font-extrabold tracking-widest text-foreground">{secondsLeft}s</span>
                <span className="text-[10px] text-muted-foreground block uppercase font-bold tracking-wider mt-1">
                  Remaining in Phase
                </span>
              </div>
            </CardContent>
            <CardFooter className="w-full flex justify-center gap-4 border-t pt-4">
              <Button onClick={toggleTimer} className={isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-sky-600 hover:bg-sky-700"}>
                {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isActive ? "Pause Guide" : "Start Guide"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Breath Cadence</CardTitle>
              <CardDescription>Different cyclic cadences support different wellness outcomes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: "box", title: "Box Breathing (4-4-4-4)", desc: "Equal duration for inhale, hold, exhale, hold. Favored by clinical practitioners for quick nervous system calming." },
                { id: "calm", title: "Relaxation Breathing (4-7-8)", desc: "4s inhale, 7s retention, 8s slow exhale. Increases oxygen distribution, promotes deep sleep states." },
              ].map((pattern) => (
                <div
                  key={pattern.id}
                  onClick={() => {
                    setActivePattern(pattern.id);
                    resetTimer();
                  }}
                  className={`p-4 border rounded-xl cursor-pointer hover:border-sky-400/30 transition-all ${
                    activePattern === pattern.id ? "bg-sky-500/5 border-sky-400" : "bg-background"
                  }`}
                >
                  <span className="font-bold text-sm block text-foreground">{pattern.title}</span>
                  <p className="text-xs text-muted-foreground mt-1">{pattern.desc}</p>
                </div>
              ))}

              <div className="flex items-center gap-4 p-4 border rounded-xl bg-muted/20 border-dashed">
                <Brain className="h-8 w-8 text-sky-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-foreground">Completed Cycles this session</span>
                  <p className="text-xs text-muted-foreground">You have finished {cyclesCompleted} complete breathing cycles.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Mindfulness;