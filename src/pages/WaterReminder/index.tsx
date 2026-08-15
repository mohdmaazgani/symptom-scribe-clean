import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { GlassWater, Plus, Trash2, BarChart2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WaterSummary from "./components/WaterSummary";
import useWaterReminder from "./hooks/useWaterReminder";

const WaterReminder: React.FC = () => {
  const { t } = useTranslation();
  const hook = useWaterReminder();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <GlassWater className="h-8 w-8 text-sky-500" />
          {t("sidebar.items.waterReminder", "Water Reminder")}
        </h1>
        <p className="text-muted-foreground mt-1">Log your water intake throughout the day and work towards your daily hydration goal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Log New Entry</CardTitle>
              <CardDescription>Record your water reminder data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Amount Consumed (ml)</label>
                <Input
                  value={hook.inputValue}
                  onChange={(e) => hook.setInputValue(e.target.value)}
                  placeholder="e.g. 250"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Notes (optional)</label>
                <textarea
                  value={hook.notes}
                  onChange={(e) => hook.setNotes(e.target.value)}
                  placeholder="Any relevant notes..."
                  className="w-full min-h-[80px] p-3 bg-background border rounded-md text-sm resize-none focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <Button
                onClick={hook.addEntry}
                disabled={!hook.inputValue}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" /> Log Water Intake
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <WaterSummary entries={hook.entries} />
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" /> Intake History
                </CardTitle>
                <Badge variant="secondary">{hook.entries.length} entries</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {hook.entries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  <GlassWater className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm">No entries yet. Start logging above.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {hook.entries.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between p-3 border rounded-lg hover:border-sky-500/20 transition-all bg-background">
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

export default WaterReminder;
