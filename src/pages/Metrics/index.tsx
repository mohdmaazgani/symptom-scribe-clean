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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { showSuccess, showError, showWarning } from "@/lib/toast-helpers";
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
} from "recharts";
import { Trash2 } from "lucide-react";
import { toPng } from "html-to-image";
import { useRef } from "react";

const numberField = (label: string) =>
  z.number({
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be a valid number`,
  });

const weightMetricSchema = z.object({
  value: numberField("Weight")
    .min(20, "Weight must be between 20 and 500 kg")
    .max(500, "Weight must be between 20 and 500 kg"),
});

const bloodPressureMetricSchema = z
  .object({
    systolic: numberField("Systolic pressure")
      .min(60, "Systolic pressure must be between 60 and 300 mmHg")
      .max(300, "Systolic pressure must be between 60 and 300 mmHg"),
    diastolic: numberField("Diastolic pressure")
      .min(40, "Diastolic pressure must be between 40 and 200 mmHg")
      .max(200, "Diastolic pressure must be between 40 and 200 mmHg"),
  })
  .refine((data) => data.systolic > data.diastolic, {
    message: "Systolic pressure must be greater than diastolic pressure",
    path: ["systolic"],
  });

const heartRateMetricSchema = z.object({
  value: numberField("Heart rate")
    .min(30, "Heart rate must be between 30 and 250 BPM")
    .max(250, "Heart rate must be between 30 and 250 BPM"),
});

const temperatureMetricSchema = z.object({
  value: numberField("Temperature")
    .min(86, "Temperature must be between 86°F and 113°F")
    .max(113, "Temperature must be between 86°F and 113°F"),
});

const bloodGlucoseMetricSchema = z.object({
  value: numberField("Blood glucose")
    .min(20, "Blood glucose must be between 20 and 600 mg/dL")
    .max(600, "Blood glucose must be between 20 and 600 mg/dL"),
});

const metricFormSchema = z
  .object({
    metricType: z.string().min(1, "Please select a metric type"),
    value: z.number().optional(),
    systolic: z.number().optional(),
    diastolic: z.number().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const addIssues = (result: { success: false; error: z.ZodError }) => {
      result.error.issues.forEach((issue) => {
        ctx.addIssue(issue);
      });
    };

    if (data.metricType === "weight") {
      const result = weightMetricSchema.safeParse({ value: data.value });
      if (!result.success) addIssues(result);
      return;
    }

    if (data.metricType === "blood_pressure") {
      const result = bloodPressureMetricSchema.safeParse({
        systolic: data.systolic,
        diastolic: data.diastolic,
      });
      if (!result.success) addIssues(result);
      return;
    }

    if (data.metricType === "heart_rate") {
      const result = heartRateMetricSchema.safeParse({ value: data.value });
      if (!result.success) addIssues(result);
      return;
    }

    if (data.metricType === "temperature") {
      const result = temperatureMetricSchema.safeParse({ value: data.value });
      if (!result.success) addIssues(result);
      return;
    }

    if (data.metricType === "blood_sugar") {
      const result = bloodGlucoseMetricSchema.safeParse({ value: data.value });
      if (!result.success) addIssues(result);
      return;
    }

    if (data.metricType !== "blood_pressure" && data.value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Value is required",
      });
    }
  });

type MetricFormValues = z.infer<typeof metricFormSchema>;

const metricTypes = [
  {
    value: "blood_pressure",
    label: "Blood Pressure",
    icon: Activity,
    unit: "mmHg",
  },
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F" },
  { value: "weight", label: "Weight", icon: Weight, unit: "kg" },
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

const Metrics = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const valueInputConstraints: Record<
    string,
    { min: number; max: number; step: number; hint: string }
  > = {
    heart_rate: {
      min: 30,
      max: 250,
      step: 1,
      hint: "Enter a value between 30 and 250 BPM",
    },
    temperature: {
      min: 86,
      max: 113,
      step: 0.1,
      hint: "Enter a value between 86°F and 113°F",
    },
    weight: {
      min: 20,
      max: 500,
      step: 0.1,
      hint: "Enter a value between 20 and 500 kg",
    },
    blood_sugar: {
      min: 20,
      max: 600,
      step: 1,
      hint: "Enter a value between 20 and 600 mg/dL",
    },
    oxygen_saturation: {
      min: 70,
      max: 100,
      step: 1,
      hint: "Enter a value between 70% and 100%",
    },
    sleep: {
      min: 0,
      max: 24,
      step: 0.1,
      hint: "Enter a value between 0 and 24 hours",
    },
    steps: {
      min: 0,
      max: 100000,
      step: 1,
      hint: "Enter a value between 0 and 100,000 steps",
    },
    respiratory_rate: {
      min: 6,
      max: 60,
      step: 1,
      hint: "Enter a value between 6 and 60 breaths per minute",
    },
  };

  const downloadChart = async () => {
    if (!chartRef.current) return;
    const dataUrl = await toPng(chartRef.current);
    const link = document.createElement("a");
    link.download = "health-metric-chart.png";
    link.href = dataUrl;
    link.click();
  };
  
  const [metricType, setMetricType] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [historyUserId, setHistoryUserId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<MetricFormValues>({
    resolver: zodResolver(metricFormSchema),
    mode: "onChange",
    defaultValues: {
      metricType: "",
      notes: "",
    },
  });

  const {
    records,
    loading: historyLoading,
    refresh,
    deleteRecord,
    sortOrder,
    setSortOrder,
  } = useMetricsHistory(historyUserId);
  
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setHistoryUserId(user.id);
      }
    };

    fetchUser();
  }, []);

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
  
  const onSubmit = async (data: MetricFormValues) => {
    if (!data.metricType) return;
    const selectedMetricType = data.metricType;

    if (selectedMetricType === "oxygen_saturation") {
      const oxygen = Number(data.value);
      if (oxygen < 70 || oxygen > 100) {
        showWarning("Invalid Oxygen Saturation", "Oxygen saturation must be between 70% and 100%");
        return;
      }
    }

    if (selectedMetricType === "sleep") {
      const sleepVal = Number(data.value);
      if (sleepVal < 0 || sleepVal > 24) {
        showWarning("Invalid Sleep Duration", "Sleep duration must be between 0 and 24 hours");
        return;
      }
    }

    if (selectedMetricType === "steps") {
      const stepsVal = Number(data.value);
      if (stepsVal < 0 || stepsVal > 100000) {
        showWarning("Invalid Steps Count", "Steps must be between 0 and 100,000");
        return;
      }
    }

    if (selectedMetricType === "respiratory_rate") {
      const rr = Number(data.value);
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
      if (selectedMetricType === "blood_pressure") {
        metricValue = {
          systolic: Number(data.systolic),
          diastolic: Number(data.diastolic),
        };
      } else {
        metricValue = { value: Number(data.value) };
      }

      const metricLabel = metricTypes.find(
        (m) => m.value === selectedMetricType,
      )?.label;

      const recordId = crypto.randomUUID();
      const recordedAt = new Date().toISOString();

      const keys = await whenKeysReady();

      const record = {
        id: recordId,
        user_id: user.id,
        metric_type: selectedMetricType,
        value: metricValue as Json,
        notes: data.notes || null,
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
    reset({
      metricType: metric,
      value: undefined,
      systolic: undefined,
      diastolic: undefined,
      notes: "",
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    reset({
      metricType: "",
      value: undefined,
      systolic: undefined,
      diastolic: undefined,
      notes: "",
    });
    setFormOpen(false);
    // Clear after the close animation so the card highlight resets without the
    // modal contents visibly flipping mid-fade.
    window.setTimeout(() => setMetricType(""), 200);
  };

  const selectedMetric = metricTypes.find((m) => m.value === metricType);
  const SelectedIcon = selectedMetric?.icon;
  const selectedValueConstraint = valueInputConstraints[metricType];

  return (
    <div className="space-y-6">
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
          Track your vital signs and health measurements
        </p>
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

      <Dialog open={formOpen} onOpenChange={(open) => (open ? setFormOpen(true) : closeForm())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {SelectedIcon && <SelectedIcon className="w-5 h-5 text-primary" />}
              Record {selectedMetric?.label ?? "Measurement"}
            </DialogTitle>
            <DialogDescription>Enter your latest reading below.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" role="form" aria-label={`Record ${selectedMetric?.label ?? "measurement"} form`}>
            <input type="hidden" {...register("metricType")} />
            {metricType === "blood_pressure" ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolic</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    min={60}
                    max={300}
                    required
                    aria-required="true"
                    aria-describedby="systolic-hint"
                    aria-invalid={Boolean(errors.systolic)}
                    {...register("systolic", {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    })}
                  />
                  <p id="systolic-hint" className="text-xs text-muted-foreground">Enter a value between 60 and 300 mmHg</p>
                  {errors.systolic?.message && (
                    <p className="mt-1 text-sm text-destructive">{errors.systolic.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolic</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    min={40}
                    max={200}
                    required
                    aria-required="true"
                    aria-describedby="diastolic-hint"
                    aria-invalid={Boolean(errors.diastolic)}
                    {...register("diastolic", {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    })}
                  />
                  <p id="diastolic-hint" className="text-xs text-muted-foreground">Enter a value between 40 and 200 mmHg</p>
                  {errors.diastolic?.message && (
                    <p className="mt-1 text-sm text-destructive">{errors.diastolic.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="value">Value ({selectedMetric?.unit})</Label>
                <Input
                  id="value"
                  type="number"
                  min={selectedValueConstraint?.min}
                  max={selectedValueConstraint?.max}
                  step={selectedValueConstraint?.step ?? 0.1}
                  placeholder={`Enter value in ${selectedMetric?.unit ?? "units"}`}
                  required
                  aria-required="true"
                  aria-describedby="value-hint"
                  aria-invalid={Boolean(errors.value)}
                  {...register("value", {
                    setValueAs: (v) => (v === "" ? undefined : Number(v)),
                  })}
                />
                <p id="value-hint" className="text-xs text-muted-foreground">{selectedValueConstraint?.hint ?? "Enter a valid measurement value"}</p>
                {errors.value?.message && (
                  <p className="mt-1 text-sm text-destructive">{errors.value.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Any additional notes"
                {...register("notes")}
              />
            </div>

            <Button type="submit" disabled={loading || !isValid} className="w-full" aria-label={loading ? "Saving metric" : "Record metric"}>
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
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip labelFormatter={(value) => formatDate(value)} />
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