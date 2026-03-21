import { describe, it, expect } from "vitest";
import { resolveDueSlot } from "@/lib/pushServer";
import type { PushSubscriptionRecord } from "@/lib/pushTypes";

function makeRecord(
  overrides: Partial<PushSubscriptionRecord> = {}
): PushSubscriptionRecord {
  return {
    endpoint: "https://push.example.com/test",
    subscription: { endpoint: "https://push.example.com/test" },
    remindersEnabled: true,
    reminderScheduleType: "daily",
    reminderTimes: [{ hour: 8, minute: 0 }],
    reminderDays: [],
    language: "fr",
    timezone: "UTC",
    updatedAt: "2026-03-21T00:00:00.000Z",
    ...overrides,
  };
}

describe("resolveDueSlot", () => {
  it("returns null when reminders are disabled", () => {
    const record = makeRecord({ remindersEnabled: false });
    const now = new Date("2026-03-21T08:00:00Z");
    expect(resolveDueSlot(record, now)).toBeNull();
  });

  it("returns null when reminderTimes is empty", () => {
    const record = makeRecord({ reminderTimes: [] });
    const now = new Date("2026-03-21T08:00:00Z");
    expect(resolveDueSlot(record, now)).toBeNull();
  });

  it("returns the slot string when hour and minute match in UTC", () => {
    const record = makeRecord({ reminderTimes: [{ hour: 8, minute: 30 }] });
    const now = new Date("2026-03-21T08:30:00Z");
    expect(resolveDueSlot(record, now)).toBe("2026-03-21 08:30");
  });

  it("returns null when only hour matches but minute does not", () => {
    const record = makeRecord({ reminderTimes: [{ hour: 8, minute: 30 }] });
    const now = new Date("2026-03-21T08:15:00Z");
    expect(resolveDueSlot(record, now)).toBeNull();
  });

  it("returns null when neither hour nor minute matches", () => {
    const record = makeRecord({ reminderTimes: [{ hour: 8, minute: 0 }] });
    const now = new Date("2026-03-21T09:05:00Z");
    expect(resolveDueSlot(record, now)).toBeNull();
  });

  it("resolves the correct local time for Europe/Paris (UTC+1 in winter)", () => {
    // 07:00 UTC = 08:00 Paris (UTC+1, winter)
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      timezone: "Europe/Paris",
    });
    const now = new Date("2026-03-21T07:00:00Z");
    expect(resolveDueSlot(record, now)).toBe("2026-03-21 08:00");
  });

  it("returns null when UTC time does not align with user local time in Europe/Paris", () => {
    // 08:00 UTC is 09:00 Paris — does NOT match reminder at 08:00 Paris
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      timezone: "Europe/Paris",
    });
    const now = new Date("2026-03-21T08:00:00Z");
    expect(resolveDueSlot(record, now)).toBeNull();
  });

  it("resolves correctly for America/New_York (UTC-4 in summer/DST, March 21)", () => {
    // DST starts 2nd Sunday of March; March 21 is EDT (UTC-4)
    // 12:00 UTC = 08:00 New York (EDT)
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      timezone: "America/New_York",
    });
    const now = new Date("2026-03-21T12:00:00Z");
    expect(resolveDueSlot(record, now)).toBe("2026-03-21 08:00");
  });

  it("resolves correctly for Asia/Riyadh (UTC+3)", () => {
    // 05:00 UTC = 08:00 Riyadh (UTC+3)
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      timezone: "Asia/Riyadh",
    });
    const now = new Date("2026-03-21T05:00:00Z");
    expect(resolveDueSlot(record, now)).toBe("2026-03-21 08:00");
  });

  it("returns the same slot string for the same subscriber/day (dedup key is stable)", () => {
    const record = makeRecord({ reminderTimes: [{ hour: 9, minute: 15 }] });
    // Two calls at the same UTC time should produce the same slot string
    const t1 = new Date("2026-03-21T09:15:00Z");
    const t2 = new Date("2026-03-21T09:15:30Z"); // 30s later, same minute
    expect(resolveDueSlot(record, t1)).toBe(resolveDueSlot(record, t2));
  });

  it("once-per-day dedup: same slot as lastSentSlot means dispatch skips", () => {
    const slot = "2026-03-21 08:00";
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      lastSentSlot: slot,
    });
    const now = new Date("2026-03-21T08:00:00Z");
    const resolved = resolveDueSlot(record, now);
    // resolveDueSlot returns the slot; the dispatch loop checks lastSentSlot === slot
    expect(resolved).toBe(slot);
    expect(record.lastSentSlot === resolved).toBe(true); // dispatch would skip
  });

  it("sends again on a different day after dedup", () => {
    // Subscriber was sent yesterday's slot; today's slot should differ
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      lastSentSlot: "2026-03-20 08:00",
    });
    const now = new Date("2026-03-21T08:00:00Z");
    const resolved = resolveDueSlot(record, now);
    expect(resolved).toBe("2026-03-21 08:00");
    expect(record.lastSentSlot === resolved).toBe(false); // dispatch would send
  });

  it("falls back to UTC when timezone is empty string", () => {
    const record = makeRecord({
      reminderTimes: [{ hour: 8, minute: 0 }],
      timezone: "",
    });
    const now = new Date("2026-03-21T08:00:00Z");
    expect(resolveDueSlot(record, now)).toBe("2026-03-21 08:00");
  });
});
