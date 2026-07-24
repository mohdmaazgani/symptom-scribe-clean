import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Download, FileDown, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { decryptSymptom, type OfflineSymptom } from "@/lib/offline-db";
import { whenEncryptionReady } from "@/lib/encryption";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SymptomEntry {
  id: string;
  symptoms: string;
  severity_level: string;
  possible_causes: string[] | null;
  recommendations: string[] | null;
  risk_score: number | null;
  resolved: boolean;
  created_at: string;
}

type TimeView = "daily" | "weekly" | "monthly";
type SeverityFilter = "all" | "low" | "moderate" | "high";

const TimelineSkeleton = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="h-8 w-64 rounded mb-2" />
      <Skeleton className="h-4 w-96 rounded" />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 w-24 rounded" />
      <Skeleton className="h-10 w-24 rounded" />
      <Skeleton className="h-10 w-24 rounded" />
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-4 w-72 rounded mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full rounded" />
      </CardContent>
    </Card>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="py-4">
            <Skeleton className="h-5 w-3/4 rounded mb-2" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

const Timeline = () => {
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeView, setTimeView] = useState<TimeView>("daily");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [jumpDate, setJumpDate] = useState<Date | undefined>(new Date());
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: rawData, error } = await supabase
        .from("symptom_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (rawData && rawData.length > 0) {
        const key = await whenEncryptionReady();
        const decryptedResults = await Promise.allSettled(
          rawData.map((record) => decryptSymptom(record as unknown as OfflineSymptom, key))
        );

        const validRecords = decryptedResults
          .filter((result): result is PromiseFulfilledResult<OfflineSymptom> => result.status === "fulfilled")
          .map((result) => result.value);

        const failedCount = decryptedResults.filter((result) => result.status === "rejected").length;
        if (failedCount > 0) {
          console.warn(`Skipped ${failedCount} symptom records that could not be decrypted`);
        }

        const mapped: SymptomEntry[] = validRecords.map((s) => ({
          id: s.id,
          symptoms: s.symptoms,
          severity_level: s.severity_level || "low",
          possible_causes: s.possible_causes,
          recommendations: s.recommendations,
          risk_score: s.risk_score,
          resolved: !!s.resolved,
          created_at: s.created_at,
        }));

        setHistory(mapped);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("Error fetching timeline data:", error);
      showError("Connection Error", "Failed to load timeline data");
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = useMemo(() => {
    const now = new Date();
    switch (timeView) {
      case "daily":
        return { start: subDays(now, 30), end: now, label: "Last 30 Days" };
      case "weekly":
        return { start: subWeeks(now, 12), end: now, label: "Last 12 Weeks" };
      case "monthly":
        return { start: subMonths(now, 12), end: now, label: "Last 12 Months" };
      default:
        return { start: subDays(now, 30), end: now, label: "Last 30 Days" };
    }
  }, [timeView]);

  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (severityFilter !== "all") {
      filtered = filtered.filter((entry) => entry.severity_level === severityFilter);
    }

    filtered = filtered.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      return isWithinInterval(entryDate, { start: getDateRange.start, end: getDateRange.end });
    });

    return filtered;
  }, [history, severityFilter, getDateRange]);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { date: string; count: number; avgSeverity: number; high: number; moderate: number; low: number }> = {};

    filteredHistory.forEach((entry) => {
      const entryDate = new Date(entry.created_at);
      let key: string;
      let label: string;

      if (timeView === "daily") {
        key = format(entryDate, "yyyy-MM-dd");
        label = format(entryDate, "MMM d");
      } else if (timeView === "weekly") {
        const weekStart = startOfWeek(entryDate, { weekStartsOn: 1 });
        key = format(weekStart, "yyyy-MM-dd");
        label = format(weekStart, "MMM d");
      } else {
        key = format(entryDate, "yyyy-MM");
        label = format(entryDate, "MMM yyyy");
      }

      if (!dataMap[key]) {
        dataMap[key] = { date: key, count: 0, avgSeverity: 0, high: 0, moderate: 0, low: 0 };
      }

      dataMap[key].count += 1;

      const severityScore = entry.severity_level === "high" ? 3 : entry.severity_level === "moderate" ? 2 : 1;
      dataMap[key].avgSeverity += severityScore;

      if (entry.severity_level === "high") dataMap[key].high += 1;
      else if (entry.severity_level === "moderate") dataMap[key].moderate += 1;
      else dataMap[key].low += 1;
    });

    return Object.values(dataMap)
      .map((item) => ({
        ...item,
        avgSeverity: item.count > 0 ? Math.round((item.avgSeverity / item.count) * 10) / 10 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHistory, timeView]);

  const severityColors: Record<string, string> = {
    high: "#ef4444",
    moderate: "#f59e0b",
    low: "#22c55e",
  };

  const getSeverityBadgeVariant = (severity: string): "destructive" | "default" | "secondary" => {
    switch (severity) {
      case "high":
        return "destructive";
      case "moderate":
        return "default";
      default:
        return "secondary";
    }
  };

  const navigateToDate = (direction: "prev" | "next") => {
    if (!jumpDate) return;
    const newDate = direction === "prev" ? subDays(jumpDate, timeView === "daily" ? 7 : timeView === "weekly" ? 4 : 3) : subDays(jumpDate, timeView === "daily" ? -7 : timeView === "weekly" ? -4 : -3);
    setJumpDate(newDate);
  };

  const exportCSV = () => {
    const headers = ["Date", "Symptoms", "Severity", "Risk Score", "Resolved"];
    const rows = filteredHistory.map((entry) => [
      new Date(entry.created_at).toLocaleDateString(),
      `"${entry.symptoms.replace(/"/g, '""')}"`,
      entry.severity_level,
      entry.risk_score ?? "N/A",
      entry.resolved ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `symptom-timeline-${timeView}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Export Complete", "Timeline exported as CSV");
  };

  const exportPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Symptom Timeline Report", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
      doc.text(`View: ${timeView.charAt(0).toUpperCase() + timeView.slice(1)} | Entries: ${filteredHistory.length}`, 14, 32);

      autoTable(doc, {
        startY: 40,
        head: [["Date", "Symptoms", "Severity", "Risk Score", "Status"]],
        body: filteredHistory.map((entry) => [
          new Date(entry.created_at).toLocaleDateString(),
          entry.symptoms.length > 60 ? entry.symptoms.substring(0, 60) + "..." : entry.symptoms,
          entry.severity_level,
          `${entry.risk_score ?? "N/A"}`,
          entry.resolved ? "Resolved" : "Active",
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [20, 130, 120] },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 2) {
            const severity = String(data.cell.raw).toLowerCase();
            if (severity === "high") data.cell.styles.textColor = [200, 40, 40];
            else if (severity === "moderate") data.cell.styles.textColor = [180, 120, 0];
            else data.cell.styles.textColor = [34, 197, 94];
          }
        },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          "This report is generated from self-reported symptom data and is not a substitute for professional medical advice.",
          14,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 30,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      doc.save(`symptom-timeline-${timeView}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      showSuccess("Export Complete", "Timeline exported as PDF");
    } catch (error) {
      console.error("PDF export failed:", error);
      showError("Export Failed", "Could not generate PDF report");
    } finally {
      setExporting(false);
    }
  };

  const getTimeLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (timeView === "monthly") return format(date, "MMM yyyy");
    if (timeView === "weekly") return format(date, "MMM d, yyyy");
    return format(date, "MMM d");
  };

  if (loading) {
    return <TimelineSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Symptom Timeline</h1>
          <p className="text-muted-foreground">Visualize how your symptoms change over time</p>
        </div>

        {filteredHistory.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm">
              Export CSV
            </Button>
            <Button onClick={exportPDF} variant="outline" size="sm" disabled={exporting}>
              <FileDown className="w-4 h-4 mr-1" />
              {exporting ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-muted/50 p-1 rounded-lg">
              <Button
                size="sm"
                variant={timeView === "daily" ? "default" : "ghost"}
                className="text-xs h-8 px-3"
                onClick={() => setTimeView("daily")}
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={timeView === "weekly" ? "default" : "ghost"}
                className="text-xs h-8 px-3"
                onClick={() => setTimeView("weekly")}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant={timeView === "monthly" ? "default" : "ghost"}
                className="text-xs h-8 px-3"
                onClick={() => setTimeView("monthly")}
              >
                Monthly
              </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-8 px-3 gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  {severityFilter === "all" ? "All Severities" : severityFilter.charAt(0).toUpperCase() + severityFilter.slice(1)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex flex-col gap-1">
                  {(["all", "low", "moderate", "high"] as SeverityFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSeverityFilter(filter)}
                      className={cn(
                        "text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                        severityFilter === filter
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      {filter === "all" ? "All Severities" : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateToDate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-8 px-3 gap-1.5 min-w-[140px]">
                    <Calendar className="w-3.5 h-3.5" />
                    {jumpDate ? format(jumpDate, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent
                    mode="single"
                    selected={jumpDate}
                    onSelect={setJumpDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigateToDate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {severityFilter !== "all" && (
              <>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setSeverityFilter("all")}
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filter
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950">
              <Calendar className="w-8 h-8 text-teal-600 dark:text-teal-400" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">No timeline data</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {history.length === 0
                  ? "Your symptom history will appear here after your first AI consultation."
                  : "Try adjusting your filters or time range to see more data."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Symptom Frequency</span>
                <Badge variant="secondary" className="text-xs">
                  {getDateRange.label}
                </Badge>
              </CardTitle>
              <CardDescription>
                Number of symptom entries per {timeView === "daily" ? "day" : timeView === "weekly" ? "week" : "month"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={getTimeLabel}
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(label) => getTimeLabel(label)}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        color: "var(--popover-foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      dot={{ r: 4, strokeWidth: 1, fill: "var(--background)" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Severity Distribution</span>
                <Badge variant="secondary" className="text-xs">
                  {getDateRange.label}
                </Badge>
              </CardTitle>
              <CardDescription>
                Breakdown of symptom severity levels over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={getTimeLabel}
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(label) => getTimeLabel(label)}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        color: "var(--popover-foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="low" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="moderate" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Severity Trend</CardTitle>
              <CardDescription>
                Average severity score trend over time (1 = low, 2 = moderate, 3 = high)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={getTimeLabel}
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={30}
                      domain={[1, 3]}
                      ticks={[1, 2, 3]}
                      tickFormatter={(value) => (value === 1 ? "Low" : value === 2 ? "Mod" : "High")}
                    />
                    <Tooltip
                      labelFormatter={(label) => getTimeLabel(label)}
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                        color: "var(--popover-foreground)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgSeverity"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorSeverity)"
                      dot={{ r: 4, strokeWidth: 1, fill: "var(--background)" }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline Entries</CardTitle>
              <CardDescription>
                Showing {filteredHistory.length} of {history.length} entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0 rounded-md p-3 transition-all duration-200 hover:bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm break-words">{entry.symptoms}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                      {entry.risk_score !== null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Risk Score: {entry.risk_score}/100
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant={getSeverityBadgeVariant(entry.severity_level)}>
                        {entry.severity_level}
                      </Badge>
                      {entry.resolved && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Timeline;
