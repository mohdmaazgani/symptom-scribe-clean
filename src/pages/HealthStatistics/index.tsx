import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db, decryptSymptom } from "@/lib/offline-db";
import { whenKeysReady } from "@/lib/encryption";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Download, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface SymptomEntry {
  id: string;
  symptoms: string;
  severity_level: string;
  created_at: string;
}

const HealthStatistics = () => {
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        let rawData: Record<string, unknown>[] = [];
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from("symptom_history")
            .select("*")
            .eq("user_id", user.id);
          if (!error && data) rawData = data;
        } else {
          const localRecords = await db.symptomHistory
            .where("user_id")
            .equals(user.id)
            .filter((record: { pending_delete: number }) => record.pending_delete === 0)
            .toArray();
          const keys = await whenKeysReady();
          const decrypted = await Promise.allSettled(
            localRecords.map((r: unknown) => decryptSymptom(r, keys.encryptionKey))
          );
          rawData = decrypted
            .filter((r) => r.status === "fulfilled")
            .map((r) => (r as PromiseFulfilledResult<Record<string, unknown>>).value);
        }

        setEntries(
          rawData.map((r) => ({
            id: r.id,
            symptoms: r.symptoms || "",
            severity_level: r.severity_level || "low",
            created_at: r.created_at || new Date().toISOString(),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch health statistics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredEntries = useMemo(() => {
    if (dateRange === "all") return entries;
    const now = new Date();
    const days = parseInt(dateRange, 10);
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return entries.filter((e) => new Date(e.created_at) >= threshold);
  }, [entries, dateRange]);

  const stats = useMemo(() => {
    const total = filteredEntries.length;
    let severitySum = 0;
    const symptomsFreq: Record<string, number> = {};
    const monthlyData: Record<string, number> = {};

    filteredEntries.forEach((entry) => {
      // average severity
      if (entry.severity_level === "high") severitySum += 3;
      else if (entry.severity_level === "moderate") severitySum += 2;
      else severitySum += 1; // low

      // frequent symptoms (simple word parsing)
      const words = entry.symptoms.toLowerCase().match(/\b(\w+)\b/g);
      if (words) {
        words.forEach((w) => {
          if (w.length > 3) {
            symptomsFreq[w] = (symptomsFreq[w] || 0) + 1;
          }
        });
      }

      // monthly trends
      const date = new Date(entry.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const avgSeverityNum = total ? severitySum / total : 0;
    const avgSeverity =
      avgSeverityNum > 2.3
        ? "High"
        : avgSeverityNum > 1.6
          ? "Moderate"
          : total === 0
            ? "N/A"
            : "Low";

    const topSymptoms =
      Object.entries(symptomsFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((k) => k[0])
        .join(", ") || "None";

    const chartData = Object.entries(monthlyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, count]) => ({ month, count }));

    return { total, avgSeverity, topSymptoms, chartData };
  }, [filteredEntries]);

  const exportPNG = async () => {
    if (chartRef.current) {
      const dataUrl = await toPng(chartRef.current);
      const link = document.createElement("a");
      link.download = "health-statistics.png";
      link.href = dataUrl;
      link.click();
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Health Statistics Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Total Entries: ${stats.total}`, 14, 30);
    doc.text(`Average Severity: ${stats.avgSeverity}`, 14, 40);
    doc.text(`Top Symptoms: ${stats.topSymptoms}`, 14, 50);

    const tableData = stats.chartData.map((d) => [d.month, d.count.toString()]);
    autoTable(doc, {
      startY: 60,
      head: [["Month", "Entries"]],
      body: tableData,
    });
    doc.save("health-statistics.pdf");
  };

  const exportCSV = () => {
    const headers = ["Month", "Entries"];
    const rows = stats.chartData.map((d) => [d.month, d.count]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "health-statistics.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Health Statistics Dashboard</h1>
          <p className="text-muted-foreground">Summarized insights based on your symptom history</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Symptom Entries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Severity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : stats.avgSeverity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Frequent</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate" title={stats.topSymptoms}>
              {loading ? "..." : stats.topSymptoms}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Monthly Activity Trends</CardTitle>
            <CardDescription>Frequency of symptoms logged per month</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPNG}>
              <ImageIcon className="h-4 w-4 mr-2" /> PNG
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={chartRef} className="h-[300px] w-full p-4 bg-background">
            {loading ? (
              <div className="flex h-full items-center justify-center">Loading chart...</div>
            ) : stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                No data available for the selected timeframe.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthStatistics;
