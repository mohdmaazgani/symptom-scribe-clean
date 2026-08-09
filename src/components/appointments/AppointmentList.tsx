import React from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Paperclip,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Stethoscope,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";

export type Appointment = Tables<"appointments">;
export type SymptomHistory = Tables<"symptom_history">;

interface AppointmentListProps {
  appointments: Appointment[];
  symptomHistoryMap?: Record<string, SymptomHistory>;
  isLoading?: boolean;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => Promise<void> | void;
  onUpdateStatus: (id: string, status: "upcoming" | "completed" | "cancelled") => Promise<void> | void;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  symptomHistoryMap = {},
  isLoading = false,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="animate-pulse bg-slate-900/40 border-slate-800 h-32" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="bg-slate-900/40 border-slate-800 text-center py-12 px-4">
        <CardContent className="space-y-3 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">No Appointments Scheduled</h3>
          <p className="text-sm text-slate-400 max-w-md">
            You don't have any appointments listed in this category. Click "Add Appointment" above to schedule a visit with your provider.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: Appointment["status"]) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-cyan-950 text-cyan-400 border-cyan-500/30">Upcoming</Badge>;
      case "completed":
        return <Badge className="bg-emerald-950 text-emerald-400 border-emerald-500/30">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-950 text-rose-400 border-rose-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAppointmentDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const formattedDate = d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { formattedDate, formattedTime };
  };

  return (
    <div className="space-y-4">
      {appointments.map((appt) => {
        const { formattedDate, formattedTime } = formatAppointmentDateTime(appt.appointment_date);
        const linkedSymptom = appt.symptom_history_id ? symptomHistoryMap[appt.symptom_history_id] : null;

        return (
          <Card
            key={appt.id}
            className="bg-slate-900/60 border-slate-800/80 hover:border-slate-700 transition-all duration-200 overflow-hidden"
          >
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100">{appt.doctor_name}</h3>
                    <Badge variant="outline" className="bg-purple-950/40 text-purple-300 border-purple-500/30 text-xs">
                      {appt.specialty}
                    </Badge>
                    {getStatusBadge(appt.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 pt-0.5">
                    <span className="flex items-center gap-1.5 font-medium text-cyan-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formattedTime}
                    </span>
                    {appt.location && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {appt.location}
                      </span>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-slate-400 italic flex items-center gap-1 pt-1">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {appt.notes}
                    </p>
                  )}

                  {/* Linked Symptom Checkup Card */}
                  {linkedSymptom && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                        <LinkIcon className="w-3.5 h-3.5" />
                        Linked Symptom Checkup:
                      </div>
                      <p className="text-slate-300">
                        "{linkedSymptom.symptoms.slice(0, 90)}..." — Risk: <span className="font-semibold text-amber-400">{linkedSymptom.severity_level}</span>
                      </p>
                    </div>
                  )}

                  {/* Attached Document Link */}
                  {appt.file_url && (
                    <div className="pt-1">
                      <a
                        href={appt.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-medium bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-500/20"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        Attached File: {appt.file_name || "View Document"}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {appt.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(appt.id, "completed")}
                      className="bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/30 text-xs flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Completed
                    </Button>
                  )}

                  {appt.status !== "cancelled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(appt.id, "cancelled")}
                      className="bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border-rose-500/30 text-xs flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Visit
                    </Button>
                  )}

                  {appt.status !== "upcoming" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(appt.id, "upcoming")}
                      className="bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 border-cyan-500/30 text-xs flex items-center gap-1"
                    >
                      Re-schedule
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onEdit(appt)}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 h-8 w-8"
                    title="Edit Appointment"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDelete(appt.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8 w-8"
                    title="Delete Appointment"
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
  );
};

export default AppointmentList;
