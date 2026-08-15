import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface MoodEntry {
  id: string;
  score: number;
  journal: string;
  timestamp: string;
}

const EMOJI_MAP: Record<number, string> = { 5: "😄", 4: "🙂", 3: "😐", 2: "😔", 1: "😢" };

const MoodTrendChart: React.FC<{ entries: MoodEntry[] }> = ({ entries }) => {
  const recent = entries.slice(-14);
  const maxScore = 5;

  if (recent.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Mood Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-6">Log at least 2 mood entries to see your trend chart.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Mood Trend (Last {recent.length} entries)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-1 h-[120px] border-b pb-1">
          {recent.map((entry, idx) => {
            const height = ((entry.score / maxScore) * 100);
            return (
              <div key={entry.id} className="flex flex-col items-center gap-1 flex-1" title={entry.timestamp}>
                <span className="text-sm">{EMOJI_MAP[entry.score]}</span>
                <div
                  className="w-full rounded-t-sm bg-amber-400 transition-all"
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Oldest</span><span>Most Recent</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodTrendChart;
