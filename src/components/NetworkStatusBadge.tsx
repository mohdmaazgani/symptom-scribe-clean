import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils";

interface NetworkStatusBadgeProps {
  className?: string;
}

/**
 * A compact header badge that shows:
 * - Green "Online" dot when connected
 * - Amber "Offline" pulsing dot when disconnected
 * - Spinning icon while syncing pending data to the cloud
 */
const NetworkStatusBadge = ({ className }: NetworkStatusBadgeProps) => {
  const { isOnline, isSyncing } = useNetworkStatus({ autoSync: true });

  if (isOnline && !isSyncing) {
    // Only show badge when offline or syncing — don't clutter the UI when everything is fine
    return null;
  }

  if (isSyncing) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
          "bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400",
          className
        )}
        aria-label="Syncing offline data"
        title="Syncing your offline data to the cloud…"
      >
        <RefreshCw className="w-3 h-3 animate-spin" />
        Syncing…
      </span>
    );
  }

  // Offline state
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        "bg-yellow-500/15 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
        className
      )}
      aria-label="Offline mode — changes will sync when reconnected"
      title="You are offline. Changes are saved locally and will sync when you reconnect."
    >
      <WifiOff className="w-3 h-3" />
      Offline
    </span>
  );
};

export default NetworkStatusBadge;
