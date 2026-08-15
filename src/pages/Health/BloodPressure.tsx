import { useEffect, useMemo, useState } from "react";
import { Activity, HeartPulse, TrendingUp, Trash2, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { useMetricsHistory } from "@/hooks/useMetricsHistory";
import { db, type OfflineMetric, encryptMetric } from "@/lib/offline-db";
import { whenKeysReady } from "@/lib/encryption";
import { invalidateCache } from "@/lib/cached-queries";
import {
  classifyBloodPressure,
  summarizeBloodPressure,
  readingsWithinLastDays,
  isSystolicValid,
  isDiastolicValid,
  type BloodPressureReading,
  type HypertensionClassification,
} from "@/lib/hypertension";

const CATEGORY_BADGE: Record<string, string> = {
  normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  elevated: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  stage1: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  stage2: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  crisis: "bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-600/30",
};

function toReading(record: OfflineMetric): BloodPressureReading | null {
  const value = record.value as
    | { systolic?: number; diastolic?: number }
    | null;
  if (
    !value ||
    typeof value.systolic !== "number" ||
    typeof value.diastolic !== "number"
  ) {
    return null;
  }
  return {
    systolic: value.systolic,
    diastolic: value.diastolic,
    recordedAt: record.recorded_at,
    notes: record.notes,
  };
}

const BloodPressureDiary = () => {
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyUserId, setHistoryUserId] = useState("");
  const { toast } = useToast();

  const { records, loading: historyLoading, refresh, deleteRecord } =
    useMetricsHistory(historyUserId);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setHistoryUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const bpReadings = useMemo(
    () =>
      records
        .filter((record) => record.metric_type === "blood_pressure")
        .map(toReading)
        .filter((r): r is BloodPressureReading => r !== null),
    [records],
  );

  const weeklyReadings = useMemo(
    () => readingsWithinLastDays(bpReadings, 7),
    [bpReadings],
  );
  const weeklySummary = useMemo(
    () => summarizeBloodPressure(weeklyReadings),
    [weeklyReadings],
  );

  const latestCategory = useMemo(
    () =>
      bpReadings.length > 0
        ? classifyBloodPressure(
            bpReadings[0].systolic,
            bpReadings[0].diastolic,
          )
        : null,
    [bpReadings],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sys = Number(systolic);
    const dia = Number(diastolic);

    if (!isSystolicValid(sys) || !isDiastolicValid(dia)) {
      showError(
        "Invalid Reading",
        "Systolic must be 50-300 and diastolic 30-200 mmHg.",
      );
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      setHistoryUserId(user.id);

      const recordId = crypto.randomUUID();
      const recordedAt = new Date().toISOString();
      const keys = await whenKeysReady();

      const record = {
        id: recordId,
        user_id: user.id,
        metric_type: "blood_pressure",
        value: { systolic: sys, diastolic: dia } as Json,
        notes: notes || null,
        recorded_at: recordedAt,
        pending_sync: navigator.onLine ? 0 : 1,
        pending_delete: 0,
      };

      const encryptedRecord = await encryptMetric(record, keys.encryptionKey, keys.searchKey);

      if (navigator.onLine) {
        const { pending_sync, pending_delete, ...supabaseData } = encryptedRecord;
        const { error } = await supabase
          .from("health_metrics")
          .insert(supabaseData);
        if (error) throw error;
        await invalidateCache("health_metrics");
        await db.healthMetrics.put(encryptedRecord);
        showSuccess("Reading Recorded", "Blood pressure saved successfully.");
      } else {
        await db.healthMetrics.put(encryptedRecord);
        showSuccess(
          "Reading Saved Offline",
          "No internet connection. Saved locally and will sync once online.",
        );
      }

      setSystolic("");
      setDiastolic("");
      setNotes("");
      refresh();
    } catch (error) {
      console.error("Error saving blood pressure:", error);
      showError("Failed to Save", "Could not record your blood pressure reading");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const CategoryBadge = ({ classification }: { classification: HypertensionClassification }) => (
    <Badge className={CATEGORY_BADGE[classification.category]}>
      {classification.label}
    </Badge>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-primary" />
          Blood Pressure Diary
        </h1>
        <p className="text-muted-foreground">
          Log systolic and diastolic readings and track hypertension trends
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Record New Reading</CardTitle>
            <CardDescription>
              Enter your latest blood pressure measurement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="systolic">Systolic (mmHg)</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diastolic">Diastolic (mmHg)</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    required
                  />
                </div>
              </div>

              {systolic && diastolic && isSystolicValid(Number(systolic)) && isDiastolicValid(Number(diastolic)) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  Classification:
                  <CategoryBadge
                    classification={classifyBloodPressure(
                      Number(systolic),
                      Number(diastolic),
                    )}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="e.g. After morning walk, resting"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Record Reading"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Weekly Trend Summary
              </CardTitle>
              <CardDescription>
                Average readings from the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {weeklySummary.readingCount === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No readings in the last 7 days yet.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {weeklySummary.averageSystolic}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg Systolic
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {weeklySummary.averageDiastolic}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Avg Diastolic
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {weeklySummary.readingCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Readings (7d)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Latest Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestCategory ? (
                <div className="flex items-center justify-between">
                  <div>
                    <CategoryBadge classification={latestCategory} />
                    <p className="text-sm text-muted-foreground mt-2">
                      {latestCategory.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Record your first reading to see a classification.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reading History</CardTitle>
          <CardDescription>
            Your timestamped blood pressure readings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading readings...
            </div>
          ) : bpReadings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No blood pressure readings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Record your first reading above to start tracking your trends.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reading</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bpReadings.map((reading) => {
                    const classification = classifyBloodPressure(
                      reading.systolic,
                      reading.diastolic,
                    );
                    const record = records.find(
                      (r) =>
                        r.recorded_at === reading.recordedAt &&
                        (r.value as { systolic?: number }).systolic === reading.systolic,
                    );
                    return (
                      <TableRow key={reading.recordedAt}>
                        <TableCell>
                          {reading.recordedAt ? formatDate(reading.recordedAt) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {reading.systolic}/{reading.diastolic} mmHg
                        </TableCell>
                        <TableCell>
                          <CategoryBadge classification={classification} />
                        </TableCell>
                        <TableCell>{reading.notes || "-"}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Reading?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The selected blood
                                  pressure reading will be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    if (record) deleteRecord(record.id);
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BloodPressureDiary;
