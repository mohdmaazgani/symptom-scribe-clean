import React from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { CheckCircle2, XCircle, TrendingUp, Calendar, AlertCircle } from "lucide-react";

export type MedicationLog = Tables<"medication_log">;

interface MedicationAdherenceChartProps {
  logs: MedicationLog[];
  isLoading?: boolean;
}

export const MedicationAdherenceChart: React.FC<MedicationAdherenceChartProps> = ({
  logs,
  isLoading = false,
}) => {
  if (isLoading) {
    return <Card className="animate-pulse bg-slate-900/40 border-slate-800 h-64" />;
  }

  // Calculate adherence statistics
  const totalLogs = logs.length;
  const takenCount = logs.filter((l) => l.status === "taken").length;
  const skippedCount = logs.filter((l) => l.status === "skipped").length;
  const adherenceRate = totalLogs > 0 ? Math.round((takenCount / totalLogs) * 100) : 0;

  // Process logs grouped by day for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map((dateStr) => {
    const dayLogs = logs.filter((l) => {
      const logDate = new Date(l.scheduled_at || l.created_at || "").toISOString().split("T")[0];
      return logDate === dateStr;
    });

    const dayName = new Date(dateStr).toLocaleDateString(undefined, { weekday: "short", month: "numeric", day: "numeric" });
    const taken = dayLogs.filter((l) => l.status === "taken").length;
    const skipped = dayLogs.filter((l) => l.status === "skipped").length;

    return {
      date: dayName,
      taken,
      skipped,
    };
  });

  return (
    <div className="space-y-6">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Adherence Rate</p>
              <h4 className="text-2xl font-bold text-cyan-400 mt-1">{adherenceRate}%</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Doses Taken</p>
              <h4 className="text-2xl font-bold text-emerald-400 mt-1">{takenCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Doses Skipped</p>
              <h4 className="text-2xl font-bold text-amber-400 mt-1">{skippedCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recharts Bar Chart */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Adherence History (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {totalLogs === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-500" />
              <p>No adherence logs recorded yet. Mark doses as taken or skipped to see history visualization.</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                    itemStyle={{ fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar dataKey="taken" name="Taken" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="skipped" name="Skipped" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicationAdherenceChart;
