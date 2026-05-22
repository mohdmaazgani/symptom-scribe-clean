import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Heart, Thermometer, Weight, Droplet, Wind, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helpers";

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
  const [history, setHistory] = useState<MetricEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(30);

      if (!error && data) setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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
    const prevEntry = sameType[currentIndex + 1]; // sorted desc, so next index = older reading

    if (!prevEntry) return null; // first ever entry for this metric type

    const curr =
      currentEntry.metric_type === "blood_pressure"
        ? currentEntry.value.systolic
        : currentEntry.value.value;
    const prev =
      prevEntry.metric_type === "blood_pressure"
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

      // Reset form
      setValue("");
      setSystolic("");
      setDiastolic("");
      setNotes("");

      // Refresh history to show the new entry with trend
      fetchHistory();
    } catch (error) {
      console.error("Error saving metric:", error);
      showError("Failed to Save", "Could not record your health metric");
    } finally {
      setLoading(false);
    }
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
          <CardDescription>
            Your last 30 recorded metrics 
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-muted-foreground text-sm">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No readings recorded yet. Record your first metric above.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => {
                const trend = getTrend(entry, history);
                const metricMeta = metricTypes.find((m) => m.value === entry.metric_type);
                const Icon = metricMeta?.icon ?? Activity;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{metricMeta?.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.recorded_at).toLocaleString()}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground italic mt-0.5">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{getDisplayValue(entry)}</span>
                      {trend === "up" && (
                        <TrendingUp className="w-4 h-4 text-red-400" title="Higher than previous reading" />
                      )}
                      {trend === "down" && (
                        <TrendingDown className="w-4 h-4 text-green-400" title="Lower than previous reading" />
                      )}
                      {trend === "same" && (
                        <Minus className="w-4 h-4 text-muted-foreground" title="Same as previous reading" />
                      )}
                      {trend === null && (
                        <span className="text-xs text-muted-foreground">first entry</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Metrics;
