import React, { useEffect, useState } from "react";
import { subscribeToCaregiverAlerts, type CaregiverAlertPayload } from "./realtime-subscription";
import { ShieldAlert, Activity, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const CaregiverMonitor: React.FC<{ caregiverId: string }> = ({ caregiverId }) => {
  const [alerts, setAlerts] = useState<CaregiverAlertPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCaregiverAlerts(
      caregiverId,
      (newAlert) => {
        setAlerts((prev) => [newAlert, ...prev]);
      },
      (status) => {
        setIsConnected(status === "SUBSCRIBED");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [caregiverId]);

  return (
    <Card className="w-full bg-slate-900 text-slate-100 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          Caregiver Live Co-Monitoring Stream
        </CardTitle>
        <Badge variant={isConnected ? ("default" as const) : ("destructive" as const)} className="animate-pulse">
          {isConnected ? "Live Connected" : "Connecting..."}
        </Badge>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            No active severe symptom alerts from dependent user.
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-start gap-3"
              >
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-300">
                      Severity: {alert.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mt-1">{alert.decryptedSymptom}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
