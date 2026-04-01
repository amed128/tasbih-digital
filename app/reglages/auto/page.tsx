"use client";

import { useSyncExternalStore, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../../components/BottomNav";
import { useTasbihStore } from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";

export default function AutoCounterSettings() {
  const t = useT();
  const preferences = useTasbihStore((s) => s.preferences);
  const setAutoCounterDefaultEnabled = useTasbihStore((s) => s.setAutoCounterDefaultEnabled);
  const setAutoCounterDefaultSpeed = useTasbihStore((s) => s.setAutoCounterDefaultSpeed);
  // Track last custom value in state only
  const [lastCustomValue, setLastCustomValue] = useState(5);
  // For temporary input editing only
  const [inputValue, setInputValue] = useState<string>("");

  // Derive the displayed value for the input
  let customValue: number | "";
  if (![500, 1000, 2000].includes(preferences.autoCounterDefaultSpeed) && preferences.autoCounterDefaultSpeed) {
    customValue = inputValue !== "" ? Number(inputValue) : Math.floor(preferences.autoCounterDefaultSpeed / 1000);
  } else {
    customValue = inputValue !== "" ? Number(inputValue) : lastCustomValue;
  }
  const setAutoCounterResumeAfterReset = useTasbihStore((s) => s.setAutoCounterResumeAfterReset);
  const setAutoCounterStopAtGoal = useTasbihStore((s) => s.setAutoCounterStopAtGoal);
  const setAutoCounterEntryAutoStart = useTasbihStore((s) => s.setAutoCounterEntryAutoStart);
  const setBlurActionControlsWhileAuto = useTasbihStore((s) => s.setBlurActionControlsWhileAuto);
  const setAutoCounterConfirmOnStop = useTasbihStore((s) => s.setAutoCounterConfirmOnStop);
  const setAutoCounterSoundOnTick = useTasbihStore((s) => s.setAutoCounterSoundOnTick);
  const setAutoCounterWakeLock = useTasbihStore((s) => s.setAutoCounterWakeLock);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <motion.main
        className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex flex-col gap-1">
          <Link href="/reglages" className="mb-1 text-sm font-medium text-[var(--primary)]">
            {t("about.back")}
          </Link>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
            <Link href="/reglages" className="hover:text-[var(--foreground)]">
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.autoCounterSettingsTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("settings.autoCounterSettingsTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("settings.autoCounterSettingsHint")}
          </p>
        </header>
        {/* Enable auto-counter by default */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterDefaultEnabledTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterDefaultEnabledHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterDefaultEnabled(!preferences.autoCounterDefaultEnabled)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterDefaultEnabled
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterDefaultEnabled}
            aria-label={t("autoCounterDefaultEnabledTitle")}
          >
            {preferences.autoCounterDefaultEnabled ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Default auto-counter speed */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterDefaultSpeedTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterDefaultSpeedHint")}</div>
            </div>
            <select
              id="auto-speed"
              value={[500,1000,2000].includes(preferences.autoCounterDefaultSpeed) ? preferences.autoCounterDefaultSpeed : 'custom'}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setAutoCounterDefaultSpeed((lastCustomValue || 5) * 1000);
                  return;
                }
                // If leaving custom, store the last custom value
                if (!([500,1000,2000].includes(preferences.autoCounterDefaultSpeed))) {
                  setLastCustomValue(Number(customValue) || 5);
                }
                setAutoCounterDefaultSpeed(Number(e.target.value));
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value="custom">{t("settings.custom")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="custom-auto-speed" className="text-xs text-[var(--secondary)]">{t("settings.autoCounterCustomSpeedLabel")}</label>
              <input
                id="custom-auto-speed"
                type="number"
                min={1}
                max={120}
                step={1}
                pattern="[0-9]*"
                value={customValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  const val = Number(e.target.value);
                  if (!isNaN(val) && Number.isInteger(val) && val >= 1 && val <= 120) {
                    setLastCustomValue(val);
                    setAutoCounterDefaultSpeed(val * 1000);
                  } else if (e.target.value === "") {
                    setAutoCounterDefaultSpeed(0); // temp empty
                  }
                }}
                onBlur={e => {
                  const val = Number(e.target.value);
                  if (isNaN(val) || !Number.isInteger(val) || val < 1) {
                    setLastCustomValue(5);
                    setInputValue("5");
                    setAutoCounterDefaultSpeed(5000); // default to 5 seconds
                  } else {
                    setInputValue(""); // clear temp input after valid entry
                  }
                }}
                disabled={[500, 1000, 2000].includes(preferences.autoCounterDefaultSpeed)}
                className={`w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] ${[500,1000,2000].includes(preferences.autoCounterDefaultSpeed) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterMaxSpeedHint")}</div>
          </div>
        </section>

        {/* Resume auto-counter after reset/quit if goal was reached */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterResumeAfterResetTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterResumeAfterResetHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterResumeAfterReset(!preferences.autoCounterResumeAfterReset)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterResumeAfterReset
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterResumeAfterReset}
            aria-label={t("autoCounterResumeAfterResetTitle")}
          >
            {preferences.autoCounterResumeAfterReset ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Stop auto-counter when goal is reached */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterStopAtGoalTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterStopAtGoalHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterStopAtGoal(!preferences.autoCounterStopAtGoal)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterStopAtGoal
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterStopAtGoal}
            aria-label={t("autoCounterStopAtGoalTitle")}
          >
            {preferences.autoCounterStopAtGoal ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Start auto-counter immediately on entry */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterEntryAutoStartTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterEntryAutoStartHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterEntryAutoStart(!preferences.autoCounterEntryAutoStart)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterEntryAutoStart
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterEntryAutoStart}
            aria-label={t("autoCounterEntryAutoStartTitle")}
          >
            {preferences.autoCounterEntryAutoStart ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Blur/disable actions while auto-counter is running */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.blurActionControlsWhileAutoTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.blurActionControlsWhileAutoHint")}</div>
          </div>
          <button
            onClick={() => setBlurActionControlsWhileAuto(!preferences.blurActionControlsWhileAuto)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.blurActionControlsWhileAuto
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.blurActionControlsWhileAuto}
            aria-label={t("blurActionControlsWhileAutoTitle")}
          >
            {preferences.blurActionControlsWhileAuto ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Show confirmation before stopping auto-counter on reset/quit */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterConfirmOnStopTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterConfirmOnStopHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterConfirmOnStop(!preferences.autoCounterConfirmOnStop)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterConfirmOnStop
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterConfirmOnStop}
            aria-label={t("autoCounterConfirmOnStopTitle")}
          >
            {preferences.autoCounterConfirmOnStop ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Play sound/vibrate on each auto-increment */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterSoundOnTickTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterSoundOnTickHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterSoundOnTick(!preferences.autoCounterSoundOnTick)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterSoundOnTick
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterSoundOnTick}
            aria-label={t("autoCounterSoundOnTickTitle")}
          >
            {preferences.autoCounterSoundOnTick ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Wake lock toggle */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoCounterWakeLockTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoCounterWakeLockHint")}</div>
          </div>
          <button
            onClick={() => setAutoCounterWakeLock(!preferences.autoCounterWakeLock)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              preferences.autoCounterWakeLock
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
            aria-pressed={preferences.autoCounterWakeLock}
            aria-label={t("autoCounterWakeLockTitle")}
          >
            {preferences.autoCounterWakeLock ? t("settings.on") : t("settings.off")}
          </button>
        </section>
        <BottomNav />
      </motion.main>
    </div>
  );
}


