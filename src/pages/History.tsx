import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, X, Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { showSuccess, showError } from "@/lib/toast-helpers";
import { db, syncOfflineData, encryptSymptom, decryptSymptom } from "@/lib/offline-db";
import { whenKeysReady, generateSearchTokens } from "@/lib/encryption";
import { getCachedData, invalidateCache } from "@/lib/cached-queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SymptomEntry {
  id: string;
  user_id?: string;
  symptoms: string;
  severity_level: string;
  possible_causes: string[];
  recommendations: string[];
  risk_score: number;
  resolved: boolean;
  created_at: string;
}

const History = () => {
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('symptom-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchHistory = useCallback(async (queryText = "") => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const keys = await whenKeysReady();
      const searchTokens = queryText ? await generateSearchTokens(queryText, keys.searchKey) : [];

      if (navigator.onLine) {
        let query = supabase.from("symptom_history").select("*").eq("user_id", user.id);
        
        if (severityFilter !== "all") {
          query = query.eq("severity_level", severityFilter);
        }

        if (searchTokens.length > 0) {
          query = query.contains("search_tokens", searchTokens);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data) {
          if (!queryText && severityFilter === "all") {
            await db.symptomHistory
              .where("user_id")
              .equals(user.id)
              .filter(
                (record) =>
                  record.pending_sync === 0 &&
                  record.pending_delete === 0 &&
                  record.pending_update === 0
              )
              .delete();
          }

          const localEntries = data.map((record) => ({
            id: record.id,
            user_id: record.user_id,
            symptoms: record.symptoms || "",
            severity_level: record.severity_level || "low",
            possible_causes: record.possible_causes,
            recommendations: record.recommendations,
            risk_score: record.risk_score,
            resolved: !!record.resolved,
            created_at: record.created_at || new Date().toISOString(),
            ai_analysis: record.ai_analysis,
            search_tokens: record.search_tokens,
            pending_sync: 0,
            pending_update: 0,
            pending_delete: 0,
          }));

          const encryptedEntries = await Promise.all(
            localEntries.map((entry) => encryptSymptom(entry, keys.encryptionKey, keys.searchKey))
          );

          await db.symptomHistory.bulkPut(encryptedEntries);
        }
      }
    } catch (error) {
      console.warn("Error fetching history from Supabase, falling back to local DB:", error);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const keys = await whenKeysReady();
        const searchTokens = queryText ? await generateSearchTokens(queryText, keys.searchKey) : [];

        let localQuery = db.symptomHistory
          .where("user_id")
          .equals(user.id)
          .filter((record) => record.pending_delete === 0);

        if (severityFilter !== "all") {
          localQuery = localQuery.filter((record) => record.severity_level === severityFilter);
        }

        if (searchTokens.length > 0) {
          localQuery = localQuery.filter((record) =>
            record.search_tokens &&
            searchTokens.every((token) => record.search_tokens!.includes(token))
          );
        }

        const localRecords = await localQuery.toArray();

        const decryptedRecords = await Promise.all(
          localRecords.map((record) => decryptSymptom(record, keys.encryptionKey))
        );

        decryptedRecords.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setHistory(decryptedRecords as unknown as SymptomEntry[]);
      }
    } catch (err) {
      console.error("Error loading local symptoms:", err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const synced = await syncOfflineData();
      if (synced) fetchHistory(debouncedQuery);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [debouncedQuery, fetchHistory]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    fetchHistory(debouncedQuery);
  }, [debouncedQuery, fetchHistory]);

  const toggleResolved = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;

      if (navigator.onLine) {
        const { error } = await supabase
          .from("symptom_history")
          .update({ resolved: newStatus })
          .eq("id", id);

        if (error) throw error;
        await invalidateCache("symptom_history");
        await db.symptomHistory.update(id, { resolved: newStatus, pending_update: 0 });
      } else {
        await db.symptomHistory.update(id, { resolved: newStatus, pending_update: 1 });
      }

      toast({
        title: "Status Updated",
        description: newStatus ? "Marked as resolved" : "Marked as unresolved",
      });

      setHistory((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, resolved: newStatus } : entry))
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      if (navigator.onLine) {
        const { error } = await supabase
          .from("symptom_history")
          .delete()
          .eq("id", id);

        if (error) throw error;
        await invalidateCache("symptom_history");
        await db.symptomHistory.delete(id);
      } else {
        await db.symptomHistory.update(id, { pending_delete: 1 });
      }

      showSuccess("Record deleted", "The symptom history has been permanently removed.");
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Error deleting history:", error);
      showError("Delete failed", "Could not delete this health record.");
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Symptoms", "Severity", "Risk Score", "Resolved"];
    const rows = history.map((entry) => [
      new Date(entry.created_at).toLocaleDateString(),
      `"${entry.symptoms.replace(/"/g, '""')}"`,
      entry.severity_level,
      entry.risk_score,
      entry.resolved ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "symptom-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string): "default" | "secondary" | "destructive" => {
    switch (severity) {
      case "high": return "destructive";
      case "moderate": return "default";
      default: return "secondary";
    }
  };

  // The history state is already filtered by fetchHistory using blind indexes and severity
  const filteredHistory = history;

  const isFiltering = searchQuery.trim() !== "" || severityFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Symptom History</h1>
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/30 px-3 py-1 text-xs font-semibold text-yellow-600 dark:text-yellow-500">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
                Offline Mode
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Review your past health consultations</p>
        </div>
        {history.length > 0 && (
          <Button onClick={exportCSV} variant="outline" size="sm">
            Export CSV
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="symptom-search-input"
            type="text"
            placeholder="Search symptoms... (Ctrl+K to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Severities</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
        </select>
      </div>

      {isFiltering && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { 
              setSearchQuery(""); 
              setSeverityFilter("all"); 
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground">Loading history...</p>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <p className="text-muted-foreground">
              No symptom history yet. Start by consulting with the AI Assistant!
            </p>
          </CardContent>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <p className="text-muted-foreground">
              No results match your search{isFiltering ? " or filter" : ""}. Try adjusting your criteria.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearchQuery(""); setSeverityFilter("all"); }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((entry) => (
            <Card key={entry.id} className={entry.resolved ? "opacity-70" : ""}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg break-words">{entry.symptoms}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Permanently delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Symptom History?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete this health consultation
                            record? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteEntry(entry.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
        </div>
      )}
    </div>
  );
};

export default History;
