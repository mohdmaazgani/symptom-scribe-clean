import { useState } from "react";
import { format } from "date-fns";
import {
  Bell,
  BellOff,
  Trash2,
  Edit2,
  Plus,
  Clock,
  AlarmClock,
  RotateCcw,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useReminders,
  type Reminder,
  type ReminderFrequency,
  type ReminderDay,
} from "@/hooks/useReminders";

const DAY_OPTIONS: { label: string; value: ReminderDay }[] = [
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
  { label: "Sun", value: "sunday" },
];

const SNOOZE_OPTIONS = [5, 10, 15, 30, 60];

const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  custom: "Custom Days",
};

function frequencyBadgeColor(freq: ReminderFrequency): string {
  if (freq === "daily") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  if (freq === "weekly") return "bg-violet-500/20 text-violet-400 border-violet-500/30";
  return "bg-amber-500/20 text-amber-400 border-amber-500/30";
}

function daysSummary(days: ReminderDay[]): string {
  if (days.length === 0) return "No days selected";
  if (days.length === 7) return "Every day";
  return days
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3))
    .join(", ");
}

interface ReminderFormData {
  label: string;
  frequency: ReminderFrequency;
  time: string;
  days: ReminderDay[];
}

const DEFAULT_FORM: ReminderFormData = {
  label: "",
  frequency: "daily",
  time: "08:00",
  days: ["monday"],
};

export default function ReminderManager() {
  const { toast } = useToast();
  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminder,
    snoozeReminder,
    dismissReminder,
  } = useReminders();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ReminderFormData>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(reminder: Reminder) {
    setEditingId(reminder.id);
    setForm({
      label: reminder.label,
      frequency: reminder.frequency,
      time: reminder.time,
      days: reminder.days,
    });
    setShowForm(true);
  }

  function toggleDay(day: ReminderDay) {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  }

  function handleSave() {
    if (!form.label.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a reminder label.",
        variant: "destructive",
      });
      return;
    }
    if (
      (form.frequency === "weekly" || form.frequency === "custom") &&
      form.days.length === 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      label: form.label.trim(),
      frequency: form.frequency,
      time: form.time,
      days:
        form.frequency === "daily"
          ? [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ] as ReminderDay[]
          : form.days,
      enabled: true,
    };

    if (editingId) {
      updateReminder(editingId, payload);
      toast({
        title: "Reminder Updated",
        description: `"${payload.label}" has been updated.`,
      });
    } else {
      addReminder(payload);
      toast({
        title: "Reminder Created",
        description: `"${payload.label}" will remind you at ${form.time}.`,
      });
    }
    setShowForm(false);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const reminder = reminders.find((r) => r.id === deleteTarget);
    deleteReminder(deleteTarget);
    setDeleteTarget(null);
    toast({
      title: "Reminder Deleted",
      description: `"${reminder?.label}" has been removed.`,
    });
  }

  function handleSnooze(id: string, minutes: number) {
    snoozeReminder(id, minutes);
    setSnoozeTarget(null);
    toast({
      title: "Snoozed",
      description: `Reminder snoozed for ${minutes} minutes.`,
    });
  }

  function handleDismiss(id: string) {
    dismissReminder(id);
    toast({
      title: "Reminder Dismissed",
      description: "The reminder has been dismissed.",
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            Symptom Reminders
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Schedule recurring reminders to log your symptoms consistently.
          </p>
        </div>
        <Button
          id="add-reminder-btn"
          onClick={openAdd}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          Add Reminder
        </Button>
      </div>

      {/* Empty state */}
      {reminders.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlarmClock className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="font-medium text-muted-foreground">
              No reminders yet
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
              Create your first symptom reminder to stay on track.
            </p>
            <Button
              id="add-first-reminder-btn"
              variant="outline"
              onClick={openAdd}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Reminder
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reminder list */}
      <div className="space-y-3">
        {reminders.map((reminder) => {
          const isSnoozed =
            !!reminder.snoozeUntil &&
            new Date(reminder.snoozeUntil) > new Date();
          return (
            <Card
              key={reminder.id}
              className={`transition-all ${
                reminder.enabled
                  ? "border-border"
                  : "opacity-60 border-dashed"
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <div className="pt-0.5">
                    <Switch
                      id={`toggle-${reminder.id}`}
                      checked={reminder.enabled}
                      onCheckedChange={() => toggleReminder(reminder.id)}
                      aria-label={`Toggle ${reminder.label}`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">
                        {reminder.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${frequencyBadgeColor(
                          reminder.frequency
                        )}`}
                      >
                        {FREQUENCY_LABELS[reminder.frequency]}
                      </Badge>
                      {!reminder.enabled && (
                        <Badge
                          variant="outline"
                          className="text-xs text-muted-foreground"
                        >
                          Paused
                        </Badge>
                      )}
                      {isSnoozed && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30"
                        >
                          Snoozed until{" "}
                          {format(
                            new Date(reminder.snoozeUntil!),
                            "HH:mm"
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {reminder.time}
                      </span>
                      {reminder.frequency !== "daily" && (
                        <span>{daysSummary(reminder.days)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {reminder.enabled && (
                      <>
                        <Button
                          id={`snooze-${reminder.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSnoozeTarget(reminder.id)}
                          title="Snooze"
                        >
                          <AlarmClock className="w-4 h-4 text-amber-400" />
                        </Button>
                        <Button
                          id={`dismiss-${reminder.id}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDismiss(reminder.id)}
                          title="Dismiss"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </Button>
                      </>
                    )}
                    <Button
                      id={`edit-${reminder.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(reminder)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      id={`delete-${reminder.id}`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(reminder.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Add / Edit Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Reminder" : "New Reminder"}
            </DialogTitle>
            <DialogDescription>
              Set up a recurring reminder to log your symptoms.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="reminder-label">Reminder Name</Label>
              <Input
                id="reminder-label"
                placeholder="e.g. Log morning symptoms"
                value={form.label}
                onChange={(e) =>
                  setForm((p) => ({ ...p, label: e.target.value }))
                }
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="reminder-frequency">Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    frequency: v as ReminderFrequency,
                    days:
                      v === "weekly"
                        ? ["monday"]
                        : v === "daily"
                        ? []
                        : p.days,
                  }))
                }
              >
                <SelectTrigger id="reminder-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day picker for weekly / custom */}
            {(form.frequency === "weekly" ||
              form.frequency === "custom") && (
              <div className="space-y-2">
                <Label>Days</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      id={`day-${value}`}
                      onClick={() => toggleDay(value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.days.includes(value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((p) => ({ ...p, time: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              id="cancel-reminder-form"
              variant="outline"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button id="save-reminder-btn" onClick={handleSave}>
              {editingId ? "Save Changes" : "Create Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Snooze Dialog ─────────────────────────────────────────────────────── */}
      <Dialog
        open={!!snoozeTarget}
        onOpenChange={(o) => !o && setSnoozeTarget(null)}
      >
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Snooze Reminder
            </DialogTitle>
            <DialogDescription>
              How long would you like to snooze this reminder?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-2">
            {SNOOZE_OPTIONS.map((mins) => (
              <Button
                key={mins}
                id={`snooze-${mins}min`}
                variant="outline"
                size="sm"
                onClick={() => snoozeTarget && handleSnooze(snoozeTarget, mins)}
              >
                {mins < 60 ? `${mins}m` : `${mins / 60}h`}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              id="cancel-snooze-btn"
              variant="ghost"
              size="sm"
              onClick={() => setSnoozeTarget(null)}
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This reminder will be permanently removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              id="confirm-delete-reminder"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
