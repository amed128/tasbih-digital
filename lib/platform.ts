/**
 * Runtime environment classification.
 *
 * Used for user-facing messaging about feature availability.
 * Do not use this for hard feature gating — use lib/capabilities.ts instead.
 */

export type Platform = "ios" | "android" | "desktop" | "unknown";
export type RuntimeMode = "standalone" | "browser";

export function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Win|Mac|Linux/.test(navigator.platform ?? "")) return "desktop";
  return "unknown";
}

export function getRuntimeMode(): RuntimeMode {
  if (typeof window === "undefined") return "browser";
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true;
  return isStandalone ? "standalone" : "browser";
}

// True only inside the Capacitor native wrapper (iOS/Android app).
// Use this to gate features that require native APIs.
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}
