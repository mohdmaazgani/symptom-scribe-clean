import Dexie, { type Table } from "dexie";
import { supabase } from "@/integrations/supabase/client";
import { type Database, type Json } from "@/integrations/supabase/types";
import {
  encryptText,
  decryptText,
  whenEncryptionReady,
  registerEncryptionHooks,
  getSearchKey,
  generateSearchTokens,
  encryptProfileField,
  decryptProfileField,
  encryptProfileArray,
  decryptProfileArray,
} from "./encryption";
import { invalidateCache } from "@/lib/cached-queries";

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
  },
});

export const syncOfflineData = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const key = await whenEncryptionReady();
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

    // 2. Sync pending health metrics insertions
    const pendingMetricsInserts = await db.healthMetrics
      .where("pending_sync")
      .equals(1)
      .toArray();

    for (const record of pendingMetricsInserts) {
      const { pending_sync, pending_delete, ...supabaseData } = record;
      const { error } = await supabase
        .from("health_metrics")
        .insert(supabaseData);

      if (!error) {
        await db.healthMetrics.update(record.id, { pending_sync: 0 });
        syncedAny = true;
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

    // 4. Sync pending symptom history insertions
    const pendingSymptomInserts = await db.symptomHistory
      .where("pending_sync")
      .equals(1)
      .toArray();

    for (const record of pendingSymptomInserts) {
      const { pending_sync, pending_delete, pending_update, ...supabaseData } = record;
      const { error } = await supabase
        .from("symptom_history")
        .insert(supabaseData);

      if (!error) {
        await db.symptomHistory.update(record.id, { pending_sync: 0 });
        syncedAny = true;
      }
    }

    // 5. Sync pending symptom history updates (resolve/reopen)
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
};

/**
 * Re-encrypts the authenticated user's server-side rows after a password
 * change/reset so existing records remain decryptable under the new key.
 *
 * Without this, only the local Dexie cache is re-encrypted (see the
 * onTokenRefresh hook above) and every server row stays encrypted under the
 * old key, becoming undecryptable after a reload.
 */
export const reencryptServerData = async (
  oldKey: CryptoKey,
  newKey: CryptoKey,
  oldSearchKey?: CryptoKey | null,
  newSearchKey?: CryptoKey | null
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // symptom_history
  const { data: symptoms, error: symptomsError } = await supabase
    .from("symptom_history")
    .select("*")
    .eq("user_id", user.id);

  if (symptomsError) {
    console.error("Failed to fetch symptom_history for re-encryption:", symptomsError);
  } else if (symptoms && symptoms.length > 0) {
    for (const record of symptoms) {
      try {
        const decrypted = await decryptSymptom(record as unknown as OfflineSymptom, oldKey);
        const reencrypted = await encryptSymptom(decrypted, newKey, newSearchKey);
        const { error: updateError } = await supabase
          .from("symptom_history")
          .update({
            symptoms: reencrypted.symptoms,
            ai_analysis: reencrypted.ai_analysis,
            possible_causes: reencrypted.possible_causes,
            recommendations: reencrypted.recommendations,
            search_tokens: reencrypted.search_tokens,
          })
          .eq("id", record.id);
        if (updateError) {
          console.error(`Failed to re-encrypt symptom_history row ${record.id}:`, updateError);
        }
      } catch (err) {
        console.error(`Failed to re-encrypt symptom_history row ${record.id}:`, err);
      }
    }
  }

  // health_metrics
  const { data: metrics, error: metricsError } = await supabase
    .from("health_metrics")
    .select("*")
    .eq("user_id", user.id);

  if (metricsError) {
    console.error("Failed to fetch health_metrics for re-encryption:", metricsError);
  } else if (metrics && metrics.length > 0) {
    for (const record of metrics) {
      try {
        const decrypted = await decryptMetric(record as unknown as OfflineMetric, oldKey);
        const reencrypted = await encryptMetric(decrypted, newKey, newSearchKey);
        const { error: updateError } = await supabase
          .from("health_metrics")
          .update({
            value: reencrypted.value,
            notes: reencrypted.notes,
            search_tokens: reencrypted.search_tokens,
          })
          .eq("id", record.id);
        if (updateError) {
          console.error(`Failed to re-encrypt health_metrics row ${record.id}:`, updateError);
        }
      } catch (err) {
        console.error(`Failed to re-encrypt health_metrics row ${record.id}:`, err);
      }
    }
  }

  // profiles (encrypted fields)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to fetch profile for re-encryption:", profileError);
  } else if (profile) {
    const profileUpdate: Database["public"]["Tables"]["profiles"]["Update"] = {};

    const textFields = [
      "full_name",
      "date_of_birth",
      "emergency_contact_name",
      "emergency_contact_phone",
    ] as const;
    const arrayFields = ["allergies", "chronic_conditions"] as const;

    for (const field of textFields) {
      try {
        const decrypted = await decryptProfileField(profile[field], oldKey);
        profileUpdate[field] = await encryptProfileField(decrypted, newKey);
      } catch (err) {
        console.error(`Failed to re-encrypt profile field ${field}:`, err);
      }
    }

    for (const field of arrayFields) {
      try {
        const decrypted = await decryptProfileArray(profile[field] as unknown as string, oldKey);
        profileUpdate[field] = (await encryptProfileArray(decrypted, newKey)) as unknown as string[] | null;
      } catch (err) {
        console.error(`Failed to re-encrypt profile field ${field}:`, err);
      }
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", user.id);

    if (profileUpdateError) {
      console.error("Failed to update re-encrypted profile fields:", profileUpdateError);
    }
  }

  await Promise.all([
    invalidateCache("health_metrics").catch(() => {}),
    invalidateCache("symptom_history").catch(() => {}),
    invalidateCache("profiles").catch(() => {}),
  ]);
};
