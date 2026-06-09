import { useEffect, useState } from "react";
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
  TrendingDown,
  Minus,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import { db, syncOfflineData, type OfflineMetric } from "@/lib/offline-db";
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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Trash2 } from "lucide-react";

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
];

interface MetricEntry {
  id: string;
  metric_type: string;
  value: { value?: number; systolic?: number; diastolic?: number };
  notes: string | null;
  recorded_at: string;
}

const Metrics = () => {
  const [metricType, setMetricType] = useState("");
  const [value, setValue] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [historyUserId, setHistoryUserId] = useState("");

  const {
    records,
    loading: historyLoading,
    refresh,
    deleteRecord,
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!metricType) return;
    if (metricType === "blood_pressure" && (!systolic || !diastolic)) return;
    if (metricType !== "blood_pressure" && !value) return;

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

      if (navigator.onLine) {
        const { error } = await supabase.from("health_metrics").insert({
          id: recordId,
          user_id: user.id,
          metric_type: metricType,
          value: metricValue,
          notes: notes || null,
          recorded_at: recordedAt,
        });

        if (error) throw error;

        // Cache locally
        await db.healthMetrics.put({
          id: recordId,
          user_id: user.id,
          metric_type: metricType,
          value: metricValue,
          notes: notes || null,
          recorded_at: recordedAt,
          pending_sync: 0,
          pending_delete: 0,
        });

        showSuccess(
          `${metricLabel} Recorded`,
          "Your health metric has been saved successfully.",
        );
      } else {
        // Save offline in local database
        await db.healthMetrics.put({
          id: recordId,
          user_id: user.id,
          metric_type: metricType,
          value: metricValue,
          notes: notes || null,
          recorded_at: recordedAt,
          pending_sync: 1,
          pending_delete: 0,
        });

        showSuccess(
          `${metricLabel} Saved Offline`,
          "No internet connection. Saved locally and will sync once online.",
        );
      }

      // Reset form
      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");

      // Refresh history
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricTypes.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.value}
              className={`cursor-pointer transition-all hover-scale ${
                metricType === metric.value ? "border-primary bg-accent" : ""
              }`}
              onClick={() => setMetricType(metric.value)}
            >
              <CardContent className="pt-6 text-center">
                <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">{metric.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Record New Measurement</CardTitle>
          <CardDescription>Enter your latest health metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Metric Type</Label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select metric type" />
                </SelectTrigger>
                <SelectContent>
                  {metricTypes.map((metric) => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {metricType && (
              <>
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
                      />
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
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      Value (
                      {metricTypes.find((m) => m.value === metricType)?.unit})
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.1"
                      placeholder="Enter value"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      required
                    />
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

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Record Metric"}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Metrics History</CardTitle>
          <CardDescription>
            Your previously recorded health metrics
          </CardDescription>
        </CardHeader>

        <CardContent>
          {historyLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading health metrics...
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No health metrics yet</p>

              <p className="text-sm text-muted-foreground mt-1">
                Record your first measurement above to start tracking trends.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Select
                  value={historyMetricFilter}
                  onValueChange={setHistoryMetricFilter}
                >
                  <SelectTrigger className="w-[220px]">
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
                >
                  <SelectTrigger className="w-[220px] mt-3">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>

                    <SelectItem value="30">Last 30 Days</SelectItem>

                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={historyView === "table" ? "default" : "outline"}
                  onClick={() => setHistoryView("table")}
                >
                  Table
                </Button>

                <Button
                  variant={historyView === "chart" ? "default" : "outline"}
                  onClick={() => setHistoryView("chart")}
                >
                  Chart
                </Button>
              </div>
              {historyView === "table" && (
                <div className="rounded-xl border overflow-x-auto">
                  <Table>
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
                                <Button variant="destructive" size="icon">
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
                  <div className="h-[400px] w-full rounded-xl border p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={filteredRecords}>
                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis
                          dataKey="recorded_at"
                          tickFormatter={(value) =>
                            new Date(value).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          }
                        />

                        <YAxis />

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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;
