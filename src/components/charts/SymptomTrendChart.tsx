import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface SymptomRecord {
  created_at: string;
  risk_score: number | null;
  severity_level: string;
  resolved: boolean;
}

interface DayBucket {
  date: string;
  consultations: number;
  avgRisk: number;
  resolved: number;
}

function buildChartData(records: SymptomRecord[], days = 30): DayBucket[] {
  const buckets: Record<string, { total: number; riskSum: number; resolved: number }> = {};

  // Pre-fill the last N days so the axis always shows them
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets[key] = { total: 0, riskSum: 0, resolved: 0 };
  }

  records.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (buckets[key]) {
      buckets[key].total += 1;
      buckets[key].riskSum += r.risk_score ?? 0;
      if (r.resolved) buckets[key].resolved += 1;
    }
  });

  return Object.entries(buckets).map(([date, b]) => ({
    date,
    consultations: b.total,
    avgRisk: b.total > 0 ? Math.round(b.riskSum / b.total) : 0,
    resolved: b.resolved,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

interface SymptomTrendChartProps {
  records: SymptomRecord[];
}

const SymptomTrendChart = ({ records }: SymptomTrendChartProps) => {
  const data = buildChartData(records, 14);
  const hasData = records.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Symptom Activity — Last 14 Days</CardTitle>
        </div>
        <CardDescription>
          Daily consultations (bars) and average risk score (line)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
            <TrendingUp className="w-10 h-10 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">
              No data yet — start logging symptoms to see your trend.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border opacity-40" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(value) =>
                  value === "consultations"
                    ? "Consultations"
                    : value === "avgRisk"
                    ? "Avg Risk Score"
                    : value
                }
              />
              <Bar
                dataKey="consultations"
                fill="url(#barGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Line
                type="monotone"
                dataKey="avgRisk"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f59e0b" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default SymptomTrendChart;
