import { useState, useCallback } from "react";
import { db, decryptSymptom, type OfflineSymptom } from "@/lib/offline-db";
import { whenEncryptionReady } from "@/lib/encryption";
import { supabase } from "@/integrations/supabase/client";

// Configurable detection window in hours
const DETECTION_WINDOW_HOURS = 24;

export function useDuplicateSymptomDetection() {
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateRecord, setDuplicateRecord] = useState<OfflineSymptom | null>(null);
  const [pendingRecord, setPendingRecord] = useState<OfflineSymptom | null>(null);

  const checkDuplicate = useCallback(async (newRecord: OfflineSymptom): Promise<OfflineSymptom | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const keys = await whenEncryptionReady();
      if (!keys) return null;

      // Get recent records (last 24 hours) from local Dexie database
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - DETECTION_WINDOW_HOURS);
      
      const localRecords = await db.symptomHistory
        .where("user_id")
        .equals(user.id)
        .filter((r) => r.pending_delete === 0 && new Date(r.created_at) >= cutoffTime)
        .toArray();
      
      const decryptedRecords = await Promise.all(
        localRecords.map(record => decryptSymptom(record, keys.encryptionKey))
      );

      // Simple text similarity logic based on significant words
      const newTokens = newRecord.symptoms.toLowerCase().split(/\W+/).filter(t => t.length > 3);

      for (const record of decryptedRecords) {
        if (!record.symptoms) continue;
        const oldTokens = record.symptoms.toLowerCase().split(/\W+/).filter(t => t.length > 3);
        
        // If at least one significant word matches, or exact match
        const hasOverlap = newTokens.some(token => oldTokens.includes(token));
        
        if (hasOverlap || record.symptoms.toLowerCase() === newRecord.symptoms.toLowerCase()) {
          setDuplicateRecord(record);
          setPendingRecord(newRecord);
          setIsDuplicateDialogOpen(true);
          return record; // Return the duplicate record
        }
      }

      return null; // No duplicate found
    } catch (error) {
      console.error("Error checking for duplicate symptoms:", error);
      return null;
    }
  }, []);

  return {
    isDuplicateDialogOpen,
    duplicateRecord,
    pendingRecord,
    checkDuplicate,
    setIsDuplicateDialogOpen,
  };
}
