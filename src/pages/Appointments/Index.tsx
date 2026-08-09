import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import AppointmentList from "@/components/appointments/AppointmentList";
import AddAppointmentForm, { AddAppointmentFormValues } from "@/components/appointments/AddAppointmentForm";
import { uploadAppointmentDocument } from "@/lib/appointmentStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Clock, CheckCircle2, FileText, CalendarCheck, Stethoscope } from "lucide-react";

export type Appointment = Tables<"appointments">;
export type SymptomHistory = Tables<"symptom_history">;

const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [symptomHistoryOptions, setSymptomHistoryOptions] = useState<SymptomHistory[]>([]);
  const [symptomMap, setSymptomMap] = useState<Record<string, SymptomHistory>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch appointments and symptom history from Supabase
  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [apptRes, symRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("user_id", user.id)
          .order("appointment_date", { ascending: true }),
        supabase
          .from("symptom_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (apptRes.error) throw apptRes.error;
      if (symRes.error) throw symRes.error;

      const apptData = apptRes.data || [];
      const symData = (symRes.data as SymptomHistory[]) || [];

      setAppointments(apptData);
      setSymptomHistoryOptions(symData);

      // Create a map for quick lookup of symptom history items
      const map: Record<string, SymptomHistory> = {};
      symData.forEach((item) => {
        map[item.id] = item;
      });
      setSymptomMap(map);
    } catch (error: any) {
      console.error("Error loading appointments:", error);
      toast({
        title: "Error Loading Appointments",
        description: error.message || "Failed to fetch appointments.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handle Add / Edit Appointment
  const handleSaveAppointment = async (
    values: AddAppointmentFormValues,
    selectedFile: File | null
  ) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      let fileUrl = editingAppointment?.file_url || null;
      let fileName = editingAppointment?.file_name || null;

      // Upload file to Supabase Storage if a new file is attached
      if (selectedFile) {
        const uploadRes = await uploadAppointmentDocument(selectedFile, user.id);
        fileUrl = uploadRes.fileUrl;
        fileName = uploadRes.fileName;
      }

      if (editingAppointment) {
        // Update existing appointment
        const { error } = await supabase
          .from("appointments")
          .update({
            doctor_name: values.doctor_name,
            specialty: values.specialty,
            appointment_date: new Date(values.appointment_date).toISOString(),
            location: values.location || null,
            notes: values.notes || null,
            status: values.status,
            symptom_history_id: values.symptom_history_id || null,
            file_url: fileUrl,
            file_name: fileName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAppointment.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast({
          title: "Appointment Updated",
          description: `Appointment with ${values.doctor_name} updated successfully.`,
        });
      } else {
        // Insert new appointment
        const { error } = await supabase.from("appointments").insert({
          user_id: user.id,
          doctor_name: values.doctor_name,
          specialty: values.specialty,
          appointment_date: new Date(values.appointment_date).toISOString(),
          location: values.location || null,
          notes: values.notes || null,
          status: values.status,
          symptom_history_id: values.symptom_history_id || null,
          file_url: fileUrl,
          file_name: fileName,
        });

        if (error) throw error;
        toast({
          title: "Appointment Scheduled",
          description: `Upcoming visit with ${values.doctor_name} added to your schedule.`,
        });
      }

      setIsDialogOpen(false);
      setEditingAppointment(null);
      await fetchData();
    } catch (error: any) {
      console.error("Error saving appointment:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save appointment details.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Appointment
  const handleDeleteAppointment = async (id: string) => {
    if (!user) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Appointment Deleted", description: "Appointment removed." });
      await fetchData();
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete appointment.",
        variant: "destructive",
      });
    }
  };

  // Update Status Quick Handler
  const handleUpdateStatus = async (
    id: string,
    newStatus: "upcoming" | "completed" | "cancelled"
  ) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      toast({ title: "Status Updated", description: `Appointment marked as ${newStatus}.` });
      await fetchData();
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update status.",
        variant: "destructive",
      });
    }
  };

  // Statistics
  const upcomingCount = appointments.filter((a) => a.status === "upcoming").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
  const attachedFilesCount = appointments.filter((a) => Boolean(a.file_url)).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-cyan-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Appointment Management</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Track upcoming visits with healthcare providers, upload lab results, and receive 24h reminders.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingAppointment(null);
            setIsDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-2 shadow-md shadow-cyan-900/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Appointment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Upcoming Visits</p>
              <h4 className="text-2xl font-bold text-cyan-400 mt-1">{upcomingCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Completed Visits</p>
              <h4 className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Attached Documents</p>
              <h4 className="text-2xl font-bold text-purple-400 mt-1">{attachedFilesCount}</h4>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 border border-slate-800 p-1 mb-6">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-xs sm:text-sm">
            Upcoming ({upcomingCount})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-xs sm:text-sm">
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-xs sm:text-sm">
            Cancelled ({cancelledCount})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-xs sm:text-sm">
            All ({appointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <AppointmentList
            appointments={appointments.filter((a) => a.status === "upcoming")}
            symptomHistoryMap={symptomMap}
            isLoading={isLoading}
            onEdit={(appt) => {
              setEditingAppointment(appt);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteAppointment}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        <TabsContent value="completed">
          <AppointmentList
            appointments={appointments.filter((a) => a.status === "completed")}
            symptomHistoryMap={symptomMap}
            isLoading={isLoading}
            onEdit={(appt) => {
              setEditingAppointment(appt);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteAppointment}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <AppointmentList
            appointments={appointments.filter((a) => a.status === "cancelled")}
            symptomHistoryMap={symptomMap}
            isLoading={isLoading}
            onEdit={(appt) => {
              setEditingAppointment(appt);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteAppointment}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>

        <TabsContent value="all">
          <AppointmentList
            appointments={appointments}
            symptomHistoryMap={symptomMap}
            isLoading={isLoading}
            onEdit={(appt) => {
              setEditingAppointment(appt);
              setIsDialogOpen(true);
            }}
            onDelete={handleDeleteAppointment}
            onUpdateStatus={handleUpdateStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Add / Edit Appointment Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-400">
              <Stethoscope className="w-5 h-5" />
              {editingAppointment ? "Edit Appointment" : "Schedule New Appointment"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Enter healthcare provider details, select date/time, and attach any relevant lab results.
            </DialogDescription>
          </DialogHeader>

          <AddAppointmentForm
            initialValues={
              editingAppointment
                ? {
                    doctor_name: editingAppointment.doctor_name,
                    specialty: editingAppointment.specialty,
                    appointment_date: editingAppointment.appointment_date,
                    location: editingAppointment.location || "",
                    notes: editingAppointment.notes || "",
                    status: editingAppointment.status as any,
                    symptom_history_id: editingAppointment.symptom_history_id || "",
                    file_name: editingAppointment.file_name,
                  }
                : undefined
            }
            symptomHistoryOptions={symptomHistoryOptions}
            onSubmit={handleSaveAppointment}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingAppointment(null);
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentsPage;
