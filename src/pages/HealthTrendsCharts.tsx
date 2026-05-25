import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, Heart, Moon, Footprints } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from "recharts";

interface ChartDataPoint {
  date: string;
  symptoms: number;
  severity: number | null;
  heartRate: number | null;
  sleep: number | null;
  steps: number | null;
}

interface HealthTrendsChartProps {
  data: ChartDataPoint[];
}

type MetricKey = "symptoms" | "heartRate" | "sleep" | "steps";

const HealthTrendsChart = ({ data }: HealthTrendsChartProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("symptoms");
  const [timeRange, setTimeRange] = useState<"7" | "14" | "30">("30");

  const filteredData = data.slice(-parseInt(timeRange));

  const metrics: { key: MetricKey; label: string; color: string; icon: any }[] = [
    { key: "symptoms", label: "Symptoms", color: "#f43f5e", icon: Activity },
    { key: "heartRate", label: "Heart Rate", color: "#3b82f6", icon: Heart },
    { key: "sleep", label: "Sleep", color: "#8b5cf6", icon: Moon },
    { key: "steps", label: "Steps", color: "#10b981", icon: Footprints },
  ];

  const getYAxisLabel = () => {
    switch(selectedMetric) {
      case "symptoms": return "Number of Symptoms";
      case "heartRate": return "Heart Rate (BPM)";
      case "sleep": return "Sleep (Hours)";
      case "steps": return "Steps (Thousands)";
      default: return "";
    }
  };

  const getMetricValue = () => {
    const last7Days = filteredData.slice(-7);
    const values: number[] = [];
    
    for (const day of last7Days) {
      const val = day[selectedMetric];
      if (val !== null && typeof val === "number") {
        values.push(val);
      }
    }
    
    if (values.length === 0) return { avg: 0, trend: 0, min: 0, max: 0 };
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    const prev7Days = filteredData.slice(-14, -7);
    const prevValues: number[] = [];
    for (const day of prev7Days) {
      const val = day[selectedMetric];
      if (val !== null && typeof val === "number") {
        prevValues.push(val);
      }
    }
    const prevAvg = prevValues.length > 0 ? prevValues.reduce((a, b) => a + b, 0) / prevValues.length : avg;
    const trend = ((avg - prevAvg) / prevAvg) * 100;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return { avg, trend, min, max };
  };

  const stats = getMetricValue();
  const currentMetric = metrics.find(m => m.key === selectedMetric)!;

  const formatValue = (value: number): string => {
    if (value === null || value === undefined) return "No data";
    if (selectedMetric === "steps") return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const formatTickValue = (value: any): string => {
    if (value === null || value === undefined) return "No data";
    const numValue = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(numValue)) return "No data";
    if (selectedMetric === "steps") return `${(numValue / 1000).toFixed(1)}k`;
    return numValue.toString();
  };

  const trendValue = typeof stats.trend === "number" ? stats.trend : parseFloat(stats.trend as any);
  const isTrendUp = trendValue > 0;
  const absTrend = Math.abs(trendValue).toFixed(1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Health Analytics Dashboard
            </CardTitle>
            <CardDescription>Track your health trends over time</CardDescription>
          </div>
          
          <div className="flex gap-2">
            {(["7", "14", "30"] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range} Days
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      {/* Metric Selector Buttons */}
      <div className="px-6 pb-2">
        <div className="flex gap-2 flex-wrap">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isActive = selectedMetric === metric.key;
            return (
              <Button
                key={metric.key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric(metric.key)}
                className="gap-2"
                style={isActive ? { backgroundColor: metric.color } : {}}
              >
                <Icon className="w-3 h-3" />
                {metric.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pt-4">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Average</p>
          <p className="text-xl font-bold">{stats.avg.toFixed(1)}</p>
          <p className="text-xs">{getYAxisLabel()}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {isTrendUp ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-500" />
            )}
            <p className={`text-xl font-bold ${isTrendUp ? 'text-red-500' : 'text-green-500'}`}>
              {absTrend}%
            </p>
          </div>
          <p className="text-xs">vs last 7 days</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Highest</p>
          <p className="text-xl font-bold">{formatValue(stats.max)}</p>
          <p className="text-xs">peak value</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Lowest</p>
          <p className="text-xl font-bold">{formatValue(stats.min)}</p>
          <p className="text-xs">lowest value</p>
        </div>
      </div>

      {/* Chart */}
      <CardContent className="pt-4">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentMetric.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={currentMetric.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                interval={timeRange === "7" ? 0 : timeRange === "14" ? 2 : 5}
              />
              <YAxis 
                label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft', fontSize: 11 }}
                tick={{ fontSize: 11 }}
                tickFormatter={formatTickValue}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), currentMetric.label]}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#666" />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={currentMetric.color}
                fill="url(#colorMetric)"
                strokeWidth={2}
                name={currentMetric.label}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthTrendsChart;