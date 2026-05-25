import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, AlertCircle, CheckCircle, Flame, Zap, Footprints, 
  TrendingUp, TrendingDown, Award, Calendar, Clock, Target,
  Battery, Heart, Brain, Smile, ArrowUp, ArrowDown, Minus, Moon
} from "lucide-react";
import { showError, showWarning, showSuccess } from "@/lib/toast-helpers";
import HealthTrendsChart from "@/pages/HealthTrendsCharts";
import HealthScoreCard from "@/pages/HealthScoreCard";

interface SymptomRecord {
  id: string;
  symptoms: string;
  severity_level: string;
  risk_score: number;
  created_at: string;
  resolved: boolean;
}

interface HealthMetric {
  id: string;
  metric_type: string;
  value: any;
  recorded_at: string;
}

interface Alert {
  id: string;
  type: "warning" | "critical" | "info" | "success";
  message: string;
  recommendation: string;
  timestamp: Date;
}

interface Goal {
  type: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
  streak: number;
  icon: any;
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [stats, setStats] = useState({
    totalSymptoms: 0,
    unresolvedSymptoms: 0,
    avgRiskScore: 0,
    recentActivity: 0,
    symptomFreeDays: 0,
  });
  const [recentHistory, setRecentHistory] = useState<SymptomRecord[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState({
    score: 0,
    trend: "stable" as "up" | "down" | "stable",
    weeklyChange: 0,
    breakdown: { sleep: 0, activity: 0, symptoms: 0, consistency: 0 }
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [riskPrediction, setRiskPrediction] = useState<{ message: string; severity: "low" | "medium" | "high" } | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

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

      // Fetch user profile to get name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name.split(" ")[0]); // Just first name
      } else if (user.email) {
        setUserName(user.email.split("@")[0]); // Use email username
      }

      const [symptomsRes, metricsRes] = await Promise.all([
        supabase.from("symptom_history").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("health_metrics").select("*").eq("user_id", user.id).order("recorded_at", { ascending: false }).limit(200)
      ]);

      const symptoms = symptomsRes.data || [];
      const metrics = metricsRes.data || [];

      if (symptoms.length > 0) {
        processSymptoms(symptoms);
        processChartData(symptoms, metrics);
        calculateHealthScore(symptoms, metrics);
        generateAlerts(symptoms, metrics);
        generateRiskPrediction(symptoms);
        generateInsights(symptoms, metrics);
        calculateGoalProgress(metrics);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showError("Connection Error", "Failed to load dashboard data");
      setLoading(false);
    }
  };

  const processSymptoms = (symptoms: SymptomRecord[]) => {
    const unresolved = symptoms.filter(s => !s.resolved).length;
    const avgRisk = symptoms.reduce((sum, s) => sum + (s.risk_score || 0), 0) / symptoms.length;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = symptoms.filter(s => new Date(s.created_at) > sevenDaysAgo).length;
    
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });
    const symptomDays = new Set(symptoms.map(s => new Date(s.created_at).toDateString()));
    const symptomFreeDays = last30Days.filter(day => !symptomDays.has(day)).length;

    setStats({
      totalSymptoms: symptoms.length,
      unresolvedSymptoms: unresolved,
      avgRiskScore: Math.round(avgRisk),
      recentActivity: recent,
      symptomFreeDays,
    });

    setRecentHistory(symptoms.slice(0, 5));
  };

  const processChartData = (symptoms: SymptomRecord[], metrics: HealthMetric[]) => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const daySymptoms = symptoms.filter(s => new Date(s.created_at).toDateString() === date.toDateString());
      const dayMetrics = metrics.filter(m => new Date(m.recorded_at).toDateString() === date.toDateString());
      
      const heartRate = dayMetrics.find(m => m.metric_type === "heart_rate")?.value?.value || null;
      const sleep = dayMetrics.find(m => m.metric_type === "sleep")?.value?.value || null;
      const steps = dayMetrics.find(m => m.metric_type === "steps")?.value?.value || null;
      
      const avgSeverity = daySymptoms.length > 0 
        ? daySymptoms.reduce((sum, s) => sum + (s.severity_level === "high" ? 3 : s.severity_level === "moderate" ? 2 : 1), 0) / daySymptoms.length
        : null;
      
      last30Days.push({
        date: dateStr,
        symptoms: daySymptoms.length,
        severity: avgSeverity,
        heartRate,
        sleep: sleep ? Math.round(sleep * 10) / 10 : null,
        steps: steps ? Math.round(steps / 100) / 10 : null,
      });
    }
    setChartData(last30Days);
  };

  const calculateHealthScore = (symptoms: SymptomRecord[], metrics: HealthMetric[]) => {
    const sleepMetrics = metrics.filter(m => m.metric_type === "sleep");
    const avgSleep = sleepMetrics.reduce((sum, m) => sum + (m.value?.value || 0), 0) / (sleepMetrics.length || 1);
    const sleepScore = Math.min(100, Math.max(0, (avgSleep / 8) * 100));
    
    const stepMetrics = metrics.filter(m => m.metric_type === "steps");
    const avgSteps = stepMetrics.reduce((sum, m) => sum + (m.value?.value || 0), 0) / (stepMetrics.length || 1);
    const activityScore = Math.min(100, Math.max(0, (avgSteps / 10000) * 100));
    
    const last30DaysSymptoms = symptoms.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 86400000));
    const symptomScore = Math.max(0, 100 - (last30DaysSymptoms.length * 5));
    
    const uniqueDays = new Set(metrics.map(m => new Date(m.recorded_at).toDateString())).size;
    const consistencyScore = Math.min(100, (uniqueDays / 30) * 100);
    
    const totalScore = Math.round((sleepScore + activityScore + symptomScore + consistencyScore) / 4);
    
    const lastWeekSymptoms = symptoms.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)).length;
    const previousWeekSymptoms = symptoms.filter(s => {
      const date = new Date(s.created_at);
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
      const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
      return date > twoWeeksAgo && date < oneWeekAgo;
    }).length;
    
    let trend: "up" | "down" | "stable" = "stable";
    if (lastWeekSymptoms < previousWeekSymptoms) trend = "up";
    if (lastWeekSymptoms > previousWeekSymptoms) trend = "down";
    
    setHealthScore({
      score: totalScore,
      trend,
      weeklyChange: 5,
      breakdown: {
        sleep: Math.round(sleepScore),
        activity: Math.round(activityScore),
        symptoms: Math.round(symptomScore),
        consistency: Math.round(consistencyScore),
      }
    });
  };

  const generateAlerts = (symptoms: SymptomRecord[], metrics: HealthMetric[]) => {
    const newAlerts: Alert[] = [];
    
    const lastWeekSymptoms = symptoms.filter(s => new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)).length;
    const previousWeekSymptoms = symptoms.filter(s => {
      const date = new Date(s.created_at);
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
      const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
      return date > twoWeeksAgo && date < oneWeekAgo;
    }).length;
    
    if (lastWeekSymptoms > previousWeekSymptoms * 1.5) {
      newAlerts.push({
        id: "symptom-increase",
        type: "warning",
        message: "Symptoms are increasing",
        recommendation: "Consider tracking triggers and consult a doctor if persists",
        timestamp: new Date()
      });
    }
    
    const highSeveritySymptoms = symptoms.filter(s => 
      s.severity_level === "high" && new Date(s.created_at) > new Date(Date.now() - 7 * 86400000)
    );
    if (highSeveritySymptoms.length > 0) {
      newAlerts.push({
        id: "high-severity",
        type: "critical",
        message: "High severity symptoms detected",
        recommendation: "Please consult a healthcare provider immediately",
        timestamp: new Date()
      });
    }
    
    const heartRates = metrics.filter(m => m.metric_type === "heart_rate").slice(0, 10);
    const avgHR = heartRates.reduce((sum, m) => sum + (m.value?.value || 0), 0) / (heartRates.length || 1);
    const latestHR = heartRates[0]?.value?.value;
    if (latestHR && (latestHR > avgHR * 1.2 || latestHR < avgHR * 0.8)) {
      newAlerts.push({
        id: "hr-anomaly",
        type: "warning",
        message: "Unusual heart rate detected",
        recommendation: "Monitor your heart rate and rest. Consult doctor if concerned.",
        timestamp: new Date()
      });
    }
    
    if (stats.symptomFreeDays >= 5) {
      newAlerts.push({
        id: "symptom-free",
        type: "success",
        message: "5+ symptom-free days!",
        recommendation: "Great job! Keep up the healthy habits!",
        timestamp: new Date()
      });
    }
    
    setAlerts(newAlerts);
    
    newAlerts.forEach(alert => {
      if (alert.type === "critical") showWarning(alert.message, alert.recommendation);
      if (alert.type === "success") showSuccess(alert.message, alert.recommendation);
    });
  };

  const generateRiskPrediction = (symptoms: SymptomRecord[]) => {
    const recentSymptoms = symptoms.slice(0, 14);
    const highRiskSymptoms = recentSymptoms.filter(s => s.risk_score && s.risk_score > 70);
    const improving = recentSymptoms.length < symptoms.slice(14, 28).length;
    
    if (highRiskSymptoms.length >= 3) {
      setRiskPrediction({ 
        message: "Your recent symptoms indicate elevated health risk. Schedule a checkup soon.", 
        severity: "high" 
      });
    } else if (recentSymptoms.length > 10) {
      setRiskPrediction({ 
        message: "High symptom frequency detected. Consider lifestyle adjustments to manage triggers.", 
        severity: "medium" 
      });
    } else if (improving && symptoms.length > 10) {
      setRiskPrediction({ 
        message: "Great improvement! Your symptoms are decreasing. Keep tracking!", 
        severity: "low" 
      });
    } else {
      setRiskPrediction({ 
        message: "Your health patterns are stable. Continue tracking for personalized insights.", 
        severity: "low" 
      });
    }
  };

  const generateInsights = (symptoms: SymptomRecord[], metrics: HealthMetric[]) => {
    const insightsList: string[] = [];
    
    const sleepMetrics = metrics.filter(m => m.metric_type === "sleep");
    const avgSleep = sleepMetrics.reduce((sum, m) => sum + (m.value?.value || 0), 0) / (sleepMetrics.length || 1);
    if (avgSleep < 6) insightsList.push("Low sleep average. Try to get 7-8 hours for better health.");
    if (avgSleep > 9) insightsList.push("High sleep average. Consistent sleep schedule may help.");
    
    const stepMetrics = metrics.filter(m => m.metric_type === "steps");
    const avgSteps = stepMetrics.reduce((sum, m) => sum + (m.value?.value || 0), 0) / (stepMetrics.length || 1);
    if (avgSteps < 5000) insightsList.push("Low step count. Try small walks throughout the day.");
    if (avgSteps > 10000) insightsList.push("Great activity level! Your cardiovascular health is benefiting.");
    
    const highSeverityCount = symptoms.filter(s => s.severity_level === "high").length;
    if (highSeverityCount > 5) insightsList.push("Multiple high-severity symptoms detected. Consider medical consultation.");
    
    const resolved = symptoms.filter(s => s.resolved).length;
    const total = symptoms.length;
    if (total > 0 && resolved / total > 0.7) {
      insightsList.push("Great recovery rate! Your symptoms are resolving well.");
    }
    
    setInsights(insightsList.slice(0, 3));
  };

  const calculateGoalProgress = (metrics: HealthMetric[]) => {
    const last7Days = metrics.filter(m => new Date(m.recorded_at) > new Date(Date.now() - 7 * 86400000));
    const avgSteps = last7Days.filter(m => m.metric_type === "steps").reduce((sum, m) => sum + (m.value?.value || 0), 0) / 7;
    const avgSleep = last7Days.filter(m => m.metric_type === "sleep").reduce((sum, m) => sum + (m.value?.value || 0), 0) / 7;
    
    const goalsList: Goal[] = [
      { 
        type: "steps", 
        current: Math.round(avgSteps || 0), 
        target: 8000, 
        unit: "steps", 
        progress: Math.min(100, ((avgSteps || 0) / 8000) * 100),
        streak: 0,
        icon: Footprints 
      },
      { 
        type: "sleep", 
        current: Math.round((avgSleep || 0) * 10) / 10, 
        target: 7.5, 
        unit: "hours", 
        progress: Math.min(100, ((avgSleep || 0) / 7.5) * 100),
        streak: 0,
        icon: Moon 
      },
    ];
    
    setGoals(goalsList);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome, {userName}
          </h1>
          <p className="text-muted-foreground">Advanced analytics & personalized health insights</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-3xl font-bold">{healthScore.score}</p>
                <div className="flex items-center gap-1 mt-1">
                  {healthScore.trend === "up" && <ArrowUp className="w-3 h-3 text-green-500" />}
                  {healthScore.trend === "down" && <ArrowDown className="w-3 h-3 text-red-500" />}
                  <span className={`text-xs ${healthScore.trend === "up" ? "text-green-500" : healthScore.trend === "down" ? "text-red-500" : "text-yellow-500"}`}>
                    {healthScore.trend === "up" ? `+${healthScore.weeklyChange}%` : 
                     healthScore.trend === "down" ? `-${healthScore.weeklyChange}%` : "stable"}
                  </span>
                </div>
              </div>
              <Award className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Issues</p>
                <p className="text-3xl font-bold">{stats.unresolvedSymptoms}</p>
                <p className="text-xs text-muted-foreground mt-1">Requiring follow-up</p>
              </div>
              <AlertCircle className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-3xl font-bold">{stats.avgRiskScore}</p>
                <p className="text-xs text-muted-foreground mt-1">Average risk level</p>
              </div>
              <Brain className="w-10 h-10 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracking Streak</p>
                <p className="text-3xl font-bold">{Math.min(7, stats.recentActivity)} days</p>
                <p className="text-xs text-muted-foreground mt-1">Active tracking</p>
              </div>
              <Flame className="w-10 h-10 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Symptom-Free Days</p>
                <p className="text-3xl font-bold">{stats.symptomFreeDays}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
              <Smile className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Card Component */}
      <HealthScoreCard 
        score={healthScore.score}
        trend={healthScore.trend}
        weeklyChange={healthScore.weeklyChange}
        breakdown={healthScore.breakdown}
      />

      {/* Health Trends Chart Component */}
      {chartData.length > 0 && <HealthTrendsChart data={chartData} />}

      {/* AI Insights & Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Risk Prediction */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              AI Health Insights
            </CardTitle>
            <CardDescription>Personalized recommendations based on your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {riskPrediction && (
              <div className={`p-4 rounded-lg ${
                riskPrediction.severity === "high" ? "bg-red-500/20 border border-red-500" :
                riskPrediction.severity === "medium" ? "bg-yellow-500/20 border border-yellow-500" :
                "bg-green-500/20 border border-green-500"
              }`}>
                <p className="text-foreground">{riskPrediction.message}</p>
              </div>
            )}
            
            {insights.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Quick Insights:</p>
                {insights.map((insight, i) => (
                  <div key={i} className="p-2 rounded-lg bg-background/50">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Smart Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Smart Alerts & Notifications
            </CardTitle>
            <CardDescription>Important health notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p className="font-medium">All Clear</p>
                <p className="text-sm text-muted-foreground">No active alerts. Your health patterns look stable.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border ${
                    alert.type === 'critical' ? 'border-red-500 bg-red-500/10' :
                    alert.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-green-500 bg-green-500/10'
                  }`}>
                    <p className="font-medium text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.recommendation}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress & Recent Symptoms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Progress Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Weekly Health Goals
            </CardTitle>
            <CardDescription>Track your progress towards daily targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {goals.map((goal) => {
                const Icon = goal.icon;
                const isAchieved = goal.current >= goal.target;
                return (
                  <div key={goal.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize font-medium">{goal.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {goal.current} / {goal.target} {goal.unit}
                        </span>
                        {isAchieved && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      />
                    </div>
                    {isAchieved && (
                      <p className="text-xs text-green-500">Goal achieved! Great job!</p>
                    )}
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Target</span>
                  <span className="font-medium">2/3 goals achieved</span>
                </div>
                <div className="h-2 bg-muted rounded-full mt-2">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "66%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Symptoms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Symptom Checks
            </CardTitle>
            <CardDescription>Your most recent health consultations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentHistory.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No symptom history yet.</p>
                <p className="text-sm text-muted-foreground">Start by consulting with the AI Assistant!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {recentHistory.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-all">
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-2">{item.symptoms}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.severity_level === "high" ? "bg-red-500/20 text-red-500" :
                        item.severity_level === "moderate" ? "bg-yellow-500/20 text-yellow-500" :
                        "bg-green-500/20 text-green-500"
                      }`}>
                        {item.severity_level}
                      </span>
                      {item.resolved && <CheckCircle className="w-4 h-4 text-green-500" />}
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