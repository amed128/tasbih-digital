"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../../../components/BottomNav";
import { useTasbihStore } from "../../../../store/tasbihStore";
import { useT } from "@/hooks/useT";

export default function AdvancedAudioSettingsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const setAdvancedTiming = useTasbihStore((s) => s.setAdvancedTiming);
  const createCustomProfile = useTasbihStore((s) => s.createCustomProfile);
  const deleteCustomProfile = useTasbihStore((s) => s.deleteCustomProfile);
  const setActiveCustomProfile = useTasbihStore((s) => s.setActiveCustomProfile);

  const [showAdvancedTiming, setShowAdvancedTiming] = useState(true);
  const [showCustomProfiles, setShowCustomProfiles] = useState(true);
  const [customProfileName, setCustomProfileName] = useState("");
  const [customProfileCooldown, setCustomProfileCooldown] = useState(800);
  const [customProfileRearm, setCustomProfileRearm] = useState(0.28);

  const t = useT();

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
          <Link href="/reglages/audio" className="mb-1 text-sm font-medium text-[var(--primary)]">
            {t("about.back")}
          </Link>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
            <Link href="/reglages" className="hover:text-[var(--foreground)] flex items-center gap-1">
              <span className="inline-block mr-1">⚙️</span>
              {t("settings.title")}
            </Link>
            <span>/</span>
            <Link href="/reglages/audio" className="hover:text-[var(--foreground)]">
              {t("settings.audioCounterSettingsTitle")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.audioCounterAdvancedSettingsTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("settings.audioCounterAdvancedSettingsTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("settings.audioCounterAdvancedSettingsHint")}
          </p>
        </header>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <button
            type="button"
            onClick={() => setShowAdvancedTiming(!showAdvancedTiming)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {t("settings.advancedTimingTitle")}
                </div>
                <div className="text-xs text-[var(--secondary)]">
                  {t("settings.advancedTimingHint")}
                </div>
              </div>
              <div className="text-lg">{showAdvancedTiming ? "▼" : "▶"}</div>
            </div>
          </button>

          {showAdvancedTiming && (
            <div className="mt-4 flex flex-col gap-4 border-t border-[var(--border)] pt-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.advancedTiming?.enabled ?? false}
                  onChange={(e) =>
                    setAdvancedTiming({
                      enabled: e.target.checked,
                      cooldownMs: preferences.advancedTiming?.cooldownMs,
                      rearmProgress: preferences.advancedTiming?.rearmProgress,
                    })
                  }
                  className="h-5 w-5 accent-[var(--primary)]"
                />
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {t("settings.advancedTimingEnable")}
                </span>
              </label>

              {preferences.advancedTiming?.enabled && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[var(--secondary)]">
                      {t("settings.advancedTimingCooldownLabel", {
                        value: preferences.advancedTiming.cooldownMs ?? 800,
                      })}
                    </label>
                    <input
                      type="range"
                      min={300}
                      max={2000}
                      step={100}
                      value={preferences.advancedTiming.cooldownMs ?? 800}
                      onChange={(e) =>
                        setAdvancedTiming({
                          enabled: true,
                          cooldownMs: Number(e.target.value),
                          rearmProgress: preferences.advancedTiming?.rearmProgress,
                        })
                      }
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--secondary)]">
                      {t("settings.advancedTimingRearmLabel", {
                        value: (preferences.advancedTiming.rearmProgress ?? 0.28).toFixed(2),
                      })}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={preferences.advancedTiming.rearmProgress ?? 0.28}
                      onChange={(e) =>
                        setAdvancedTiming({
                          enabled: true,
                          cooldownMs: preferences.advancedTiming?.cooldownMs,
                          rearmProgress: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <button
            type="button"
            onClick={() => setShowCustomProfiles(!showCustomProfiles)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-[var(--foreground)]">
                  {t("settings.customProfilesTitle")}
                </div>
                <div className="text-xs text-[var(--secondary)]">
                  {t("settings.customProfilesHint")}
                </div>
              </div>
              <div className="text-lg">{showCustomProfiles ? "▼" : "▶"}</div>
            </div>
          </button>

          {showCustomProfiles && (
            <div className="mt-4 flex flex-col gap-4 border-t border-[var(--border)] pt-4">
              {preferences.customProfiles && preferences.customProfiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-[var(--secondary)]">
                    {t("settings.customProfilesActiveLabel")}
                  </div>
                  <select
                    value={preferences.activeCustomProfileId ?? ""}
                    onChange={(e) => setActiveCustomProfile(e.target.value || undefined)}
                    className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)]"
                  >
                    <option value="">{t("settings.customProfilesUseBuiltIn")}</option>
                    {preferences.customProfiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-[var(--secondary)]">
                  {t("settings.customProfilesNameLabel")}
                </div>
                <input
                  type="text"
                  value={customProfileName}
                  onChange={(e) => setCustomProfileName(e.target.value)}
                  placeholder={t("settings.customProfilesNamePlaceholder")}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!customProfileName.trim()) return;
                  createCustomProfile({
                    name: customProfileName,
                    allowPartial: true,
                    minOrderedCoverage: 0.65,
                    minOrderedWords: 1,
                    enableNearMissShortcut: true,
                    partialMinLengthRatio: 0.6,
                    nearMissMaxLengthDiff: 1,
                    cooldownMs: customProfileCooldown,
                    rearmProgress: customProfileRearm,
                  });
                  setCustomProfileName("");
                  setCustomProfileCooldown(800);
                  setCustomProfileRearm(0.28);
                }}
                className="rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-[var(--card)]"
              >
                {t("settings.customProfilesCreate")}
              </button>

              {preferences.customProfiles && preferences.customProfiles.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-2">
                  {preferences.customProfiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium text-[var(--foreground)]">{profile.name}</span>
                      <button
                        type="button"
                        onClick={() => deleteCustomProfile(profile.id)}
                        className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                      >
                        {t("settings.customProfilesDelete")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </motion.main>

      <BottomNav />
    </div>
  );
}
