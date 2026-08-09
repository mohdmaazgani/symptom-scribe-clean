import { encryptText, decryptText } from "../encryption";
import { supabase } from "@/integrations/supabase/client";
import { db } from "../offline-db";

export interface KeyRotationOptions {
  oldKey: CryptoKey;
  newKey: CryptoKey;
  onProgress?: (processed: number, total: number) => void;
}

export interface RotationResult {
  success: boolean;
  recordsRotated: number;
  error?: string;
}

/**
 * Client-Side AES-GCM Key Rotation Engine
 * Decrypts sensitive health records with old key and re-encrypts using new key.
 */
export async function rotateUserEncryptionKeys(
  options: KeyRotationOptions
): Promise<RotationResult> {
  const { oldKey, newKey, onProgress } = options;
  let processedCount = 0;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error("Authentication required for key rotation");
    }

    // 1. Re-encrypt local IndexedDB Offline Metrics & Symptoms
    const localMetrics = await db.healthMetrics.where("user_id").equals(session.user.id).toArray();
    const localSymptoms = await db.symptomHistory.where("user_id").equals(session.user.id).toArray();

    const totalRecords = localMetrics.length + localSymptoms.length;

    for (const metric of localMetrics) {
      if (typeof metric.notes === "string" && metric.notes.startsWith("enc:")) {
        try {
          const plain = await decryptText(metric.notes, oldKey);
          metric.notes = await encryptText(plain, newKey);
          await db.healthMetrics.put(metric);
        } catch (e) {
          console.warn(`Failed re-encrypting local metric ${metric.id}:`, e);
        }
      }
      processedCount++;
      onProgress?.(processedCount, totalRecords);
    }

    for (const symptom of localSymptoms) {
      if (symptom.symptoms && symptom.symptoms.startsWith("enc:")) {
        try {
          const plain = await decryptText(symptom.symptoms, oldKey);
          symptom.symptoms = await encryptText(plain, newKey);
          await db.symptomHistory.put(symptom);
        } catch (e) {
          console.warn(`Failed re-encrypting local symptom ${symptom.id}:`, e);
        }
      }
      processedCount++;
      onProgress?.(processedCount, totalRecords);
    }

    return {
      success: true,
      recordsRotated: processedCount,
    };
  } catch (error: any) {
    return {
      success: false,
      recordsRotated: processedCount,
      error: error?.message || "Unknown key rotation error",
    };
  }
}
