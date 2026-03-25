"use client";

import { useSyncExternalStore } from "react";
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
            <span className="text-[var(--foreground)]">{t("autoCounterSettingsTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("autoCounterSettingsTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("autoCounterSettingsHint")}
          </p>
        </header>

        <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterDefaultEnabled}
              onChange={e => setAutoCounterDefaultEnabled(e.target.checked)}
              id="auto-enable"
            />
            <label htmlFor="auto-enable" className="text-sm font-medium">
              {t("autoCounterDefaultEnabledTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="auto-speed" className="text-sm font-medium">
              {t("autoCounterDefaultSpeedTitle")}
            </label>
            <select
              id="auto-speed"
              value={preferences.autoCounterDefaultSpeed}
              onChange={e => setAutoCounterDefaultSpeed(Number(e.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              <option value={500}>0.5s</option>
              <option value={1000}>1s</option>
              <option value={2000}>2s</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterResumeAfterReset}
              onChange={e => setAutoCounterResumeAfterReset(e.target.checked)}
              id="auto-resume-after-reset"
            />
            <label htmlFor="auto-resume-after-reset" className="text-sm font-medium">
              {t("autoCounterResumeAfterResetTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterStopAtGoal}
              onChange={e => setAutoCounterStopAtGoal(e.target.checked)}
              id="auto-stop-at-goal"
            />
            <label htmlFor="auto-stop-at-goal" className="text-sm font-medium">
              {t("autoCounterStopAtGoalTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterEntryAutoStart}
              onChange={e => setAutoCounterEntryAutoStart(e.target.checked)}
              id="auto-entry-autostart"
            />
            <label htmlFor="auto-entry-autostart" className="text-sm font-medium">
              {t("autoCounterEntryAutoStartTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.blurActionControlsWhileAuto}
              onChange={e => setBlurActionControlsWhileAuto(e.target.checked)}
              id="auto-blur-controls"
            />
            <label htmlFor="auto-blur-controls" className="text-sm font-medium">
              {t("blurActionControlsWhileAutoTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterConfirmOnStop}
              onChange={e => setAutoCounterConfirmOnStop(e.target.checked)}
              id="auto-confirm-on-stop"
            />
            <label htmlFor="auto-confirm-on-stop" className="text-sm font-medium">
              {t("autoCounterConfirmOnStopTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterSoundOnTick}
              onChange={e => setAutoCounterSoundOnTick(e.target.checked)}
              id="auto-sound-on-tick"
            />
            <label htmlFor="auto-sound-on-tick" className="text-sm font-medium">
              {t("autoCounterSoundOnTickTitle")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoCounterWakeLock}
              onChange={e => setAutoCounterWakeLock(e.target.checked)}
              id="auto-wakelock"
            />
            <label htmlFor="auto-wakelock" className="text-sm font-medium">
              {t("autoCounterWakeLockTitle")}
            </label>
          </div>
        </section>

        <BottomNav />
      </motion.main>
    </div>
  );
}


                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterDefaultEnabled}
                      onChange={e => setAutoCounterDefaultEnabled(e.target.checked)}
                      id="auto-enable"
                    />
                    <label htmlFor="auto-enable" className="text-sm font-medium">
                      {t("autoCounterDefaultEnabledTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="auto-speed" className="text-sm font-medium">
                      {t("autoCounterDefaultSpeedTitle")}
                    </label>
                    <select
                      id="auto-speed"
                      value={preferences.autoCounterDefaultSpeed}
                      onChange={e => setAutoCounterDefaultSpeed(Number(e.target.value))}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                    >
                      <option value={500}>0.5s</option>
                      <option value={1000}>1s</option>
                      <option value={2000}>2s</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterResumeAfterReset}
                      onChange={e => setAutoCounterResumeAfterReset(e.target.checked)}
                      id="auto-resume-after-reset"
                    />
                    <label htmlFor="auto-resume-after-reset" className="text-sm font-medium">
                      {t("autoCounterResumeAfterResetTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterStopAtGoal}
                      onChange={e => setAutoCounterStopAtGoal(e.target.checked)}
                      id="auto-stop-at-goal"
                    />
                    <label htmlFor="auto-stop-at-goal" className="text-sm font-medium">
                      {t("autoCounterStopAtGoalTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterEntryAutoStart}
                      onChange={e => setAutoCounterEntryAutoStart(e.target.checked)}
                      id="auto-entry-autostart"
                    />
                    <label htmlFor="auto-entry-autostart" className="text-sm font-medium">
                      {t("autoCounterEntryAutoStartTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.blurActionControlsWhileAuto}
                      onChange={e => setBlurActionControlsWhileAuto(e.target.checked)}
                      id="auto-blur-controls"
                    />
                    <label htmlFor="auto-blur-controls" className="text-sm font-medium">
                      {t("blurActionControlsWhileAutoTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterConfirmOnStop}
                      onChange={e => setAutoCounterConfirmOnStop(e.target.checked)}
                      id="auto-confirm-on-stop"
                    />
                    <label htmlFor="auto-confirm-on-stop" className="text-sm font-medium">
                      {t("autoCounterConfirmOnStopTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterSoundOnTick}
                      onChange={e => setAutoCounterSoundOnTick(e.target.checked)}
                      id="auto-sound-on-tick"
                    />
                    <label htmlFor="auto-sound-on-tick" className="text-sm font-medium">
                      {t("autoCounterSoundOnTickTitle")}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={preferences.autoCounterWakeLock}
                      onChange={e => setAutoCounterWakeLock(e.target.checked)}
                      id="auto-wakelock"
                    />
                    <label htmlFor="auto-wakelock" className="text-sm font-medium">
                      {t("autoCounterWakeLockTitle")}
                    </label>
                  </div>
                </section>

                <BottomNav />
              </motion.main>
            </div>
          );
                                  </h1>
                                  <p className="text-sm text-[var(--secondary)]">
                                    {t("autoCounterSettingsHint")}
                                  </p>
                                </header>

                                <section className="rounded-2xl bg-[var(--card)] p-4 flex flex-col gap-4">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterDefaultEnabled}
                                      onChange={e => setAutoCounterDefaultEnabled(e.target.checked)}
                                      id="auto-enable"
                                    />
                                    <label htmlFor="auto-enable" className="text-sm font-medium">
                                      {t("autoCounterDefaultEnabledTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <label htmlFor="auto-speed" className="text-sm font-medium">
                                      {t("autoCounterDefaultSpeedTitle")}
                                    </label>
                                    <select
                                      id="auto-speed"
                                      value={preferences.autoCounterDefaultSpeed}
                                      onChange={e => setAutoCounterDefaultSpeed(Number(e.target.value))}
                                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                                    >
                                      <option value={500}>0.5s</option>
                                      <option value={1000}>1s</option>
                                      <option value={2000}>2s</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterResumeAfterReset}
                                      onChange={e => setAutoCounterResumeAfterReset(e.target.checked)}
                                      id="auto-resume-after-reset"
                                    />
                                    <label htmlFor="auto-resume-after-reset" className="text-sm font-medium">
                                      {t("autoCounterResumeAfterResetTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterStopAtGoal}
                                      onChange={e => setAutoCounterStopAtGoal(e.target.checked)}
                                      id="auto-stop-at-goal"
                                    />
                                    <label htmlFor="auto-stop-at-goal" className="text-sm font-medium">
                                      {t("autoCounterStopAtGoalTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterEntryAutoStart}
                                      onChange={e => setAutoCounterEntryAutoStart(e.target.checked)}
                                      id="auto-entry-autostart"
                                    />
                                    <label htmlFor="auto-entry-autostart" className="text-sm font-medium">
                                      {t("autoCounterEntryAutoStartTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.blurActionControlsWhileAuto}
                                      onChange={e => setBlurActionControlsWhileAuto(e.target.checked)}
                                      id="auto-blur-controls"
                                    />
                                    <label htmlFor="auto-blur-controls" className="text-sm font-medium">
                                      {t("blurActionControlsWhileAutoTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterConfirmOnStop}
                                      onChange={e => setAutoCounterConfirmOnStop(e.target.checked)}
                                      id="auto-confirm-on-stop"
                                    />
                                    <label htmlFor="auto-confirm-on-stop" className="text-sm font-medium">
                                      {t("autoCounterConfirmOnStopTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterSoundOnTick}
                                      onChange={e => setAutoCounterSoundOnTick(e.target.checked)}
                                      id="auto-sound-on-tick"
                                    />
                                    <label htmlFor="auto-sound-on-tick" className="text-sm font-medium">
                                      {t("autoCounterSoundOnTickTitle")}
                                    </label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={preferences.autoCounterWakeLock}
                                      onChange={e => setAutoCounterWakeLock(e.target.checked)}
                                      id="auto-wakelock"
                                    />
                                    <label htmlFor="auto-wakelock" className="text-sm font-medium">
                                      {t("autoCounterWakeLockTitle")}
                                    </label>
                                  </div>
                                </section>

                    <BottomNav />
                  </motion.main>
                </div>
              );
            }

