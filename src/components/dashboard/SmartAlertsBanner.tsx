import { useState, useEffect, useCallback } from "react";
import { type SmartAlert, dismissAlert, detectSmartAlerts } from "@/lib/alerts-engine";
import { db, type OfflineMetric, type OfflineSymptom, decryptMetric } from "@/lib/offline-db";
import { whenEncryptionReady } from "@/lib/encryption";
import { AlertCircle, AlertTriangle, Info, X, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartAlertsBannerProps {
  userId: string;
  symptoms: OfflineSymptom[];
}

export function SmartAlertsBanner({ userId, symptoms }: SmartAlertsBannerProps) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const key = await whenEncryptionReady();
      const localMetrics = await db.healthMetrics
        .where("user_id")
        .equals(userId)
        .filter((record) => record.pending_delete === 0)
        .toArray();

      // Decrypt metrics to get numerical values
      const decryptedMetrics = await Promise.all(
        localMetrics.map((record) => decryptMetric(record, key))
      );

      const activeAlerts = detectSmartAlerts(decryptedMetrics, symptoms);
      setAlerts(activeAlerts);
    } catch (err) {
      console.error("Failed to calculate smart alerts:", err);
    }
  }, [userId, symptoms]);

  useEffect(() => {
    if (userId) {
      loadAlerts();
    }
  }, [userId, loadAlerts]);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissAlert(id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    if (expandedAlert === id) {
      setExpandedAlert(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAlert(expandedAlert === id ? null : id);
  };

  if (alerts.length === 0) {
    return (
      <div className="space-y-3 mb-6 select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Smart Health Alerts (0)
          </h3>
        </div>
        <div className="rounded-xl border bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/30 p-4 shadow-sm flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/15">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground leading-none">All Systems Clear</h4>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              No abnormal physiological trends or symptom warnings have been detected.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 select-none">
          <AlertCircle className="w-4 h-4 text-primary animate-pulse" /> Smart Health Alerts ({alerts.length})
        </h3>
      </div>
      <AnimatePresence initial={false}>
        {alerts.map((alert) => {
          const isExpanded = expandedAlert === alert.id;
          const isCritical = alert.type === "critical";
          const isWarning = alert.type === "warning";

          const cardBg = isCritical
            ? "bg-destructive/10 dark:bg-destructive/5 border-destructive/30"
            : isWarning
              ? "bg-orange-500/10 dark:bg-orange-500/5 border-orange-500/30"
              : "bg-primary/10 dark:bg-primary/5 border-primary/30";

          const iconColor = isCritical
            ? "text-destructive"
            : isWarning
              ? "text-orange-500"
              : "text-primary";

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl border ${cardBg} p-4 transition-all duration-300 shadow-sm cursor-pointer select-none`}
              onClick={() => toggleExpand(alert.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-1.5 rounded-lg ${isCritical ? "bg-destructive/15" : isWarning ? "bg-orange-500/15" : "bg-primary/15"} mt-0.5`}>
                    {isCritical ? (
                      <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                    ) : isWarning ? (
                      <AlertTriangle className={`w-5 h-5 ${iconColor}`} />
                    ) : (
                      <Info className={`w-5 h-5 ${iconColor}`} />
                    )}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground leading-none">{alert.title}</h4>
                      {isCritical && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground animate-pulse">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    className="p-1 rounded-md hover:bg-muted-foreground/10 text-muted-foreground/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(alert.id);
                    }}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    className="p-1 rounded-md hover:bg-muted-foreground/10 text-muted-foreground/80 transition-colors"
                    onClick={(e) => handleDismiss(alert.id, e)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3 pl-11 border-t pt-3 border-border/40"
                  >
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Action Plan:</h5>
                      <p className="text-xs font-medium text-foreground leading-relaxed">
                        {alert.actionPlan}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
