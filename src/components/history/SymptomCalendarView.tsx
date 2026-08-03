import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  X,
  Trash2,
  Filter,
  Search,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export interface SymptomEntry {
  id: string;
  user_id?: string;
  symptoms: string;
  severity_level: string;
  possible_causes: string[];
  recommendations: string[];
  risk_score: number;
  resolved: boolean;
  created_at: string;
  ai_analysis?: string;
}

interface SymptomCalendarViewProps {
  history: SymptomEntry[];
  onToggleResolved: (id: string, currentStatus: boolean) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to format Date to YYYY-MM-DD local string
const toLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const SymptomCalendarView = ({
  history,
  onToggleResolved,
  onDeleteEntry,
}: SymptomCalendarViewProps) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string>(toLocalDateString(today));
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Filter history entries based on severity, status, search query
  const filteredEntries = useMemo(() => {
    return history.filter((entry) => {
      // Severity filter
      if (severityFilter !== "all" && entry.severity_level.toLowerCase() !== severityFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === "active" && entry.resolved) return false;
      if (statusFilter === "resolved" && !entry.resolved) return false;
      // Search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesSymptoms = entry.symptoms.toLowerCase().includes(query);
        const matchesCauses = entry.possible_causes?.some((c) => c.toLowerCase().includes(query));
        if (!matchesSymptoms && !matchesCauses) return false;
      }
      return true;
    });
  }, [history, severityFilter, statusFilter, searchQuery]);

  // Group filtered entries by date string YYYY-MM-DD
  const entriesByDate = useMemo(() => {
    const map: Record<string, SymptomEntry[]> = {};
    filteredEntries.forEach((entry) => {
      const dateObj = new Date(entry.created_at);
      if (!isNaN(dateObj.getTime())) {
        const dateKey = toLocalDateString(dateObj);
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(entry);
      }
    });
    return map;
  }, [filteredEntries]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(toLocalDateString(now));
  };

  const handleMonthChange = (monthIdx: number) => {
    setCurrentDate(new Date(currentYear, monthIdx, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentMonth, 1));
  };

  // Calendar Grid calculations
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Previous month padding days
    const prevMonthDaysCount = startingDayOfWeek;
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    const days: Array<{ date: Date; isCurrentMonth: boolean; dateStr: string }> = [];

    for (let i = prevMonthDaysCount - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDate - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: toLocalDateString(d),
      });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(currentYear, currentMonth, day);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: toLocalDateString(d),
      });
    }

    // Next month padding days to complete grid (multiples of 7)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: toLocalDateString(d),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Determine severity styling
  const getSeverityBadgeVariant = (severity: string): "destructive" | "default" | "secondary" => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "destructive";
      case "moderate":
        return "default";
      default:
        return "secondary";
    }
  };

  const getHighestSeverity = (entries: SymptomEntry[]): string => {
    if (entries.some((e) => e.severity_level?.toLowerCase() === "high")) return "high";
    if (entries.some((e) => e.severity_level?.toLowerCase() === "moderate")) return "moderate";
    return "low";
  };

  const getSeverityColorClasses = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500 text-white dark:bg-red-600";
      case "moderate":
        return "bg-amber-500 text-white dark:bg-amber-600";
      default:
        return "bg-teal-500 text-white dark:bg-teal-600";
    }
  };

  const getSeverityBorderColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500/60 bg-red-500/10";
      case "moderate":
        return "border-amber-500/60 bg-amber-500/10";
      default:
        return "border-teal-500/60 bg-teal-500/10";
    }
  };

  // Selected date entries
  const selectedDateEntries = entriesByDate[selectedDateStr] || [];
  const todayStr = toLocalDateString(today);

  // Generate Year options around current year
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-6">
      {/* Calendar Controls & Filters Header */}
      <Card className="border shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Month & Year Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevMonth}
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-xl font-semibold text-foreground min-w-[160px] text-center">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h2>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
                aria-label="Next Month"
                title="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button variant="secondary" size="sm" onClick={handleToday} className="ml-2">
                Today
              </Button>
            </div>

            {/* Jump to Date / Select Month & Year */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-medium text-muted-foreground">Jump to:</span>
              <select
                aria-label="Select month"
                value={currentMonth}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {MONTH_NAMES.map((month, idx) => (
                  <option key={month} value={idx}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                aria-label="Select year"
                value={currentYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search entries in calendar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />

              <select
                aria-label="Severity filter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Severities</option>
                <option value="high">High Severity</option>
                <option value="moderate">Moderate Severity</option>
                <option value="low">Low Severity</option>
              </select>

              <select
                aria-label="Status filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-md border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="resolved">Resolved Only</option>
              </select>

              {(severityFilter !== "all" || statusFilter !== "all" || searchQuery !== "") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSeverityFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                  className="h-8 px-2 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid & Preview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid Container */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Monthly Overview
              </CardTitle>

              {/* Color-Coded Severity Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">Severity:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> High
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" /> Low
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center font-medium text-xs text-muted-foreground mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="py-1.5">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map(({ date, isCurrentMonth, dateStr }) => {
                const dayEntries = entriesByDate[dateStr] || [];
                const hasEntries = dayEntries.length > 0;
                const isSelected = dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const highestSev = hasEntries ? getHighestSeverity(dayEntries) : null;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`
                      min-h-[72px] sm:min-h-[80px] p-1.5 rounded-lg border text-left transition-all relative flex flex-col justify-between
                      ${!isCurrentMonth ? "opacity-35 bg-muted/20" : "bg-card hover:bg-accent/40"}
                      ${isSelected ? "ring-2 ring-teal-600 dark:ring-teal-400 border-transparent shadow-sm" : ""}
                      ${isToday ? "border-teal-500/80 font-bold" : "border-border"}
                      ${hasEntries && highestSev ? getSeverityBorderColor(highestSev) : ""}
                    `}
                  >
                    {/* Day number & Today Badge */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                          isToday
                            ? "bg-teal-600 text-white font-bold"
                            : isSelected
                              ? "font-bold text-teal-600 dark:text-teal-400"
                              : "text-foreground"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {hasEntries && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            highestSev
                              ? getSeverityColorClasses(highestSev)
                              : "bg-primary text-white"
                          }`}
                        >
                          {dayEntries.length}
                        </span>
                      )}
                    </div>

                    {/* Daily Entry Indicators */}
                    {hasEntries && (
                      <div className="mt-1 space-y-1 w-full overflow-hidden">
                        <div className="flex flex-wrap gap-1 items-center">
                          {dayEntries.slice(0, 2).map((e) => (
                            <span
                              key={e.id}
                              className={`w-1.5 h-1.5 rounded-full inline-block ${getSeverityColorClasses(
                                e.severity_level?.toLowerCase()
                              )}`}
                              title={`${e.symptoms} (${e.severity_level})`}
                            />
                          ))}
                          {dayEntries.length > 2 && (
                            <span className="text-[9px] text-muted-foreground font-medium">
                              +{dayEntries.length - 2}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
                          {dayEntries[0].symptoms}
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Entry Preview Side Panel */}
        <Card className="shadow-sm border">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold">Quick Entry Preview</CardTitle>
            <CardDescription className="text-xs">
              {new Date(selectedDateStr + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {selectedDateEntries.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No symptom entries logged for this date.
                </p>
                <p className="text-xs text-muted-foreground/80 max-w-[220px] mx-auto">
                  Select another day on the calendar to view logged health consultations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  {selectedDateEntries.length}{" "}
                  {selectedDateEntries.length === 1 ? "Entry" : "Entries"} Found
                </p>

                {selectedDateEntries.map((entry) => (
                  <Card
                    key={entry.id}
                    className={`border ${entry.resolved ? "opacity-75 bg-muted/10" : ""}`}
                  >
                    <CardHeader className="p-3 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-bold text-foreground break-words">
                          {entry.symptoms}
                        </h4>
                        <Badge variant={getSeverityBadgeVariant(entry.severity_level)}>
                          {entry.severity_level}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {entry.risk_score !== null && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            Risk: {entry.risk_score}/100
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-3 pt-0 space-y-2 text-xs">
                      {entry.possible_causes && entry.possible_causes.length > 0 && (
                        <div>
                          <span className="font-semibold text-foreground">Possible Causes:</span>
                          <ul className="list-disc list-inside text-muted-foreground pl-1 mt-0.5 space-y-0.5">
                            {entry.possible_causes.map((c, i) => (
                              <li key={i} className="truncate">
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {entry.recommendations && entry.recommendations.length > 0 && (
                        <div>
                          <span className="font-semibold text-foreground">Recommendations:</span>
                          <ul className="list-disc list-inside text-muted-foreground pl-1 mt-0.5 space-y-0.5">
                            {entry.recommendations.map((r, i) => (
                              <li key={i} className="truncate">
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Card Actions: Resolve & Delete */}
                      <div className="pt-2 border-t flex items-center justify-between gap-2">
                        <Button
                          variant={entry.resolved ? "outline" : "default"}
                          size="sm"
                          onClick={() => onToggleResolved(entry.id, entry.resolved)}
                          className="h-7 text-xs px-2"
                        >
                          {entry.resolved ? (
                            <>
                              <X className="w-3 h-3 mr-1" /> Reopen
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" /> Resolve
                            </>
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Symptom Entry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this entry logged on{" "}
                                {new Date(entry.created_at).toLocaleDateString()}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteEntry(entry.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SymptomCalendarView;
