import React from "react";
import { AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface Interaction {
  id: string;
  drugA: string;
  drugB: string;
  severity: "severe" | "moderate" | "minor" | "none";
  mechanism: string;
  recommendation: string;
}

interface InteractionAlertsProps {
  interactions: Interaction[];
  medications: Array<{ id: string; name: string }>;
}

const InteractionAlerts: React.FC<InteractionAlertsProps> = ({ interactions, medications }) => {
  if (interactions.length === 0) {
    return (
      <div className="p-6 border rounded-lg bg-green-500/5 border-green-500/20 text-center space-y-3">
        <ShieldCheck className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h3 className="font-semibold text-green-600 text-lg">No Known Interactions</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1">
            No active chemical interactions found between <strong>{medications.map(m => m.name).join(', ')}</strong>.
            Ensure you follow prescribed dosages.
          </p>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "severe":
        return <Badge className="bg-red-500 hover:bg-red-600 text-white font-semibold">Severe Danger</Badge>;
      case "moderate":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-semibold">Moderate Risk</Badge>;
      case "minor":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-dark font-semibold">Mild Warning</Badge>;
      default:
        return <Badge variant="outline">No Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            {interactions.length} Potential Issues Flagged
          </h3>
          <p className="text-xs text-muted-foreground">
            Please review the details below regarding dosage spacing or alternative therapies.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {interactions.map((interaction) => (
          <Card
            key={interaction.id}
            className={`border-l-4 transition-shadow hover:shadow-md ${
              interaction.severity === "severe"
                ? "border-l-red-500 border-red-500/10"
                : interaction.severity === "moderate"
                ? "border-l-amber-500 border-amber-500/10"
                : "border-l-yellow-500 border-yellow-500/10"
            }`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-sm text-foreground">
                  {interaction.drugA} + {interaction.drugB}
                </span>
                {getSeverityBadge(interaction.severity)}
              </div>

              <div className="text-sm text-foreground/80 space-y-1">
                <strong className="text-xs text-muted-foreground block uppercase">Mechanism</strong>
                <p>{interaction.mechanism}</p>
              </div>

              <div className="text-sm bg-muted/40 p-3 rounded border space-y-1">
                <strong className="text-xs text-muted-foreground block uppercase">Clinical Advice</strong>
                <p className="text-foreground/90 font-medium">{interaction.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InteractionAlerts;