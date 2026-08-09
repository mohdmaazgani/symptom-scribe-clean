import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck, Stethoscope, Calendar, MapPin, FileText, Upload, CheckCircle2, Link as LinkIcon } from "lucide-react";

export type SymptomHistoryOption = Tables<"symptom_history">;

export const addAppointmentSchema = z.object({
  doctor_name: z.string().min(1, "Healthcare provider name is required"),
  specialty: z.string().min(1, "Specialty is required (e.g. Cardiology, Primary Care)"),
  appointment_date: z.string().min(1, "Appointment date and time are required"),
  location: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["upcoming", "completed", "cancelled"]).default("upcoming"),
  symptom_history_id: z.string().optional(),
});

export type AddAppointmentFormValues = z.infer<typeof addAppointmentSchema>;

interface AddAppointmentFormProps {
  initialValues?: Partial<AddAppointmentFormValues> & { file_name?: string | null };
  symptomHistoryOptions?: SymptomHistoryOption[];
  onSubmit: (values: AddAppointmentFormValues, selectedFile: File | null) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const AddAppointmentForm: React.FC<AddAppointmentFormProps> = ({
  initialValues,
  symptomHistoryOptions = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Format default appointment date string for datetime-local input (YYYY-MM-DDTHH:mm)
  const defaultDateStr = initialValues?.appointment_date
    ? new Date(initialValues.appointment_date).toISOString().slice(0, 16)
    : new Date(Date.now() + 86400000).toISOString().slice(0, 16);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddAppointmentFormValues>({
    resolver: zodResolver(addAppointmentSchema),
    defaultValues: {
      doctor_name: initialValues?.doctor_name || "",
      specialty: initialValues?.specialty || "",
      appointment_date: defaultDateStr,
      location: initialValues?.location || "",
      notes: initialValues?.notes || "",
      status: initialValues?.status || "upcoming",
      symptom_history_id: initialValues?.symptom_history_id || "",
    },
  });

  const selectedStatus = watch("status");
  const selectedSymptomId = watch("symptom_history_id");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = async (data: AddAppointmentFormValues) => {
    await onSubmit(data, selectedFile);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="doctor_name" className="flex items-center gap-1.5 text-sm font-semibold">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            Doctor / Provider Name *
          </Label>
          <Input
            id="doctor_name"
            placeholder="e.g. Dr. Sarah Jenkins"
            {...register("doctor_name")}
            className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
          />
          {errors.doctor_name && <p className="text-xs text-rose-400">{errors.doctor_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialty" className="flex items-center gap-1.5 text-sm font-semibold">
            <Stethoscope className="w-4 h-4 text-cyan-400" />
            Specialty *
          </Label>
          <Input
            id="specialty"
            placeholder="e.g. General Practice, Cardiology, Neurology"
            {...register("specialty")}
            className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
          />
          {errors.specialty && <p className="text-xs text-rose-400">{errors.specialty.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appointment_date" className="flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Date & Time *
          </Label>
          <Input
            id="appointment_date"
            type="datetime-local"
            {...register("appointment_date")}
            className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
          />
          {errors.appointment_date && <p className="text-xs text-rose-400">{errors.appointment_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="flex items-center gap-1.5 text-sm font-semibold">
            Appointment Status
          </Label>
          <Select
            value={selectedStatus}
            onValueChange={(val: AddAppointmentFormValues["status"]) => setValue("status", val)}
          >
            <SelectTrigger className="bg-slate-900/60 border-slate-800 focus:border-cyan-500">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-1.5 text-sm font-semibold">
          <MapPin className="w-4 h-4 text-cyan-400" />
          Location / Clinic Address
        </Label>
        <Input
          id="location"
          placeholder="e.g. City Health Clinic, Room 302 or Telehealth Link"
          {...register("location")}
          className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
        />
      </div>

      {/* Link to Symptom History */}
      {symptomHistoryOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="symptom_history_id" className="flex items-center gap-1.5 text-sm font-semibold">
            <LinkIcon className="w-4 h-4 text-cyan-400" />
            Link Symptom Checkup Entry (Optional)
          </Label>
          <Select
            value={selectedSymptomId || "none"}
            onValueChange={(val) => setValue("symptom_history_id", val === "none" ? "" : val)}
          >
            <SelectTrigger className="bg-slate-900/60 border-slate-800 focus:border-cyan-500">
              <SelectValue placeholder="Select a past symptom entry" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 max-h-56">
              <SelectItem value="none">None</SelectItem>
              {symptomHistoryOptions.map((sym) => (
                <SelectItem key={sym.id} value={sym.id}>
                  {new Date(sym.created_at || "").toLocaleDateString()}: {sym.symptoms.slice(0, 45)}... ({sym.severity_level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Attach Document File */}
      <div className="space-y-2">
        <Label htmlFor="file_upload" className="flex items-center gap-1.5 text-sm font-semibold">
          <Upload className="w-4 h-4 text-cyan-400" />
          Attach Medical Document / Lab Result (Optional)
        </Label>
        <Input
          id="file_upload"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleFileChange}
          className="bg-slate-900/60 border-slate-800 focus:border-cyan-500 text-xs text-slate-300"
        />
        {initialValues?.file_name && !selectedFile && (
          <p className="text-xs text-cyan-400">Attached file: {initialValues.file_name}</p>
        )}
        {selectedFile && (
          <p className="text-xs text-emerald-400">Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-1.5 text-sm font-semibold">
          <FileText className="w-4 h-4 text-cyan-400" />
          Notes / Prep Instructions
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g. Fasting required for blood work; bring previous prescription list."
          {...register("notes")}
          className="bg-slate-900/60 border-slate-800 focus:border-cyan-500 min-h-[70px]"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? "Saving..." : initialValues?.doctor_name ? "Update Appointment" : "Add Appointment"}
        </Button>
      </div>
    </form>
  );
};

export default AddAppointmentForm;
