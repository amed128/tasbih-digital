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

function normalizeTimezone(timezone: unknown): string {
  const value = typeof timezone === "string" ? timezone.trim() : "";
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

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

  const firstTime = Array.isArray(body.reminderTimes) ? body.reminderTimes[0] : undefined;
  const reminderTime = {
    hour: Math.max(0, Math.min(23, Math.floor(Number(firstTime?.hour) || 8))),
    minute: Math.max(0, Math.min(59, Math.floor(Number(firstTime?.minute) || 0))),
  };

  await upsertSubscriber({
    endpoint: subscription.endpoint,
    subscription,
    remindersEnabled: Boolean(body.remindersEnabled),
    reminderScheduleType: "daily",
    reminderTimes: [reminderTime],
    reminderDays: [],
    language: body.language === "fr" ? "fr" : "en",
    timezone: normalizeTimezone(body.timezone),
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
