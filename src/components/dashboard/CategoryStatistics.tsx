import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Tag, CheckCircle2, AlertTriangle } from "lucide-react";
import { getCategories, getCategoryByName } from "@/lib/symptom-categories";

interface SymptomRecordForStats {
  id: string;
  symptoms: string;
  category?: string;
  severity_level: string;
  resolved: boolean;
}

interface CategoryStatisticsProps {
  symptoms: SymptomRecordForStats[];
  onSelectCategoryFilter?: (categoryName: string) => void;
  selectedCategory?: string;
}

export const CategoryStatistics: React.FC<CategoryStatisticsProps> = ({
  symptoms,
  onSelectCategoryFilter,
  selectedCategory = "all",
}) => {
  const categories = getCategories();

  if (!symptoms || symptoms.length === 0) {
    return null;
  }

  // Count symptoms per category
  const categoryCounts: Record<string, { total: number; resolved: number; active: number; highSeverity: number }> = {};

  symptoms.forEach((s) => {
    const catName = s.category || "General";
    if (!categoryCounts[catName]) {
      categoryCounts[catName] = { total: 0, resolved: 0, active: 0, highSeverity: 0 };
    }
    categoryCounts[catName].total += 1;
    if (s.resolved) {
      categoryCounts[catName].resolved += 1;
    } else {
      categoryCounts[catName].active += 1;
    }
    if (s.severity_level === "high") {
      categoryCounts[catName].highSeverity += 1;
    }
  });

  const totalEntries = symptoms.length;
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1].total - a[1].total);

  return (
    <Card className="border shadow-sm bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <CardTitle className="text-lg font-bold">Category Statistics</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full font-medium">
            {totalEntries} Total Logged
          </span>
        </div>
        <CardDescription>
          Distribution and breakdown of health records by category
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No categories recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedCategories.map(([catName, stats]) => {
              const categoryObj = getCategoryByName(catName);
              const color = categoryObj.color || "#6b7280";
              const percentage = Math.round((stats.total / totalEntries) * 100);
              const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();

              return (
                <div
                  key={catName}
                  onClick={() => onSelectCategoryFilter && onSelectCategoryFilter(isSelected ? "all" : catName)}
                  className={`p-3 rounded-lg border transition-all ${
                    onSelectCategoryFilter ? "cursor-pointer hover:border-teal-500/50" : ""
                  } ${isSelected ? "ring-2 ring-teal-500/50 bg-teal-500/5 border-teal-500/40" : "bg-muted/20"}`}
                >
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span>{catName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-foreground">{stats.total} {stats.total === 1 ? "entry" : "entries"}</span>
                      <span className="text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: color }}
                    />
                  </div>

                  {/* Extra breakdown badges */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {stats.resolved} Resolved
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-500" />
                      {stats.active} Active
                    </span>
                    {stats.highSeverity > 0 && (
                      <span className="flex items-center gap-1 text-red-500 dark:text-red-400 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {stats.highSeverity} High Severity
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
