import { supabase } from "@/integrations/supabase/client";

export interface CaregiverAlertPayload {
  id: string;
  patientId: string;
  decryptedSymptom: string;
  severity: string;
  timestamp: string;
}

export function subscribeToCaregiverAlerts(
  caregiverId: string,
  onAlertReceived: (alert: CaregiverAlertPayload) => void,
  onStatusChange?: (status: string) => void
) {
  const channel = supabase
    .channel(`caregiver_alerts:${caregiverId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "symptom_history",
      },
      (payload) => {
        const newRecord = payload.new;
        if (newRecord) {
          const alert: CaregiverAlertPayload = {
            id: newRecord.id,
            patientId: newRecord.user_id,
            decryptedSymptom: newRecord.symptoms || "High Severity Alert Logged",
            severity: newRecord.severity_level || "High",
            timestamp: newRecord.created_at || new Date().toISOString(),
          };
          onAlertReceived(alert);
        }
      }
    )
    .subscribe((status) => {
      onStatusChange?.(status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
