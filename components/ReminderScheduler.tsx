"use client";

import { useEffect } from "react";
import { useTasbihStore } from "../store/tasbihStore";

const LAST_FIRED_KEY = "tasbih-reminder-last-fired";

function currentSlot(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const yyyy = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mo}-${dd} ${hh}:${mm}`;
}

async function showReminderNotification(language: "fr" | "en", slot: string) {
  const title = "At-tasbih";
  const body =
    language === "fr"
      ? "Petit rappel : prenez un moment pour votre zikr."
      : "Gentle reminder: take a moment for your zikr.";
  const tag = `tasbih-reminder-${slot}`;

  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, tag });
    } else {
      new Notification(title, { body, tag });
    }
  } catch {
    // Fallback if SW showNotification fails
    try {
      new Notification(title, { body, tag });
    } catch {
      // Notifications not available
    }
  }
}

export function ReminderScheduler() {
  const remindersEnabled = useTasbihStore((s) => s.preferences.remindersEnabled);
  const reminderTimes = useTasbihStore((s) => s.preferences.reminderTimes);
  const language = useTasbihStore((s) => s.preferences.language);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (!remindersEnabled || reminderTimes.length === 0) return;

    const check = () => {
      if (Notification.permission !== "granted") return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const isDue = reminderTimes.some(
        (rt) => rt.hour === currentHour && rt.minute === currentMinute
      );
      if (!isDue) return;

      const slot = currentSlot();
      const lastFired = localStorage.getItem(LAST_FIRED_KEY);
      if (lastFired === slot) return;

      localStorage.setItem(LAST_FIRED_KEY, slot);
      void showReminderNotification(language, slot);
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [remindersEnabled, reminderTimes, language]);

  return null;
}
