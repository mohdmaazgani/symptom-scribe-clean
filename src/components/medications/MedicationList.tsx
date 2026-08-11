import React from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, Clock, Calendar, CheckCircle, XCircle, Edit, Trash2, Info } from "lucide-react";

export type Medication = Tables<"medications">;

interface MedicationListProps {
  medications: Medication[];
  isLoading?: boolean;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => Promise<void> | void;
  onLogDose: (medicationId: string, status: "taken" | "skipped") => Promise<void> | void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  medications,
  isLoading = false,
  onEdit,
  onDelete,
  onLogDose,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <Card key={n} className="animate-pulse bg-slate-900/40 border-slate-800 h-28" />
        ))}
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <Card className="bg-slate-900/40 border-slate-800 text-center py-12 px-4">
        <CardContent className="space-y-3 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Pill className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100">No Medications Added</h3>
          <p className="text-sm text-slate-400 max-w-md">
            You haven't added any medications to your schedule yet. Click "Add Medication" above to start tracking your daily doses and adherence.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatFrequencyLabel = (freq: string) => {
    switch (freq) {
      case "daily":
        return "Once Daily";
      case "twice_daily":
        return "Twice Daily";
      case "three_times_daily":
        return "3x Daily";
      case "weekly":
        return "Weekly";
      case "as_needed":
        return "As Needed (PRN)";
      default:
        return freq;
    }
  };

  return (
    <div className="space-y-4">
      {medications.map((med) => (
        <Card
          key={med.id}
          className="bg-slate-900/60 border-slate-800/80 hover:border-slate-700 transition-all duration-200 overflow-hidden"
        >
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center flex-wrap gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Pill className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-100">{med.name}</h3>
                  <Badge variant="outline" className="bg-cyan-950/40 text-cyan-400 border-cyan-500/30 text-xs">
                    {med.dosage}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-950/40 text-purple-400 border-purple-500/30 text-xs">
                    {formatFrequencyLabel(med.frequency)}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 pt-1">
                  {med.times && med.times.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Times: {med.times.join(", ")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Start: {med.start_date} {med.end_date ? `— End: ${med.end_date}` : ""}
                  </span>
                </div>

                {med.notes && (
                  <p className="text-xs text-slate-400 italic flex items-center gap-1 pt-1">
                    <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {med.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLogDose(med.id, "taken")}
                  className="bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/30 text-xs flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Mark Taken
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onLogDose(med.id, "skipped")}
                  className="bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 border-amber-500/30 text-xs flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Mark Skipped
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onEdit(med)}
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 h-8 w-8"
                  title="Edit Medication"
                >
                  <Edit className="w-4 h-4" />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(med.id)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 h-8 w-8"
                  title="Delete Medication"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MedicationList;
