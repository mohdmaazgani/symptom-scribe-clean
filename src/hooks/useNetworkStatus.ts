import { useState, useEffect, useCallback, useRef } from "react";
import { syncOfflineData } from "@/lib/offline-db";
import { showSuccess } from "@/lib/toast-helpers";

interface UseNetworkStatusOptions {
  /** If true, automatically syncs offline data when coming back online */
  autoSync?: boolean;
  /** Called after a successful sync */
  onSynced?: () => void;
}

/**
 * Hook that tracks the browser's online/offline status and optionally
 * triggers a background sync of pending IndexedDB data when reconnecting.
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}) {
  const { autoSync = true, onSynced } = options;

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const triggerSync = useCallback(async () => {
    if ((typeof navigator !== "undefined" && !navigator.onLine) || isSyncingRef.current) return;
    setIsSyncing(true);
    isSyncingRef.current = true;
    try {
      const synced = await syncOfflineData();
      if (synced) {
        setLastSyncedAt(new Date());
        showSuccess(
          "Data Synced",
          "Your offline changes have been saved to the cloud."
        );
        onSynced?.();
      }
    } catch (err) {
      console.error("Background sync failed:", err);
    } finally {
      setIsSyncing(false);
      isSyncingRef.current = false;
    }
  }, [onSynced]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        triggerSync();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoSync, triggerSync]);

  return { isOnline, isSyncing, lastSyncedAt, triggerSync };
}
