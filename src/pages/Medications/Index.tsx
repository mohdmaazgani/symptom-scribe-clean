import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import MedicationList from "@/components/medications/MedicationList";
import AddMedicationForm, { AddMedicationFormValues } from "@/components/medications/AddMedicationForm";
import MedicationAdherenceChart from "@/components/medications/MedicationAdherenceChart";
import {
  subscribeUserToPush,
  unsubscribeUserFromPush,
  getNotificationPermissionState,
} from "@/lib/pushNotifications";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Bell, BellOff, Activity, ShieldCheck, ListFilter } from "lucide-react";

export type Medication = Tables<"medications">;
export type MedicationLog = Tables<"medication_log">;

const MedicationsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Check push notification permission on mount
  useEffect(() => {
    async function checkPushStatus() {
      const state = await getNotificationPermissionState();
      setPushEnabled(state === "granted");
    }
    checkPushStatus();
  }, []);

  // Fetch medications & logs from Supabase
  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [medRes, logRes] = await Promise.all([
        supabase
          .from("medications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("medication_log")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_at", { ascending: false }),
      ]);

      if (medRes.error) throw medRes.error;
      if (logRes.error) throw logRes.error;

      setMedications(medRes.data || []);
      setLogs((logRes.data as MedicationLog[]) || []);
    } catch (error) {
      console.error("Error loading medications data:", error);
      toast({
        title: "Error Loading Data",
        description: error instanceof Error ? error.message : "Failed to fetch medications.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle Push Notification Toggle
  const handleTogglePush = async () => {
    if (!user) return;
    if (pushEnabled) {
      const success = await unsubscribeUserFromPush(user.id);
      if (success) {
        setPushEnabled(false);
        toast({ title: "Notifications Disabled", description: "You will no longer receive push reminders." });
      }
    } else {
      const success = await subscribeUserToPush(user.id);
      if (success) {
        setPushEnabled(true);
        toast({ title: "Notifications Enabled", description: "You will receive push notification reminders for due doses." });
      } else {
        toast({
          title: "Permission Denied",
          description: "Could not enable push notifications. Please check browser permissions.",
          variant: "destructive",
        });
      }
    }
  };

  // Add / Edit Medication
  const handleSaveMedication = async (values: AddMedicationFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const timesArray = values.times
        ? values.times.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      if (editingMedication) {
        // Update existing
        const { error } = await supabase
          .from("medications")
          .update({
            name: values.name,
            dosage: values.dosage,
            frequency: values.frequency,
            times: timesArray,
            start_date: values.start_date,
            end_date: values.end_date || null,
            notes: values.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMedication.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast({ title: "Medication Updated", description: `${values.name} has been updated.` });
      } else {
        // Create new
        const { error } = await supabase.from("medications").insert({
          user_id: user.id,
          name: values.name,
          dosage: values.dosage,
          frequency: values.frequency,
          times: timesArray,
          start_date: values.start_date,
          end_date: values.end_date || null,
          notes: values.notes || null,
        });

        if (error) throw error;
        toast({ title: "Medication Added", description: `${values.name} added to schedule.` });
      }

      setIsDialogOpen(false);
      setEditingMedication(null);
      await fetchData();
    } catch (error) {
      console.error("Error saving medication:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save medication details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Medication
  const handleDeleteMedication = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this medication?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("medications")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Medication Deleted", description: "Medication removed from your schedule." });
      await fetchData();
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Could not delete medication.",
        variant: "destructive",
      });
    }
  };

  // Log Dose Status (Taken / Skipped)
  const handleLogDose = async (medicationId: string, status: "taken" | "skipped") => {
    if (!user) return;
    try {
      const scheduledAt = new Date().toISOString();
      const { error } = await supabase.from("medication_log").insert({
        medication_id: medicationId,
        user_id: user.id,
        scheduled_at: scheduledAt,
        status: status,
        logged_at: scheduledAt,
      });

      if (error) throw error;

      toast({
        title: status === "taken" ? "Dose Marked as Taken" : "Dose Marked as Skipped",
        description: `Adherence log recorded for ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      });

      await fetchData();
    } catch (error) {
      console.error("Error logging dose:", error);
      toast({
        title: "Log Failed",
        description: error instanceof Error ? error.message : "Could not record dose adherence status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Pill className="w-7 h-7 text-cyan-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Medications & Adherence</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Manage your daily medications, receive timely push reminders, and track dose adherence over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setEditingMedication(null);
              setIsDialogOpen(true);
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-2 shadow-md shadow-cyan-900/30"
          >
            <Plus className="w-4 h-4" />
            Add Medication
          </Button>
        </div>
      </div>

      {/* Push Notification Control Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${pushEnabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
            {pushEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              Push Notification Reminders
              {pushEnabled && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-normal">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              {pushEnabled
                ? "Push notifications are active. You will receive alert reminders when doses are due."
                : "Enable push notifications to receive automatic reminders directly on your browser or device."}
            </p>
          </div>
        </div>

        <Button
          variant={pushEnabled ? "outline" : "default"}
          size="sm"
          onClick={handleTogglePush}
          className={pushEnabled ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "bg-cyan-600 hover:bg-cyan-500 text-white"}
        >
          {pushEnabled ? "Disable Push" : "Enable Reminders"}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900/80 border border-slate-800 p-1 mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400">
            <ListFilter className="w-4 h-4" />
            <span>Medication Schedule ({medications.length})</span>
          </TabsTrigger>
          <TabsTrigger value="adherence" className="flex items-center gap-2 data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400">
            <Activity className="w-4 h-4" />
            <span>Adherence Visuals</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <MedicationList
            medications={medications}
            isLoading={isLoading}
            onEdit={(med) => {
              setEditingMedication(med);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteMedication}
            onLogDose={handleLogDose}
          />
        </TabsContent>

        <TabsContent value="adherence">
          <MedicationAdherenceChart logs={logs} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400">
              <Pill className="w-5 h-5" />
              {editingMedication ? "Edit Medication" : "Add New Medication"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Configure medication dosage, schedule times, and frequency to start tracking adherence.
            </DialogDescription>
          </DialogHeader>

          <AddMedicationForm
            initialValues={
              editingMedication
                ? {
                    name: editingMedication.name,
                    dosage: editingMedication.dosage,
                    frequency: editingMedication.frequency as AddMedicationFormValues["frequency"],
                    times: editingMedication.times ? editingMedication.times.join(", ") : "",
                    start_date: editingMedication.start_date,
                    end_date: editingMedication.end_date || "",
                    notes: editingMedication.notes || "",
                  }
                : undefined
            }
            onSubmit={handleSaveMedication}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingMedication(null);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicationsPage;
