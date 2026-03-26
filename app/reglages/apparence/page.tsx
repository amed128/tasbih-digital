"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Settings } from "lucide-react";
import { BottomNav } from "../../../components/BottomNav";
import { useTasbihStore } from "../../../store/tasbihStore";
import type { Theme, IconTheme } from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";

export default function AppearanceSettingsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const setTheme = useTasbihStore((s) => s.setTheme);
  const setIconTheme = useTasbihStore((s) => s.setIconTheme);
  const toggleConfetti = useTasbihStore((s) => s.toggleConfetti);

  const t = useT();

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t("settings.themeLight") },
    { value: "dark", label: t("settings.themeDark") },
    { value: "blue", label: t("settings.themeBlue") },
  ];

  const iconThemeOptions: { value: IconTheme; label: string }[] = [
    { value: "auto", label: t("settings.iconThemeAuto") },
    { value: "dark", label: t("settings.iconThemeDark") },
    { value: "blue", label: t("settings.iconThemeBlue") },
    { value: "light", label: t("settings.iconThemeLight") },
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
          <Link href="/reglages" className="mb-1 text-sm font-medium text-[var(--primary)]">
            {t("about.back")}
          </Link>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
            <Link href="/reglages" className="hover:text-[var(--foreground)] flex items-center gap-1">
              <Settings className="inline-block w-4 h-4 mr-1" />
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.appearanceTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("settings.appearanceTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("settings.appearanceHint")}
          </p>
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
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.iconThemeTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.iconThemeHint")}</div>
            </div>
            <select
              value={preferences.iconTheme ?? "auto"}
              onChange={(e) => setIconTheme(e.target.value as IconTheme)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label={t("settings.ariaIconTheme")}
            >
              {iconThemeOptions.map((option) => (
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
      </motion.main>

      <BottomNav />
    </div>
  );
}
