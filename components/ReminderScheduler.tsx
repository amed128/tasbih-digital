"use client";

import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { useTasbihStore } from "../store/tasbihStore";
import { isNativeApp } from "../lib/platform";

// Stable notification ID for the daily reminder (overwritten on reschedule).
const REMINDER_NOTIFICATION_ID = 1001;

export function ReminderScheduler() {
  const remindersEnabled = useTasbihStore((s) => s.preferences.remindersEnabled);
  const reminderTimes = useTasbihStore((s) => s.preferences.reminderTimes);
  const language = useTasbihStore((s) => s.preferences.language);

  useEffect(() => {
    if (!isNativeApp()) return;

    const sync = async () => {
      // Cancel existing reminder first so we always start clean.
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });

      if (!remindersEnabled || reminderTimes.length === 0) return;

      const rt = reminderTimes[0];
      if (!rt) return;

      const body =
        language === "fr"
          ? "Petit rappel : prenez un moment pour votre zikr."
          : "Gentle reminder: take a moment for your zikr.";

      const now = new Date();
      const scheduled = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        rt.hour,
        rt.minute,
        0
      );
      // If the time already passed today, schedule for tomorrow.
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_NOTIFICATION_ID,
            title: "At-tasbih",
            body,
            schedule: {
              at: scheduled,
              repeats: true,
              every: "day",
            },
            sound: undefined,
            smallIcon: "ic_stat_icon",
          },
        ],
      });
    };

    void sync();
  }, [remindersEnabled, reminderTimes, language]);

  return null;
}
