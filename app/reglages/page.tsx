"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useTasbihStore } from "../../store/tasbihStore";
import type { Theme } from "../../store/tasbihStore";
import { BottomNav } from "../../components/BottomNav";

const SOUND_OPTIONS = [
  { value: "off", label: "Desactive" },
  { value: "tap-soft", label: "Tap doux" },
  { value: "button-click", label: "Clic bouton" },
  { value: "haptic-pulse", label: "Pulse court" },
] as const;

const THEME_OPTIONS = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "blue", label: "Bleu" },
] as const;

export default function ReglagesPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const preferences = useTasbihStore((s) => s.preferences);
  const mode = useTasbihStore((s) => s.mode);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const toggleMode = useTasbihStore((s) => s.toggleMode);
  const setTheme = useTasbihStore((s) => s.setTheme);
  const toggleVibration = useTasbihStore((s) => s.toggleVibration);
  const setTapSound = useTasbihStore((s) => s.setTapSound);
  const setLanguage = useTasbihStore((s) => s.setLanguage);

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

  const setExecutionMode = (target: "up" | "down") => {
    if (mode !== target) toggleMode();
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
          <h1 className="text-xl font-semibold text-[var(--foreground)]">⚙️ Réglages</h1>
          <p className="text-sm text-[var(--secondary)]">Personnalisez votre expérience</p>
        </header>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">Mode d&apos;exécution</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setExecutionMode("up")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "up"
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              Incrémenter
            </button>
            <button
              onClick={() => setExecutionMode("down")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "down"
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
              }`}
            >
              Décrémenter
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-[var(--foreground)]">Thème</div>
              <div className="text-xs text-[var(--secondary)]">Choix global de palette</div>
            </div>
            <select
              value={preferences.theme}
              onChange={(e) => handleThemeChange(e.target.value as Theme)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label="Selection du thème"
            >
              {THEME_OPTIONS.map((option) => (
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
              <div className="text-sm font-semibold text-[var(--foreground)]">Son</div>
              <div className="text-xs text-[var(--secondary)]">
                Simule un retour d&apos;appui ou une sensation de vibration
              </div>
            </div>
            <select
              value={preferences.tapSound}
              onChange={(e) => setTapSound(e.target.value as (typeof SOUND_OPTIONS)[number]["value"])}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-base font-semibold text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
              aria-label="Selection du son"
            >
              {SOUND_OPTIONS.map((option) => (
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
              <div className="text-sm font-semibold text-[var(--foreground)]">Vibration</div>
              <div className="text-xs text-[var(--secondary)]">
                {isIOS ? "Non disponible sur iOS" : "Retour haptique si supporte"}
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
              {preferences.vibration ? "Active" : "Desactive"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--card)] p-4">
          <div className="text-sm font-semibold text-[var(--foreground)]">Langue</div>
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
          Tasbih Digital — v1.0
        </div>
      </motion.main>

      <BottomNav />
    </div>
  );
}
