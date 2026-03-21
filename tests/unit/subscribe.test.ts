import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock pushStore so tests don't touch the filesystem
vi.mock("@/lib/pushStore", () => ({
  upsertSubscriber: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/push/subscribe/route";
import { upsertSubscriber } from "@/lib/pushStore";

const mockUpsert = vi.mocked(upsertSubscriber);

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validSubscription: PushSubscriptionJSON = {
  endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
  keys: { p256dh: "test-p256dh", auth: "test-auth" },
};

describe("POST /api/push/subscribe — validation", () => {
  beforeEach(() => {
    mockUpsert.mockClear();
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json() as { ok: boolean; error: string };
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/invalid json/i);
  });

  it("returns 400 when subscription is missing", async () => {
    const res = await POST(makeRequest({ remindersEnabled: true }));
    expect(res.status).toBe(400);
    const json = await res.json() as { ok: boolean; error: string };
    expect(json.ok).toBe(false);
    expect(json.error).toMatch(/endpoint/i);
  });

  it("returns 400 when subscription.endpoint is empty", async () => {
    const res = await POST(makeRequest({ subscription: { endpoint: "" } }));
    expect(res.status).toBe(400);
    const json = await res.json() as { ok: boolean };
    expect(json.ok).toBe(false);
  });

  it("returns 200 and upserts for a valid payload", async () => {
    const res = await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: true,
      reminderTimes: [{ hour: 8, minute: 0 }],
      language: "fr",
      timezone: "Europe/Paris",
    }));
    expect(res.status).toBe(200);
    const json = await res.json() as { ok: boolean };
    expect(json.ok).toBe(true);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it("normalizes an invalid timezone to UTC before storing", async () => {
    await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: true,
      reminderTimes: [{ hour: 9, minute: 0 }],
      language: "en",
      timezone: "Mars/OlympusMons",
    }));
    expect(mockUpsert).toHaveBeenCalledOnce();
    const stored = mockUpsert.mock.calls[0][0];
    expect(stored.timezone).toBe("UTC");
  });

  it("normalizes a missing timezone to UTC", async () => {
    await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: false,
      reminderTimes: [{ hour: 9, minute: 0 }],
      language: "en",
      // no timezone field
    }));
    const stored = mockUpsert.mock.calls[0][0];
    expect(stored.timezone).toBe("UTC");
  });

  it("clamps an out-of-range hour to valid bounds", async () => {
    await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: true,
      reminderTimes: [{ hour: 99, minute: 0 }],
      language: "en",
      timezone: "UTC",
    }));
    const stored = mockUpsert.mock.calls[0][0];
    expect(stored.reminderTimes[0].hour).toBe(23);
  });

  it("clamps an out-of-range minute to valid bounds", async () => {
    await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: true,
      reminderTimes: [{ hour: 8, minute: 99 }],
      language: "en",
      timezone: "UTC",
    }));
    const stored = mockUpsert.mock.calls[0][0];
    expect(stored.reminderTimes[0].minute).toBe(59);
  });

  it("always stores reminderScheduleType as 'daily' regardless of input", async () => {
    await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: true,
      reminderScheduleType: "weekly", // client tries to send weekly
      reminderTimes: [{ hour: 8, minute: 0 }],
      language: "fr",
      timezone: "UTC",
    }));
    const stored = mockUpsert.mock.calls[0][0];
    expect(stored.reminderScheduleType).toBe("daily");
    expect(stored.reminderDays).toEqual([]);
  });

  it("defaults to 'en' for an unknown language value", async () => {
    await POST(makeRequest({
      subscription: validSubscription,
      remindersEnabled: true,
      reminderTimes: [{ hour: 8, minute: 0 }],
      language: "es", // unsupported language
      timezone: "UTC",
    }));
    const stored = mockUpsert.mock.calls[0][0];
    expect(stored.language).toBe("en");
  });

  it("cleanup path: stale endpoint still validates and upserts (404/410 handled in dispatch)", async () => {
    // The subscribe route does not try to send — it just stores.
    // Stale endpoint cleanup happens in dispatch when push fails with 404/410.
    // This test confirms subscribe always upserts without probing the endpoint.
    const res = await POST(makeRequest({
      subscription: { endpoint: "https://stale.endpoint.example/token" },
      remindersEnabled: true,
      reminderTimes: [{ hour: 8, minute: 0 }],
      language: "en",
      timezone: "UTC",
    }));
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });
});
