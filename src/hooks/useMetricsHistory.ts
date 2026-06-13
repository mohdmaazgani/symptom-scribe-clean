import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db, type OfflineMetric, encryptMetric, decryptMetric } from "@/lib/offline-db";
import { whenEncryptionReady } from "@/lib/encryption";


export function useMetricsHistory(userId: string | null) {
  const [records, setRecords] = useState<OfflineMetric[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    // never query with an empty/null userId.
    if (!userId) return;

    setLoading(true);

    try {
      const key = await whenEncryptionReady();

      if (navigator.onLine) {
        try {
          const { data, error } = await supabase
            .from("health_metrics")
            .select("*")
            .eq("user_id", userId)
            .order("recorded_at", { ascending: false });

          if (!error && data) {
            await db.healthMetrics
              .where("user_id")
              .equals(userId)
              .filter((record) => record.pending_sync === 0 && record.pending_delete === 0)
              .delete();

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

            const encryptedEntries = await Promise.all(
              localEntries.map((entry) => encryptMetric(entry, key))
            );

            await db.healthMetrics.bulkPut(encryptedEntries);
          }
        } catch (err) {
          console.warn("Failed to fetch from Supabase, falling back to local DB:", err);
        }
      }

      const localRecords = await db.healthMetrics
        .where("user_id")
        .equals(userId)
        .filter((record) => record.pending_delete === 0)
        .toArray();

      const decryptedRecords = await Promise.all(
        localRecords.map((record) => decryptMetric(record, key))
      );

      decryptedRecords.sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      setRecords(decryptedRecords);
    } catch (err) {
      console.error("Error loading local metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

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

    await db.healthMetrics.update(id, { pending_delete: 1 });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => {
    // Only fire when userId is a real non-empty string.
    if (userId) {
      fetchHistory();
    }
  }, [userId, fetchHistory]);

  return {
    records,
    //  Still "loading" if userId hasn't resolved yet.
    loading: loading || !userId,
    refresh: fetchHistory,
    deleteRecord,
  };
}
