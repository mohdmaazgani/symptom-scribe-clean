import React from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, Plus, Trash2, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import UpcomingDoses from "./components/UpcomingDoses";
import useVaccinationLog from "./hooks/useVaccinationLog";

const VaccinationLog: React.FC = () => {
  const { t } = useTranslation();
  const {
    vaccineName, setVaccineName, dateAdministered, setDateAdministered,
    doseNumber, setDoseNumber, nextDueDate, setNextDueDate,
    provider, setProvider, entries, addEntry, removeEntry,
  } = useVaccinationLog();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldAlert className="h-8 w-8 text-teal-500" />
          {t("sidebar.items.vaccinationLog", "Vaccination Log")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Maintain a complete immunization history and get reminded about upcoming booster doses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Vaccination Record</CardTitle>
              <CardDescription>Log a received vaccine dose</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Vaccine Name</label>
                <Input value={vaccineName} onChange={(e) => setVaccineName(e.target.value)} placeholder="e.g. COVID-19, Influenza, MMR" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Date Administered</label>
                <Input type="date" value={dateAdministered} onChange={(e) => setDateAdministered(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Dose Number</label>
                <div className="flex gap-2">
                  {[1, 2, 3, "Booster"].map((d) => (
                    <button
                      key={String(d)}
                      type="button"
                      onClick={() => setDoseNumber(String(d))}
                      className={`flex-1 py-1.5 text-xs rounded border font-medium transition-colors ${doseNumber === String(d) ? "bg-teal-500 text-white border-teal-500" : "bg-background border-border hover:border-teal-500/50"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Healthcare Provider</label>
                <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="Clinic or hospital name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Next Dose Due</label>
                <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
              </div>
              <Button
                onClick={addEntry}
                disabled={!vaccineName || !dateAdministered}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Vaccination Record
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <UpcomingDoses entries={entries} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Immunization History</CardTitle>
                <Badge className="bg-teal-500/10 text-teal-600">{entries.length} vaccines</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-sm">No vaccination records yet. Add your first above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.slice().reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-teal-500/20 transition-all bg-background">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{entry.vaccineName}</span>
                          <Badge variant="outline" className="text-xs">Dose {entry.doseNumber}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{entry.dateAdministered}</span>
                          {entry.provider && <span>{entry.provider}</span>}
                          {entry.nextDueDate && <span className="text-teal-600 font-medium">Next: {entry.nextDueDate}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeEntry(entry.id)} className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
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

export default VaccinationLog;
