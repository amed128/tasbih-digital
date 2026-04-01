import { NextResponse } from "next/server";
import { configureWebPush } from "@/lib/pushServer";
import { listSubscribers } from "@/lib/pushStore";
import webpush from "web-push";

export const runtime = "nodejs";

export async function POST() {
  if (!configureWebPush()) {
    return NextResponse.json(
      { ok: false, error: "Missing VAPID config (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)" },
      { status: 500 }
    );
  }

  const subscribers = await listSubscribers();
  if (subscribers.length === 0) {
    return NextResponse.json({ ok: false, error: "No push subscribers found" }, { status: 404 });
  }

  const sub = subscribers[0];
  await webpush.sendNotification(
    sub.subscription as unknown as webpush.PushSubscription,
    JSON.stringify({
      title: "Tasbih Digital",
      body: sub.language === "fr" ? "Notification de test en arriere-plan." : "Background test notification.",
      tag: "tasbih-push-test",
      url: "/reglages",
    })
  );

  return NextResponse.json({ ok: true, endpoint: sub.endpoint });
}
