import { useEffect, useMemo, useState } from "react";
import { Droplet, Plus, Target, Trash2, TrendingUp } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
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
  DEFAULT_DAILY_GOAL_ML,
  QUICK_ADD_OPTIONS_ML,
  summarizeDay,
  intakesOnSameDay,
  isAmountValid,
  isDailyGoalValid,
  type HydrationIntake,
} from "@/lib/hydration";

function toIntake(record: OfflineMetric): HydrationIntake | null {
  const value = record.value as { value?: number } | null;
  if (!value || typeof value.value !== "number") return null;
  return {
    amountMl: value.value,
    recordedAt: record.recorded_at,
    notes: record.notes,
  };
}

const HydrationTracker = () => {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [dailyGoal, setDailyGoal] = useState(DEFAULT_DAILY_GOAL_ML.toString());
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

  const allIntakes = useMemo(
    () =>
      records
        .filter((record) => record.metric_type === "hydration")
        .map(toIntake)
        .filter((i): i is HydrationIntake => i !== null),
    [records],
  );

  const todayIntakes = useMemo(() => intakesOnSameDay(allIntakes), [allIntakes]);

  const parsedGoal = Number(dailyGoal);
  const goalMl = isDailyGoalValid(parsedGoal)
    ? parsedGoal
    : DEFAULT_DAILY_GOAL_ML;

  const summary = useMemo(
    () => summarizeDay(todayIntakes, goalMl),
    [todayIntakes, goalMl],
  );

  const handleAddIntake = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountMl = Number(amount);
    if (!isAmountValid(amountMl)) {
      showError(
        "Invalid Amount",
        "Please enter a water amount between 1 and 5000 ml.",
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
        metric_type: "hydration",
        value: { value: amountMl } as Json,
        notes: notes || null,
        recorded_at: recordedAt,
        pending_sync: navigator.onLine ? 0 : 1,
        pending_delete: 0,
      };

      const encryptedRecord = await encryptMetric(
        record,
        keys.encryptionKey,
        keys.searchKey,
      );

      if (navigator.onLine) {
        const { pending_sync, pending_delete, ...supabaseData } = encryptedRecord;
        const { error } = await supabase
          .from("health_metrics")
          .insert(supabaseData);
        if (error) throw error;
        await invalidateCache("health_metrics");
        await db.healthMetrics.put(encryptedRecord);
        showSuccess("Water Logged", "Your intake has been saved.");
      } else {
        await db.healthMetrics.put(encryptedRecord);
        showSuccess(
          "Saved Offline",
          "No internet connection. Saved locally and will sync once online.",
        );
      }

      setAmount("");
      setNotes("");
      refresh();
    } catch (error) {
      console.error("Error saving hydration:", error);
      showError("Failed to Save", "Could not record your water intake");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Droplet className="w-8 h-8 text-primary" />
          Hydration Tracker
        </h1>
        <p className="text-muted-foreground">
          Log your water intake and work toward your daily goal
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log Water Intake</CardTitle>
            <CardDescription>
              Quick-add a glass or enter a custom amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddIntake} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {QUICK_ADD_OPTIONS_ML.map((ml) => (
                  <Button
                    key={ml}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(ml.toString())}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    {ml} ml
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ml)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 250"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="e.g. Glass of water after lunch"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Log Intake"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Today's Goal
              </CardTitle>
              <CardDescription>
                Daily hydration target (ml)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  id="dailyGoal"
                  type="number"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                  min={250}
                  max={20000}
                  className="max-w-[160px]"
                />
                <span className="text-sm text-muted-foreground">ml</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {summary.totalMl} / {goalMl} ml
                  </span>
                  <span className="font-medium">{summary.percentComplete}%</span>
                </div>
                <Progress value={summary.percentComplete} className="h-3" />
              </div>

              {summary.remainingMl > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {summary.remainingMl} ml remaining to hit today's goal
                </p>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Daily goal reached — well done!
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Today's Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary.totalMl}</p>
                  <p className="text-xs text-muted-foreground">ml today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{summary.entries}</p>
                  <p className="text-xs text-muted-foreground">intakes today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intake History</CardTitle>
          <CardDescription>
            Your timestamped water intake log
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading intake history...
            </div>
          ) : allIntakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No water intakes logged yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Log your first glass above to start tracking your hydration.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allIntakes.map((intake) => {
                    const record = records.find(
                      (r) =>
                        r.recorded_at === intake.recordedAt &&
                        (r.value as { value?: number }).value === intake.amountMl,
                    );
                    return (
                      <TableRow key={intake.recordedAt}>
                        <TableCell>
                          {intake.recordedAt ? formatDate(intake.recordedAt) : "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {intake.amountMl} ml
                        </TableCell>
                        <TableCell>{intake.notes || "-"}</TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Intake?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The selected water
                                  intake entry will be permanently removed.
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

export default HydrationTracker;
