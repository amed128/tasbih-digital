"use client";

import { useTasbihStore } from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AutoCounterEntry() {
  const t = useT();
  const router = useRouter();
  const preferences = useTasbihStore((s) => s.preferences);
  const setAutoCounterDefaultEnabled = useTasbihStore((s) => s.setAutoCounterDefaultEnabled);
  const setAutoCounterDefaultSpeed = useTasbihStore((s) => s.setAutoCounterDefaultSpeed);
  const [enabled, setEnabled] = useState(preferences.autoCounterDefaultEnabled);
  const [speed, setSpeed] = useState(preferences.autoCounterDefaultSpeed);

  const handleStart = () => {
    setAutoCounterDefaultEnabled(enabled);
    setAutoCounterDefaultSpeed(speed);
    // Navigate to zikr/counter page (adjust route as needed)
    router.push("/counter");
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-2">{t("autoCounterEntryTitle")}</h1>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            id="auto-enable"
          />
          <label htmlFor="auto-enable">{t("autoCounterDefaultEnabledTitle")}</label>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="auto-speed">{t("autoCounterDefaultSpeedTitle")}</label>
          <select
            id="auto-speed"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          >
            <option value={500}>0.5s</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {t("autoCounterEntrySummary")}
        </div>
        <button
          className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2 text-white font-semibold"
          onClick={handleStart}
        >
          {t("autoCounterEntryStart")}
        </button>
      </div>
    </div>
  );
}
