import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Pencil,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { z } from "zod";
import FieldError from "@/components/ui/FieldError";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface MedicationLog {
  id: string;
  medication_id: string;
  taken_at: string;
  status: "taken" | "skipped";
}

// ─── Validation Schema ────────────────────────────────────────────────────────
const medicationSchema = z.object({
  name: z
    .string()
    .min(2, "Medication name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  dosage: z
    .string()
    .min(1, "Dosage is required (e.g. 500mg)")
    .max(50, "Dosage cannot exceed 50 characters"),
  frequency: z.string().min(1, "Please select a frequency"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").optional(),
});

type MedicationFormValues = z.infer<typeof medicationSchema>;

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "Weekly",
  "As needed",
];

const TODAY = new Date().toISOString().split("T")[0];

// ─── Page ─────────────────────────────────────────────────────────────────────
const Medications = () => {
  const [userId, setUserId] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<MedicationFormValues>({
    name: "",
    dosage: "",
    frequency: "",
    start_date: TODAY,
    end_date: "",
    notes: "",
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (uid: string) => {
    const [{ data: meds }, { data: logs }] = await Promise.all([
      supabase
        .from("medications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("medication_logs")
        .select("*")
        .eq("user_id", uid)
        .eq("taken_at", TODAY),
    ]);
    setMedications((meds as Medication[]) ?? []);
    setTodayLogs((logs as MedicationLog[]) ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchData(user.id);
      setLoading(false);
    };
    init();
  }, [fetchData]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ name: "", dosage: "", frequency: "", start_date: TODAY, end_date: "", notes: "" });
    setFieldErrors({});
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (med: Medication) => {
    setForm({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      start_date: med.start_date,
      end_date: med.end_date ?? "",
      notes: med.notes ?? "",
    });
    setEditingId(med.id);
    setFieldErrors({});
    setShowForm(true);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const parsed = medicationSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const f = err.path[0] as string;
        if (!errs[f]) errs[f] = err.message;
      });
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_id: userId,
        name: form.name.trim(),
        dosage: form.dosage.trim(),
        frequency: form.frequency,
        start_date: form.start_date,
        end_date: form.end_date || null,
        notes: form.notes?.trim() || null,
        is_active: true,
      };

      if (editingId) {
        const { error } = await supabase
          .from("medications")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        showSuccess("Updated", "Medication details saved.");
      } else {
        const { error } = await supabase.from("medications").insert(payload);
        if (error) throw error;
        showSuccess("Added", `${form.name} added to your medications.`);
      }

      resetForm();
      await fetchData(userId);
    } catch (err) {
      console.error(err);
      showError("Error", "Could not save medication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) {
      showError("Error", "Could not delete medication.");
      return;
    }
    showSuccess("Deleted", "Medication removed.");
    await fetchData(userId);
  };

  // ── Daily check-in ─────────────────────────────────────────────────────────
  const getTodayLog = (medId: string) =>
    todayLogs.find((l) => l.medication_id === medId);

  const handleCheckIn = async (medId: string, status: "taken" | "skipped") => {
    const existing = getTodayLog(medId);
    if (existing) {
      // Toggle: update existing log
      const { error } = await supabase
        .from("medication_logs")
        .update({ status })
        .eq("id", existing.id);
      if (error) { showError("Error", "Could not update log."); return; }
    } else {
      const { error } = await supabase.from("medication_logs").insert({
        user_id: userId,
        medication_id: medId,
        taken_at: TODAY,
        status,
      });
      if (error) { showError("Error", "Could not log medication."); return; }
    }
    await fetchData(userId);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeMeds = medications.filter((m) => m.is_active);
  const inactiveMeds = medications.filter((m) => !m.is_active);
  const takenToday = todayLogs.filter((l) => l.status === "taken").length;
  const adherenceRate =
    activeMeds.length > 0
      ? Math.round((takenToday / activeMeds.length) * 100)
      : 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-56 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Pill className="w-8 h-8 text-primary" />
            Medications
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your prescriptions and daily adherence
          </p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className="gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Medication"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeMeds.length}</p>
              <p className="text-xs text-muted-foreground">Active medications</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{takenToday}/{activeMeds.length}</p>
              <p className="text-xs text-muted-foreground">Taken today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${adherenceRate >= 80 ? "bg-green-500/10" : adherenceRate >= 50 ? "bg-yellow-500/10" : "bg-red-500/10"}`}>
              <Clock className={`w-5 h-5 ${adherenceRate >= 80 ? "text-green-500" : adherenceRate >= 50 ? "text-yellow-500" : "text-red-500"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{adherenceRate}%</p>
              <p className="text-xs text-muted-foreground">Today's adherence</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? "Edit Medication" : "Add New Medication"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="med-name">Medication Name *</Label>
                  <Input
                    id="med-name"
                    placeholder="e.g. Metformin"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    aria-invalid={!!fieldErrors.name}
                    className={fieldErrors.name ? "border-destructive" : ""}
                  />
                  <FieldError id="med-name-error" message={fieldErrors.name} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="med-dosage">Dosage *</Label>
                  <Input
                    id="med-dosage"
                    placeholder="e.g. 500mg"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    aria-invalid={!!fieldErrors.dosage}
                    className={fieldErrors.dosage ? "border-destructive" : ""}
                  />
                  <FieldError id="med-dosage-error" message={fieldErrors.dosage} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Frequency *</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => setForm({ ...form, frequency: v })}
                  >
                    <SelectTrigger aria-invalid={!!fieldErrors.frequency} className={fieldErrors.frequency ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="med-freq-error" message={fieldErrors.frequency} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="med-start">Start Date *</Label>
                  <Input
                    id="med-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    aria-invalid={!!fieldErrors.start_date}
                    className={fieldErrors.start_date ? "border-destructive" : ""}
                  />
                  <FieldError id="med-start-error" message={fieldErrors.start_date} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="med-end">End Date (optional)</Label>
                  <Input
                    id="med-end"
                    type="date"
                    value={form.end_date ?? ""}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="med-notes">Notes (optional)</Label>
                  <Input
                    id="med-notes"
                    placeholder="e.g. Take with food"
                    value={form.notes ?? ""}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    aria-invalid={!!fieldErrors.notes}
                    className={fieldErrors.notes ? "border-destructive" : ""}
                  />
                  <FieldError id="med-notes-error" message={fieldErrors.notes} />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={submitting} className="flex-1 sm:flex-none">
                  {submitting ? "Saving…" : editingId ? "Save Changes" : "Add Medication"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Medications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Active Medications
          </CardTitle>
          <CardDescription>Log today's intake with the check-in buttons</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeMeds.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active medications. Click "Add Medication" to get started.
            </p>
          ) : (
            activeMeds.map((med) => {
              const log = getTodayLog(med.id);
              const isTaken = log?.status === "taken";
              const isSkipped = log?.status === "skipped";
              const isExpanded = expandedId === med.id;

              return (
                <div
                  key={med.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Top row */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Status indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isTaken ? "bg-green-500" : isSkipped ? "bg-yellow-500" : "bg-muted-foreground/30"}`} />

                    {/* Medication info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{med.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {med.dosage} · {med.frequency}
                      </p>
                    </div>

                    {/* Today badge */}
                    {isTaken && (
                      <Badge className="bg-green-500/15 text-green-600 border-green-500/30 text-xs hidden sm:flex">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Taken
                      </Badge>
                    )}
                    {isSkipped && (
                      <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 text-xs hidden sm:flex">
                        <XCircle className="w-3 h-3 mr-1" /> Skipped
                      </Badge>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={isTaken ? "default" : "outline"}
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => handleCheckIn(med.id, "taken")}
                        title="Mark as taken"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Taken</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={isSkipped ? "secondary" : "outline"}
                        className="h-8 px-2 gap-1 text-xs"
                        onClick={() => handleCheckIn(med.id, "skipped")}
                        title="Mark as skipped"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Skip</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setExpandedId(isExpanded ? null : med.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3 bg-muted/30 space-y-2">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Started: {new Date(med.start_date).toLocaleDateString()}
                        </span>
                        {med.end_date && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            Until: {new Date(med.end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {med.notes && (
                        <p className="text-xs text-muted-foreground italic">"{med.notes}"</p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => openEdit(med)}
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {med.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the medication and all its logs. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(med.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Inactive / past medications */}
      {inactiveMeds.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Past Medications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactiveMeds.map((med) => (
              <div
                key={med.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-2 opacity-60"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{med.name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} · {med.frequency}</p>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">Inactive</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Medications;
