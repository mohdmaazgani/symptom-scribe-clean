import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Activity,
  AlertCircle,
  ListOrdered,
  RefreshCw,
  Filter,
  Flame,
  FileBarChart,
} from "lucide-react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { db, decryptSymptom } from "@/lib/offline-db";
import { whenKeysReady } from "@/lib/encryption";
import { getCachedData } from "@/lib/cached-queries";

export interface SymptomRecord {
  id: string;
  user_id?: string;
  symptoms: string;
  severity_level: string;
  possible_causes?: string[] | null;
  recommendations?: string[] | null;
  risk_score?: number | null;
  resolved?: boolean;
  created_at: string;
}

type DateRangePreset = "7days" | "30days" | "90days" | "1year" | "all" | "custom";

const SEVERITY_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export default function HealthStatistics() {
  const [records, setRecords] = useState<SymptomRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState<DateRangePreset>("30days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchSymptomRecords = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const keys = await whenKeysReady();

      if (navigator.onLine) {
        try {
          const { data: cachedData, error: cachedError } =
            await getCachedData<SymptomRecord[]>("symptom_history");
          if (!cachedError && cachedData && cachedData.length > 0) {
            setRecords(cachedData);
            setLoading(false);
            return;
          }

          const { data, error } = await supabase
            .from("symptom_history")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data) {
            const parsed = data.map((item) => ({
              id: item.id,
              user_id: item.user_id,
              symptoms: item.symptoms || "Unspecified Symptom",
              severity_level: (item.severity_level || "low").toLowerCase(),
              possible_causes: item.possible_causes,
              recommendations: item.recommendations,
              risk_score: item.risk_score,
              resolved: !!item.resolved,
              created_at: item.created_at || new Date().toISOString(),
            }));
            setRecords(parsed);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn(
            "Failed to fetch symptom history online, attempting IndexedDB fallback:",
            err
          );
        }
      }

      // Offline DB Fallback
      const localRecords = await db.symptomHistory
        .where("user_id")
        .equals(user.id)
        .filter((r) => r.pending_delete === 0)
        .toArray();

      const decrypted = await Promise.allSettled(
        localRecords.map((r) => decryptSymptom(r, keys.encryptionKey))
      );

      const validRecords = decrypted
        .filter(
          (r): r is PromiseFulfilledResult<(typeof localRecords)[number]> =>
            r.status === "fulfilled"
        )
        .map((r) => ({
          id: r.value.id,
          user_id: r.value.user_id,
          symptoms: r.value.symptoms || "Unspecified Symptom",
          severity_level: (r.value.severity_level || "low").toLowerCase(),
          possible_causes: r.value.possible_causes,
          recommendations: r.value.recommendations,
          risk_score: r.value.risk_score,
          resolved: !!r.value.resolved,
          created_at: r.value.created_at || new Date().toISOString(),
        }));

      validRecords.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecords(validRecords);
    } catch (error) {
      console.error("Error loading health statistics data:", error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load symptom records for statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSymptomRecords();
  }, [fetchSymptomRecords]);

  // Date filtering logic
  const filteredRecords = useMemo(() => {
    if (!records || records.length === 0) return [];
    const now = new Date();

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (datePreset === "7days") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (datePreset === "30days") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
    } else if (datePreset === "90days") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 90);
    } else if (datePreset === "1year") {
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (datePreset === "custom") {
      if (customStartDate) startDate = new Date(customStartDate);
      if (customEndDate) {
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    return records.filter((r) => {
      const recordDate = new Date(r.created_at);
      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
      return true;
    });
  }, [records, datePreset, customStartDate, customEndDate]);

  // Key Statistics Calculations
  const totalEntries = filteredRecords.length;
  const resolvedCount = useMemo(
    () => filteredRecords.filter((r) => r.resolved).length,
    [filteredRecords]
  );
  const activeCount = totalEntries - resolvedCount;

  // Average severity calculation
  const { averageSeverityScore, averageSeverityLabel } = useMemo(() => {
    if (filteredRecords.length === 0)
      return { averageSeverityScore: 0, averageSeverityLabel: "N/A" };
    let totalWeight = 0;
    filteredRecords.forEach((r) => {
      const level = (r.severity_level || "low").toLowerCase();
      totalWeight += SEVERITY_WEIGHTS[level] || 1;
    });
    const avg = totalWeight / filteredRecords.length;
    let label = "Low";
    if (avg >= 3.5) label = "Critical";
    else if (avg >= 2.5) label = "High";
    else if (avg >= 1.75) label = "Medium";
    return { averageSeverityScore: Math.round(avg * 10) / 10, averageSeverityLabel: label };
  }, [filteredRecords]);

  // Average risk score calculation
  const averageRiskScore = useMemo(() => {
    const recordsWithRisk = filteredRecords.filter((r) => typeof r.risk_score === "number");
    if (recordsWithRisk.length === 0) return null;
    const sum = recordsWithRisk.reduce((acc, r) => acc + (r.risk_score || 0), 0);
    return Math.round(sum / recordsWithRisk.length);
  }, [filteredRecords]);

  // Severity Distribution Data
  const severityDistribution = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    filteredRecords.forEach((r) => {
      const level = (r.severity_level || "low").toLowerCase();
      if (level in counts) {
        counts[level as keyof typeof counts]++;
      } else {
        counts.low++;
      }
    });

    return [
      { name: "Low", value: counts.low, color: SEVERITY_COLORS.low },
      { name: "Medium", value: counts.medium, color: SEVERITY_COLORS.medium },
      { name: "High", value: counts.high, color: SEVERITY_COLORS.high },
      { name: "Critical", value: counts.critical, color: SEVERITY_COLORS.critical },
    ].filter((item) => item.value > 0);
  }, [filteredRecords]);

  // Most Frequent Symptoms
  const topSymptoms = useMemo(() => {
    const freqMap: Record<string, { count: number; severities: string[] }> = {};
    filteredRecords.forEach((r) => {
      // Split symptoms by comma or bullet if multi-symptom string
      const names = r.symptoms
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      names.forEach((name) => {
        const cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        if (!freqMap[cleanName]) {
          freqMap[cleanName] = { count: 0, severities: [] };
        }
        freqMap[cleanName].count += 1;
        freqMap[cleanName].severities.push((r.severity_level || "low").toLowerCase());
      });
    });

    return Object.entries(freqMap)
      .map(([name, data]) => {
        // Calculate dominant severity
        const sevCounts: Record<string, number> = {};
        data.severities.forEach((s) => (sevCounts[s] = (sevCounts[s] || 0) + 1));
        const dominantSeverity = Object.keys(sevCounts).reduce((a, b) =>
          sevCounts[a] > sevCounts[b] ? a : b
        );

        return {
          name,
          count: data.count,
          percentage: totalEntries > 0 ? Math.round((data.count / totalEntries) * 100) : 0,
          dominantSeverity,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [filteredRecords, totalEntries]);

  // Monthly Activity Trend Data
  const monthlyActivityData = useMemo(() => {
    if (filteredRecords.length === 0) return [];

    // Group logs by Year-Month (YYYY-MM)
    const monthMap: Record<
      string,
      { total: number; low: number; medium: number; high: number; critical: number }
    > = {};

    filteredRecords.forEach((r) => {
      const d = new Date(r.created_at);
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[yearMonth]) {
        monthMap[yearMonth] = { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
      }
      monthMap[yearMonth].total += 1;
      const level = (r.severity_level || "low").toLowerCase() as keyof (typeof monthMap)[string];
      if (level in monthMap[yearMonth]) {
        monthMap[yearMonth][level] += 1;
      }
    });

    return Object.keys(monthMap)
      .sort()
      .map((ym) => {
        const [year, month] = ym.split("-");
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        const label = dateObj.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
        return {
          monthKey: ym,
          label,
          Total: monthMap[ym].total,
          Low: monthMap[ym].low,
          Medium: monthMap[ym].medium,
          High: monthMap[ym].high,
          Critical: monthMap[ym].critical,
        };
      });
  }, [filteredRecords]);

  // Export handlers
  const handleExportPNG = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(dashboardRef.current, {
        cacheBust: true,
        backgroundColor: "#090d16",
        style: { borderRadius: "12px", padding: "16px" },
      });
      const link = document.createElement("a");
      link.download = `Health_Record_Statistics_${new Date().toISOString().split("T")[0]}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Export Successful", description: "Dashboard PNG saved to your downloads." });
    } catch (err) {
      console.error("Failed to export PNG:", err);
      toast({
        title: "Export Error",
        description: "Failed to export dashboard image.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      // Title & Header
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("Symptom Scribe - Health Record Statistics", 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()} | Filter: ${datePreset.toUpperCase()}`,
        14,
        27
      );
      doc.line(14, 31, 196, 31);

      // Summary Table
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Executive Insights Summary", 14, 40);

      autoTable(doc, {
        startY: 44,
        head: [["Metric", "Value"]],
        body: [
          ["Total Symptom Entries", totalEntries.toString()],
          ["Active / Unresolved", activeCount.toString()],
          ["Resolved Symptoms", resolvedCount.toString()],
          ["Average Severity Rating", `${averageSeverityLabel} (${averageSeverityScore}/4.0)`],
          ["Average Risk Score", averageRiskScore !== null ? `${averageRiskScore}/100` : "N/A"],
        ],
        theme: "striped",
        headStyles: { fillColor: [14, 165, 233] },
      });

      // Top Symptoms Table
      const currentY =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.text("Most Frequent Logged Symptoms", 14, currentY);

      const topSymptomsRows = topSymptoms.map((s, idx) => [
        `#${idx + 1}`,
        s.name,
        s.count.toString(),
        `${s.percentage}%`,
        s.dominantSeverity.toUpperCase(),
      ]);

      autoTable(doc, {
        startY: currentY + 4,
        head: [["Rank", "Symptom Name", "Occurrences", "% of Total", "Dominant Severity"]],
        body:
          topSymptomsRows.length > 0 ? topSymptomsRows : [["-", "No data recorded", "-", "-", "-"]],
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
      });

      // Monthly Activity Table
      const monthlyY =
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      doc.setFontSize(14);
      doc.text("Monthly Activity Log Breakdown", 14, monthlyY);

      const monthlyRows = monthlyActivityData.map((m) => [
        m.label,
        m.Total.toString(),
        m.Low.toString(),
        m.Medium.toString(),
        m.High.toString(),
        m.Critical.toString(),
      ]);

      autoTable(doc, {
        startY: monthlyY + 4,
        head: [["Month", "Total Entries", "Low", "Medium", "High", "Critical"]],
        body:
          monthlyRows.length > 0 ? monthlyRows : [["-", "No activity data", "-", "-", "-", "-"]],
        theme: "striped",
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`Health_Record_Statistics_${new Date().toISOString().split("T")[0]}.pdf`);
      toast({ title: "PDF Export Complete", description: "Health statistics report downloaded." });
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast({
        title: "Export Error",
        description: "Failed to generate PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Logged Date", "Symptom", "Severity Level", "Risk Score", "Status"];
      const rows = filteredRecords.map((r) => [
        r.id,
        new Date(r.created_at).toLocaleString(),
        `"${(r.symptoms || "").replace(/"/g, '""')}"`,
        r.severity_level,
        r.risk_score ?? "",
        r.resolved ? "Resolved" : "Active",
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `Symptom_Statistics_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "CSV Downloaded", description: "Symptom records exported to CSV." });
    } catch (err) {
      console.error("Failed to export CSV:", err);
      toast({
        title: "Export Error",
        description: "Failed to download CSV data.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto space-y-8 p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">
      {/* Header & Title Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-cyan-500" />
            Health Record Statistics
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Summarized insights, symptom frequency analytics, and activity trends.
          </p>
        </div>

        {/* Date Filter & Export Action Bar */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSymptomRecords}
            disabled={loading}
            className="h-9 px-3 gap-1.5"
            aria-label="Refresh statistics data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Date range dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <Select
              value={datePreset}
              onValueChange={(val) => setDatePreset(val as DateRangePreset)}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs font-medium">
                <SelectValue placeholder="Select Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export options dropdown / buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPNG}
              disabled={isExporting || totalEntries === 0}
              className="h-9 px-3 gap-1 text-xs"
              title="Export Dashboard as Image"
            >
              <ImageIcon className="h-3.5 w-3.5 text-blue-500" />
              <span className="hidden sm:inline">PNG</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={isExporting || totalEntries === 0}
              className="h-9 px-3 gap-1 text-xs"
              title="Export Report as PDF"
            >
              <FileText className="h-3.5 w-3.5 text-rose-500" />
              <span className="hidden sm:inline">PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={totalEntries === 0}
              className="h-9 px-3 gap-1 text-xs"
              title="Export Symptom Data to CSV"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Custom Date Inputs (shown only if custom preset selected) */}
      {datePreset === "custom" && (
        <Card className="bg-muted/30 border-cyan-500/20 p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Label htmlFor="start-date" className="font-semibold text-muted-foreground">
                Start Date:
              </Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-auto h-8 text-xs bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="end-date" className="font-semibold text-muted-foreground">
                End Date:
              </Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-auto h-8 text-xs bg-background"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
                className="h-8 text-xs text-destructive"
              >
                Clear Dates
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Dashboard Canvas Container for Image Export */}
      <div ref={dashboardRef} className="space-y-8 bg-background p-1 rounded-xl">
        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-8 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Top Key Metrics Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Total Symptom Entries */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-border/60 transition-all hover:border-cyan-500/40 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Logged Entries
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                      <Activity className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{totalEntries}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      >
                        {resolvedCount} Resolved
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-500 border-amber-500/20"
                      >
                        {activeCount} Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stat 2: Average Severity */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="border-border/60 transition-all hover:border-amber-500/40 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Severity
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                      <Flame className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground flex items-baseline gap-2">
                      {averageSeverityLabel}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({averageSeverityScore} / 4.0)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Based on {totalEntries} entries in selected window
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stat 3: Top Symptom */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="border-border/60 transition-all hover:border-indigo-500/40 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Most Frequent
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                      <ListOrdered className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-foreground truncate">
                      {topSymptoms.length > 0 ? topSymptoms[0].name : "None Logged"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {topSymptoms.length > 0
                        ? `${topSymptoms[0].count} times (${topSymptoms[0].percentage}% of logs)`
                        : "No entries recorded"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Stat 4: Average Risk Score */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="border-border/60 transition-all hover:border-rose-500/40 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Risk Level
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {averageRiskScore !== null ? `${averageRiskScore}%` : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {averageRiskScore !== null
                        ? averageRiskScore > 60
                          ? "Elevated health risk indicator"
                          : "Normal baseline range"
                        : "No risk scores recorded"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Empty State warning */}
            {totalEntries === 0 && (
              <Card className="p-12 text-center border-dashed border-border/80">
                <AlertCircle className="h-12 w-12 text-muted-foreground/60 mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-foreground">No Health Records Found</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-6">
                  No symptom entries were logged during the selected timeframe. Try selecting a
                  broader date filter or log new symptoms in History.
                </p>
                <Button onClick={() => setDatePreset("all")} variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" /> View All Time Records
                </Button>
              </Card>
            )}

            {totalEntries > 0 && (
              <>
                {/* Main Visual Charts Section Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Most Frequent Symptoms (Horizontal Bar Chart) */}
                  <Card className="border-border/60 hover:shadow-md transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                        Most Frequent Symptoms
                      </CardTitle>
                      <CardDescription>
                        Top logged health symptoms by occurrence count
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {topSymptoms.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                          No frequency data available
                        </div>
                      ) : (
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={topSymptoms}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                horizontal={false}
                                stroke="var(--border)"
                                opacity={0.4}
                              />
                              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                              <YAxis
                                dataKey="name"
                                type="category"
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                width={100}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--popover)",
                                  borderColor: "var(--border)",
                                  borderRadius: "8px",
                                  color: "var(--popover-foreground)",
                                  fontSize: "12px",
                                }}
                              />
                              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                                {topSymptoms.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={SEVERITY_COLORS[entry.dominantSeverity] || "#6366f1"}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Chart 2: Severity Distribution (Pie Chart & Breakdown) */}
                  <Card className="border-border/60 hover:shadow-md transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-amber-500" />
                        Severity Level Breakdown
                      </CardTitle>
                      <CardDescription>
                        Proportion of logged entries across severity categories
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {severityDistribution.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                          No severity distribution data available
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 h-[300px]">
                          <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <Pie
                                  data={severityDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={85}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {severityDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "var(--popover)",
                                    borderColor: "var(--border)",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                  }}
                                />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Severity breakdown list */}
                          <div className="space-y-3 pr-2">
                            {severityDistribution.map((item) => {
                              const pct = Math.round((item.value / totalEntries) * 100);
                              return (
                                <div key={item.name} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="h-2.5 w-2.5 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                      />
                                      {item.name} Severity
                                    </span>
                                    <span>
                                      {item.value} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Chart 3: Monthly Activity Trends (Area Chart - Span 2 Columns) */}
                  <Card className="lg:col-span-2 border-border/60 hover:shadow-md transition-all">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-500" />
                        Monthly Activity Timeline
                      </CardTitle>
                      <CardDescription>
                        Symptom logging frequency over time by month
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {monthlyActivityData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                          No monthly activity recorded
                        </div>
                      ) : (
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={monthlyActivityData}
                              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="var(--border)"
                                opacity={0.4}
                              />
                              <XAxis
                                dataKey="label"
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                              />
                              <YAxis
                                stroke="var(--muted-foreground)"
                                fontSize={11}
                                allowDecimals={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "var(--popover)",
                                  borderColor: "var(--border)",
                                  borderRadius: "8px",
                                  fontSize: "12px",
                                }}
                              />
                              <Legend
                                verticalAlign="top"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: "12px" }}
                              />
                              <Area
                                type="monotone"
                                dataKey="Total"
                                name="Total Logged Entries"
                                stroke="#06b6d4"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#totalColor)"
                              />
                              <Area
                                type="monotone"
                                dataKey="High"
                                name="High Severity"
                                stroke="#f97316"
                                fill="transparent"
                                strokeDasharray="3 3"
                              />
                              <Area
                                type="monotone"
                                dataKey="Critical"
                                name="Critical Severity"
                                stroke="#ef4444"
                                fill="transparent"
                                strokeDasharray="2 2"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Top Symptoms Table */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <FileBarChart className="h-5 w-5 text-emerald-500" />
                      Detailed Frequent Symptoms Insights
                    </CardTitle>
                    <CardDescription>
                      Comprehensive list of recorded symptoms with occurrence percentage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border/80 text-muted-foreground font-medium text-xs">
                          <th className="pb-3 pr-4">RANK</th>
                          <th className="pb-3 pr-4">SYMPTOM NAME</th>
                          <th className="pb-3 pr-4">OCCURRENCES</th>
                          <th className="pb-3 pr-4">% OF TOTAL LOGS</th>
                          <th className="pb-3">DOMINANT SEVERITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {topSymptoms.map((symptom, idx) => (
                          <tr key={symptom.name} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 font-semibold text-muted-foreground text-xs">
                              #{idx + 1}
                            </td>
                            <td className="py-3 font-medium text-foreground">{symptom.name}</td>
                            <td className="py-3 text-muted-foreground">{symptom.count} logs</td>
                            <td className="py-3 font-semibold text-foreground">
                              {symptom.percentage}%
                            </td>
                            <td className="py-3">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs font-semibold"
                                style={{
                                  borderColor: SEVERITY_COLORS[symptom.dominantSeverity],
                                  color: SEVERITY_COLORS[symptom.dominantSeverity],
                                  backgroundColor: `${SEVERITY_COLORS[symptom.dominantSeverity]}15`,
                                }}
                              >
                                {symptom.dominantSeverity}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
