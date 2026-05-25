import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Heart, Thermometer, Weight, Droplet, Wind, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
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

const metricTypes = [
  { value: "blood_pressure", label: "Blood Pressure", icon: Activity, unit: "mmHg" },
  { value: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm" },
  { value: "temperature", label: "Temperature", icon: Thermometer, unit: "°F" },
  { value: "weight", label: "Weight", icon: Weight, unit: "lbs" },
  { value: "blood_sugar", label: "Blood Sugar", icon: Droplet, unit: "mg/dL" },
  { value: "oxygen_saturation", label: "Oxygen Saturation", icon: Wind, unit: "%" },
];

interface MetricEntry {
  id: string;
  metric_type: string;
  value: any;
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
  const [historyMetricFilter, setHistoryMetricFilter] = useState("all");
  const [timeframeFilter, setTimeframeFilter] = useState("all");
  const [historyView, setHistoryView] = useState("table");

  const {
    records,
    loading: historyLoading,
    refresh: fetchHistory,
    deleteRecord,
  } = useMetricsHistory(historyUserId);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setHistoryUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const getDisplayValue = (entry: MetricEntry) => {
    if (entry.metric_type === "blood_pressure") {
      return `${entry.value.systolic}/${entry.value.diastolic} mmHg`;
    }
    const unit = metricTypes.find((m) => m.value === entry.metric_type)?.unit ?? "";
    return `${entry.value.value} ${unit}`;
  };

  const getTrend = (currentEntry: MetricEntry, allEntries: MetricEntry[]) => {
    const sameType = allEntries.filter((e) => e.metric_type === currentEntry.metric_type);
    const currentIndex = sameType.findIndex((e) => e.id === currentEntry.id);
    const prevEntry = sameType[currentIndex + 1];

    if (!prevEntry) return null;

    const curr = currentEntry.metric_type === "blood_pressure"
      ? currentEntry.value.systolic
      : currentEntry.value.value;
    const prev = prevEntry.metric_type === "blood_pressure"
      ? prevEntry.value.systolic
      : prevEntry.value.value;

    if (curr > prev) return "up";
    if (curr < prev) return "down";
    return "same";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!metricType) return;
    if (metricType === "blood_pressure" && (!systolic || !diastolic)) return;
    if (metricType !== "blood_pressure" && !value) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let metricValue: any = {};
      if (metricType === "blood_pressure") {
        metricValue = { systolic: parseInt(systolic), diastolic: parseInt(diastolic) };
      } else {
        metricValue = { value: parseFloat(value) };
      }

      const { error } = await supabase.from("health_metrics").insert({
        user_id: user.id,
        metric_type: metricType,
        value: metricValue,
        notes: notes || null,
      });

      if (error) throw error;

      const metricLabel = metricTypes.find((m) => m.value === metricType)?.label;
      showSuccess(`${metricLabel} Recorded`, "Your health metric has been saved successfully.");

      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");

      await fetchHistory();
    } catch (error) {
      console.error("Error saving metric:", error);
      showError("Failed to Save", "Could not record your health metric");
    } finally {
      setLoading(false);
    }
  };

  const formatMetricValue = (record: any) => {
    if (record.metric_type === "blood_pressure") {
      return `${record.value?.systolic}/${record.value?.diastolic} mmHg`;
    }
    const metric = metricTypes.find((m) => m.value === record.metric_type);
    return `${record.value?.value} ${metric?.unit || ""}`;
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

  const filteredRecords = records.filter((record: any) => {
    const metricMatch = historyMetricFilter === "all" || record.metric_type === historyMetricFilter;

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

  // Prepare chart data
  const chartData = filteredRecords
    .filter(r => r.metric_type !== "blood_pressure")
    .slice(0, 10)
    .reverse()
    .map(r => ({
      date: formatDate(r.recorded_at),
      value: r.value?.value,
      metric: r.metric_type
    }));

  const handleDelete = async (id: string) => {
    await deleteRecord(id);
    await fetchHistory();
    showSuccess("Deleted", "Metric record removed successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Health Metrics</h1>
        <p className="text-muted-foreground">Track your vital signs and health measurements</p>
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

      <Card>
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
                      Value ({metricTypes.find((m) => m.value === metricType)?.unit})
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

      {/* History Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
          <CardDescription>Your last 30 recorded metrics</CardDescription>
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
              <div className="flex flex-wrap gap-3 mb-4">
                <Select value={historyMetricFilter} onValueChange={setHistoryMetricFilter}>
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

                <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={historyView === "table" ? "default" : "outline"}
                    onClick={() => setHistoryView("table")}
                    size="sm"
                  >
                    Table
                  </Button>
                  <Button
                    variant={historyView === "chart" ? "default" : "outline"}
                    onClick={() => setHistoryView("chart")}
                    size="sm"
                  >
                    Chart
                  </Button>
                </div>
              </div>

              {historyView === "table" ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((entry: MetricEntry) => {
                        const trend = getTrend(entry, records);
                        const metricMeta = metricTypes.find((m) => m.value === entry.metric_type);
                        const Icon = metricMeta?.icon ?? Activity;

                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {formatDate(entry.recorded_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-primary" />
                                {metricMeta?.label}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold">
                              {getDisplayValue(entry)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.notes || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {trend === "up" && (
                                  <TrendingUp className="w-4 h-4 text-red-400" />
                                )}
                                {trend === "down" && (
                                  <TrendingDown className="w-4 h-4 text-green-400" />
                                )}
                                {trend === "same" && (
                                  <Minus className="w-4 h-4 text-muted-foreground" />
                                )}
                                {trend === null && (
                                  <span className="text-xs text-muted-foreground">first</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Record</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-[400px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Not enough data for chart
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;