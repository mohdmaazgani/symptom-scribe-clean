import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, CheckCircle2, Zap, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { calculateWeeklyHealthScore } from "@/lib/score-calculator";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import type { OfflineSymptom } from "@/lib/offline-db";

interface WeeklyHealthScoreCardProps {
  userId: string | null;
  symptoms: OfflineSymptom[];
}

export function WeeklyHealthScoreCard({ userId, symptoms }: WeeklyHealthScoreCardProps) {
  const { records: metrics } = useMetricsHistory(userId);

  const scoreResult = useMemo(() => {
    return calculateWeeklyHealthScore(symptoms, metrics);
  }, [symptoms, metrics]);

  const { totalScore, streakDays, breakdown } = scoreResult;

  // Determine score level color
  let scoreColor = "text-emerald-500";
  let strokeColor = "#10b981";
  let badgeLabel = "Excellent Health Habits";

  if (totalScore < 50) {
    scoreColor = "text-rose-500";
    strokeColor = "#ef4444";
    badgeLabel = "Needs Attention";
  } else if (totalScore < 80) {
    scoreColor = "text-amber-500";
    strokeColor = "#f59e0b";
    badgeLabel = "Good Progress";
  }

  // Radial SVG calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalScore / 100) * circumference;

  return (
    <Card className="w-full border border-border/60 transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Weekly Health Score
          </CardTitle>
          <CardDescription>Gamified logging consistency & vital stability score</CardDescription>
        </div>

        {/* Streak Badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/20 text-orange-500 self-start sm:self-auto"
        >
          <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-bounce" />
          <span className="text-xs font-bold tracking-tight">
            {streakDays > 0 ? `${streakDays} Day Logging Streak!` : "Start Your Logging Streak!"}
          </span>
        </motion.div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Side: Radial Progress Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-muted/20 border border-border/40 rounded-xl">
          <div className="relative w-28 h-28 flex items-center justify-center select-none">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                className="text-muted/20"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                fill="transparent"
                stroke={strokeColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-2xl font-black tracking-tight ${scoreColor}`}>
                {totalScore}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                / 100 XP
              </span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`mt-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${scoreColor} border-current/20`}
          >
            {badgeLabel}
          </Badge>
        </div>

        {/* Right Side: XP Checklist Breakdown */}
        <div className="md:col-span-7 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" /> XP Checklist Breakdown
          </h4>

          <div className="space-y-3">
            {breakdown.map((item) => {
              const percentage = Math.round((item.points / item.maxPoints) * 100);
              return (
                <div
                  key={item.id}
                  className="space-y-1.5 p-2.5 rounded-lg border border-border/40 bg-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    <span className="font-bold text-primary">
                      +{item.points} / {item.maxPoints} XP
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground pl-6">{item.description}</p>

                  <div className="pl-6 pt-1">
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
