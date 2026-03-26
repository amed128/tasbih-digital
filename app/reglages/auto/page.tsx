"use client";

import { useSyncExternalStore, useRef, useState, useEffect } from "react";
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
  // Track last custom value in a ref so it persists even if user switches away from 'Custom'
  const lastCustomValueRef = useRef(5);
  const [customValue, setCustomValue] = useState(5);

  // Keep customValue in sync with preferences when switching to custom
  useEffect(() => {
    if (![500,1000,2000].includes(preferences.autoCounterDefaultSpeed) && preferences.autoCounterDefaultSpeed) {
      setCustomValue(Math.floor(preferences.autoCounterDefaultSpeed / 1000));
    } else if ([500,1000,2000].includes(preferences.autoCounterDefaultSpeed)) {
      setCustomValue(lastCustomValueRef.current || 5);
    }
  }, [preferences.autoCounterDefaultSpeed]);
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
              Settings
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">Auto-counter settings</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Auto-counter settings
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            Configure how the auto-counter behaves, including speed, start/stop conditions, and advanced options.
          </p>
        </header>
        {/* Enable auto-counter by default */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Enable auto-counter by default</div>
            <div className="text-xs text-[var(--secondary)]">Automatically enable auto-counter mode when starting a new session.</div>
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
            {preferences.autoCounterDefaultEnabled ? "On" : "Off"}
          </button>
        </section>

        {/* Default auto-counter speed */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">Default auto-counter speed</div>
              <div className="text-xs text-[var(--secondary)]">Set how fast the auto-counter increments (interval between counts).</div>
            </div>
            <select
              id="auto-speed"
              value={[500,1000,2000].includes(preferences.autoCounterDefaultSpeed) ? preferences.autoCounterDefaultSpeed : 'custom'}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setAutoCounterDefaultSpeed((lastCustomValueRef.current || 5) * 1000);
                  return;
                }
                // If leaving custom, store the last custom value
                if (!([500,1000,2000].includes(preferences.autoCounterDefaultSpeed))) {
                  lastCustomValueRef.current = customValue || 5;
                }
                setAutoCounterDefaultSpeed(Number(e.target.value));
              }}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="custom-auto-speed" className="text-xs text-[var(--secondary)]">Custom speed (seconds):</label>
              <input
                id="custom-auto-speed"
                type="number"
                min={1}
                max={120}
                step={1}
                pattern="[0-9]*"
                value={customValue}
                onChange={e => {
                  const val = Number(e.target.value);
                  setCustomValue(e.target.value === '' ? '' : val);
                  if (!isNaN(val) && Number.isInteger(val) && val >= 1 && val <= 120) {
                    lastCustomValueRef.current = val;
                    setAutoCounterDefaultSpeed(val * 1000);
                  } else if (e.target.value === '') {
                    setAutoCounterDefaultSpeed(0); // temp empty
                  }
                }}
                onBlur={e => {
                  if (![500,1000,2000].includes(preferences.autoCounterDefaultSpeed)) {
                    const val = Number(e.target.value);
                    if (isNaN(val) || !Number.isInteger(val) || val < 1) {
                      lastCustomValueRef.current = 5;
                      setCustomValue(5);
                      setAutoCounterDefaultSpeed(5000); // default to 5 seconds
                    }
                  }
                }}
                disabled={[500,1000,2000].includes(preferences.autoCounterDefaultSpeed)}
                className={`w-24 rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)] ${[500,1000,2000].includes(preferences.autoCounterDefaultSpeed) ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="text-xs text-[var(--secondary)]">Maximum: 120 seconds</div>
          </div>
        </section>

        {/* Resume auto-counter after reset/quit if goal was reached */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Resume after reset/quit if goal was reached</div>
            <div className="text-xs text-[var(--secondary)]">If enabled, auto-counter resumes automatically after reset or quit, but only if the previous goal was reached.</div>
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
            {preferences.autoCounterResumeAfterReset ? "On" : "Off"}
          </button>
        </section>

        {/* Stop auto-counter when goal is reached */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Stop auto-counter when goal is reached</div>
            <div className="text-xs text-[var(--secondary)]">Automatically stop counting when the set goal is reached.</div>
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
            {preferences.autoCounterStopAtGoal ? "On" : "Off"}
          </button>
        </section>

        {/* Start auto-counter immediately on entry */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Start auto-counter immediately on entry</div>
            <div className="text-xs text-[var(--secondary)]">Begin counting as soon as you enter auto-counter mode, without manual start.</div>
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
            {preferences.autoCounterEntryAutoStart ? "On" : "Off"}
          </button>
        </section>

        {/* Blur/disable actions while auto-counter is running */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Blur/disable actions while auto-counter is running</div>
            <div className="text-xs text-[var(--secondary)]">Prevent accidental actions by blurring or disabling controls during auto-counting.</div>
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
            {preferences.blurActionControlsWhileAuto ? "On" : "Off"}
          </button>
        </section>

        {/* Show confirmation before stopping auto-counter on reset/quit */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Show confirmation before stopping on reset/quit</div>
            <div className="text-xs text-[var(--secondary)]">Ask for confirmation before stopping the auto-counter when you reset or quit.</div>
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
            {preferences.autoCounterConfirmOnStop ? "On" : "Off"}
          </button>
        </section>

        {/* Play sound/vibrate on each auto-increment */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Play sound/vibrate on each auto-increment</div>
            <div className="text-xs text-[var(--secondary)]">Enable feedback (sound or vibration) for every auto-increment.</div>
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
            {preferences.autoCounterSoundOnTick ? "On" : "Off"}
          </button>
        </section>

        {/* Wake lock toggle */}
        <section className="rounded-2xl bg-[var(--card)] p-4 mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">Keep screen awake during auto-counter</div>
            <div className="text-xs text-[var(--secondary)]">Prevent your device from sleeping while auto-counter is active.</div>
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
            {preferences.autoCounterWakeLock ? "On" : "Off"}
          </button>
        </section>
        <BottomNav />
      </motion.main>
    </div>
  );
}


