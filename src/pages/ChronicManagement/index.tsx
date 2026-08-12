import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, Plus, RefreshCw, Heart, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LogGauges from "./components/LogGauges";
import useChronicLogs from "./hooks/useChronicLogs";

const ChronicManagement: React.FC = () => {
  const { t } = useTranslation();
  const [valType, setValType] = useState<"glucose" | "systolic">("glucose");
  const [valAmount, setValAmount] = useState("110");
  
  const {
    logs,
    averageGlucose,
    averageBp,
    handleLogItem,
    clearLogs,
  } = useChronicLogs();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Heart className="h-8 w-8 text-rose-500 animate-pulse" />
            {t("sidebar.items.chronicManagement", "Chronic Condition Management")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track vital chronic indicators like Blood Glucose (mg/dL) and Systolic Blood Pressure (mmHg).
          </p>
        </div>
        {logs.length > 0 && (
          <Button variant="outline" onClick={clearLogs} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset Log Lists
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Vital Ranges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4">
              <LogGauges glucose={averageGlucose} bp={averageBp} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Medical Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Metric Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={valType === "glucose" ? "default" : "outline"}
                    onClick={() => {
                      setValType("glucose");
                      setValAmount("110");
                    }}
                    className="w-full text-xs"
                  >
                    Blood Glucose
                  </Button>
                  <Button
                    type="button"
                    variant={valType === "systolic" ? "default" : "outline"}
                    onClick={() => {
                      setValType("systolic");
                      setValAmount("120");
                    }}
                    className="w-full text-xs"
                  >
                    Systolic Pressure
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Value Amount</label>
                <Input
                  type="number"
                  value={valAmount}
                  onChange={(e) => setValAmount(e.target.value)}
                />
              </div>

              <Button
                onClick={() => handleLogItem(valType, parseInt(valAmount, 10))}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              >
                Save vital sign entry
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Diagnostic Vitals History</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12 border border-dashed rounded-lg">
                  No vital signs recorded today. Log values on the left side.
                </p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-all bg-background"
                    >
                      <div>
                        <span className="font-semibold text-sm capitalize block">{log.type}</span>
                        <span className="text-[10px] text-muted-foreground">{log.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-foreground">{log.value} {log.type === "glucose" ? "mg/dL" : "mmHg"}</span>
                        {log.warning && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Spike
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChronicManagement;