import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { browserEnv } from "@/lib/env";
import { useDebounce } from "@/hooks/useDebounce";

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

/**
 * Idle time before a changed symptom list is sent for analysis. The dashboard
 * can refresh this list several times in a row (initial load, cache hydration,
 * offline sync), and only the final list is worth an edge function call.
 */
const PREDICTION_DEBOUNCE_MS = 800;

export default function SymptomPredictions({ userId, symptoms }: SymptomPredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symptomsHash = useMemo(() => symptoms.join("|"), [symptoms]);
  const debouncedSymptomsHash = useDebounce(symptomsHash, PREDICTION_DEBOUNCE_MS);

  // The effect below is keyed on the debounced hash rather than on the array
  // itself, so a new array carrying the same symptoms never refires it. The ref
  // hands the effect the matching list without widening its dependencies.
  const symptomsRef = useRef(symptoms);
  symptomsRef.current = symptoms;

  // Identifies the request currently in flight, and the one the UI is waiting
  // on, so the same analysis is never fired twice and a response that arrives
  // after the symptom list has moved on is discarded.
  const inFlightRequestRef = useRef<string | null>(null);
  const latestRequestRef = useRef<string | null>(null);

  useEffect(() => {
    const currentSymptoms = symptomsRef.current;
    const requestKey = `${userId}:${debouncedSymptomsHash}`;
    latestRequestRef.current = requestKey;

    if (!userId || currentSymptoms.length === 0) {
      setPredictions([]);
      return;
    }

    // A request for this exact symptom list is already running — reuse it
    // instead of paying for a second identical call.
    if (inFlightRequestRef.current === requestKey) return;

    const isStale = () => latestRequestRef.current !== requestKey;

    const fetchPredictions = async () => {
      // 1. Check local storage cache
      const cacheKey = `ai_health_predictions_${userId}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          // Refresh if cache is > 24 hours OR if symptoms list changed
          if (age < 24 * 60 * 60 * 1000 && parsed.symptomsHash === debouncedSymptomsHash) {
            setPredictions(parsed.predictions);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached predictions", e);
        }
      }

      inFlightRequestRef.current = requestKey;

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
            symptoms: currentSymptoms,
          }),
        });

        // Provide more specific error messages based on response status
        if (!response.ok) {
          let errorMessage = "Failed to fetch predictions from AI assistant";

          if (response.status === 401 || response.status === 403) {
            errorMessage = "Authentication failed. Please log in again.";
          } else if (response.status === 429) {
            errorMessage = "Too many requests. Predictions will refresh shortly.";
          } else if (response.status === 0 || response.type === "opaque" || response.type === "error") {
            errorMessage = "Network error. Please check your connection and try again.";
          } else if (response.status >= 500) {
            errorMessage = "Server error. The AI service is temporarily unavailable. Please try again later.";
          } else {
            // Try to get error details from response body
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // Response body is not JSON, use generic message
            }
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        const preds = data.predictions || [];

        // Save to cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            predictions: preds,
            symptomsHash: debouncedSymptomsHash,
            timestamp: Date.now(),
          })
        );

        if (!isStale()) setPredictions(preds);
      } catch (err) {
        console.error("Error fetching AI predictions:", err);

        // Handle specific error types for better error messages. A response for
        // a symptom list that has since moved on is dropped rather than shown.
        if (!isStale()) {
          if (err instanceof TypeError && err.message.includes("fetch")) {
            setError("Network error. Please check your internet connection and try again.");
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("Failed to load predictions");
          }
        }
      } finally {
        if (inFlightRequestRef.current === requestKey) {
          inFlightRequestRef.current = null;
        }
        if (!isStale()) setLoading(false);
      }
    };

    fetchPredictions();
  }, [userId, debouncedSymptomsHash]);

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
