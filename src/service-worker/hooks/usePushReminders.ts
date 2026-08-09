import { useState, useEffect } from "react";
import { requestNotificationPermission, registerPushSubscription } from "../push-manager";

export function usePushReminders() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const enablePushNotifications = async (vapidKey: string) => {
    const perm = await requestNotificationPermission();
    setPermission(perm);

    if (perm === "granted") {
      const sub = await registerPushSubscription(vapidKey);
      setSubscription(sub);
      return sub;
    }
    return null;
  };

  return {
    permission,
    subscription,
    enablePushNotifications,
  };
}
