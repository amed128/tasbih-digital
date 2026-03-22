"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useTasbihStore } from "../../store/tasbihStore";
import type { Theme, ReminderTime } from "../../store/tasbihStore";
import type { TapSound } from "../../store/tasbihStore";
import type { SpeechTolerance } from "../../store/tasbihStore";
import type { SpeechRecognitionLanguage } from "../../store/tasbihStore";
import type { ChipTextFormat } from "../../store/tasbihStore";
import {
  TASBIH_STORAGE_KEY,
  createBackupPayload,
  parseBackupPayload,
} from "../../store/tasbihStore";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";
import { useFeatureAvailability } from "@/hooks/useFeatureAvailability";
import Link from "next/link";

const timeToString = (rt: ReminderTime) =>
  `${String(rt.hour).padStart(2, "0")}:${String(rt.minute).padStart(2, "0")}`;

const stringToTime = (s: string): ReminderTime => {
  const [h, m] = s.split(":").map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
};

export default function ReglagesPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const wakeLockAvail = useFeatureAvailability("wakeLock");

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const setTheme = useTasbihStore((s) => s.setTheme);
  const toggleVibration = useTasbihStore((s) => s.toggleVibration);
  const setWakeLockEnabled = useTasbihStore((s) => s.setWakeLockEnabled);
  const toggleConfetti = useTasbihStore((s) => s.toggleConfetti);
  const setTapSound = useTasbihStore((s) => s.setTapSound);
  const setSpeechTolerance = useTasbihStore((s) => s.setSpeechTolerance);
  const setSpeechRecognitionLanguage = useTasbihStore((s) => s.setSpeechRecognitionLanguage);
  const setAudioSilenceTimeoutSec = useTasbihStore((s) => s.setAudioSilenceTimeoutSec);
  const setAudioTranscriptClearDelaySec = useTasbihStore((s) => s.setAudioTranscriptClearDelaySec);
  const setBlurActionControlsWhileListening = useTasbihStore(
    (s) => s.setBlurActionControlsWhileListening
  );
  const setChipTextFormat = useTasbihStore((s) => s.setChipTextFormat);
  const setAudioClearTranscriptOnSilence = useTasbihStore(
    (s) => s.setAudioClearTranscriptOnSilence
  );
  const setAudioStopOnSilence = useTasbihStore((s) => s.setAudioStopOnSilence);
  const setLanguage = useTasbihStore((s) => s.setLanguage);
  const setRemindersEnabled = useTasbihStore((s) => s.setRemindersEnabled);
  const setReminderTimes = useTasbihStore((s) => s.setReminderTimes);
  const setOptionalSyncEnabled = useTasbihStore((s) => s.setOptionalSyncEnabled);
  const resetPreferences = useTasbihStore((s) => s.resetPreferences);
  const t = useT();
  const [syncCode, setSyncCode] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [permissionResetPending, setPermissionResetPending] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => {
    if (typeof window === "undefined" || typeof Notification === "undefined") {
      return "unsupported";
    }
    return Notification.permission;
  });

  const soundOptions: { value: TapSound; label: string }[] = [
    { value: "off", label: t("settings.soundOff") },
    { value: "tap-soft", label: t("settings.soundSoft") },
    { value: "button-click", label: t("settings.soundClick") },
    { value: "haptic-pulse", label: t("settings.soundPulse") },
  ];

  const speechToleranceOptions: { value: SpeechTolerance; label: string }[] = [
    { value: "strict", label: t("settings.speechToleranceStrict") },
    { value: "balanced", label: t("settings.speechToleranceBalanced") },
    { value: "tolerant", label: t("settings.speechToleranceTolerant") },
  ];

  const speechRecognitionLanguageOptions: {
    value: SpeechRecognitionLanguage;
    label: string;
  }[] = [
    { value: "ar-SA", label: t("settings.speechRecognitionLanguageArSa") },
    { value: "ar-EG", label: t("settings.speechRecognitionLanguageArEg") },
    { value: "ar-MA", label: t("settings.speechRecognitionLanguageArMa") },
    { value: "fr-FR", label: t("settings.speechRecognitionLanguageFrFr") },
    { value: "en-US", label: t("settings.speechRecognitionLanguageEnUs") },
  ];

  const audioSilenceTimeoutOptions = [15, 30, 45, 60, 90, 120];
  const audioTranscriptClearDelayOptions = [0, 2, 3, 5];
  const chipTextFormatOptions: { value: ChipTextFormat; label: string }[] = [
    { value: "transliteration", label: t("settings.chipTextFormatTransliteration") },
    { value: "arabic", label: t("settings.chipTextFormatArabic") },
    { value: "both", label: t("settings.chipTextFormatBoth") },
  ];

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
    { value: "blue", label: t("settings.themeBlue") },
  ];

  const wakeLockToggleDisabled = wakeLockAvail.status !== "available";

  const applyThemeToDom = (theme: Theme) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body?.setAttribute("data-theme", theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const metaColor =
        theme === "light" ? "#F3F5F8" : theme === "dark" ? "#0A0A0A" : "#0B1118";
      themeMeta.setAttribute("content", metaColor);
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    applyThemeToDom(theme);
  };

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    setPermissionResetPending(false);
    if (Notification.permission === "denied") {
      setNotificationPermission("denied");
      window.alert(t("settings.remindersPermissionDeniedHelp"));
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const sendTestNotification = async () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const body =
      preferences.language === "fr"
        ? "Rappel de zikr: qu'Allah accepte vos invocations."
        : "Zikr reminder: may Allah accept your invocations.";
    try {
      if (navigator.serviceWorker?.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification("Tasbih Digital", { body, tag: "tasbih-test-reminder" });
      } else {
        new Notification("Tasbih Digital", { body, tag: "tasbih-test-reminder" });
      }
    } catch {
      // ignore
    }
  };

  const encodeSyncCode = (value: string) => {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  };

  const decodeSyncCode = (value: string) => {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const handleGenerateSyncCode = () => {
    const payload = createBackupPayload();
    const code = encodeSyncCode(JSON.stringify(payload));
    setSyncCode(code);
    setSyncMessage("");
  };

  const handleCopySyncCode = async () => {
    if (!syncCode) return;
    await navigator.clipboard.writeText(syncCode);
    setSyncMessage(t("settings.syncCopied"));
  };

  const handleImportSyncCode = () => {
    try {
      const decoded = decodeSyncCode(syncCode.trim());
      const parsed = parseBackupPayload(decoded);
      if (!parsed.ok) {
        setSyncMessage(t("settings.syncInvalid"));
        return;
      }
      window.localStorage.setItem(TASBIH_STORAGE_KEY, JSON.stringify(parsed.state));
      setSyncMessage(t("settings.syncImported"));
      window.setTimeout(() => window.location.reload(), 400);
    } catch {
      setSyncMessage(t("settings.syncInvalid"));
    }
  };

  const handleRestoreDefaultSettings = () => {
    resetPreferences();
    applyThemeToDom("light");
    setNotificationPermission("default");
    setPermissionResetPending(true);
    setSyncCode("");
    setSyncMessage("");
    setShowRestoreConfirm(false);
  };

  const effectiveNotificationPermission: NotificationPermission | "unsupported" =
    permissionResetPending && notificationPermission !== "unsupported"
      ? "default"
      : notificationPermission;

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
          <h1 className="text-xl font-semibold text-[var(--foreground)]">{t("settings.title")}</h1>
          <p className="text-sm text-[var(--secondary)]">{t("settings.subtitle")}</p>
        </header>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.themeTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.themeHint")}</div>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaTheme")}
            >
              {themeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.soundTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.soundHint")}
              </div>
            </div>
            <select
              value={preferences.tapSound}
              onChange={(e) => setTapSound(e.target.value as TapSound)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaSound")}
            >
              {soundOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.speechToleranceTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.speechToleranceHint")}</div>
            </div>
            <select
              value={preferences.speechTolerance}
              onChange={(e) => setSpeechTolerance(e.target.value as SpeechTolerance)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaSpeechTolerance")}
            >
              {speechToleranceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.speechRecognitionLanguageTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.speechRecognitionLanguageHint")}
              </div>
            </div>
            <select
              value={preferences.speechRecognitionLanguage}
              onChange={(e) =>
                setSpeechRecognitionLanguage(e.target.value as SpeechRecognitionLanguage)
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaSpeechRecognitionLanguage")}
            >
              {speechRecognitionLanguageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.audioSilenceTimeoutTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.audioSilenceTimeoutHint")}
              </div>
            </div>
            <select
              value={preferences.audioSilenceTimeoutSec}
              onChange={(e) => setAudioSilenceTimeoutSec(Number(e.target.value) || 15)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaAudioSilenceTimeout")}
            >
              {audioSilenceTimeoutOptions.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {t("settings.audioSilenceTimeoutOption", { seconds })}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.audioClearTranscriptOnSilenceTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.audioClearTranscriptOnSilenceHint")}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setAudioClearTranscriptOnSilence(!preferences.audioClearTranscriptOnSilence)
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.audioClearTranscriptOnSilence
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.audioClearTranscriptOnSilence ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.audioStopOnSilenceTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.audioStopOnSilenceHint")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAudioStopOnSilence(!preferences.audioStopOnSilence)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.audioStopOnSilence
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.audioStopOnSilence ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.audioTranscriptClearDelayTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.audioTranscriptClearDelayHint")}
              </div>
            </div>
            <select
              value={preferences.audioTranscriptClearDelaySec}
              onChange={(e) => setAudioTranscriptClearDelaySec(Number(e.target.value) || 0)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaAudioTranscriptClearDelay")}
            >
              {audioTranscriptClearDelayOptions.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds === 0
                    ? t("settings.audioTranscriptClearDelayOff")
                    : t("settings.audioTranscriptClearDelayOption", { seconds })}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.blurActionControlsWhileListeningTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.blurActionControlsWhileListeningHint")}
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setBlurActionControlsWhileListening(
                  !preferences.blurActionControlsWhileListening
                )
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.blurActionControlsWhileListening
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.blurActionControlsWhileListening ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.chipTextFormatTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">
                {t("settings.chipTextFormatHint")}
              </div>
            </div>
            <select
              value={preferences.chipTextFormat}
              onChange={(e) => setChipTextFormat(e.target.value as ChipTextFormat)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaChipTextFormat")}
            >
              {chipTextFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.vibrationTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">
                {isIOS ? t("settings.vibrationIOS") : t("settings.vibrationHint")}
              </div>
            </div>
            <button
              onClick={toggleVibration}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.vibration
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.vibration ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.wakeLockTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">
                {wakeLockToggleDisabled ? t("settings.wakeLockLimitedHint") : t("settings.wakeLockHint")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWakeLockEnabled(!preferences.wakeLockEnabled)}
              disabled={wakeLockToggleDisabled}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.wakeLockEnabled
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              } ${wakeLockToggleDisabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {preferences.wakeLockEnabled ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.confettiTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.confettiHint")}</div>
            </div>
            <button
              onClick={toggleConfetti}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.confetti
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.confetti ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.remindersTitle")}</div>
          <div className="mt-1 text-xs text-[var(--secondary)]">{t("settings.remindersHint")}</div>

          <div className="mt-3 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                void requestNotificationPermission();
              }}
              disabled={effectiveNotificationPermission === "granted"}
              className={`self-start rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition ${
                effectiveNotificationPermission === "granted"
                  ? "cursor-not-allowed bg-[var(--background)] text-[var(--secondary)] opacity-50"
                  : "bg-[var(--background)] text-[var(--foreground)]"
              }`}
            >
              {t("settings.remindersAskPermission")}
            </button>
            <span className="text-xs text-[var(--secondary)]">
              {effectiveNotificationPermission === "granted"
                ? t("settings.remindersPermissionGrantedStatus")
                : t("settings.remindersPermissionNotGrantedStatus")}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--foreground)]">{t("settings.remindersEnabled")}</span>
            <button
              type="button"
              onClick={() => {
                if (effectiveNotificationPermission !== "granted") {
                  setRemindersEnabled(false);
                  return;
                }
                const nextEnabled = !preferences.remindersEnabled;
                setRemindersEnabled(nextEnabled);
                if (nextEnabled && preferences.reminderTimes.length === 0) {
                  setReminderTimes([{ hour: 8, minute: 0 }]);
                }
              }}
              disabled={effectiveNotificationPermission !== "granted"}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.remindersEnabled
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              } ${effectiveNotificationPermission !== "granted" ? "cursor-not-allowed opacity-50" : ""}`}
            >
              {preferences.remindersEnabled ? t("settings.on") : t("settings.off")}
            </button>
          </div>

          {preferences.remindersEnabled ? (
            <>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-[var(--foreground)]">{t("settings.remindersScheduleDaily")}</span>
                <input
                  type="time"
                  value={timeToString(preferences.reminderTimes[0] ?? { hour: 8, minute: 0 })}
                  onChange={(e) => {
                    const next = stringToTime(e.target.value);
                    setReminderTimes([next]);
                  }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            </>
          ) : null}

          <div className="mt-3">
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={notificationPermission !== "granted"}
              className={`w-full rounded-xl px-4 py-2 text-sm font-semibold ${
                notificationPermission === "granted"
                  ? "bg-[var(--primary)] text-black"
                  : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)] opacity-50"
              }`}
            >
              {t("settings.remindersTest")}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.syncTitle")}</div>
          <div className="mt-1 text-xs text-[var(--secondary)]">{t("settings.syncHint")}</div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--foreground)]">{t("settings.syncEnable")}</span>
            <button
              type="button"
              onClick={() => setOptionalSyncEnabled(!preferences.optionalSyncEnabled)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.optionalSyncEnabled
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              {preferences.optionalSyncEnabled ? t("settings.on") : t("settings.off")}
            </button>
          </div>

          {preferences.optionalSyncEnabled ? (
            <>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateSyncCode}
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                >
                  {t("settings.syncGenerate")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopySyncCode();
                  }}
                  disabled={!syncCode}
                  className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold ${
                    syncCode
                      ? "bg-[var(--primary)] text-black"
                      : "cursor-not-allowed border border-[var(--border)] bg-[var(--background)] text-[var(--secondary)]"
                  }`}
                >
                  {t("settings.syncCopy")}
                </button>
              </div>

              <textarea
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                placeholder={t("settings.syncPlaceholder")}
                className="mt-3 min-h-[90px] w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              />

              <button
                type="button"
                onClick={handleImportSyncCode}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("settings.syncImport")}
              </button>

              {syncMessage ? <div className="mt-2 text-xs text-[var(--secondary)]">{syncMessage}</div> : null}
            </>
          ) : null}
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.langTitle")}</div>
            <select
              value={preferences.language}
              onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaLanguage")}
            >
              <option value="en">{t("settings.languageEnglish")}</option>
              <option value="fr">{t("settings.languageFrench")}</option>
            </select>
          </div>
        </section>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowRestoreConfirm(true)}
            className="rounded-xl border border-[#A5D6A7] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[#2E7D32] transition hover:border-[#2E7D32]"
          >
            {t("settings.restoreDefaults")}
          </button>
        </div>

        <Link
          href="/about"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("about.settingsLink")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("about.settingsHint")}
            </div>
          </div>
          <span className="text-[var(--secondary)] text-base">›</span>
        </Link>

        <div className="mt-2 text-center text-xs text-[var(--secondary)]">
          {t("settings.version")}
        </div>
      </motion.main>

      {showRestoreConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {t("settings.restoreDefaultsConfirmTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--secondary)]">
              {t("settings.restoreDefaultsConfirmBody")}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
              >
                {t("settings.restoreDefaultsConfirmCancel")}
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaultSettings}
                className="flex-1 rounded-xl border border-[#A5D6A7] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[#2E7D32]"
              >
                {t("settings.restoreDefaultsConfirmConfirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </div>
  );
}
