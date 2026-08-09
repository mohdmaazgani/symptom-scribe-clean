import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Clock, Calendar, Pill, FileText, CheckCircle2 } from "lucide-react";

export const addMedicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required (e.g. 500mg, 1 tablet)"),
  frequency: z.enum(["daily", "twice_daily", "three_times_daily", "weekly", "as_needed"]),
  times: z.string().optional(), // Comma-separated HH:MM times, e.g., "08:00, 20:00"
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

export type AddMedicationFormValues = z.infer<typeof addMedicationSchema>;

interface AddMedicationFormProps {
  initialValues?: Partial<AddMedicationFormValues>;
  onSubmit: (values: AddMedicationFormValues) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export const AddMedicationForm: React.FC<AddMedicationFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const defaultStartDate = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMedicationFormValues>({
    resolver: zodResolver(addMedicationSchema),
    defaultValues: {
      name: initialValues?.name || "",
      dosage: initialValues?.dosage || "",
      frequency: initialValues?.frequency || "daily",
      times: initialValues?.times || "08:00",
      start_date: initialValues?.start_date || defaultStartDate,
      end_date: initialValues?.end_date || "",
      notes: initialValues?.notes || "",
    },
  });

  const selectedFrequency = watch("frequency");

  const handleFormSubmit = async (data: AddMedicationFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1.5 text-sm font-semibold">
          <Pill className="w-4 h-4 text-cyan-400" />
          Medication Name *
        </Label>
        <Input
          id="name"
          placeholder="e.g. Amoxicillin, Lisinopril, Vitamin D3"
          {...register("name")}
          className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
        />
        {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dosage" className="flex items-center gap-1.5 text-sm font-semibold">
            Dosage *
          </Label>
          <Input
            id="dosage"
            placeholder="e.g. 500mg, 1 tablet, 10ml"
            {...register("dosage")}
            className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
          />
          {errors.dosage && <p className="text-xs text-rose-400">{errors.dosage.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency" className="flex items-center gap-1.5 text-sm font-semibold">
            Frequency *
          </Label>
          <Select
            value={selectedFrequency}
            onValueChange={(val: AddMedicationFormValues["frequency"]) => setValue("frequency", val)}
          >
            <SelectTrigger className="bg-slate-900/60 border-slate-800 focus:border-cyan-500">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
              <SelectItem value="daily">Once Daily</SelectItem>
              <SelectItem value="twice_daily">Twice Daily</SelectItem>
              <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="as_needed">As Needed (PRN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="times" className="flex items-center gap-1.5 text-sm font-semibold">
          <Clock className="w-4 h-4 text-cyan-400" />
          Scheduled Times (HH:MM format, comma separated)
        </Label>
        <Input
          id="times"
          placeholder="e.g. 08:00, 20:00"
          {...register("times")}
          className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
        />
        <p className="text-[11px] text-slate-400">
          Used to trigger push notification reminders at specific times of the day.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Start Date *
          </Label>
          <Input
            id="start_date"
            type="date"
            {...register("start_date")}
            className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
          />
          {errors.start_date && <p className="text-xs text-rose-400">{errors.start_date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="flex items-center gap-1.5 text-sm font-semibold">
            <Calendar className="w-4 h-4 text-cyan-400" />
            End Date (Optional)
          </Label>
          <Input
            id="end_date"
            type="date"
            {...register("end_date")}
            className="bg-slate-900/60 border-slate-800 focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="flex items-center gap-1.5 text-sm font-semibold">
          <FileText className="w-4 h-4 text-cyan-400" />
          Notes / Instructions
        </Label>
        <Textarea
          id="notes"
          placeholder="e.g. Take with food or a full glass of water."
          {...register("notes")}
          className="bg-slate-900/60 border-slate-800 focus:border-cyan-500 min-h-[80px]"
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
          {isSubmitting ? "Saving..." : initialValues?.name ? "Update Medication" : "Add Medication"}
        </Button>
      </div>
    </form>
  );
};

export default AddMedicationForm;
