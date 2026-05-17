import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { AnimatedMetricCard } from "@/components/AnimatedMetricCard";
import { cn } from "@/lib/utils";

interface Stats {
  totalSymptoms: number;
  unresolvedSymptoms: number;
  avgRiskScore: number;
  recentActivity: number;
}

// ─── Stagger config for stat cards ─────────────────────────────────────────
const CARD_CONFIGS = [
  {
    key: "total",
    title: "Total Consultations",
    statKey: "totalSymptoms" as keyof Stats,
    description: "Lifetime symptom checks",
    icon: <Activity className="h-4 w-4" />,
    accentClass: "text-primary bg-primary/10",
    delay: 0,
  },
  {
    key: "active",
    title: "Active Issues",
    statKey: "unresolvedSymptoms" as keyof Stats,
    description: "Requiring follow-up",
    icon: <AlertCircle className="h-4 w-4" />,
    accentClass: "text-orange-500 bg-orange-500/10",
    delay: 100,
  },
  {
    key: "risk",
    title: "Avg Risk Score",
    statKey: "avgRiskScore" as keyof Stats,
    suffix: "/100",
    description: "Based on history",
    icon: <TrendingUp className="h-4 w-4" />,
    accentClass: "text-secondary bg-secondary/10",
    delay: 200,
    showProgress: true,
    progressMax: 100,
  },
  {
    key: "recent",
    title: "Recent Activity",
    statKey: "recentActivity" as keyof Stats,
    description: "Last 7 days",
    icon: <CheckCircle className="h-4 w-4" />,
    accentClass: "text-green-500 bg-green-500/10",
    delay: 300,
  },
] as const;

// ─── Skeleton placeholder shown while loading ────────────────────────────────
function SkeletonCard() {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-3 w-28 rounded bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 rounded bg-muted animate-pulse mb-2" />
        <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalSymptoms: 0,
    unresolvedSymptoms: 0,
    avgRiskScore: 0,
    recentActivity: 0,
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For the history section entrance animation
  const historyRef = useRef<HTMLDivElement>(null);
  const [historyVisible, setHistoryVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Observe history card entrance
  useEffect(() => {
    const el = historyRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHistoryVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]); // re-run after loading so ref is attached

  const fetchDashboardData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: symptoms, error } = await supabase
        .from("symptom_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching symptoms:", error);
      }

      if (symptoms && symptoms.length > 0) {
        const unresolved = symptoms.filter((s) => !s.resolved).length;
        const avgRisk =
          symptoms.reduce((sum, s) => sum + (s.risk_score || 0), 0) /
          symptoms.length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recent = symptoms.filter(
          (s) => new Date(s.created_at) > sevenDaysAgo
        ).length;

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
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="animate-fade-in [animation-fill-mode:both]">
        <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your health tracking journey
        </p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? // Pulse skeleton while data loads
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          : CARD_CONFIGS.map((cfg) => (
              <AnimatedMetricCard
                key={cfg.key}
                title={cfg.title}
                value={stats[cfg.statKey]}
                suffix={"suffix" in cfg ? cfg.suffix : ""}
                description={cfg.description}
                icon={cfg.icon}
                accentClass={cfg.accentClass}
                delay={cfg.delay}
                showProgress={"showProgress" in cfg ? cfg.showProgress : false}
                progressMax={"progressMax" in cfg ? cfg.progressMax : 100}
              />
            ))}
      </div>

      {/* ── Recent symptom checks card ──────────────────────────────────────── */}
      <div
        ref={historyRef}
        className={cn(
          "transition-all duration-700 ease-out",
          historyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        )}
        style={{ transitionDelay: "350ms" }}
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Symptom Checks</CardTitle>
            <CardDescription>
              Your most recent health consultations
            </CardDescription>
          </CardHeader>

          <CardContent>
            {recentHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No symptom history yet. Start by consulting with the AI
                Assistant!
              </p>
            ) : (
              <div className="space-y-4">
                {recentHistory.map((item, index) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start justify-between border-b border-border pb-3 last:border-0",
                      // Staggered slide-in for each row
                      "transition-all duration-500 ease-out",
                      historyVisible
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-3"
                    )}
                    style={{
                      transitionDelay: historyVisible
                        ? `${400 + index * 80}ms`
                        : "0ms",
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.symptoms.substring(0, 60)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium capitalize ${getSeverityColor(item.severity_level)}`}
                      >
                        {item.severity_level}
                      </span>
                      {item.resolved && (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
