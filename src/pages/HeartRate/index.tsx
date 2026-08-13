import { useEffect, useMemo, useState } from "react";
import { Activity, Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { classifyHeartRate } from "@/lib/heart-rate-zones";

const contexts = ["Resting", "Exercise", "Post-workout", "Walking", "Other"] as const;
type ReadingContext = (typeof contexts)[number];

interface HeartRateReading {
  id: string;
  recorded_at: string | null;
  value: Json;
}

function getReadingDetails(reading: HeartRateReading) {
  const value = reading.value as Record<string, unknown>;
  return {
    bpm: typeof value.value === "number" ? value.value : 0,
    age: typeof value.age === "number" ? value.age : null,
    context: typeof value.context === "string" ? value.context : "Unspecified",
    zone: typeof value.zone === "string" ? value.zone : "Unclassified",
  };
}

function formatTimestamp(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value)
      )
    : "Unknown time";
}

export default function HeartRatePage() {
  const { user } = useAuth();
  const [bpm, setBpm] = useState("");
  const [age, setAge] = useState("");
  const [context, setContext] = useState<ReadingContext>("Resting");
  const [readings, setReadings] = useState<HeartRateReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analysis = useMemo(() => {
    const numericBpm = Number(bpm);
    const numericAge = Number(age);
    return Number.isFinite(numericBpm) &&
      Number.isFinite(numericAge) &&
      numericBpm >= 30 &&
      numericBpm <= 250 &&
      numericAge >= 13 &&
      numericAge <= 120
      ? classifyHeartRate(numericBpm, numericAge)
      : null;
  }, [age, bpm]);

  const loadReadings = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("health_metrics")
      .select("id, recorded_at, value")
      .eq("user_id", user.id)
      .eq("metric_type", "heart_rate")
      .order("recorded_at", { ascending: false })
      .limit(20);
    if (error) setError("Could not load heart-rate history.");
    else setReadings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadReadings();
  }, [user?.id]);

  const saveReading = async () => {
    if (!user || !analysis) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("health_metrics").insert({
      user_id: user.id,
      metric_type: "heart_rate",
      value: { value: Number(bpm), age: Number(age), context, zone: analysis.zone.name } as Json,
      recorded_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setError("Could not save this heart-rate reading. Please try again.");
      return;
    }
    setBpm("");
    await loadReadings();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <Heart className="h-8 w-8 text-rose-500" />
          Heart Rate Monitor
        </h1>
        <p className="mt-1 text-muted-foreground">
          Understand your effort using age-adjusted cardio zones.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log a reading</CardTitle>
            <CardDescription>Enter your BPM, age, and activity context.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heart-rate-bpm">Heart rate (BPM)</Label>
                <Input
                  id="heart-rate-bpm"
                  type="number"
                  min="30"
                  max="250"
                  value={bpm}
                  onChange={(event) => setBpm(event.target.value)}
                  placeholder="e.g. 128"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heart-rate-age">Age</Label>
                <Input
                  id="heart-rate-age"
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  placeholder="e.g. 32"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heart-rate-context">Activity context</Label>
              <Select
                value={context}
                onValueChange={(value) => setContext(value as ReadingContext)}
              >
                <SelectTrigger id="heart-rate-context">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contexts.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" disabled={!analysis || saving} onClick={saveReading}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save reading"}
            </Button>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zone analysis</CardTitle>
            <CardDescription>
              {analysis
                ? `Estimated max heart rate: ${analysis.maxHeartRate} BPM`
                : "Enter BPM and age to calculate your zone."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysis ? (
              <div className="space-y-5">
                <div
                  className="rounded-xl p-5 text-center"
                  style={{
                    backgroundColor: `${analysis.zone.color}20`,
                    border: `1px solid ${analysis.zone.color}`,
                  }}
                >
                  <p className="text-sm text-muted-foreground">Current zone</p>
                  <p className="text-3xl font-bold" style={{ color: analysis.zone.color }}>
                    {analysis.zone.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {analysis.percentage}% of estimated maximum
                  </p>
                </div>
                <div
                  className="flex h-4 overflow-hidden rounded-full"
                  aria-label="Heart-rate zone gauge"
                >
                  {[20, 10, 10, 15, 45].map((width, index) => (
                    <div
                      key={index}
                      style={{
                        width: `${width}%`,
                        backgroundColor: ["#64748b", "#22c55e", "#06b6d4", "#f59e0b", "#ef4444"][
                          index
                        ],
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["Resting", "Fat Burn", "Aerobic", "Threshold", "Peak"].map((zone) => (
                    <span
                      key={zone}
                      className={
                        zone === analysis.zone.name
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {zone}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{analysis.zone.description}</p>
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
                <Activity className="mr-2 h-5 w-5" />
                Your colour-coded zone gauge will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reading history</CardTitle>
          <CardDescription>
            Your latest heart-rate readings, including zone and activity context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading readings...
            </div>
          ) : readings.length ? (
            <ul className="divide-y divide-border">
              {readings.map((reading) => {
                const details = getReadingDetails(reading);
                return (
                  <li
                    key={reading.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {details.bpm} BPM{" "}
                        <span className="font-normal text-muted-foreground">
                          · {details.context}
                        </span>
                      </p>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={reading.recorded_at ?? undefined}
                      >
                        {formatTimestamp(reading.recorded_at)}
                      </time>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-sm font-medium"
                      style={{
                        backgroundColor: `${classifyHeartRate(details.bpm || 1, details.age ?? 40).zone.color}20`,
                        color: classifyHeartRate(details.bpm || 1, details.age ?? 40).zone.color,
                      }}
                    >
                      {details.zone}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No readings yet. Save your first check-in above.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
