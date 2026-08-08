import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Plus, RefreshCw, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AllergyRiskGauge from "./components/AllergyRiskGauge";
import useAllergyAnalysis from "./hooks/useAllergyAnalysis";

const AllergyTracker: React.FC = () => {
  const { t } = useTranslation();
  const [allergen, setAllergen] = useState("Tree Pollen");
  const [severity, setSeverity] = useState("mild");

  const {
    allergyLogs,
    riskRating,
    riskAdvice,
    handleAddLog,
    clearLogs,
  } = useAllergyAnalysis();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
            {t("sidebar.items.allergyTracker", "Allergy Trigger Tracker")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Evaluate your allergen exposure history to calculate a customized environmental risk score.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Allergen Risk Index</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center p-6 space-y-4">
              <AllergyRiskGauge rating={riskRating} />
              
              <div className="text-center space-y-1">
                <span className="text-2xl font-bold block text-foreground capitalize">{riskRating} Risk</span>
                <p className="text-xs text-muted-foreground leading-relaxed px-4">{riskAdvice}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log Reaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Substance / Allergen</label>
                <select
                  value={allergen}
                  onChange={(e) => setAllergen(e.target.value)}
                  className="w-full p-2 bg-background border rounded"
                >
                  <option value="Tree Pollen">Tree Pollen</option>
                  <option value="Grass Pollen">Grass Pollen</option>
                  <option value="Pet Dander">Pet Dander</option>
                  <option value="Dust Mites">Dust Mites</option>
                  <option value="Mold Spores">Mold Spores</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Severity</label>
                <div className="grid grid-cols-3 gap-2">
                  {["mild", "moderate", "severe"].map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={severity === s ? "default" : "outline"}
                      onClick={() => setSeverity(s)}
                      className="w-full text-xs capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleAddLog(allergen, severity)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              >
                Log Reaction Entry
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Logged Reactions</CardTitle>
                <CardDescription>Historical logs of recent allergic flare-ups.</CardDescription>
              </div>
              {allergyLogs.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearLogs} className="text-rose-500">
                  Reset logs
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {allergyLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12 border border-dashed rounded-lg">
                  No reactions logged recently. Keep a diary above to monitor allergen risk.
                </p>
              ) : (
                <div className="space-y-3">
                  {allergyLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background hover:border-rose-500/20 transition-all"
                    >
                      <div>
                        <span className="font-semibold text-sm block">{log.allergen}</span>
                        <span className="text-[10px] text-muted-foreground">{log.timestamp}</span>
                      </div>
                      <Badge
                        className={
                          log.severity === "severe"
                            ? "bg-red-500"
                            : log.severity === "moderate"
                            ? "bg-amber-500"
                            : "bg-yellow-500 text-dark"
                        }
                      >
                        {log.severity}
                      </Badge>
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

export default AllergyTracker;