import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { showSuccess, showError } from "@/lib/toast-helpers";

interface SymptomEntry {
  id: string;
  symptoms: string;
  severity_level: string;
  possible_causes: string[];
  recommendations: string[];
  risk_score: number;
  resolved: boolean;
  created_at: string;
}

const getStorageKey = (userId: string) => `hidden_symptom_entries_${userId}`;

const loadHiddenIds = (userId: string): Set<string> => {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveHiddenIds = (userId: string, ids: Set<string>) => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify([...ids]));
  } catch {}
};

const History = () => {
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      const stored = loadHiddenIds(user.id);
      setHiddenIds(stored);

      const { data, error } = await supabase
        .from("symptom_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleResolved = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("symptom_history")
        .update({ resolved: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: !currentStatus ? "Marked as resolved" : "Marked as unresolved",
      });

      fetchHistory();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const hideEntry = (id: string, symptoms: string) => {
    if (!userId) return;
    const updated = new Set(hiddenIds);
    updated.add(id);
    setHiddenIds(updated);
    saveHiddenIds(userId, updated);
    const label = symptoms.length > 40 ? symptoms.substring(0, 40) + "..." : symptoms;
    showSuccess("Record hidden", `"${label}" removed from your view`);
  };

  const restoreEntry = (id: string) => {
    if (!userId) return;
    const updated = new Set(hiddenIds);
    updated.delete(id);
    setHiddenIds(updated);
    saveHiddenIds(userId, updated);
    showSuccess("Record restored", "Entry is visible again");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "moderate": return "default";
      default: return "secondary";
    }
  };

  const visibleHistory = history.filter((e) => !hiddenIds.has(e.id));
  const hiddenHistory = history.filter((e) => hiddenIds.has(e.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Symptom History</h1>
          <p className="text-muted-foreground">Review your past health consultations</p>
        </div>

        {hiddenHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowHidden((prev) => !prev)}
          >
            <Eye className="w-4 h-4" />
            {showHidden ? "Hide removed" : `Show removed (${hiddenHistory.length})`}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading history...</p>
      ) : visibleHistory.length === 0 && !showHidden ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <p className="text-muted-foreground">
              {history.length === 0
                ? "No symptom history yet. Start by consulting with the AI Assistant!"
                : "All records have been removed from view."}
            </p>
            {hiddenHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowHidden(true)}>
                <Eye className="w-4 h-4 mr-2" />
                Show {hiddenHistory.length} hidden record{hiddenHistory.length > 1 ? "s" : ""}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleHistory.map((entry) => (
            <Card key={entry.id} className={entry.resolved ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg break-words">{entry.symptoms}</CardTitle>
                    <CardDescription>
                      {new Date(entry.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge variant={getSeverityColor(entry.severity_level)}>
                      {entry.severity_level}
                    </Badge>
                    <Button
                      variant={entry.resolved ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleResolved(entry.id, entry.resolved)}
                    >
                      {entry.resolved ? (
                        <><X className="w-4 h-4 mr-1" />Reopen</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-1" />Resolve</>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => hideEntry(entry.id, entry.symptoms)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove from view (record is kept safely, can be restored)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entry.possible_causes && entry.possible_causes.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Possible Causes:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {entry.possible_causes.map((cause, idx) => (
                          <li key={idx}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {entry.recommendations && entry.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold mb-1">Recommendations:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {entry.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {entry.risk_score !== null && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Risk Score:</p>
                      <Badge variant="outline">{entry.risk_score}/100</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {showHidden && hiddenHistory.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-border" />
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {hiddenHistory.length} hidden record{hiddenHistory.length > 1 ? "s" : ""}
                </p>
                <div className="flex-1 h-px bg-border" />
              </div>

              {hiddenHistory.map((entry) => (
                <Card key={entry.id} className="opacity-50 border-dashed">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg line-through text-muted-foreground">
                          {entry.symptoms}
                        </CardTitle>
                        <CardDescription>
                          {new Date(entry.created_at).toLocaleString()} · hidden
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreEntry(entry.id)}
                        className="flex-shrink-0 gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Restore
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default History;