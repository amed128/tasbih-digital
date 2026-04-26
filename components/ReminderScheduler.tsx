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

      const REMINDER_BODY: Record<string, string> = {
        fr: "Petit rappel : prenez un moment pour votre zikr.",
        de: "Erinnerung: Nehmen Sie sich einen Moment für Ihren Zikr.",
        es: "Recordatorio: tómate un momento para tu zikr.",
        pt: "Lembrete: reserve um momento para o seu zikr.",
        hi: "याद दिलाना: अपने ज़िक्र के लिए एक पल निकालें।",
        ar: "تذكير: خذ لحظة لأداء ذكرك.",
        tr: "Hatırlatma: Zikriniz için bir an ayırın.",
        ur: "یاد دہانی: اپنے ذکر کے لیے ایک لمحہ نکالیں۔",
        bn: "স্মরণ করিয়ে দেওয়া: আপনার যিকরের জন্য একটু সময় নিন।",
        id: "Pengingat: luangkan waktu sejenak untuk zikir Anda.",
        ms: "Peringatan: luangkan masa sejenak untuk zikir anda.",
        ru: "Напоминание: уделите момент своему зикру.",
      };
      const body = REMINDER_BODY[language ?? "en"] ?? "Gentle reminder: take a moment for your zikr.";

      await LocalNotifications.schedule({
        notifications: [
          {
            id: REMINDER_NOTIFICATION_ID,
            title: "At-tasbih",
            body,
            // `on` fires whenever the clock matches { hour, minute } — i.e. daily
            // at that time. Using `at` + `every: "day"` together conflicts on iOS
            // and causes "trigger failed".
            schedule: {
              on: { hour: rt.hour, minute: rt.minute },
              allowWhileIdle: true,
            },
            smallIcon: "ic_stat_icon",
          },
        ],
      });
    };

    void sync();
  }, [remindersEnabled, reminderTimes, language]);

  return null;
}
