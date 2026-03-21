import { describe, it, expect } from "vitest";
import { normalizeTimezone, clampReminderTime } from "@/lib/pushValidation";

describe("normalizeTimezone", () => {
  it("returns a valid IANA timezone unchanged", () => {
    expect(normalizeTimezone("Europe/Paris")).toBe("Europe/Paris");
    expect(normalizeTimezone("Asia/Riyadh")).toBe("Asia/Riyadh");
    expect(normalizeTimezone("America/New_York")).toBe("America/New_York");
    expect(normalizeTimezone("UTC")).toBe("UTC");
  });

  it("falls back to UTC for a completely invalid string", () => {
    expect(normalizeTimezone("Not/ATimezone")).toBe("UTC");
    expect(normalizeTimezone("garbage")).toBe("UTC");
  });

  it("falls back to UTC for an empty string", () => {
    expect(normalizeTimezone("")).toBe("UTC");
  });

  it("falls back to UTC when given a non-string value", () => {
    expect(normalizeTimezone(null)).toBe("UTC");
    expect(normalizeTimezone(undefined)).toBe("UTC");
    expect(normalizeTimezone(42)).toBe("UTC");
    expect(normalizeTimezone({})).toBe("UTC");
  });

  it("trims whitespace before validating", () => {
    expect(normalizeTimezone("  UTC  ")).toBe("UTC");
    expect(normalizeTimezone("  ")).toBe("UTC");
  });
});

describe("clampReminderTime", () => {
  it("passes through valid values unchanged", () => {
    expect(clampReminderTime({ hour: 8, minute: 30 })).toEqual({ hour: 8, minute: 30 });
    expect(clampReminderTime({ hour: 0, minute: 0 })).toEqual({ hour: 0, minute: 0 });
    expect(clampReminderTime({ hour: 23, minute: 59 })).toEqual({ hour: 23, minute: 59 });
  });

  it("clamps hour above 23 to 23", () => {
    expect(clampReminderTime({ hour: 25, minute: 0 })).toEqual({ hour: 23, minute: 0 });
    expect(clampReminderTime({ hour: 100, minute: 0 })).toEqual({ hour: 23, minute: 0 });
  });

  it("clamps hour below 0 to 0", () => {
    expect(clampReminderTime({ hour: -1, minute: 0 })).toEqual({ hour: 0, minute: 0 });
  });

  it("clamps minute above 59 to 59", () => {
    expect(clampReminderTime({ hour: 8, minute: 60 })).toEqual({ hour: 8, minute: 59 });
    expect(clampReminderTime({ hour: 8, minute: 999 })).toEqual({ hour: 8, minute: 59 });
  });

  it("clamps minute below 0 to 0", () => {
    expect(clampReminderTime({ hour: 8, minute: -5 })).toEqual({ hour: 8, minute: 0 });
  });

  it("defaults to 0 for non-numeric hour and minute", () => {
    expect(clampReminderTime({ hour: "abc" as unknown as number, minute: null as unknown as number })).toEqual({ hour: 0, minute: 0 });
  });

  it("defaults to 0 for undefined input", () => {
    expect(clampReminderTime(undefined)).toEqual({ hour: 0, minute: 0 });
  });

  it("truncates fractional values", () => {
    expect(clampReminderTime({ hour: 8.9, minute: 30.7 })).toEqual({ hour: 8, minute: 30 });
  });
});
