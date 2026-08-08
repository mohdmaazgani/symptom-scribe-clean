import React from "react";
import { useTranslation } from "react-i18next";
import { User, Activity, AlertCircle, ChevronRight, Heart, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HumanBodySVG from "./components/HumanBodySVG";
import useBodyMap from "./hooks/useBodyMap";

const BodyMap: React.FC = () => {
  const { t } = useTranslation();
  const {
    activeRegion,
    handleRegionSelect,
    isFront,
    setIsFront,
    regionSymptoms,
    clearSelection,
  } = useBodyMap();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-8 w-8 text-indigo-500" />
            {t("sidebar.items.bodyMap", "Anatomy Symptom Visualizer")}
          </h1>
          <p className="text-muted-foreground mt-1">
            Click on the anatomical map to explore region-specific conditions and log symptoms.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsFront(prev => !prev)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Show {isFront ? "Back View" : "Front View"}
          </Button>
          {activeRegion && (
            <Button variant="ghost" onClick={clearSelection}>
              Reset Map
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex justify-center bg-slate-950/20 rounded-2xl p-8 border">
          <div className="w-full max-w-[280px]">
            <HumanBodySVG
              activeRegion={activeRegion}
              isFront={isFront}
              onRegionSelect={handleRegionSelect}
            />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {activeRegion ? (
            <Card className="border-indigo-500/20">
              <CardHeader className="bg-indigo-500/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl capitalize text-indigo-400">
                      {activeRegion.replace("-", " ")} Region
                    </CardTitle>
                    <CardDescription>
                      Clinical checklist for signs and typical causes in this area.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                    {isFront ? "Anterior View" : "Posterior View"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                    Common Associated Symptoms
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {regionSymptoms.symptoms.map((symptom, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:border-indigo-500/20 hover:bg-indigo-500/5 transition-all"
                      >
                        <Activity className="h-4 w-4 text-indigo-500" />
                        <span className="text-sm font-medium">{symptom}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                    Possible Causes & Information
                  </h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {regionSymptoms.description}
                  </p>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-xs text-amber-500/80">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">When to Seek Immediate Care:</span>
                    {regionSymptoms.emergencyWarning}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                    Log Symptoms for this Region
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[350px] border-dashed border-2">
              <Heart className="h-16 w-16 text-indigo-500/30 animate-pulse mb-4" />
              <h3 className="font-semibold text-xl">Interactive Anatomy Visualizer</h3>
              <p className="text-muted-foreground text-sm max-w-md mt-2">
                Click on the biological areas on the left model (such as Head, Chest, Abdomen, or Limbs) to see a diagnostic symptom directory.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BodyMap;