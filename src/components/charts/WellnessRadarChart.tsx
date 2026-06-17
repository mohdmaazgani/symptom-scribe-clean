import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface SymptomRecord {
  risk_score: number | null;
  severity_level: string;
  resolved: boolean;
  created_at: string;
}

interface RadarDimension {
  subject: string;
  score: number;
  fullMark: number;
}

function buildRadarData(records: SymptomRecord[]): RadarDimension[] {
  if (records.length === 0) {
    return [
      { subject: "Low Risk", score: 0, fullMark: 100 },
      { subject: "Resolution", score: 0, fullMark: 100 },
      { subject: "Consistency", score: 0, fullMark: 100 },
      { subject: "Monitoring", score: 0, fullMark: 100 },
      { subject: "Stability", score: 0, fullMark: 100 },
    ];
  }

  const avgRisk =
    records.reduce((sum, r) => sum + (r.risk_score ?? 50), 0) / records.length;

  // Low Risk: inverse of avg risk (100 = no risk)
  const lowRiskScore = Math.round(100 - avgRisk);

  // Resolution rate: % of symptoms resolved
  const resolvedRate = Math.round(
    (records.filter((r) => r.resolved).length / records.length) * 100
  );

  // Consistency: how often user logs (more records in 30 days = higher score, cap at 100)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = records.filter(
    (r) => new Date(r.created_at) > thirtyDaysAgo
  ).length;
  const consistencyScore = Math.min(100, Math.round((recentCount / 10) * 100));

  // Monitoring: % of non-high severity (i.e., caught things early)
  const nonHighCount = records.filter(
    (r) => r.severity_level !== "high"
  ).length;
  const monitoringScore = Math.round((nonHighCount / records.length) * 100);

  // Stability: inverse of variance in risk scores
  const riskScores = records.map((r) => r.risk_score ?? 50);
  const mean = riskScores.reduce((a, b) => a + b, 0) / riskScores.length;
  const variance =
    riskScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
    riskScores.length;
  const stabilityScore = Math.max(0, Math.round(100 - Math.sqrt(variance)));

  return [
    { subject: "Low Risk", score: lowRiskScore, fullMark: 100 },
    { subject: "Resolution", score: resolvedRate, fullMark: 100 },
    { subject: "Consistency", score: consistencyScore, fullMark: 100 },
    { subject: "Monitoring", score: monitoringScore, fullMark: 100 },
    { subject: "Stability", score: stabilityScore, fullMark: 100 },
  ];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: RadarDimension; value: number }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  const { subject, score } = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-foreground">{subject}</p>
      <p className="text-muted-foreground">
        Score: <span className="font-bold text-primary">{score}/100</span>
      </p>
    </div>
  );
};

interface WellnessRadarChartProps {
  records: SymptomRecord[];
}

const WellnessRadarChart = ({ records }: WellnessRadarChartProps) => {
  const data = buildRadarData(records);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Wellness Dimensions</CardTitle>
        </div>
        <CardDescription>
          Multi-axis health score across key wellness indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="currentColor" className="text-border opacity-40" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Wellness"
              dataKey="score"
              stroke="#22d3ee"
              fill="#22d3ee"
              fillOpacity={0.25}
              strokeWidth={2}
              dot={{ r: 3, fill: "#22d3ee" }}
            />
          </RadarChart>
        </ResponsiveContainer>
        {records.length === 0 && (
          <p className="text-center text-xs text-muted-foreground -mt-4">
            Log symptoms to populate your wellness radar.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default WellnessRadarChart;
