"use client";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function ReminderScheduler() {
  const remindersEnabled = useTasbihStore((s) => s.preferences.remindersEnabled);
  const reminderScheduleType = useTasbihStore((s) => s.preferences.reminderScheduleType);
  const reminderTimes = useTasbihStore((s) => s.preferences.reminderTimes);
  const reminderDays = useTasbihStore((s) => s.preferences.reminderDays);
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
          await fetch("/api/push/unsubscribe", {
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
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          remindersEnabled,
          reminderScheduleType,
          reminderTimes,
          reminderDays,
          language,
          timezone,
        }),
      });
    };

    void syncPushSubscription();

    return undefined;
  }, [remindersEnabled, reminderScheduleType, reminderTimes, reminderDays, language]);

  return null;
}
