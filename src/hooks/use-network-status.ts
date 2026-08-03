import { useState, useEffect, useCallback } from "react";

interface NetworkStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  triggerSync: () => Promise<void>;
}

export function useNetworkStatus(syncFn?: () => Promise<void>): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const triggerSync = useCallback(async () => {
    if (!syncFn || isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncFn();
      setPendingCount(0);
    } catch (err) {
      console.error("Auto-sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [syncFn, isSyncing]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  return { isOnline, isSyncing, pendingCount, triggerSync };
}
