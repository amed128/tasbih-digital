"use client";

import { useTasbihStore } from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";
import { useState } from "react";

export default function AutoCounterSettings() {
  const t = useT();
  const preferences = useTasbihStore((s) => s.preferences);
  const setAutoAdvanceNextZikr = useTasbihStore((s) => s.setAutoAdvanceNextZikr);
  // New setters to be implemented in tasbihStore
  const setAutoCounterDefaultEnabled = useTasbihStore((s) => s.setAutoCounterDefaultEnabled);
  const setAutoCounterDefaultSpeed = useTasbihStore((s) => s.setAutoCounterDefaultSpeed);
  const setAutoCounterResumeAfterReset = useTasbihStore((s) => s.setAutoCounterResumeAfterReset);
  const setAutoCounterStopAtGoal = useTasbihStore((s) => s.setAutoCounterStopAtGoal);
  const setAutoCounterEntryAutoStart = useTasbihStore((s) => s.setAutoCounterEntryAutoStart);
  const setBlurActionControlsWhileAuto = useTasbihStore((s) => s.setBlurActionControlsWhileAuto);
  const setAutoCounterConfirmOnStop = useTasbihStore((s) => s.setAutoCounterConfirmOnStop);
  const setAutoCounterSoundOnTick = useTasbihStore((s) => s.setAutoCounterSoundOnTick);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-xl font-bold">{t("autoCounterSettingsTitle")}</h1>
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoCounterDefaultEnabled}
            onChange={e => setAutoCounterDefaultEnabled(e.target.checked)}
          />
          {t("autoCounterDefaultEnabledTitle")}
        </label>
        <label className="flex items-center gap-2">
          <span>{t("autoCounterDefaultSpeedTitle")}</span>
          <select
            value={preferences.autoCounterDefaultSpeed}
            onChange={e => setAutoCounterDefaultSpeed(Number(e.target.value))}
          >
            <option value={500}>0.5s</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoCounterResumeAfterReset}
            onChange={e => setAutoCounterResumeAfterReset(e.target.checked)}
          />
          {t("autoCounterResumeAfterResetTitle")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoCounterStopAtGoal}
            onChange={e => setAutoCounterStopAtGoal(e.target.checked)}
          />
          {t("autoCounterStopAtGoalTitle")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoCounterEntryAutoStart}
            onChange={e => setAutoCounterEntryAutoStart(e.target.checked)}
          />
          {t("autoCounterEntryAutoStartTitle")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.blurActionControlsWhileAuto}
            onChange={e => setBlurActionControlsWhileAuto(e.target.checked)}
          />
          {t("blurActionControlsWhileAutoTitle")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoCounterConfirmOnStop}
            onChange={e => setAutoCounterConfirmOnStop(e.target.checked)}
          />
          {t("autoCounterConfirmOnStopTitle")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoCounterSoundOnTick}
            onChange={e => setAutoCounterSoundOnTick(e.target.checked)}
          />
          {t("autoCounterSoundOnTickTitle")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preferences.autoAdvanceNextZikr}
            onChange={e => setAutoAdvanceNextZikr(e.target.checked)}
          />
          {t("autoAdvanceTitle")}
        </label>
      </div>
    </div>
  );
}
