import Dexie, { type Table } from "dexie";
import { supabase } from "@/integrations/supabase/client";
import { type Json, type TablesInsert, type TablesUpdate } from "@/integrations/supabase/types";
import {
  encryptText,
  decryptText,
  whenEncryptionReady,
  registerEncryptionHooks,
  getSearchKey,
  generateSearchTokens,
} from "./encryption";
import { invalidateCache } from "@/lib/cached-queries";
import { syncMutex } from "./sync-mutex";

export interface OfflineMetric {
  id: string;
  user_id: string;
  metric_type: string;
  value: Json;
  notes: string | null;
  recorded_at: string;
  pending_sync: number;
  pending_delete: number;
  search_tokens?: string[] | null;
}

export interface OfflineSymptom {
  id: string;
  user_id: string;
  symptoms: string;
  severity_level: string;
  possible_causes: string[] | null;
  recommendations: string[] | null;
  risk_score: number | null;
  resolved: boolean;
  created_at: string;
  pending_sync: number;
  pending_update: number;
  pending_delete: number;
  ai_analysis?: string;
  search_tokens?: string[] | null;
}

export interface MeshAlert {
  id: string;
  sender_id: string;
  sender_name: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  contact_phone: string;
  contact_name: string;
  signature: string;
  publicKeyJwk: JsonWebKey;
  pending_sync: number;
}

class OfflineDatabase extends Dexie {
  healthMetrics!: Table<OfflineMetric>;
  symptomHistory!: Table<OfflineSymptom>;
  pendingEmergencyMesh!: Table<MeshAlert>;

  constructor() {
    super("SymptomScribeOfflineDB");
    this.version(1).stores({
      healthMetrics: "id, user_id, metric_type, recorded_at, pending_sync, pending_delete",
      symptomHistory: "id, user_id, severity_level, created_at, pending_sync, pending_update, pending_delete",
    });
    this.version(2).stores({
      healthMetrics: "id, user_id, metric_type, recorded_at, pending_sync, pending_delete",
      symptomHistory: "id, user_id, severity_level, created_at, pending_sync, pending_update, pending_delete",
      pendingEmergencyMesh: "id, sender_id, timestamp, pending_sync",
    });
  }
}

export const db = new OfflineDatabase();

// Encryption and Decryption Mappers
export async function encryptSymptom(
  record: OfflineSymptom,
  key: CryptoKey,
  searchKey?: CryptoKey | null
): Promise<OfflineSymptom> {
  const encrypted = { ...record };
  const actualSearchKey = searchKey || getSearchKey();

  if (record.symptoms && !record.symptoms.startsWith("enc:str:")) {
    encrypted.symptoms = `enc:str:${await encryptText(record.symptoms, key)}`;
    if (actualSearchKey) {
      encrypted.search_tokens = await generateSearchTokens(record.symptoms, actualSearchKey);
    }
  }
  if (record.ai_analysis && !record.ai_analysis.startsWith("enc:str:")) {
    encrypted.ai_analysis = `enc:str:${await encryptText(record.ai_analysis, key)}`;
  }
  if (
    record.possible_causes &&
    !(record.possible_causes.length === 1 && record.possible_causes[0].startsWith("enc:json:"))
  ) {
    encrypted.possible_causes = [
      `enc:json:${await encryptText(JSON.stringify(record.possible_causes), key)}`,
    ];
  }
  if (
    record.recommendations &&
    !(record.recommendations.length === 1 && record.recommendations[0].startsWith("enc:json:"))
  ) {
    encrypted.recommendations = [
      `enc:json:${await encryptText(JSON.stringify(record.recommendations), key)}`,
    ];
  }
  return encrypted;
}

export async function decryptSymptom(record: OfflineSymptom, key: CryptoKey): Promise<OfflineSymptom> {
  const decrypted = { ...record };
  if (record.symptoms && record.symptoms.startsWith("enc:str:")) {
    const rawEnc = record.symptoms.substring(8);
    decrypted.symptoms = await decryptText(rawEnc, key);
  }
  if (record.ai_analysis && record.ai_analysis.startsWith("enc:str:")) {
    const rawEnc = record.ai_analysis.substring(8);
    decrypted.ai_analysis = await decryptText(rawEnc, key);
  }
  if (
    record.possible_causes &&
    record.possible_causes.length === 1 &&
    record.possible_causes[0].startsWith("enc:json:")
  ) {
    const rawEnc = record.possible_causes[0].substring(9);
    decrypted.possible_causes = JSON.parse(await decryptText(rawEnc, key));
  }
  if (
    record.recommendations &&
    record.recommendations.length === 1 &&
    record.recommendations[0].startsWith("enc:json:")
  ) {
    const rawEnc = record.recommendations[0].substring(9);
    decrypted.recommendations = JSON.parse(await decryptText(rawEnc, key));
  }
  return decrypted;
}

export async function encryptMetric(
  record: OfflineMetric,
  key: CryptoKey,
  searchKey?: CryptoKey | null
): Promise<OfflineMetric> {
  const encrypted = { ...record };
  const actualSearchKey = searchKey || getSearchKey();

  if (record.value && !(typeof record.value === "string" && record.value.startsWith("enc:json:"))) {
    encrypted.value = `enc:json:${await encryptText(JSON.stringify(record.value), key)}` as Json;
  }
  if (record.notes && !record.notes.startsWith("enc:str:")) {
    encrypted.notes = `enc:str:${await encryptText(record.notes, key)}`;
    if (actualSearchKey) {
      encrypted.search_tokens = await generateSearchTokens(record.notes, actualSearchKey);
    }
  }
  return encrypted;
}

export async function decryptMetric(record: OfflineMetric, key: CryptoKey): Promise<OfflineMetric> {
  const decrypted = { ...record };
  if (
    record.value &&
    typeof record.value === "string" &&
    record.value.startsWith("enc:json:")
  ) {
    const rawEnc = record.value.substring(9);
    decrypted.value = JSON.parse(await decryptText(rawEnc, key));
  }
  if (record.notes && record.notes.startsWith("enc:str:")) {
    const rawEnc = record.notes.substring(8);
    decrypted.notes = await decryptText(rawEnc, key);
  }
  return decrypted;
}

/**
 * Re-encrypts the user's server-side rows after a key rotation so that data
 * stored in Supabase (which only ever contains ciphertext) stays decryptable
 * under the new key (issue #999).
 *
 * Each row is decrypted with the old key and re-encrypted with the new key;
 * rows that cannot be decrypted (e.g. created under a key this device never
 * had) are skipped and logged instead of aborting the whole rotation. After
 * the pass, the Redis-backed read caches for both tables are invalidated so
 * callers do not keep serving old-key ciphertext.
 */
async function reEncryptServerData(
  oldKey: CryptoKey,
  newKey: CryptoKey,
  newSearchKey: CryptoKey
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  let reEncrypted = 0;
  let skipped = 0;
  let total = 0;

  // 1. Re-encrypt health_metrics rows.
  const { data: metricRows, error: metricError } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id);

  if (metricError) {
    console.error("Failed to fetch server health_metrics for re-encryption:", metricError);
  } else {
    for (const row of metricRows ?? []) {
      total++;
      try {
        const decrypted = await decryptMetric(row as unknown as OfflineMetric, oldKey);
        const encrypted = await encryptMetric(decrypted, newKey, newSearchKey);
        // `search_tokens` exists in the DB (migration 20260616143000) but is
        // missing from the generated types; cast keeps the column writeable.
        const payload = {
          value: encrypted.value,
          notes: encrypted.notes,
          search_tokens: encrypted.search_tokens ?? null,
        } as unknown as TablesUpdate<"health_metrics">;
        const { error } = await supabase
          .from("health_metrics")
          .update(payload)
          .eq("id", row.id);
        if (error) {
          skipped++;
          console.warn(`Failed to re-encrypt health_metrics row ${row.id}:`, error.message);
        } else {
          reEncrypted++;
        }
      } catch (err) {
        skipped++;
        console.warn(`Skipping health_metrics row ${row.id} (cannot decrypt with old key):`, err);
      }
    }
  }

  // 2. Re-encrypt symptom_history rows.
  const { data: symptomRows, error: symptomError } = await supabase
    .from("symptom_history")
    .select("*")
    .eq("user_id", user.id);

  if (symptomError) {
    console.error("Failed to fetch server symptom_history for re-encryption:", symptomError);
  } else {
    for (const row of symptomRows ?? []) {
      total++;
      try {
        const decrypted = await decryptSymptom(row as unknown as OfflineSymptom, oldKey);
        const encrypted = await encryptSymptom(decrypted, newKey, newSearchKey);
        const payload = {
          symptoms: encrypted.symptoms,
          ai_analysis: encrypted.ai_analysis,
          possible_causes: encrypted.possible_causes,
          recommendations: encrypted.recommendations,
          search_tokens: encrypted.search_tokens ?? null,
        } as unknown as TablesUpdate<"symptom_history">;
        const { error } = await supabase
          .from("symptom_history")
          .update(payload)
          .eq("id", row.id);
        if (error) {
          skipped++;
          console.warn(`Failed to re-encrypt symptom_history row ${row.id}:`, error.message);
        } else {
          reEncrypted++;
        }
      } catch (err) {
        skipped++;
        console.warn(`Skipping symptom_history row ${row.id} (cannot decrypt with old key):`, err);
      }
    }
  }

  if (skipped > 0) {
    console.warn(
      `Server-side re-encryption finished: ${reEncrypted} re-encrypted, ${skipped} skipped of ${total} rows.`
    );
  }

  // Cached copies of these tables still hold old-key ciphertext; drop them so
  // callers re-fetch the re-encrypted rows.
  await Promise.all([
    invalidateCache("health_metrics").catch(() => {}),
    invalidateCache("symptom_history").catch(() => {}),
  ]);
}

// Register Encryption Hooks for Auth Lifecycles
registerEncryptionHooks({
  onLogout: async () => {
    try {
      await db.healthMetrics.clear();
      await db.symptomHistory.clear();
    } catch (err) {
      console.error("Error clearing database on logout:", err);
    }
  },
  onTokenRefresh: async (oldKey, newKey, oldSearchKey, newSearchKey) => {
    try {
      const metrics = await db.healthMetrics.toArray();
      for (const record of metrics) {
        const decrypted = await decryptMetric(record, oldKey);
        const encrypted = await encryptMetric(decrypted, newKey, newSearchKey);
        await db.healthMetrics.put(encrypted);
      }

      const symptoms = await db.symptomHistory.toArray();
      for (const record of symptoms) {
        const decrypted = await decryptSymptom(record, oldKey);
        const encrypted = await encryptSymptom(decrypted, newKey, newSearchKey);
        await db.symptomHistory.put(encrypted);
      }
    } catch (err) {
      console.error("Error migrating offline database on token rotation, clearing tables:", err);
      try {
        await db.healthMetrics.clear();
        await db.symptomHistory.clear();
      } catch (clearErr) {
        console.error("Failed to clear database after migration failure:", clearErr);
      }
    }

    // Also re-encrypt server-side rows so the Supabase copies stay decryptable
    // under the new key (issue #999). Failures here must not clear local data.
    try {
      await reEncryptServerData(oldKey, newKey, newSearchKey);
    } catch (err) {
      console.error("Failed to re-encrypt server-side data after key rotation:", err);
    }
  },
});

export const syncOfflineData = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;

  const result = await syncMutex.runExclusive(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      await whenEncryptionReady();
      let syncedAny = false;

      // 1. Sync pending health metrics deletions
      const pendingMetricsDeletes = await db.healthMetrics
        .where("pending_delete")
        .equals(1)
        .toArray();

      for (const record of pendingMetricsDeletes) {
        const { error } = await supabase
          .from("health_metrics")
          .delete()
          .eq("id", record.id);

        if (!error || error.code === "PGRST116") {
          await db.healthMetrics.delete(record.id);
          syncedAny = true;
        }
      }

      // 2. Sync pending health metrics insertions (with in-flight isolation)
      const pendingMetricsInserts = await db.healthMetrics
        .where("pending_sync")
        .equals(1)
        .toArray();

      for (const record of pendingMetricsInserts) {
        // Mark as in-flight (pending_sync: 2)
        await db.healthMetrics.update(record.id, { pending_sync: 2 });
        const { pending_sync, pending_delete, ...supabaseData } = record;

        const { error } = await supabase
          .from("health_metrics")
          .insert(supabaseData as unknown as TablesInsert<"health_metrics">);

        if (!error) {
          await db.healthMetrics.update(record.id, { pending_sync: 0 });
          syncedAny = true;
        } else {
          // Revert to pending on failure
          await db.healthMetrics.update(record.id, { pending_sync: 1 });
        }
      }

      // 3. Sync pending symptom history deletions
      const pendingSymptomDeletes = await db.symptomHistory
        .where("pending_delete")
        .equals(1)
        .toArray();

      for (const record of pendingSymptomDeletes) {
        const { error } = await supabase
          .from("symptom_history")
          .delete()
          .eq("id", record.id);

        if (!error || error.code === "PGRST116") {
          await db.symptomHistory.delete(record.id);
          syncedAny = true;
        }
      }

      // 4. Sync pending symptom history insertions (with in-flight isolation)
      const pendingSymptomInserts = await db.symptomHistory
        .where("pending_sync")
        .equals(1)
        .toArray();

      for (const record of pendingSymptomInserts) {
        // Mark as in-flight (pending_sync: 2)
        await db.symptomHistory.update(record.id, { pending_sync: 2 });
        const { pending_sync, pending_delete, pending_update, ...supabaseData } = record;

        const { error } = await supabase
          .from("symptom_history")
          .insert(supabaseData as unknown as TablesInsert<"symptom_history">);

        if (!error) {
          await db.symptomHistory.update(record.id, { pending_sync: 0 });
          syncedAny = true;
        } else {
          // Revert to pending on failure
          await db.symptomHistory.update(record.id, { pending_sync: 1 });
        }
      }

      // 5. Sync pending symptom history updates
      const pendingSymptomUpdates = await db.symptomHistory
        .where("pending_update")
        .equals(1)
        .toArray();

      for (const record of pendingSymptomUpdates) {
        const { error } = await supabase
          .from("symptom_history")
          .update({ resolved: record.resolved })
          .eq("id", record.id);

        if (!error) {
          await db.symptomHistory.update(record.id, { pending_update: 0 });
          syncedAny = true;
        }
      }

      if (syncedAny) {
        await Promise.all([
          invalidateCache("health_metrics").catch(() => {}),
          invalidateCache("symptom_history").catch(() => {}),
        ]);
      }

      return syncedAny;
    } catch (error) {
      console.error("Error during offline synchronization:", error);
      return false;
    }
  });

  return result ?? false;
};
