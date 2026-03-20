/**
 * Feature availability resolver.
 *
 * Combines platform classification + capability probes into a single
 * FeatureAvailability result for each product feature.
 *
 * The `reason` field is an internal English description for debugging.
 * User-facing messages must be resolved via translations in the UI layer.
 */

import { getPlatform } from "./platform";
import {
  supportsVibration,
  supportsNotifications,
  supportsWakeLock,
  supportsShare,
} from "./capabilities";

export type FeatureStatus =
  | "available"
  | "permission-required"
  | "limited"
  | "unsupported";

export type FeatureAvailability = {
  status: FeatureStatus;
  reason?: string;
};

export type FeatureKey = "vibration" | "notifications" | "wakeLock" | "share";

export function getVibrationAvailability(): FeatureAvailability {
  const platform = getPlatform();
  if (platform === "ios") {
    return { status: "limited", reason: "Limited on iOS Safari" };
  }
  if (supportsVibration()) {
    return { status: "available" };
  }
  return { status: "unsupported", reason: "Vibration API not supported in this browser" };
}

export function getNotificationAvailability(): FeatureAvailability {
  const platform = getPlatform();
  if (platform === "ios") {
    return { status: "limited", reason: "Notifications limited on iOS PWA" };
  }
  if (!supportsNotifications()) {
    return { status: "unsupported", reason: "Notifications not supported in this browser" };
  }
  const permission = (typeof Notification !== "undefined"
    ? Notification.permission
    : "default") as NotificationPermission;
  if (permission === "granted") {
    return { status: "available" };
  }
  if (permission === "denied") {
    return { status: "unsupported", reason: "Notification permission denied" };
  }
  return { status: "permission-required", reason: "Permission required to enable notifications" };
}

export function getWakeLockAvailability(): FeatureAvailability {
  if (supportsWakeLock()) {
    return { status: "available" };
  }
  return { status: "limited", reason: "Wake lock not supported in this browser" };
}

export function getShareAvailability(): FeatureAvailability {
  if (supportsShare()) {
    return { status: "available" };
  }
  return { status: "unsupported", reason: "Web Share API not available" };
}

export function getFeatureAvailability(feature: FeatureKey): FeatureAvailability {
  switch (feature) {
    case "vibration":
      return getVibrationAvailability();
    case "notifications":
      return getNotificationAvailability();
    case "wakeLock":
      return getWakeLockAvailability();
    case "share":
      return getShareAvailability();
  }
}
