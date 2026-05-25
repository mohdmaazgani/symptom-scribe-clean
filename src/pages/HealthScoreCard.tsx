import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp, TrendingDown, Minus, Target, Calendar, Clock, Zap, Activity, Moon, Footprints, AlertCircle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HealthScoreCardProps {
  score: number;
  trend: "up" | "down" | "stable";
  breakdown: {
    sleep: number;
    activity: number;
    symptoms: number;
    consistency: number;
  };
  weeklyChange?: number;
}

const HealthScoreCard = ({ score, trend, breakdown, weeklyChange = 5 }: HealthScoreCardProps) => {
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: "Excellent", color: "text-green-500", icon: Award };
    if (score >= 75) return { grade: "Good", color: "text-blue-500", icon: CheckCircle };
    if (score >= 60) return { grade: "Fair", color: "text-yellow-500", icon: AlertCircle };
    return { grade: "Needs Attention", color: "text-red-500", icon: AlertCircle };
  };

  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-yellow-500" />;
  };

  const grade = getScoreGrade(score);
  const GradeIcon = grade.icon;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Health Score
          </div>
          <div className="flex items-center gap-1 text-sm">
            {getTrendIcon()}
            <span className="capitalize">{trend} {Math.abs(weeklyChange)}%</span>
          </div>
        </CardTitle>
        <CardDescription>Your overall wellness score based on last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Main Score */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted"
                strokeOpacity="0.2"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-primary"
                strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute">
              <span className="text-4xl font-bold">{score}</span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <GradeIcon className={`w-5 h-5 ${grade.color}`} />
            <span className={`text-lg font-semibold ${grade.color}`}>
              {grade.grade}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {trend === "up" ? "Improving! Keep going!" : 
             trend === "down" ? "Slightly declined. Focus on weak areas" : 
             "Stable. Small improvements can boost score"}
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Score Breakdown</span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Moon className="w-3 h-3 text-blue-500" />
                  <span>Sleep Quality</span>
                </div>
                <span className={breakdown.sleep >= 70 ? 'text-green-500' : breakdown.sleep >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {breakdown.sleep}%
                </span>
              </div>
              <Progress value={breakdown.sleep} className="h-2 bg-blue-500/20" />
              <p className="text-xs text-muted-foreground">7-8 hours recommended</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Footprints className="w-3 h-3 text-green-500" />
                  <span>Activity Level</span>
                </div>
                <span className={breakdown.activity >= 70 ? 'text-green-500' : breakdown.activity >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {breakdown.activity}%
                </span>
              </div>
              <Progress value={breakdown.activity} className="h-2 bg-green-500/20" />
              <p className="text-xs text-muted-foreground">8k+ steps daily</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-purple-500" />
                  <span>Symptom Control</span>
                </div>
                <span className={breakdown.symptoms >= 70 ? 'text-green-500' : breakdown.symptoms >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {breakdown.symptoms}%
                </span>
              </div>
              <Progress value={breakdown.symptoms} className="h-2 bg-purple-500/20" />
              <p className="text-xs text-muted-foreground">Track symptoms regularly</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-orange-500" />
                  <span>Consistency</span>
                </div>
                <span className={breakdown.consistency >= 70 ? 'text-green-500' : breakdown.consistency >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                  {breakdown.consistency}%
                </span>
              </div>
              <Progress value={breakdown.consistency} className="h-2 bg-orange-500/20" />
              <p className="text-xs text-muted-foreground">Log daily for best insights</p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">Tip:</span>{" "}
              {breakdown.sleep < 70 && "Focus on improving sleep quality. "}
              {breakdown.activity < 70 && "Try to increase daily steps. "}
              {breakdown.symptoms < 70 && "Track symptoms more regularly. "}
              {breakdown.consistency < 70 && "Log health metrics daily for better insights. "}
              {(breakdown.sleep >= 70 && breakdown.activity >= 70 && breakdown.symptoms >= 70) && 
                "Great job! Maintain consistency to keep your score high!"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;