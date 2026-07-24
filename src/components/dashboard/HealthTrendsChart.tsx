import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Activity, Moon, Footprints, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface HealthTrendsChartProps {
  userId: string | null;
}

type MetricFilter = "all" | "heart_rate" | "sleep" | "steps";

export default function HealthTrendsChart({ userId }: HealthTrendsChartProps) {
  const { records, loading } = useMetricsHistory(userId);
  const [activeFilter, setActiveFilter] = useState<MetricFilter>("all");

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];

    // Group logs by date (YYYY-MM-DD) for the rolling 30-day window
    const dailyValues: Record<string, { hr: number[]; sleep: number[]; steps: number[] }> = {};

    // Pre-populate last 30 days to ensure continuous timeline
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyValues[dateStr] = { hr: [], sleep: [], steps: [] };
    }

    records.forEach((record) => {
      const dateStr = new Date(record.recorded_at).toISOString().split("T")[0];
      if (dailyValues[dateStr]) {
        const val = record.value as { value?: number; systolic?: number; diastolic?: number } | null;
        if (record.metric_type === "heart_rate" && val?.value) {
          dailyValues[dateStr].hr.push(Number(val.value));
        } else if (record.metric_type === "sleep" && val?.value) {
          dailyValues[dateStr].sleep.push(Number(val.value));
        } else if (record.metric_type === "steps" && val?.value) {
          dailyValues[dateStr].steps.push(Number(val.value));
        }
      }
    });

    return Object.keys(dailyValues)
      .sort()
      .map((dateStr) => {
        const dateObj = new Date(dateStr + "T00:00:00");
        const label = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });

        const hrArr = dailyValues[dateStr].hr;
        const sleepArr = dailyValues[dateStr].sleep;
        const stepsArr = dailyValues[dateStr].steps;

        return {
          date: dateStr,
          label,
          "Heart Rate": hrArr.length > 0 ? Math.round(hrArr.reduce((a, b) => a + b, 0) / hrArr.length) : null,
          "Sleep Duration": sleepArr.length > 0 ? Math.round((sleepArr.reduce((a, b) => a + b, 0) / sleepArr.length) * 10) / 10 : null,
          "Daily Steps": stepsArr.length > 0 ? Math.round(stepsArr.reduce((a, b) => a + b, 0) / stepsArr.length) : null,
        };
      });
  }, [records]);

  // Determine if there is any data to show in the chart, respecting the active filter
  const hasData = useMemo(() => {
    if (activeFilter === "heart_rate") {
      return chartData.some((d) => d["Heart Rate"] !== null);
    }
    if (activeFilter === "sleep") {
      return chartData.some((d) => d["Sleep Duration"] !== null);
    }
    if (activeFilter === "steps") {
      return chartData.some((d) => d["Daily Steps"] !== null);
    }
    return chartData.some(
      (d) => d["Heart Rate"] !== null || d["Sleep Duration"] !== null || d["Daily Steps"] !== null
    );
  }, [chartData, activeFilter]);

  if (loading) {
    return (
      <Card className="w-full border border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div className="space-y-1">
            <div className="h-5 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse mt-2" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-24 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-border/60 transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 pb-7">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Health Trends
          </CardTitle>
          <CardDescription>Unified rolling 30-day historical health insights</CardDescription>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-1.5 bg-muted/50 p-1 rounded-lg self-start">
          <Button
            size="sm"
            variant={activeFilter === "all" ? "default" : "ghost"}
            className="text-xs h-8 px-3"
            onClick={() => setActiveFilter("all")}
          >
            All Metrics
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "heart_rate" ? "default" : "ghost"}
            className="text-xs h-8 px-3 flex items-center gap-1.5"
            onClick={() => setActiveFilter("heart_rate")}
          >
            <Activity className="w-3.5 h-3.5 text-rose-500" /> Heart Rate
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "sleep" ? "default" : "ghost"}
            className="text-xs h-8 px-3 flex items-center gap-1.5"
            onClick={() => setActiveFilter("sleep")}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500" /> Sleep
          </Button>
          <Button
            size="sm"
            variant={activeFilter === "steps" ? "default" : "ghost"}
            className="text-xs h-8 px-3 flex items-center gap-1.5"
            onClick={() => setActiveFilter("steps")}
          >
            <Footprints className="w-3.5 h-3.5 text-emerald-500" /> Steps
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 bg-muted/20 border border-dashed rounded-xl">
            <TrendingUp className="w-12 h-12 text-muted-foreground/60 mb-3 animate-pulse" />
            <h4 className="font-bold text-sm text-foreground">No Trend Data Available</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
              No heart rate, sleep duration, or step logs detected for the last 30 days. Log your metrics in the Metrics tab to view your trends.
            </p>
          </div>
        ) : (
          <div className="h-[300px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="label"
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                
                {/* Primary Left Y-Axis for heart rate (bpm) and sleep (hours) */}
                {(activeFilter === "all" || activeFilter === "heart_rate" || activeFilter === "sleep") && (
                  <YAxis
                    yAxisId="left"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                )}

                {/* Secondary Right Y-Axis for daily steps */}
                {(activeFilter === "all" || activeFilter === "steps") && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                )}

                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                    fontSize: "12px",
                  }}
                  itemStyle={{ padding: "2px 0" }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />

                {/* Heart Rate Line */}
                {(activeFilter === "all" || activeFilter === "heart_rate") && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Heart Rate"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: "var(--background)" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                )}

                {/* Sleep Line */}
                {(activeFilter === "all" || activeFilter === "sleep") && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="Sleep Duration"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: "var(--background)" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                )}

                {/* Steps Line */}
                {(activeFilter === "all" || activeFilter === "steps") && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="Daily Steps"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: "var(--background)" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
