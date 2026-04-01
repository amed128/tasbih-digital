import { NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/pushStore";

type UnsubscribeBody = {
  endpoint?: string;
  subscription?: PushSubscriptionJSON;
};

export async function POST(request: Request) {
  let body: UnsubscribeBody;
  try {
    body = (await request.json()) as UnsubscribeBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const endpoint = body.endpoint ?? body.subscription?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ ok: false, error: "Missing endpoint" }, { status: 400 });
  }

  await removeSubscriber(endpoint);
  return NextResponse.json({ ok: true });
}
