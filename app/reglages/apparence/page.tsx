"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BottomNav } from "../../../components/BottomNav";
import { useTasbihStore } from "../../../store/tasbihStore";
import type { IconTheme, TapButtonSize } from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";
import { isNativeApp } from "../../../lib/platform";

export default function AppearanceSettingsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const setIconTheme = useTasbihStore((s) => s.setIconTheme);
  const toggleConfetti = useTasbihStore((s) => s.toggleConfetti);
  const setTapButtonSize = useTasbihStore((s) => s.setTapButtonSize);

  const t = useT();

  const iconThemeOptions: { value: IconTheme; label: string }[] = [
    { value: "auto", label: t("settings.iconThemeAuto") },
    { value: "dark", label: t("settings.iconThemeDark") },
    { value: "blue", label: t("settings.iconThemeBlue") },
    { value: "light", label: t("settings.iconThemeLight") },
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
            <Link href="/reglages" className="hover:text-[var(--foreground)]">
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

        {isNativeApp() && (
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
        )}

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.tapButtonSizeTitle")}</div>
              <div className="text-xs text-[var(--secondary)]">{t("settings.tapButtonSizeHint")}</div>
            </div>
            <select
              value={preferences.tapButtonSize ?? "normal"}
              onChange={(e) => setTapButtonSize(e.target.value as TapButtonSize)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            >
              <option value="normal">{t("settings.tapButtonSizeNormal")}</option>
              <option value="double">{t("settings.tapButtonSizeDouble")}</option>
              <option value="triple">{t("settings.tapButtonSizeTriple")}</option>
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
