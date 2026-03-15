"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useTasbihStore } from "../store/tasbihStore";
import { dhikrs } from "../data/dhikrs";
import { CircleProgress } from "../components/CircleProgress";
import { BottomNav } from "../components/BottomNav";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentDhikr = useTasbihStore((s) => s.currentDhikr);
  const counter = useTasbihStore((s) => s.counter);
  const mode = useTasbihStore((s) => s.mode);
  const isStarted = useTasbihStore((s) => s.isStarted);
  const increment = useTasbihStore((s) => s.increment);
  const reset = useTasbihStore((s) => s.reset);
  const undoLast = useTasbihStore((s) => s.undoLast);
  const selectDhikr = useTasbihStore((s) => s.selectDhikr);
  const toggleMode = useTasbihStore((s) => s.toggleMode);

  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [hasFiredConfetti, setHasFiredConfetti] = useState(false);
  const prevIsCompleted = useRef(false);

  const target = currentDhikr?.defaultTarget ?? 0;
  const isCompleted =
    mode === "up" ? counter >= target && target > 0 : counter <= 0;

  const handleIncrement = () => {
    increment();
    setPulseTrigger((t) => t + 1);
  };

  useEffect(() => {
    if (isCompleted && !prevIsCompleted.current) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.4 },
        colors: ["#F5A623", "#FFFFFF"],
      });
      setHasFiredConfetti(true);
    }

    if (!isCompleted) {
      setHasFiredConfetti(false);
    }

    prevIsCompleted.current = isCompleted;
  }, [isCompleted]);

  const groupedDhikrs = useMemo(() => {
    const map = new Map<string, typeof dhikrs>();
    dhikrs.forEach((d) => {
      const list = map.get(d.category) ?? [];
      list.push(d);
      map.set(d.category, list);
    });
    return map;
  }, []);

  if (!mounted) return null;

  const renderCompteur = () => (
    <div className="flex flex-col gap-6 px-5 pb-28 pt-6">
      <header className="flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-white">🌙 Tasbih Digital</h1>
        <p className="text-sm text-gray-400">Compteur de dhikr</p>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-300">Sélectionner un dhikr</label>
          <select
            className="w-full rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#F5A623]"
            value={currentDhikr?.id ?? ""}
            onChange={(e) => selectDhikr(e.target.value)}
          >
            {Array.from(groupedDhikrs.entries()).map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((d) => (
                  <option key={d.id} value={d.id} className="text-white">
                    {d.arabic} — {d.transliteration}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-gray-300">Mode</span>
          <button
            className={`flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#F5A623] ${
              isStarted || isCompleted ? "opacity-50 pointer-events-none" : ""
            }`}
            onClick={toggleMode}
          >
            {mode === "up" ? "0 → objectif" : "Objectif → 0"}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
          <CircleProgress
            value={counter}
            target={target}
            mode={mode}
            isCompleted={isCompleted}
            pulseTrigger={pulseTrigger}
          />
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-400">OBJECTIF</div>
          <div className="text-2xl font-bold text-white">{target}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <motion.button
          onClick={handleIncrement}
          disabled={isCompleted}
          whileTap={{ scale: 0.95 }}
          className={`w-full rounded-xl px-6 py-4 text-lg font-bold shadow-sm transition hover:brightness-110 ${
            isCompleted
              ? "bg-[#1A1A1A] text-gray-400 opacity-50 pointer-events-none cursor-not-allowed"
              : "bg-[#F5A623] text-black"
          }`}
        >
          Appuyer
        </motion.button>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={undoLast}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5A623]"
          >
            ↩ Undo
          </button>
          <button
            onClick={reset}
            className="flex-1 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-3 text-sm font-semibold text-white transition hover:border-[#F5A623]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlaceholder = (label: string) => (
    <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-lg font-semibold text-white">{label}</div>
        <div className="mt-2 text-sm text-gray-400">À venir...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <main className="mx-auto flex max-w-md flex-col pb-28">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderCompteur()}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
