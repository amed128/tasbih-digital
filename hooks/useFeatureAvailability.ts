import { useMemo } from "react";
import type { FeatureKey, FeatureAvailability } from "@/lib/featureAvailability";
import { getFeatureAvailability } from "@/lib/featureAvailability";

export function useFeatureAvailability(feature: FeatureKey): FeatureAvailability {
  return useMemo(() => {
    if (typeof window === "undefined") {
      return { status: "unsupported" as const };
    }
    return getFeatureAvailability(feature);
  }, [feature]);
}
