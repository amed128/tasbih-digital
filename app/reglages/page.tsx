"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useTasbihStore } from "../../store/tasbihStore";
import type { Theme } from "../../store/tasbihStore";
import type { TapSound } from "../../store/tasbihStore";
import { BottomNav } from "../../components/BottomNav";
import { useT } from "@/hooks/useT";

export default function ReglagesPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const setTheme = useTasbihStore((s) => s.setTheme);
  const toggleVibration = useTasbihStore((s) => s.toggleVibration);
  const toggleConfetti = useTasbihStore((s) => s.toggleConfetti);
  const setTapSound = useTasbihStore((s) => s.setTapSound);
  const setLanguage = useTasbihStore((s) => s.setLanguage);
  const t = useT();

  const soundOptions: { value: TapSound; label: string }[] = [
    { value: "off", label: t("settings.soundOff") },
    { value: "tap-soft", label: t("settings.soundSoft") },
    { value: "button-click", label: t("settings.soundClick") },
    { value: "haptic-pulse", label: t("settings.soundPulse") },
  ];

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
    { value: "blue", label: t("settings.themeBlue") },
  ];

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
          <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.langTitle")}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setLanguage("fr")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.language === "fr"
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.language === "en"
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              EN
            </button>
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-[var(--secondary)]">
          {t("settings.version")}
        </div>
      </motion.main>

      <BottomNav />
    </div>
  );
}
