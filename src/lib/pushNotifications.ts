import { supabase } from "@/integrations/supabase/client";

// VAPID Public Key (replace or configure via VITE_VAPID_PUBLIC_KEY env var)
const VAPID_PUBLIC_KEY =
  (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ||
  "BEl62iUYgUivxIkv69yViEuiBIa1F1g38B57d7hW-M-o5V2sS88qP5N62u89f_V55l6g0_y55g_66v8v-8";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushNotificationSupported(): Promise<boolean> {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getNotificationPermissionState(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    return "denied";
  }
  const permission = await Notification.requestPermission();
  return permission;
}

export async function subscribeUserToPush(userId: string): Promise<boolean> {
  try {
    if (!(await isPushNotificationSupported())) {
      console.warn("Push notifications are not supported in this browser.");
      return false;
    }

    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      console.warn("Notification permission was not granted.");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    const subscriptionJson = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh = subscriptionJson.keys?.p256dh || "";
    const auth = subscriptionJson.keys?.auth || "";

    if (!endpoint || !p256dh || !auth) {
      console.warn("Incomplete push subscription object.");
      return false;
    }

    // Save to Supabase push_subscriptions table
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      console.error("Failed to save push subscription to Supabase:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    return false;
  }
}

export async function unsubscribeUserFromPush(userId: string): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", userId);
    }
    return true;
  } catch (error) {
    console.error("Error unsubscribing from push notifications:", error);
    return false;
  }
}

export function triggerLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      icon: "/pwa-192x192.png",
      badge: "/pwa-64x64.png",
      ...options,
    });
  }
}
