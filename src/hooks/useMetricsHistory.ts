import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db, type OfflineMetric, encryptMetric, decryptMetric } from "@/lib/offline-db";
import { whenEncryptionReady } from "@/lib/encryption";
import { getCachedData, invalidateCache } from "@/lib/cached-queries";

export function useMetricsHistory(userId: string | null) {
  const [records, setRecords] = useState<OfflineMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const fetchHistory = useCallback(async () => {
    if (!userId) return;

    setLoading(true);

    try {
      const key = await whenEncryptionReady();

      if (navigator.onLine) {
        try {
          const { data, error } = await getCachedData<OfflineMetric[]>("health_metrics");

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

      const sortedRecords = [...decryptedRecords];

      if (sortOrder === 'newest') {
        sortedRecords.sort(
          (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        );
      } else {
        sortedRecords.sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
      }

      setRecords(sortedRecords);
    } catch (err) {
      console.error("Error loading local metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, sortOrder]);

  const deleteRecord = async (id: string) => {
    if (navigator.onLine) {
      const { error } = await supabase
        .from("health_metrics")
        .delete()
        .eq("id", id);

      if (!error) {
        await invalidateCache("health_metrics");
        await db.healthMetrics.delete(id);
        fetchHistory();
        return;
      }
    }

    await db.healthMetrics.update(id, { pending_delete: 1 });
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId, fetchHistory]);

  return {
    records,
    loading: loading || !userId,
    refresh: fetchHistory,
    deleteRecord,
    setSortOrder,
    sortOrder,
  };
}
