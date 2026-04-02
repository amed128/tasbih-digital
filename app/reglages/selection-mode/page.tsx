"use client";

import { useTasbihStore } from "@/store/tasbihStore";
import { useT } from "@/hooks/useT";
import Link from "next/link";

export default function SelectionModeSettings() {
  const t = useT();
  const preferences = useTasbihStore((s) => s.preferences);
  const setAutoAdvanceNextZikr = useTasbihStore((s) => s.setAutoAdvanceNextZikr);
  const setResetOnPrev = useTasbihStore((s) => s.setResetOnPrev);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6">
        <header className="flex flex-col gap-1">
          <Link href="/reglages" className="mb-1 text-sm font-medium text-[var(--primary)]">
            {t("about.back")}
          </Link>
          <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-2 text-xs text-[var(--secondary)]">
            <Link href="/reglages" className="hover:text-[var(--foreground)]">
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.selectionModeTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("settings.selectionModeTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("settings.selectionModeHint")}
          </p>
        </header>

        {/* Auto-advance to next zikr toggle */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between mt-2">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.autoAdvanceTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.autoAdvanceHint")}</div>
          </div>
          <button
            type="button"
            onClick={() => setAutoAdvanceNextZikr(!(preferences.autoAdvanceNextZikr ?? false))}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              (preferences.autoAdvanceNextZikr ?? false)
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
          >
            {(preferences.autoAdvanceNextZikr ?? false) ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Reset counter on going back toggle */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between mt-2">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.resetOnPrevTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.resetOnPrevHint")}</div>
          </div>
          <button
            type="button"
            onClick={() => setResetOnPrev(!(preferences.resetOnPrev ?? true))}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              (preferences.resetOnPrev ?? true)
                ? "bg-[var(--primary)] text-black"
                : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
            }`}
          >
            {(preferences.resetOnPrev ?? true) ? t("settings.on") : t("settings.off")}
          </button>
        </section>

        {/* Active list zikr text setting */}
        <section className="rounded-2xl bg-[var(--card)] p-4 flex items-center justify-between mt-2">
          <div>
            <div className="text-sm font-semibold text-[var(--foreground)]">{t("settings.chipTextFormatTitle")}</div>
            <div className="text-xs text-[var(--secondary)]">{t("settings.chipTextFormatHint")}</div>
          </div>
          <select
            value={preferences.chipTextFormat}
            onChange={(e) => useTasbihStore.getState().setChipTextFormat(e.target.value as import("@/store/tasbihStore").ChipTextFormat)}
            className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            aria-label={t("settings.ariaChipTextFormat")}
          >
            {['transliteration','arabic','both'].map((option) => (
              <option key={option} value={option}>
                {t(`settings.chipTextFormat${option.charAt(0).toUpperCase() + option.slice(1)}`)}
              </option>
            ))}
          </select>
        </section>
      </main>
    </div>
  );
}
