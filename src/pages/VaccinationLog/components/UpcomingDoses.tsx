import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

interface VaccinationEntry {
  id: string;
  vaccineName: string;
  dateAdministered: string;
  doseNumber: string;
  nextDueDate: string;
  provider: string;
}

const UpcomingDoses: React.FC<{ entries: VaccinationEntry[] }> = ({ entries }) => {
  const upcoming = entries
    .filter((e) => e.nextDueDate)
    .map((e) => ({ ...e, daysUntil: Math.ceil((new Date(e.nextDueDate).getTime() - Date.now()) / 86400000) }))
    .filter((e) => e.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (upcoming.length === 0) return null;

  return (
    <Card className="border-teal-500/20 bg-teal-500/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-teal-500" /> Upcoming Doses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.slice(0, 3).map(({ id, vaccineName, doseNumber, nextDueDate, daysUntil }) => (
          <div key={id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div>
              <span className="font-medium text-sm">{vaccineName}</span>
              <p className="text-xs text-muted-foreground">Dose {doseNumber} — {nextDueDate}</p>
            </div>
            <Badge className={daysUntil <= 7 ? "bg-red-500 text-white" : daysUntil <= 30 ? "bg-amber-500 text-white" : "bg-teal-500 text-white"}>
              {daysUntil === 0 ? "Today" : `${daysUntil}d`}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingDoses;
