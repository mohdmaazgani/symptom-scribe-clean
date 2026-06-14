import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { showError, showInfo } from "@/lib/toast-helpers";
import CountUp from "react-countup";
import CardSkeleton from "@/components/ui/CardSkeleton";
import { getCachedData } from "@/lib/cached-queries";

interface Stats {
  totalSymptoms: number;
  unresolvedSymptoms: number;
  avgRiskScore: number;
  recentActivity: number;
}

interface SymptomHistoryRecord {
  id: string;
  symptoms: string;
  severity_level: string;
  possible_causes: string[] | null;
  recommendations: string[] | null;
  risk_score: number | null;
  resolved: boolean;
  created_at: string;
}

const RadialWellnessGauge = ({ score }: { score: number }) => {
  const [offset, setOffset] = useState(226.2);
  const radius = 36;
  const circumference = 2 * Math.PI * radius; // 226.195

  useEffect(() => {
    const progressOffset = circumference - (score / 100) * circumference;
    const timer = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  let strokeColor = "url(#wellness-green)";
  let textColor = "text-emerald-500";
  let pulseColor = "bg-emerald-500/10";

  if (score < 50) {
    strokeColor = "url(#wellness-red)";
    textColor = "text-destructive";
    pulseColor = "bg-destructive/10";
  } else if (score < 80) {
    strokeColor = "url(#wellness-orange)";
    textColor = "text-orange-500";
    pulseColor = "bg-orange-500/10";
  }

  return (
    <div className="relative flex items-center justify-center w-20 h-20 select-none">
      <div className={`absolute inset-1 rounded-full animate-pulse blur-md opacity-20 ${pulseColor}`} />

      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 88 88">
        <defs>
          <linearGradient id="wellness-green" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
          <linearGradient id="wellness-orange" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="wellness-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
        </defs>

        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          className="text-muted/10 dark:text-muted/20"
          strokeWidth="6"
        />

        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className={`text-base font-black tracking-tight ${textColor}`}>
          {score}%
        </span>
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
          Well
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalSymptoms: 0,
    unresolvedSymptoms: 0,
    avgRiskScore: 0,
    recentActivity: 0,
  });
  const [recentHistory, setRecentHistory] = useState<SymptomHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: symptoms, error } = await getCachedData<SymptomHistoryRecord[]>("symptom_history");

      if (error) {
        showError("Error loading dashboard", "Could not fetch your health data");
        console.error("Error fetching symptoms:", error);
      }

      if (symptoms && symptoms.length > 0) {
        const unresolved = symptoms.filter(s => !s.resolved).length;
        const avgRisk = symptoms.reduce((sum, s) => sum + (s.risk_score || 0), 0) / symptoms.length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = symptoms.filter(s => new Date(s.created_at) > sevenDaysAgo).length;

        setStats({
          totalSymptoms: symptoms.length,
          unresolvedSymptoms: unresolved,
          avgRiskScore: Math.round(avgRisk),
          recentActivity: recent,
        });

        setRecentHistory(symptoms.slice(0, 5));
      } else {
        setStats({
          totalSymptoms: 0,
          unresolvedSymptoms: 0,
          avgRiskScore: 0,
          recentActivity: 0,
        });
        setRecentHistory([]);
        showInfo("Welcome!", "Start by consulting with the AI Assistant");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showError("Connection Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-destructive";
      case "moderate":
        return "text-orange-500";
      default:
        return "text-green-500";
    }
  };

  // FIX: Show CardSkeleton while data loads instead of blank screen
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-52 rounded mb-2" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <CardSkeleton count={4} variant="stat" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-44 rounded mb-1" />
            <Skeleton className="h-4 w-60 rounded" />
          </CardHeader>
          <CardContent>
            <CardSkeleton count={3} variant="row" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
        <p className="text-muted-foreground">Overview of your health tracking journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CountUp end={stats.totalSymptoms} duration={1.2} />
            </div>
            <p className="text-xs text-muted-foreground">Lifetime symptom checks</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CountUp end={stats.unresolvedSymptoms} duration={1.2} />
            </div>
            <p className="text-xs text-muted-foreground">Requiring follow-up</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Wellness</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4 pt-1">
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                <CountUp end={100 - stats.avgRiskScore} duration={1.2} />%
              </div>
              <p className="text-xs text-muted-foreground">
                Avg Risk: <span className="font-semibold">{stats.avgRiskScore}/100</span>
              </p>
            </div>
            <RadialWellnessGauge score={100 - stats.avgRiskScore} />
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CountUp end={stats.recentActivity} duration={1.2} />
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card className="transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5">
        <CardHeader>
          <CardTitle>Recent Symptom Checks</CardTitle>
          <CardDescription>Your most recent health consultations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No symptom history yet. Start by consulting with the AI Assistant!
            </p>
          ) : (
            <div className="space-y-4">
              {recentHistory.map((item) => (
                <div
  key={item.id}
  className={`flex items-start justify-between border-b pb-3 last:border-0 transition-all duration-300 hover:px-2 rounded-md p-2 ${
    item.severity_level === "high"
      ? "bg-red-500/10 border-red-500 text-red-400"
      : item.severity_level === "moderate"
      ? "bg-yellow-500/10 border-yellow-500 text-yellow-400"
      : "bg-green-500/10 border-green-500 text-green-400"
  }`}
>

                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.symptoms.substring(0, 60)}...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getSeverityColor(item.severity_level)}`}>
                      {item.severity_level}
                    </span>
                    {item.resolved && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
