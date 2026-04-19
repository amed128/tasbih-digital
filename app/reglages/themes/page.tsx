"use client";

import { useSyncExternalStore, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { BottomNav } from "../../../components/BottomNav";
import { useTasbihStore } from "../../../store/tasbihStore";
import type { Theme, PremiumTheme } from "../../../store/tasbihStore";
import { useT } from "@/hooks/useT";

type ThemeCard = {
  value: Theme;
  labelKey: string;
  bg: string;
  card: string;
  primary: string;
  border: string;
  premium?: PremiumTheme;
};

const THEME_CARDS: ThemeCard[] = [
  {
    value: "light",
    labelKey: "settings.themeLight",
    bg: "#F3F5F8",
    card: "#FFFFFF",
    primary: "#B8822E",
    border: "#D4DCE6",
  },
  {
    value: "dark",
    labelKey: "settings.themeDark",
    bg: "#0A0A0A",
    card: "#1A1A1A",
    primary: "#F5A623",
    border: "#2A2A2A",
  },
  {
    value: "blue",
    labelKey: "settings.themeBlue",
    bg: "#0B1118",
    card: "#151E29",
    primary: "#E4B15A",
    border: "#2B3747",
  },
  {
    value: "emerald",
    labelKey: "settings.themeEmerald",
    bg: "#04291E",
    card: "#0A3D2B",
    primary: "#FDE68A",
    border: "#1A5C40",
    premium: "emerald",
  },
];

export default function ThemesPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const setTheme = useTasbihStore((s) => s.setTheme);
  const unlockTheme = useTasbihStore((s) => s.unlockTheme);

  const t = useT();
  const [premiumModal, setPremiumModal] = useState<PremiumTheme | null>(null);
  const [restoring, setRestoring] = useState(false);

  const applyThemeToDom = (theme: Theme) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    document.body?.setAttribute("data-theme", theme);
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      const colors: Record<Theme, string> = {
        light: "#F3F5F8",
        dark: "#0A0A0A",
        blue: "#0B1118",
        emerald: "#04291E",
      };
      themeMeta.setAttribute("content", colors[theme]);
    }
  };

  const handleThemeSelect = (card: ThemeCard) => {
    if (card.premium && !preferences.unlockedThemes?.includes(card.premium)) {
      setPremiumModal(card.premium);
      return;
    }
    setTheme(card.value);
    applyThemeToDom(card.value);
  };

  const handlePurchase = (theme: PremiumTheme) => {
    // TODO: wire real StoreKit/Play Billing IAP before production
    // TODO: restrict premium themes to native app only before production
    unlockTheme(theme);
    setTheme(theme as Theme);
    applyThemeToDom(theme as Theme);
    setPremiumModal(null);
  };

  const handleRestore = async () => {
    setRestoring(true);
    // TODO: query StoreKit/Play Billing for past purchases before production
    await new Promise((r) => setTimeout(r, 1200));
    setRestoring(false);
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
            <Link href="/reglages" className="hover:text-[var(--foreground)]">
              {t("settings.title")}
            </Link>
            <span>/</span>
            <span className="text-[var(--foreground)]">{t("settings.themesTitle")}</span>
          </nav>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {t("settings.themesTitle")}
          </h1>
          <p className="text-sm text-[var(--secondary)]">
            {t("settings.themesHint")}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {THEME_CARDS.map((card) => {
            const isActive = preferences.theme === card.value;
            const isPurchased = !!card.premium && preferences.unlockedThemes?.includes(card.premium);
            const isLocked = !!card.premium && !isPurchased;
            return (
              <button
                key={card.value}
                onClick={() => handleThemeSelect(card)}
                aria-label={t(card.labelKey as Parameters<typeof t>[0])}
                className={`relative flex flex-col gap-2 rounded-xl border-2 p-3 transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                  isActive
                    ? "border-[var(--primary)]"
                    : "border-[var(--border)] hover:border-[var(--secondary)]"
                }`}
                style={{ background: card.bg }}
              >
                {/* Mini preview */}
                <div
                  className="h-12 w-full rounded-lg border"
                  style={{ background: card.card, borderColor: card.border }}
                >
                  <div className="flex gap-1.5 p-2">
                    <div className="h-2 w-2 rounded-full" style={{ background: card.primary }} />
                    <div className="h-2 flex-1 rounded-full opacity-30" style={{ background: card.primary }} />
                  </div>
                  <div
                    className="mx-auto mt-1 h-4 w-10 rounded-lg"
                    style={{ background: card.primary, opacity: 0.85 }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: card.primary }}>
                    {t(card.labelKey as Parameters<typeof t>[0])}
                  </span>
                  {isActive && <Check size={14} style={{ color: card.primary }} />}
                  {isLocked && <Lock size={14} style={{ color: card.primary }} />}
                </div>

                {card.premium && (
                  <span
                    className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ background: card.primary, color: card.bg }}
                  >
                    {isPurchased
                      ? t("settings.themePurchasedBadge")
                      : t("settings.premiumBadge")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Restore purchases */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleRestore}
            disabled={restoring}
            className="rounded-xl border border-[var(--restore-border)] bg-[var(--background)] px-4 py-2 text-sm font-semibold text-[var(--restore)] transition hover:border-[var(--restore)] disabled:opacity-60"
          >
            {restoring ? "…" : t("settings.themeRestorePurchases")}
          </button>
        </div>
      </motion.main>

      <BottomNav />

      {/* Premium purchase modal */}
      <AnimatePresence>
        {premiumModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPremiumModal(null)}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: "#0A3D2B", border: "1px solid #1A5C40" }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="mb-4 flex h-20 w-full items-center justify-center rounded-xl"
                style={{ background: "#04291E", border: "1px solid #1A5C40" }}
              >
                <div className="flex gap-3">
                  {["#FDE68A", "#8FB8A0", "#F5F0E8"].map((c) => (
                    <div key={c} className="h-6 w-6 rounded-full" style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-base font-bold" style={{ color: "#FDE68A" }}>
                  {t("settings.premiumThemeModalTitle")}
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: "#FDE68A", color: "#04291E" }}
                >
                  {t("settings.premiumBadge")}
                </span>
              </div>
              <p className="mb-5 text-sm" style={{ color: "#8FB8A0" }}>
                {t("settings.premiumThemeModalDesc")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handlePurchase(premiumModal)}
                  className="w-full rounded-xl py-3 text-sm font-bold transition hover:opacity-90"
                  style={{ background: "#FDE68A", color: "#04291E" }}
                >
                  {preferences.unlockedThemes?.includes(premiumModal)
                    ? t("settings.premiumThemeUnlocked")
                    : t("settings.premiumThemeUnlock")}
                </button>
                <button
                  onClick={() => setPremiumModal(null)}
                  className="w-full rounded-xl border py-3 text-sm font-semibold transition hover:opacity-80"
                  style={{ borderColor: "#1A5C40", color: "#8FB8A0" }}
                >
                  {t("settings.premiumThemeCancel")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
