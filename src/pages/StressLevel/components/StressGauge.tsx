import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StressEntry { id: string; level: number; symptom: string; timestamp: string; }

const StressGauge: React.FC<{ entries: StressEntry[]; weeklyAvg: number | null }> = ({ entries, weeklyAvg }) => {
  const recent = entries.slice(-10);
  if (recent.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Stress Trend (Last 10 Entries)</CardTitle>
          {weeklyAvg !== null && (
            <Badge variant="outline">7-Day Avg: {weeklyAvg.toFixed(1)}/10</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-[80px] border-b">
          {recent.map((entry) => {
            const heightPct = (entry.level / 10) * 100;
            const color = entry.level <= 3 ? "#22c55e" : entry.level <= 5 ? "#f59e0b" : entry.level <= 8 ? "#f97316" : "#ef4444";
            return (
              <div key={entry.id} className="flex-1 flex flex-col items-center gap-0.5" title={`${entry.level}/10 – ${entry.timestamp}`}>
                <div className="w-full rounded-t-sm transition-all" style={{ height: `${heightPct}%`, backgroundColor: color }} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StressGauge;
