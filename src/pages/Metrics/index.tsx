import { useEffect, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Heart,
  Thermometer,
  Weight,
  Droplet,
  Wind,
  TrendingUp,
  ArrowUpDown,
  Moon,
  Footprints,
} from "lucide-react";
import type { Json } from "@/integrations/supabase/types";
import { showSuccess, showError, showWarning, showInfo } from "@/lib/toast-helpers";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import { db, syncOfflineData, type OfflineMetric, encryptMetric } from "@/lib/offline-db";
import { whenKeysReady } from "@/lib/encryption";
import { invalidateCache } from "@/lib/cached-queries";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Trash2, Target, Trophy, Award, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toPng } from "html-to-image";
import { useRef } from "react";

const metricTypes = [
  {
    value: "blood_pressure",
    label: "Blood Pressure",
    icon: Activity,
    unit: "mmHg",
  },
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F" },
  { value: "weight", label: "Weight", icon: Weight, unit: "lbs" },
  { value: "blood_sugar", label: "Blood Sugar", icon: Droplet, unit: "mg/dL" },
  {
    value: "oxygen_saturation",
    label: "Oxygen Saturation",
    icon: Wind,
    unit: "%",
  },
  {
    value: "sleep",
    label: "Sleep Duration",
    icon: Moon,
    unit: "hours",
  },
  {
    value: "steps",
    label: "Daily Steps",
    icon: Footprints,
    unit: "steps",
  },
  {
    value: "respiratory_rate",
    label: "Respiratory Rate",
    icon: Wind,
    unit: "brpm",
  },
];

const MetricsTableSkeleton = () => (
  <div className="rounded-xl border overflow-x-auto">
    <Table className="min-w-[600px]">
      <TableHeader>
        <TableRow>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-20" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
          <TableHead><Skeleton className="h-4 w-16" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 4 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
            <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const MetricsChartSkeleton = () => (
  <div className="h-[400px] w-full rounded-xl border p-6 flex flex-col justify-between">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-28" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
    <div className="flex-1 my-6 flex flex-col justify-between">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-3 w-8" />
          <div className="flex-1 border-b border-muted border-dashed h-px animate-pulse" />
        </div>
      ))}
    </div>
    <div className="flex justify-between pl-12 pr-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-10" />
      ))}
    </div>
  </div>
);

export interface Goal {
  id: string;
  user_id: string;
  metric_type: string;
  title: string;
  target_value: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: "active" | "completed" | "failed";
  created_at?: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_name: string;
  badge_icon: string;
  description: string;
  earned_at: string;
}

const Metrics = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const downloadChart = async () => {
    if (!chartRef.current) return;
    const dataUrl = await toPng(chartRef.current);
    const link = document.createElement("a");
    link.download = "health-metric-chart.png";
    link.href = dataUrl;
    link.click();
  };
  
  const [metricType, setMetricType] = useState("");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const { toast } = useToast();
  const [historyUserId, setHistoryUserId] = useState("");

  const {
    records,
    loading: historyLoading,
    refresh,
    deleteRecord,
    sortOrder,
    setSortOrder,
  } = useMetricsHistory(historyUserId);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    metric_type: "steps",
    title: "",
    target_value: "",
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setHistoryUserId(user.id);
        fetchGoalsAndAchievements(user.id);
      }
    };

    fetchUser();
  }, []);

  const fetchGoalsAndAchievements = async (userId: string) => {
    try {
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (goalsData) setGoals(goalsData as Goal[]);

      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (achievementsData) setAchievements(achievementsData as Achievement[]);
    } catch (err) {
      console.warn("Goals/Achievements fetch error:", err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title || !newGoal.target_value) {
      showWarning("Missing Fields", "Please specify title and target value.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const metricInfo = metricTypes.find((m) => m.value === newGoal.metric_type);
    const unit = metricInfo?.unit || "";

    const payload = {
      id: crypto.randomUUID(),
      user_id: user.id,
      metric_type: newGoal.metric_type,
      title: newGoal.title,
      target_value: parseFloat(newGoal.target_value),
      unit: unit,
      start_date: new Date().toISOString().split("T")[0],
      end_date: newGoal.end_date,
      status: "active",
    };

    const { error } = await supabase.from("goals").insert(payload);

    if (error) {
      showError("Goal Creation Failed", error.message);
    } else {
      showSuccess("Goal Created!", `Target: ${newGoal.target_value} ${unit}`);
      setShowGoalModal(false);
      setNewGoal({
        metric_type: "steps",
        title: "",
        target_value: "",
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      });
      fetchGoalsAndAchievements(user.id);
    }
  };

  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const [historyMetricFilter, setHistoryMetricFilter] = useState("all");
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const [historyView, setHistoryView] = useState("table");

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await syncOfflineData();
      if (synced) {
        refresh();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refresh]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!metricType) return;
    if (metricType === "blood_pressure" && (!systolic || !diastolic)) return;
    if (metricType !== "blood_pressure" && !value) return;

    if (metricType === "heart_rate") {
      const hr = Number(value);
      if (hr < 30 || hr > 250) {
        showWarning("Invalid Heart Rate", "Heart rate must be between 30 and 250 BPM");
        return;
      }
    }
    
    if (metricType === "temperature") {
      const temp = Number(value);
      if (temp < 86 || temp > 113) {
        showWarning("Invalid Temperature", "Temperature must be between 86°F and 113°F");
        return;
      }
    }

    if (metricType === "weight") {
      const wt = Number(value);
      if (wt <= 0 || wt > 700) {
        showWarning("Invalid Weight", "Weight must be between 1 and 700 lbs");
        return;
      }
    }

    if (metricType === "blood_sugar") {
      const sugar = Number(value);
      if (sugar < 20 || sugar > 400) {
        showWarning("Invalid Blood Sugar", "Blood sugar must be between 20 and 400 mg/dL");
        return;
      }
    }

    if (metricType === "oxygen_saturation") {
      const oxygen = Number(value);
      if (oxygen < 70 || oxygen > 100) {
        showWarning("Invalid Oxygen Saturation", "Oxygen saturation must be between 70% and 100%");
        return;
      }
    }

    if (metricType === "blood_pressure") {
      const sys = Number(systolic);
      const dia = Number(diastolic);
      if (sys < 60 || sys > 250) {
        showWarning("Invalid Systolic Pressure", "Systolic pressure must be between 60 and 250 mmHg");
        return;
      }
      if (dia < 30 || dia > 150) {
        showWarning("Invalid Diastolic Pressure", "Diastolic pressure must be between 30 and 150 mmHg");
        return;
      }
      if (sys <= dia) {
        showWarning("Invalid Blood Pressure", "Systolic pressure must be greater than diastolic pressure");
        return;
      }
    }

    if (metricType === "sleep") {
      const sleepVal = Number(value);
      if (sleepVal < 0 || sleepVal > 24) {
        showWarning("Invalid Sleep Duration", "Sleep duration must be between 0 and 24 hours");
        return;
      }
    }

    if (metricType === "steps") {
      const stepsVal = Number(value);
      if (stepsVal < 0 || stepsVal > 100000) {
        showWarning("Invalid Steps Count", "Steps must be between 0 and 100,000");
        return;
      }
    }

    if (metricType === "respiratory_rate") {
      const rr = Number(value);
      if (rr < 6 || rr > 60) {
        showWarning("Invalid Respiratory Rate", "Respiratory rate must be between 6 and 60 breaths per minute");
        return;
      }
    }
    
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setHistoryUserId(user.id);
      
      let metricValue: { value?: number; systolic?: number; diastolic?: number } = {};
      if (metricType === "blood_pressure") {
        metricValue = {
          systolic: parseInt(systolic),
          diastolic: parseInt(diastolic),
        };
      } else {
        metricValue = { value: parseFloat(value) };
      }

      const metricLabel = metricTypes.find(
        (m) => m.value === metricType,
      )?.label;

      const recordId = crypto.randomUUID();
      const recordedAt = new Date().toISOString();

      const keys = await whenKeysReady();

      const record = {
        id: recordId,
        user_id: user.id,
        metric_type: metricType,
        value: metricValue as Json,
        notes: notes || null,
        recorded_at: recordedAt,
        pending_sync: navigator.onLine ? 0 : 1,
        pending_delete: 0,
      };

      const encryptedRecord = await encryptMetric(record, keys.encryptionKey, keys.searchKey);

      if (navigator.onLine) {
        const { pending_sync, pending_delete, ...supabaseData } = encryptedRecord;
        try {
          const { error } = await supabase.from("health_metrics").insert(supabaseData);
          if (error) throw error;

          await invalidateCache("health_metrics");
          await db.healthMetrics.put(encryptedRecord);

          showSuccess(
            `${metricLabel} Recorded`,
            "Your health metric has been saved successfully.",
          );
        } catch (supabaseError) {
          console.warn("Supabase insert failed, falling back to local saving:", supabaseError);
          const fallbackRecord = {
            ...encryptedRecord,
            pending_sync: 1,
          };
          await db.healthMetrics.put(fallbackRecord);

          showWarning(
            `${metricLabel} Saved Offline`,
            "Could not connect to server. Saved locally and will sync once connection is restored."
          );
        }
      } else {
        await db.healthMetrics.put(encryptedRecord);

        showSuccess(
          `${metricLabel} Saved Offline`,
          "No internet connection. Saved locally and will sync once online.",
        );
      }

      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");
      closeForm();

      refresh();
    } catch (error) {
      console.error("Error saving metric:", error);
      showError("Failed to Save", "Could not record your health metric");
    } finally {
      setLoading(false);
    }
  };
  
  const formatMetricValue = (record: OfflineMetric) => {
    const recordValue = record.value as { value?: number; systolic?: number; diastolic?: number } | null;
    if (record.metric_type === "blood_pressure") {
      return `${recordValue?.systolic}/${recordValue?.diastolic} mmHg`;
    }

    const metric = metricTypes.find((m) => m.value === record.metric_type);

    return `${recordValue?.value} ${metric?.unit || ""}`;
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const filteredRecords = records.filter((record: OfflineMetric) => {
    const metricMatch =
      historyMetricFilter === "all" ||
      record.metric_type === historyMetricFilter;

    if (timeframeFilter === "all") {
      return metricMatch;
    }

    const days = parseInt(timeframeFilter);

    const recordDate = new Date(record.recorded_at);
    const now = new Date();

    const diffTime = now.getTime() - recordDate.getTime();

    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return metricMatch && diffDays <= days;
  });
  
  const isBloodPressure = historyMetricFilter === "blood_pressure";

  const handleMetricCardSelect = (metric: string) => {
    // Reset any previous entry so each card opens a clean form
    setMetricType(metric);
    setValue("");
    setSystolic("");
    setDiastolic("");
    setNotes("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    // Clear after the close animation so the card highlight resets without the
    // modal contents visibly flipping mid-fade.
    window.setTimeout(() => setMetricType(""), 200);
  };

  const selectedMetric = metricTypes.find((m) => m.value === metricType);
  const SelectedIcon = selectedMetric?.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Health Metrics</h1>
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-3 py-1 text-xs font-semibold text-yellow-600 dark:text-yellow-500">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                Offline Mode
              </span>
            )}
          </div>
          <p className="text-muted-foreground">
            Track your vital signs, set personal health goals, and analyze progress.
          </p>
        </div>

        <Button
          onClick={() => setShowGoalModal(true)}
          className="bg-primary text-primary-foreground font-medium text-xs px-4 py-2 flex items-center gap-1.5 self-start md:self-auto"
        >
          <Target className="h-4 w-4" /> Set New Goal
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" role="group" aria-label="Select a metric type to record">
        {metricTypes.map((metric) => {
          const Icon = metric.icon;
          const isSelected = metricType === metric.value;
          return (
            <Card
              key={metric.value}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`Select ${metric.label} to record a new measurement`}
              className={`cursor-pointer transition-all hover-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isSelected ? "border-primary bg-accent" : ""
              }`}
              onClick={() => handleMetricCardSelect(metric.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleMetricCardSelect(metric.value);
                }
              }}
            >
              <CardContent className="pt-6 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Set Goal Modal */}
      <Dialog open={showGoalModal} onOpenChange={setShowGoalModal}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-primary" /> Set New Health Goal
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Define a target threshold (e.g. 10,000 steps daily or 8 hours sleep) to track your progress.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateGoal} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="goal_title" className="text-xs">Goal Title</Label>
              <Input
                id="goal_title"
                placeholder="e.g. Walk 10,000 Steps Daily"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                required
                className="bg-slate-900 border-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="goal_metric" className="text-xs">Metric Type</Label>
                <Select
                  value={newGoal.metric_type}
                  onValueChange={(val) => setNewGoal({ ...newGoal, metric_type: val })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-800 text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800">
                    {metricTypes.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label} ({m.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="goal_target" className="text-xs">Target Value</Label>
                <Input
                  id="goal_target"
                  type="number"
                  placeholder="10000"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                  required
                  className="bg-slate-900 border-slate-800 text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="goal_end_date" className="text-xs">Target End Date</Label>
              <Input
                id="goal_end_date"
                type="date"
                value={newGoal.end_date}
                onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })}
                required
                className="bg-slate-900 border-slate-800 text-xs h-9"
              />
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground font-medium text-xs">
              Create Goal
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active Goals & Analytics Section */}
      {goals.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-800/60">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                <Target className="h-5 w-5 text-primary" />
                Active Health Goals & Progress
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Track real-time progress toward your target health milestones.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((g) => {
              const matchingRecords = records.filter((r: OfflineMetric) => r.metric_type === g.metric_type);
              const latestVal = matchingRecords[0]?.value as { value?: number } | undefined;
              const currentVal = latestVal?.value || 0;
              const percent = Math.min(100, Math.round((currentVal / g.target_value) * 100));

              return (
                <div key={g.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate" title={g.title}>{g.title}</h4>
                    <Badge className={percent >= 100 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"}>
                      {percent >= 100 ? "Goal Met!" : `${percent}%`}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Latest: <strong className="text-white">{currentVal}</strong> {g.unit}</span>
                      <span>Target: <strong className="text-white">{g.target_value}</strong> {g.unit}</span>
                    </div>
                    <Progress value={percent} className="h-2 bg-slate-800" />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Target Date: {new Date(g.end_date).toLocaleDateString()}</span>
                    <span className="capitalize text-slate-400">{g.metric_type.replace("_", " ")}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {SelectedIcon && <SelectedIcon className="w-5 h-5 text-primary" />}
              Record {selectedMetric?.label ?? "Measurement"}
            </DialogTitle>
            <DialogDescription>Enter your latest reading below.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4" role="form" aria-label={`Record ${selectedMetric?.label ?? 'measurement'} form`}>
            {metricType === "blood_pressure" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolic</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    required
                    aria-required="true"
                    aria-describedby="systolic-hint"
                  />
                  <p id="systolic-hint" className="text-xs text-muted-foreground">Enter a value between 60 and 250 mmHg</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolic</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    required
                    aria-required="true"
                    aria-describedby="diastolic-hint"
                  />
                  <p id="diastolic-hint" className="text-xs text-muted-foreground">Enter a value between 30 and 150 mmHg</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="value">Value ({selectedMetric?.unit})</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.1"
                  placeholder={`Enter value in ${selectedMetric?.unit ?? 'units'}`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  aria-required="true"
                  aria-describedby="value-hint"
                />
                <p id="value-hint" className="text-xs text-muted-foreground">Enter a valid measurement value</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full" aria-label={loading ? "Saving metric" : "Record metric"}>
              {loading ? "Saving..." : "Record Metric"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Metrics History</CardTitle>
            <CardDescription>
              Your previously recorded health metrics
            </CardDescription>
          </div>
          {historyView === "chart" && (
            <Button onClick={downloadChart} aria-label="Download chart as PNG image">
              Download Chart
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {historyLoading ? (
            historyView === "table" ? <MetricsTableSkeleton /> : <MetricsChartSkeleton />
        ) : records.length === 0 ? (
          <EmptyState
          icon={
          <Activity
            className="w-8 h-8 text-teal-600 dark:text-teal-400"
            strokeWidth={1.5}
           />
           }
          title="Add your first health metric"
          description="Record a measurement above to start tracking trends over time."
          ctaText="Add Metric"
          onCtaClick={() => setFormOpen(true)}
          />
          ) : (
            <div className="animate-fade-in">
              <div className="flex flex-wrap gap-3 mb-4">
                <Select
                  value={historyMetricFilter}
                  onValueChange={setHistoryMetricFilter}
                  aria-label="Filter metrics by type"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Metrics</SelectItem>
                    {metricTypes.map((metric) => (
                      <SelectItem key={metric.value} value={metric.value}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={timeframeFilter}
                  onValueChange={setTimeframeFilter}
                  aria-label="Filter by time range"
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2 ml-auto">
                  <Button
                    variant={sortOrder === "newest" ? "default" : "outline"}
                    onClick={() => setSortOrder("newest")}
                    className="gap-2"
                    aria-pressed={sortOrder === "newest"}
                  >
                    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                    Newest First
                  </Button>
                  <Button
                    variant={sortOrder === "oldest" ? "default" : "outline"}
                    onClick={() => setSortOrder("oldest")}
                    className="gap-2"
                    aria-pressed={sortOrder === "oldest"}
                  >
                    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                    Oldest First
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 mb-4" role="tablist" aria-label="Metrics history view">
                <Button
                  variant={historyView === "table" ? "default" : "outline"}
                  onClick={() => setHistoryView("table")}
                  role="tab"
                  aria-selected={historyView === "table"}
                  aria-controls="metrics-history-panel"
                >
                  Table
                </Button>
                <Button
                  variant={historyView === "chart" ? "default" : "outline"}
                  onClick={() => setHistoryView("chart")}
                  role="tab"
                  aria-selected={historyView === "chart"}
                  aria-controls="metrics-history-panel"
                >
                  Chart
                </Button>
              </div>

              {historyView === "table" && (
                <div className="rounded-xl border overflow-x-auto" id="metrics-history-panel" role="tabpanel">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record: OfflineMetric) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {formatDate(record.recorded_at)}
                          </TableCell>
                          <TableCell>
                            {
                              metricTypes.find(
                                (m) => m.value === record.metric_type,
                              )?.label
                            }
                          </TableCell>
                          <TableCell>{formatMetricValue(record)}</TableCell>
                          <TableCell>{record.notes || "-"}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" aria-label="Delete metric record">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Record?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. The selected
                                    health metric record will be permanently
                                    removed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteRecord(record.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {historyView === "chart" &&
                (historyMetricFilter === "all" ? (
                  <div className="flex flex-col items-center justify-center h-[400px] w-full rounded-xl border border-dashed p-8 text-center bg-muted/20">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mb-4 opacity-60" />
                    <h3 className="text-lg font-semibold mb-1">Chart View Disabled for "All Metrics"</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Please select a specific metric type from the dropdown filter above to view its trend chart.
                    </p>
                  </div>
                ) : (
                  <div ref={chartRef} className="h-[400px] w-full rounded-xl border p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredRecords}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="recorded_at"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })
                          }
                          tick={{ fontSize: 10 }}
                          minTickGap={25}
                        />
                        <Tooltip labelFormatter={(value) => formatDate(value)} />
                        {(() => {
                          const activeGoalForFilter = goals.find((g) => g.metric_type === historyMetricFilter);
                          return activeGoalForFilter ? (
                            <ReferenceLine
                              y={activeGoalForFilter.target_value}
                              stroke="#10b981"
                              strokeDasharray="4 4"
                              strokeWidth={2}
                              label={{
                                value: `Target Goal: ${activeGoalForFilter.target_value} ${activeGoalForFilter.unit}`,
                                fill: "#10b981",
                                position: "top",
                                fontSize: 11,
                              }}
                            />
                          ) : null;
                        })()}
                        {isBloodPressure ? (
                          <>
                            <Line
                              type="monotone"
                              dataKey="value.systolic"
                              stroke="#ef4444"
                              strokeWidth={3}
                              dot={{ r: 4 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="value.diastolic"
                              stroke="#3b82f6"
                              name="Diastolic"
                            />
                          </>
                        ) : (
                          <Line
                            type="monotone"
                            dataKey="value.value"
                            stroke="#8884d8"
                            name="Value"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;