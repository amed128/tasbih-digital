"use client";

import { useEffect, useRef } from "react";
import { useTasbihStore } from "../store/tasbihStore";

export function ReminderScheduler() {
  const remindersEnabled = useTasbihStore((s) => s.preferences.remindersEnabled);
  const reminderScheduleType = useTasbihStore((s) => s.preferences.reminderScheduleType);
  const reminderTimes = useTasbihStore((s) => s.preferences.reminderTimes);
  const reminderDays = useTasbihStore((s) => s.preferences.reminderDays);
  const language = useTasbihStore((s) => s.preferences.language);
  // Tracks "YYYY-MM-DD HH:MM" slots already fired to prevent double-firing within the same minute.
  const firedSlotsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!remindersEnabled || reminderTimes.length === 0) return;
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const tick = async () => {
      const now = new Date();
      const weekday = now.getDay();
      const h = now.getHours();
      const m = now.getMinutes();
      const dateKey = now.toISOString().slice(0, 10);

      for (const time of reminderTimes) {
        if (time.hour !== h || time.minute !== m) continue;
        if (reminderScheduleType === "weekly" && !reminderDays.includes(weekday)) continue;

        const slotKey = `${dateKey} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        if (firedSlotsRef.current.has(slotKey)) continue;
        firedSlotsRef.current.add(slotKey);

        const body =
          language === "fr"
            ? "Petit rappel: prenez un moment pour votre zikr."
            : "Gentle reminder: take a moment for your zikr.";
        try {
          if (navigator.serviceWorker?.controller) {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification("Tasbih Digital", { body, tag: `tasbih-reminder-${slotKey}` });
          } else {
            new Notification("Tasbih Digital", { body, tag: `tasbih-reminder-${slotKey}` });
          }
        } catch {
          // Ignore notification runtime failures.
        }
      }
    };

    // Poll every 30 s so we catch the scheduled minute within ≤30 s.
    const timer = window.setInterval(tick, 30_000);
    tick();
    return () => {
      window.clearInterval(timer);
    };
  }, [remindersEnabled, reminderScheduleType, reminderTimes, reminderDays, language]);

  return null;
}
