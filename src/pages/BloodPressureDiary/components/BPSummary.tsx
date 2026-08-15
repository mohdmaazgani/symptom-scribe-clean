import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Entry { id: string; value: string; notes: string; timestamp: string; }

const BPSummary: React.FC<{ entries: Entry[] }> = ({ entries }) => {
  if (entries.length < 2) return null;
  const recent = entries.slice(-7);

  return (
    <Card className="border-pink-500/20 bg-pink-500/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-pink-500" /> Recent Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground">Total Entries</p>
            <p className="text-xl font-bold text-foreground">{entries.length}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground">This Week</p>
            <p className="text-xl font-bold text-foreground">{recent.length}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground">Latest</p>
            <p className="text-xs font-bold text-foreground truncate">{entries[entries.length - 1]?.value ?? "–"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BPSummary;
