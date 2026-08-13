import React from "react";
import { useTranslation } from "react-i18next";
import { Activity, MapPin, Clock, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PainMap from "./components/PainMap";
import usePainJournal from "./hooks/usePainJournal";

const PainJournal: React.FC = () => {
  const { t } = useTranslation();
  const {
    entries, intensity, setIntensity, location, setLocation,
    painType, setPainType, duration, setDuration,
    notes, setNotes, addEntry, removeEntry,
  } = usePainJournal();

  const PAIN_TYPES = ["Aching", "Burning", "Stabbing", "Throbbing", "Shooting", "Cramping", "Pressure"];
  const LOCATIONS = ["Head", "Neck", "Chest", "Back", "Abdomen", "Left Arm", "Right Arm", "Left Leg", "Right Leg", "Joints"];
  const intensityColor = intensity <= 3 ? "bg-green-500" : intensity <= 6 ? "bg-amber-500" : "bg-red-500";
  const intensityLabel = intensity <= 3 ? "Mild" : intensity <= 6 ? "Moderate" : "Severe";

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-8 w-8 text-rose-500" />
          {t("sidebar.items.painJournal", "Pain Journal")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Track discomfort patterns, intensity levels, and pain locations to share with your healthcare provider.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log a Pain Entry</CardTitle>
              <CardDescription>Record the details of your current discomfort</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Pain Intensity: <span className="text-foreground font-bold">{intensity}/10 ({intensityLabel})</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min={1} max={10} value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                    className="w-full accent-rose-500"
                    aria-label="Pain intensity slider"
                  />
                  <div className={`h-6 w-6 rounded-full ${intensityColor} flex-shrink-0`} aria-hidden="true" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Barely noticeable</span><span>Unbearable</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Body Location</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        location === loc
                          ? "bg-rose-500 text-white border-rose-500"
                          : "bg-background text-muted-foreground border-border hover:border-rose-500/50"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Pain Type</label>
                <div className="flex flex-wrap gap-2">
                  {PAIN_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPainType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                        painType === type
                          ? "bg-rose-500/10 text-rose-600 border-rose-500"
                          : "bg-background text-muted-foreground border-border hover:border-rose-500/40"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Duration (minutes)</label>
                <Input
                  type="number" min={1} value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                  placeholder="e.g. 30"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any triggers, medications taken, activities..."
                  className="w-full min-h-[80px] p-3 bg-background border rounded-md text-sm resize-none focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <Button
                onClick={addEntry}
                disabled={!location || !painType}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Log Pain Entry
              </Button>
            </CardContent>
          </Card>

          <PainMap entries={entries} />
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pain History</CardTitle>
                  <CardDescription>Your recent pain entries and patterns</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
                  {entries.length} Entries
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center space-y-3 border border-dashed rounded-lg">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm">No pain entries logged yet. Use the form to start tracking.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice().reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between p-4 border rounded-xl hover:border-rose-500/20 transition-all bg-background"
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={entry.intensity >= 7 ? "bg-red-500 text-white" : entry.intensity >= 4 ? "bg-amber-500 text-white" : "bg-green-500 text-white"}>
                            {entry.intensity}/10
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />{entry.location}
                          </span>
                          <span className="text-xs text-muted-foreground">{entry.painType}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />{entry.duration}m
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>
                        )}
                        <span className="text-[10px] text-muted-foreground block">{entry.timestamp}</span>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => removeEntry(entry.id)}
                        className="h-8 w-8 ml-2 flex-shrink-0 hover:text-destructive hover:bg-destructive/10"
                      >
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

export default PainJournal;
