import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PainEntry {
  id: string;
  location: string;
  intensity: number;
  painType: string;
  duration: number;
  notes: string;
  timestamp: string;
}

interface PainMapProps {
  entries: PainEntry[];
}

const PainMap: React.FC<PainMapProps> = ({ entries }) => {
  const locationFrequency: Record<string, number[]> = {};
  entries.forEach((e) => {
    if (!locationFrequency[e.location]) locationFrequency[e.location] = [];
    locationFrequency[e.location].push(e.intensity);
  });

  const locationStats = Object.entries(locationFrequency).map(([loc, intensities]) => ({
    location: loc,
    count: intensities.length,
    avgIntensity: Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length),
  })).sort((a, b) => b.count - a.count);

  if (locationStats.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pain Hotspots</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {locationStats.slice(0, 5).map(({ location, count, avgIntensity }) => (
            <div key={location} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 rounded-full bg-rose-500 transition-all"
                  style={{ width: `${Math.min((count / (locationStats[0]?.count || 1)) * 100, 100)}%`, minWidth: "8px", maxWidth: "80px" }}
                />
                <span className="text-sm font-medium text-foreground">{location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{count}×</span>
                <Badge variant="outline" className="text-xs">avg {avgIntensity}/10</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PainMap;
