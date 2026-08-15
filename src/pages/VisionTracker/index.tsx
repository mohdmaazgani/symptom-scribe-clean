import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Plus, Trash2, BarChart2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import VisionSummary from "./components/VisionSummary";
import useVisionTracker from "./hooks/useVisionTracker";

const VisionTracker: React.FC = () => {
  const { t } = useTranslation();
  const hook = useVisionTracker();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Eye className="h-8 w-8 text-violet-500" />
          {t("sidebar.items.visionTracker", "Vision Health")}
        </h1>
        <p className="text-muted-foreground mt-1">Track your visual acuity, screen time, and eye health metrics over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log New Entry</CardTitle>
              <CardDescription>Record your vision health data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Vision Observation</label>
                <Input
                  value={hook.inputValue}
                  onChange={(e) => hook.setInputValue(e.target.value)}
                  placeholder="e.g. 20/20 left eye, 20/25 right eye"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Notes (optional)</label>
                <textarea
                  value={hook.notes}
                  onChange={(e) => hook.setNotes(e.target.value)}
                  placeholder="Any relevant notes..."
                  className="w-full min-h-[80px] p-3 bg-background border rounded-md text-sm resize-none focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>
              <Button
                onClick={hook.addEntry}
                disabled={!hook.inputValue}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" /> Log Vision Entry
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <VisionSummary entries={hook.entries} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" /> Vision History
                </CardTitle>
                <Badge variant="secondary">{hook.entries.length} entries</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {hook.entries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  <Eye className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm">No entries yet. Start logging above.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {hook.entries.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between p-3 border rounded-lg hover:border-violet-500/20 transition-all bg-background">
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-medium text-sm">{entry.value}</p>
                        {entry.notes && <p className="text-xs text-muted-foreground line-clamp-2">{entry.notes}</p>}
                        <span className="text-[10px] text-muted-foreground">{entry.timestamp}</span>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => hook.removeEntry(entry.id)}
                        className="h-8 w-8 flex-shrink-0 ml-2 hover:text-destructive hover:bg-destructive/10"
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

export default VisionTracker;
