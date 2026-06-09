import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db, type OfflineMetric } from "@/lib/offline-db";

export function useMetricsHistory(userId: string) {
  const [records, setRecords] = useState<OfflineMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);

    if (navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from("health_metrics")
          .select("*")
          .eq("user_id", userId)
          .order("recorded_at", { ascending: false });

        if (!error && data) {
          // Sync with local Dexie store
          // First, delete non-pending records in Dexie to avoid stales
          await db.healthMetrics
            .where("user_id")
            .equals(userId)
            .filter((record) => record.pending_sync === 0 && record.pending_delete === 0)
            .delete();

          // Bulk add the new ones
          const localEntries = data.map((record) => ({
            id: record.id,
            user_id: record.user_id,
            metric_type: record.metric_type,
            value: record.value,
            notes: record.notes,
            recorded_at: record.recorded_at || new Date().toISOString(),
            pending_sync: 0,
            pending_delete: 0,
          }));
          
          await db.healthMetrics.bulkPut(localEntries);
        }
      } catch (err) {
        console.warn("Failed to fetch from Supabase, falling back to local DB:", err);
      }
    }

    // Load from local Dexie database for the UI (both online & offline)
    // This merges newly added offline records (pending_sync = 1) and excludes deleted offline ones
    try {
      const localRecords = await db.healthMetrics
        .where("user_id")
        .equals(userId)
        .filter((record) => record.pending_delete === 0)
        .toArray();

      // Sort by recorded_at desc
      localRecords.sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      setRecords(localRecords);
    } catch (err) {
      console.error("Error loading local metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (navigator.onLine) {
      const { error } = await supabase
        .from("health_metrics")
        .delete()
        .eq("id", id);

      if (!error) {
        await db.healthMetrics.delete(id);
        fetchHistory();
        return;
      }
    }

    // Offline or failed request: mark as pending delete
    await db.healthMetrics.update(id, { pending_delete: 1 });
    // Update local UI immediately
    setRecords((prev) => prev.filter((r) => r.id !== id));
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