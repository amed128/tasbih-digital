import { NextResponse } from "next/server";
import { upsertSubscriber } from "@/lib/pushStore";
import type { ReminderScheduleType, ReminderTime } from "@/lib/pushTypes";

type SubscribeBody = {
  subscription?: PushSubscriptionJSON;
  remindersEnabled?: boolean;
  reminderScheduleType?: ReminderScheduleType;
  reminderTimes?: ReminderTime[];
  reminderDays?: number[];
  language?: "fr" | "en";
  timezone?: string;
};

export async function POST(request: Request) {
  let body: SubscribeBody;
  try {
    body = (await request.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const subscription = body.subscription;
  if (!subscription?.endpoint) {
    return NextResponse.json({ ok: false, error: "Missing push subscription endpoint" }, { status: 400 });
  }

  const reminderTimes = Array.isArray(body.reminderTimes)
    ? body.reminderTimes.slice(0, 2).map((t) => ({
        hour: Math.max(0, Math.min(23, Math.floor(Number(t.hour) || 0))),
        minute: Math.max(0, Math.min(59, Math.floor(Number(t.minute) || 0))),
      }))
    : [];

  const reminderDays = Array.isArray(body.reminderDays)
    ? [...new Set(body.reminderDays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
    : [];

  await upsertSubscriber({
    endpoint: subscription.endpoint,
    subscription,
    remindersEnabled: Boolean(body.remindersEnabled),
    reminderScheduleType: body.reminderScheduleType === "weekly" ? "weekly" : "daily",
    reminderTimes,
    reminderDays,
    language: body.language === "fr" ? "fr" : "en",
    timezone: body.timezone && body.timezone.trim() ? body.timezone : "UTC",
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
