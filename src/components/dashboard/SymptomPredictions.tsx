import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { browserEnv } from "@/lib/env";

interface Prediction {
  risk: string;
  confidence: "Low" | "Medium" | "High";
  advice: string;
  rationale: string;
}

interface SymptomPredictionsProps {
  userId: string | null;
  symptoms: string[];
}

export default function SymptomPredictions({ userId, symptoms }: SymptomPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || symptoms.length === 0) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = async () => {
      // 1. Check local storage cache
      const cacheKey = `ai_health_predictions_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      const symptomsHash = symptoms.join("|");

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          // Refresh if cache is > 24 hours OR if symptoms list changed
          if (age < 24 * 60 * 60 * 1000 && parsed.symptomsHash === symptomsHash) {
            setPredictions(parsed.predictions);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached predictions", e);
        }
      }

      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token || browserEnv.supabasePublishableKey;

        const response = await fetch(browserEnv.getSupabaseFunctionUrl("symptom-analyzer"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: "predict",
            symptoms,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch predictions from AI assistant");
        }

        const data = await response.json();
        const preds = data.predictions || [];

        // Save to cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            predictions: preds,
            symptomsHash,
            timestamp: Date.now(),
          })
        );

        setPredictions(preds);
      } catch (err) {
        console.error("Error fetching AI predictions:", err);
        setError(err instanceof Error ? err.message : "Failed to load predictions");
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [userId, symptoms]);

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case "High":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (loading) {
    return (
      <Card className="w-full border border-border/60">
        <CardHeader>
          <div className="h-5 w-44 rounded bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded bg-muted animate-pulse mt-2" />
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-border/60 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" /> AI Health Predictions
        </CardTitle>
        <CardDescription>Proactive health risk predictions analyzed from recent symptom logs</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm font-medium text-destructive">Could not generate predictions</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        ) : symptoms.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 bg-muted/20 border border-dashed rounded-xl">
            <CheckCircle className="w-12 h-12 text-emerald-500/60 mb-2" />
            <h4 className="font-bold text-sm text-foreground">No Active Risk Markers</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
              No recent symptom logs found. Consult with the AI assistant to track symptoms and populate predictions.
            </p>
          </div>
        ) : predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 bg-muted/20 border border-dashed rounded-xl">
            <CheckCircle className="w-12 h-12 text-emerald-500/60 mb-2" />
            <h4 className="font-bold text-sm text-foreground">All Systems Stable</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
              AI analysis of your recent logs shows no elevated health risk patterns. Keep maintaining a healthy routine!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.map((pred, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/10 transition-all duration-300 space-y-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-sm text-foreground">{pred.risk}</h4>
                  <Badge variant="outline" className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(pred.confidence)}`}>
                    {pred.confidence} Confidence
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Analysis: </span>
                  {pred.rationale}
                </p>

                <div className="flex gap-2 items-start p-2.5 rounded-lg bg-primary/5 text-primary text-xs leading-relaxed">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <div>
                    <span className="font-bold">Preventive Action Plan: </span>
                    {pred.advice}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
