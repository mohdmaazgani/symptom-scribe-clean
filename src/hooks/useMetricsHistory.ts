import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useMetricsHistory(userId: string) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false });

    if (!error && data) {
      setRecords(data);
    }

    setLoading(false);
  };
  const deleteRecord = async (id: string) => {
  const { error } = await supabase
    .from("health_metrics")
    .delete()
    .eq("id", id);

  if (!error) {
    fetchHistory();
  }
};

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);
    return {
    records,
    loading,
    refresh: fetchHistory,
    deleteRecord,
    };
}