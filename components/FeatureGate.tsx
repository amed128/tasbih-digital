"use client";

import type { ReactNode } from "react";
import type { FeatureAvailability } from "@/lib/featureAvailability";

type FeatureGateProps = {
  availability: FeatureAvailability;
  /** Rendered when status is "available" */
  available: ReactNode;
  /** Rendered when status is "permission-required". Falls back to `available` if omitted. */
  permissionRequired?: ReactNode;
  /** Rendered when status is "limited". Falls back to `available` if omitted. */
  limited?: ReactNode;
  /** Rendered when status is "unsupported". Renders nothing if omitted. */
  unsupported?: ReactNode;
};

/**
 * Renders different content based on a feature's runtime availability.
 *
 * Usage:
 * ```tsx
 * <FeatureGate
 *   availability={useFeatureAvailability("vibration")}
 *   available={<VibrationToggle />}
 *   limited={<VibrationToggle note="May vary by browser" />}
 *   unsupported={<DisabledRow label="Vibration" />}
 * />
 * ```
 */
export function FeatureGate({
  availability,
  available,
  permissionRequired,
  limited,
  unsupported,
}: FeatureGateProps) {
  switch (availability.status) {
    case "available":
      return <>{available}</>;
    case "permission-required":
      return <>{permissionRequired ?? available}</>;
    case "limited":
      return <>{limited ?? available}</>;
    case "unsupported":
      return <>{unsupported ?? null}</>;
  }
}
