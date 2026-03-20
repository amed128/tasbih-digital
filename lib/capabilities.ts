/**
 * Raw browser/runtime API support checks.
 *
 * Each function checks whether a specific API exists in the current environment.
 * These are pure capability probes — they do not check user permissions.
 */

export function supportsVibration(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function supportsNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function supportsServiceWorker(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

export function supportsWakeLock(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

export function supportsShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}
