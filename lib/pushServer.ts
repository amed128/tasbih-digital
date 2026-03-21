import webpush from "web-push";
import type { PushSubscriptionRecord } from "./pushTypes";

const DAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function configureWebPush(): boolean {
  const vapid = getVapidConfig();
  if (!vapid) return false;
  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
  return true;
}

function getZonedParts(now: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const weekday = get("weekday");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));

  return {
    dateKey: `${year}-${month}-${day}`,
    weekday: DAY_TO_INDEX[weekday] ?? 0,
    hour,
    minute,
  };
}

export function resolveDueSlot(record: PushSubscriptionRecord, now: Date): string | null {
  if (!record.remindersEnabled || record.reminderTimes.length === 0) return null;
  const zoned = getZonedParts(now, record.timezone || "UTC");

  if (record.reminderScheduleType === "weekly") {
    if (!record.reminderDays.includes(zoned.weekday)) return null;
  }

  const due = record.reminderTimes.some((t) => t.hour === zoned.hour && t.minute === zoned.minute);
  if (!due) return null;

  const hh = String(zoned.hour).padStart(2, "0");
  const mm = String(zoned.minute).padStart(2, "0");
  return `${zoned.dateKey} ${hh}:${mm}`;
}

export async function sendReminderPush(record: PushSubscriptionRecord, slot: string): Promise<void> {
  const body =
    record.language === "fr"
      ? "Petit rappel: prenez un moment pour votre zikr."
      : "Gentle reminder: take a moment for your zikr.";

  await webpush.sendNotification(
    record.subscription as unknown as webpush.PushSubscription,
    JSON.stringify({
      title: "Tasbih Digital",
      body,
      tag: `tasbih-reminder-${slot}`,
      url: "/",
    })
  );
}
