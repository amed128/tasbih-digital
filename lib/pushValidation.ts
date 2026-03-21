/**
 * Shared validation helpers used by the push subscribe API and unit tests.
 */

export function normalizeTimezone(timezone: unknown): string {
  const value = typeof timezone === "string" ? timezone.trim() : "";
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}

export type ReminderTimeInput = { hour?: unknown; minute?: unknown } | undefined;

export function clampReminderTime(input: ReminderTimeInput): {
  hour: number;
  minute: number;
} {
  return {
    hour: Math.max(0, Math.min(23, Math.floor(Number(input?.hour) || 0))),
    minute: Math.max(0, Math.min(59, Math.floor(Number(input?.minute) || 0))),
  };
}
