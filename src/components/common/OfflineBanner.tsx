import { WifiOff, Loader2 } from "lucide-react";

interface OfflineBannerProps {
  isOnline: boolean;
  isSyncing: boolean;
}

export function OfflineBanner({ isOnline, isSyncing }: OfflineBannerProps) {
  if (isOnline && !isSyncing) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border text-sm font-medium flex items-center gap-2 max-w-md">
      {isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Syncing your data...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-orange-500" />
          <span>You're offline. Changes will sync when reconnected.</span>
        </>
      )}
    </div>
  );
}
