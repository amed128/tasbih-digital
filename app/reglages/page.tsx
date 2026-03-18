"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTasbihStore } from "../../store/tasbihStore";
import { BottomNav } from "../../components/BottomNav";

const SOUND_OPTIONS = [
  { value: "off", label: "Desactive" },
  { value: "tap-soft", label: "Tap doux" },
  { value: "button-click", label: "Clic bouton" },
  { value: "haptic-pulse", label: "Pulse court" },
] as const;

export default function ReglagesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const preferences = useTasbihStore((s) => s.preferences);
  const mode = useTasbihStore((s) => s.mode);

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);
  const toggleMode = useTasbihStore((s) => s.toggleMode);
  const toggleDarkMode = useTasbihStore((s) => s.toggleDarkMode);
  const toggleVibration = useTasbihStore((s) => s.toggleVibration);
  const setTapSound = useTasbihStore((s) => s.setTapSound);
  const setLanguage = useTasbihStore((s) => s.setLanguage);

  const setExecutionMode = (target: "up" | "down") => {
    if (mode !== target) toggleMode();
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <motion.main
        className="mx-auto flex max-w-md flex-col gap-5 px-5 pb-32 pt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-white">⚙️ Réglages</h1>
          <p className="text-sm text-gray-400">Personnalisez votre expérience</p>
        </header>

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="text-sm font-semibold text-white">Mode d'exécution</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setExecutionMode("up")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "up"
                  ? "bg-[#F5A623] text-black"
                  : "bg-[#0A0A0A] border border-[#2A2A2A] text-white"
              }`}
            >
              Incrémenter
            </button>
            <button
              onClick={() => setExecutionMode("down")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "down"
                  ? "bg-[#F5A623] text-black"
                  : "bg-[#0A0A0A] border border-[#2A2A2A] text-white"
              }`}
            >
              Décrémenter
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Thème sombre</div>
              <div className="text-xs text-gray-400">(Global via préférence)</div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.darkMode
                  ? "bg-[#F5A623] text-black"
                  : "bg-[#0A0A0A] border border-[#2A2A2A] text-white"
              }`}
            >
              {preferences.darkMode ? "Activé" : "Désactivé"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Son</div>
              <div className="text-xs text-gray-400">
                Simule un retour d'appui ou une sensation de vibration
              </div>
            </div>
            <select
              value={preferences.tapSound}
              onChange={(e) => setTapSound(e.target.value as (typeof SOUND_OPTIONS)[number]["value"])}
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-xs font-semibold text-white outline-none focus:border-[#F5A623]"
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

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">Vibration</div>
              <div className="text-xs text-gray-400">
                {isIOS ? "Non disponible sur iOS" : "Retour haptique si supporte"}
              </div>
            </div>
            <button
              onClick={toggleVibration}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.vibration
                  ? "bg-[#F5A623] text-black"
                  : "bg-[#0A0A0A] border border-[#2A2A2A] text-white"
              }`}
            >
              {preferences.vibration ? "Active" : "Desactive"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1A1A1A] p-4">
          <div className="text-sm font-semibold text-white">Langue</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setLanguage("fr")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.language === "fr"
                  ? "bg-[#F5A623] text-black"
                  : "bg-[#0A0A0A] border border-[#2A2A2A] text-white"
              }`}
            >
              FR
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                preferences.language === "en"
                  ? "bg-[#F5A623] text-black"
                  : "bg-[#0A0A0A] border border-[#2A2A2A] text-white"
              }`}
            >
              EN
            </button>
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-500">
          Tasbih Digital — v1.0
        </div>
      </motion.main>

      <BottomNav />
    </div>
  );
}
