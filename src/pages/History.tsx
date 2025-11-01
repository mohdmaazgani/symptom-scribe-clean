import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const History = () => {
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "moderate":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Symptom History</h1>
        <p className="text-muted-foreground">Review your past health consultations</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground">Loading history...</p>
      ) : history.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              No symptom history yet. Start by consulting with the AI Assistant!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{entry.symptoms}</CardTitle>
                    <CardDescription>
                      {new Date(entry.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(entry.severity_level)}>
                      {entry.severity_level}
                    </Badge>
                    <Button
                      variant={entry.resolved ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleResolved(entry.id, entry.resolved)}
                    >
                      {entry.resolved ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Reopen
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </>
                      )}
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
