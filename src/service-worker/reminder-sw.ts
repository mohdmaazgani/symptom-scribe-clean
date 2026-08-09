/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Service Worker Push Event Handler for Medication & Check-up Reminders
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, icon, actions } = payload;

    const options: NotificationOptions & { vibrate?: number[]; actions?: NotificationAction[] } = {
      body: body || "You have an upcoming medication reminder.",
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      vibrate: [200, 100, 200],
      actions: actions || [
        { action: "take", title: "Mark Taken" },
        { action: "snooze", title: "Snooze 15m" },
      ],
      data: payload,
    };

    event.waitUntil(self.registration.showNotification(title || "Symptom Scribe Reminder", options));
  } catch (err) {
    console.error("Error processing push notification:", err);
  }
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const action = event.action;

  if (action === "take") {
    // Handle mark taken background sync event
    console.log("Medication marked as taken from OS notification banner");
  } else if (action === "snooze") {
    console.log("Medication reminder snoozed");
  } else {
    // Open application
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return self.clients.openWindow("/reminders");
      })
    );
  }
});

export {};
