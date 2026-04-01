import { NextResponse } from "next/server";
import { configureWebPush, resolveDueSlot, sendReminderPush } from "@/lib/pushServer";
import { listSubscribers, markSubscriberSent, removeSubscriber } from "@/lib/pushStore";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const vercelCron = request.headers.get("x-vercel-cron");
  if (vercelCron) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!configureWebPush()) {
    return NextResponse.json(
      { ok: false, error: "Missing VAPID config (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)" },
      { status: 500 }
    );
  }

  const now = new Date();
  const subscribers = await listSubscribers();
  let eligible = 0;
  let sent = 0;
  let removed = 0;
  const errors: string[] = [];

  for (const subscriber of subscribers) {
    const slot = resolveDueSlot(subscriber, now);
    if (!slot) continue;
    eligible += 1;
    if (subscriber.lastSentSlot === slot) continue;

    try {
      await sendReminderPush(subscriber, slot);
      await markSubscriberSent(subscriber.endpoint, slot);
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: unknown }).statusCode)
          : 0;

      if (statusCode === 404 || statusCode === 410) {
        await removeSubscriber(subscriber.endpoint);
        removed += 1;
        continue;
      }

      const message = error instanceof Error ? error.message : "Unknown push error";
      errors.push(`${subscriber.endpoint}: ${message}`);
    }
  }

  return NextResponse.json({
    ok: true,
    scanned: subscribers.length,
    eligible,
    sent,
    removed,
    errors,
    timestamp: now.toISOString(),
  });
}
