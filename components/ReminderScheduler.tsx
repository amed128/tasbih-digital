"use client";

import { useEffect, useRef } from "react";
import { useTasbihStore } from "../store/tasbihStore";

export function ReminderScheduler() {
  const remindersEnabled = useTasbihStore((s) => s.preferences.remindersEnabled);
  const reminderIntervalMinutes = useTasbihStore((s) => s.preferences.reminderIntervalMinutes);
  const language = useTasbihStore((s) => s.preferences.language);
  const lastShownAtRef = useRef<number>(0);

  useEffect(() => {
    if (!remindersEnabled) return;
    if (typeof window === "undefined" || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    const intervalMs = Math.max(5, reminderIntervalMinutes) * 60_000;

    const tick = () => {
      const now = Date.now();
      if (now - lastShownAtRef.current < intervalMs) return;
      lastShownAtRef.current = now;

      const title = language === "fr" ? "Tasbih Digital" : "Tasbih Digital";
      const body =
        language === "fr"
          ? "Petit rappel: prenez un moment pour votre zikr."
          : "Gentle reminder: take a moment for your zikr.";

      try {
        new Notification(title, { body, tag: "tasbih-reminder" });
      } catch {
        // Ignore notification runtime failures.
      }
    };

    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [remindersEnabled, reminderIntervalMinutes, language]);

  return null;
}
