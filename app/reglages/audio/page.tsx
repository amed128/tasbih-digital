"use client";

import { useSyncExternalStore } from "react";
import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../../components/BottomNav";
import { useTasbihStore } from "../../../store/tasbihStore";
import type {
  SpeechTolerance,
  SpeechRecognitionLanguage,
  ChipTextFormat,
} from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";

export default function AudioSettingsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
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
  const setAudioDebugTelemetry = useTasbihStore((s) => s.setAudioDebugTelemetry);

  const t = useT();

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
            <Link href="/reglages" className="hover:text-[var(--foreground)] flex items-center gap-1">
              <Settings className="inline-block w-4 h-4 mr-1" />
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.audioCounterSettingsTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("settings.audioCounterSettingsTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("settings.audioCounterSettingsHint")}
          </p>
        </header>

        <Link
          href="/reglages/audio/advanced"
          className="flex items-center justify-between rounded-2xl bg-[var(--card)] px-4 py-3"
        >
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {t("settings.audioCounterAdvancedSettingsTitle")}
            </div>
            <div className="text-xs text-[var(--secondary)]">
              {t("settings.audioCounterAdvancedSettingsHint")}
            </div>
          </div>
          <span className="text-base text-[var(--secondary)]">›</span>
        </Link>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.speechToleranceTitle")}
              </div>
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
              <div className="text-xs text-[var(--secondary)]">{t("settings.audioSilenceTimeoutHint")}</div>
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
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
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
              <div className="text-xs text-[var(--secondary)]">{t("settings.audioStopOnSilenceHint")}</div>
            </div>
            <button
              type="button"
              onClick={() => setAudioStopOnSilence(!preferences.audioStopOnSilence)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.audioStopOnSilence
                  ? "bg-[var(--primary)] text-black"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
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
                setBlurActionControlsWhileListening(!preferences.blurActionControlsWhileListening)
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.blurActionControlsWhileListening
                  ? "bg-[var(--primary)] text-black"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
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
              <div className="text-xs text-[var(--secondary)]">{t("settings.chipTextFormatHint")}</div>
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
              <div className="text-sm font-semibold text-[var(--foreground)]">
                {t("settings.audioDebugTelemetryTitle")}
              </div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.audioDebugTelemetryHint")}</div>
            </div>
            <button
              type="button"
              onClick={() => setAudioDebugTelemetry(!preferences.audioDebugTelemetry)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.audioDebugTelemetry
                  ? "bg-[var(--primary)] text-black"
                  : "border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
              }`}
            >
              {preferences.audioDebugTelemetry ? t("settings.on") : t("settings.off")}
            </button>
          </div>
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}
