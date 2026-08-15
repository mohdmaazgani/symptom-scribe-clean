import React from "react";
import { useTranslation } from "react-i18next";
import { HeartPulse, Activity, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ZoneGauge from "./components/ZoneGauge";
import useHeartRateMonitor from "./hooks/useHeartRateMonitor";

const HeartRateMonitor: React.FC = () => {
  const { t } = useTranslation();
  const { bpm, setBpm, age, setAge, context, setContext, entries, addReading, removeReading, zone } = useHeartRateMonitor();

  const CONTEXTS = ["Resting", "Light Activity", "Exercise", "Post-workout", "Sleeping"];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <HeartPulse className="h-8 w-8 text-red-500" />
          {t("sidebar.items.heartRateMonitor", "Heart Rate Monitor")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Log your heart rate, identify cardio training zones, and track resting heart rate trends over time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Heart Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">BPM Reading</label>
                <Input type="number" min={30} max={220} value={bpm || ""} onChange={(e) => setBpm(parseInt(e.target.value) || 0)} placeholder="e.g. 72" className="text-2xl h-14 text-center font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Your Age (for zone calc)</label>
                <Input type="number" min={1} max={120} value={age || ""} onChange={(e) => setAge(parseInt(e.target.value) || 0)} placeholder="e.g. 30" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Context / Activity</label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXTS.map((c) => (
                    <button key={c} type="button" onClick={() => setContext(c)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${context === c ? "bg-red-500 text-white border-red-500" : "border-border hover:border-red-500/50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {bpm > 0 && age > 0 && zone && (
                <ZoneGauge bpm={bpm} age={age} zone={zone} />
              )}
              <Button onClick={addReading} disabled={!bpm || !context} className="w-full bg-red-600 hover:bg-red-700 text-white">
                <Plus className="h-4 w-4 mr-1" /> Log Heart Rate
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> Reading History</CardTitle>
                <Badge variant="secondary">{entries.length} readings</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  <HeartPulse className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30 animate-pulse" />
                  <p className="text-sm">No readings yet. Log your first heart rate above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-red-500/20 transition-all bg-background">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className="text-2xl font-extrabold text-red-500">{entry.bpm}</span>
                          <span className="text-xs text-muted-foreground block">BPM</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge style={{ backgroundColor: entry.zone.color }} className="text-white text-xs">{entry.zone.label}</Badge>
                            <span className="text-xs text-muted-foreground">{entry.context}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeReading(entry.id)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default HeartRateMonitor;
