import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Stats {
  totalSymptoms: number;
  unresolvedSymptoms: number;
  avgRiskScore: number;
  recentActivity: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalSymptoms: 0,
    unresolvedSymptoms: 0,
    avgRiskScore: 0,
    recentActivity: 0,
  });
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
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

      // Fetch ALL symptom history for this user
      const { data: symptoms, error } = await supabase
        .from("symptom_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching symptoms:", error);
      }

      if (symptoms && symptoms.length > 0) {
        const unresolved = symptoms.filter(s => !s.resolved).length;
        const avgRisk = symptoms.reduce((sum, s) => sum + (s.risk_score || 0), 0) / symptoms.length;
        
        // Get recent activity (last 7 days)
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Dashboard</h1>
        <p className="text-muted-foreground">Overview of your health tracking journey</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSymptoms}</div>
            <p className="text-xs text-muted-foreground">Lifetime symptom checks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unresolvedSymptoms}</div>
            <p className="text-xs text-muted-foreground">Requiring follow-up</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRiskScore}/100</div>
            <p className="text-xs text-muted-foreground">Based on history</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                  className="flex items-start justify-between border-b border-border pb-3 last:border-0"
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
