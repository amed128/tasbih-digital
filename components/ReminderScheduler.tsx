
"use client";

// Use environment variable for API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Use environment variable for API base URL
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function ReminderScheduler() {
  const remindersEnabled = useTasbihStore((s) => s.preferences.remindersEnabled);
  const reminderTimes = useTasbihStore((s) => s.preferences.reminderTimes);
  const language = useTasbihStore((s) => s.preferences.language);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const syncPushSubscription = async () => {
      const sw = await navigator.serviceWorker.ready;
      let subscription = await sw.pushManager.getSubscription();

      if (Notification.permission !== "granted") {
        if (subscription) {
          await fetch(`${API_BASE}/api/push/unsubscribe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
          });
          await subscription.unsubscribe();
        }
        return;
      }

      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        return;
      }

      if (!subscription) {
        subscription = await sw.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey) as unknown as BufferSource,
        });
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const dailyTime = reminderTimes[0] ?? { hour: 8, minute: 0 };
      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          remindersEnabled,
          reminderScheduleType: "daily",
          reminderTimes: [dailyTime],
          reminderDays: [],
          language,
          timezone,
        }),
      });
    };

    void syncPushSubscription();

    return undefined;
  }, [remindersEnabled, reminderTimes, language]);

  return null;
}
