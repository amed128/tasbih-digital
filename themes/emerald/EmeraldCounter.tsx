"use client";

// ── Garden of Paradise (Jannah) ───────────────────────────────────────────────
// Crystalline emerald gemstone + amber-gold progress ring.
// The amber rosette in the botanical header echoes the existing emerald
// tap-button colour (#F59E0B), giving the whole composition visual unity.

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasbihStore } from "@/store/tasbihStore";
import { getTransliteration } from "@/data/zikrs";
import type { Zikr } from "@/data/zikrs";
import { useT } from "@/hooks/useT";
import { RotateCcw } from "lucide-react";

export interface EmeraldCounterProps {
  counter: number;
  target: number;
  mode: "up" | "down" | "auto" | "audio";
  isCompleted: boolean;
  pulseTrigger?: number;
  currentZikr: Zikr | undefined;
  onIncrement: () => void;
  onUndo: () => void;
  onReset: () => void;
  focusMode: boolean;
  shouldBlurControls: boolean;
  hasProgress: boolean;
  onTargetTap?: () => void;
  onNextZikr?: () => void;
}

interface Ripple { id: number }

// ── Amber progress ring ───────────────────────────────────────────────────────

function AmberRing({ value, target, countsDown, isCompleted, size, strokeWidth }: {
  value: number; target: number; countsDown: boolean;
  isCompleted: boolean; size: number; strokeWidth: number;
}) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = target > 0 ? Math.min(1, Math.max(0, countsDown ? (target - value) / target : value / target)) : 0;

  return (
    <svg width={size} height={size} className="-rotate-90 absolute inset-0" aria-hidden>
      <defs>
        <linearGradient id="em-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FDE68A" />
          <stop offset="35%"  stopColor="#F59E0B" />
          <stop offset="70%"  stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="em-done" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="em-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F59E0B" floodOpacity="0.50" />
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(26,92,64,0.45)"    strokeWidth={strokeWidth + 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(125,249,203,0.07)" strokeWidth={strokeWidth - 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(26,92,64,0.20)"    strokeWidth={strokeWidth} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={isCompleted ? "url(#em-done)" : "url(#em-amber)"}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ type: "spring", stiffness: 100, damping: 22 }}
        filter="url(#em-glow)"
      />
    </svg>
  );
}

// ── Crystalline emerald bead ──────────────────────────────────────────────────

function EmeraldBead({ size, isCompleted, pulseTrigger, counter, target, mode, fmt, onClick, disabled }: {
  size: number; isCompleted: boolean; pulseTrigger?: number;
  counter: number; target: number; mode: string;
  fmt: (n: number) => string; onClick: () => void; disabled: boolean;
}) {
  const t = useT();
  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.93 }}
      animate={typeof pulseTrigger === "number" ? { scale: [1, 1.07, 1] } : {}}
      transition={{ duration: 0.22, ease: "easeOut" }}
      aria-label={t("counter.tap")}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-full outline-none focus:ring-4 focus:ring-[#7DF9CB]/40"
    >
      {/* Gem body */}
      <div className="absolute inset-0 rounded-full" style={{
        background: isCompleted
          ? "radial-gradient(circle at 38% 32%, #D1FAE5, #34D399 32%, #059669 68%, #064E3B)"
          : "radial-gradient(circle at 33% 26%, #CCFFF0 0%, #7DF9CB 12%, #1A9970 40%, #0A5540 65%, #04291E 100%)",
        boxShadow: isCompleted
          ? "0 16px 48px rgba(52,211,153,0.55), 0 6px 18px rgba(0,0,0,0.4), inset 0 -6px 16px rgba(0,0,0,0.3)"
          : "0 16px 48px rgba(13,122,88,0.65), 0 6px 18px rgba(0,0,0,0.5), inset 0 -6px 16px rgba(0,0,0,0.38)",
      }} />
      {/* Crystalline facet — diagonal light refraction */}
      {!isCompleted && (
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
          background: "linear-gradient(138deg, transparent 32%, rgba(125,249,203,0.14) 38%, rgba(125,249,203,0.06) 44%, transparent 50%)",
        }} />
      )}
      {/* Primary specular */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: size * 0.32, height: size * 0.22, top: size * 0.10, left: size * 0.16,
        background: "radial-gradient(ellipse, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.28) 55%, transparent 100%)",
        filter: "blur(2.5px)",
      }} />
      {/* Amber rim glow — links bead to ring */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle at 72% 82%, rgba(245,158,11,0.22) 0%, transparent 42%)",
      }} />
      {/* Text */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <motion.span key={counter} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.18 }}
          className="text-5xl font-bold leading-tight tabular-nums"
          style={{ color: isCompleted ? "#ECFDF5" : "#EFFFFA", textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.8)" }}>
          {fmt(counter)}
        </motion.span>
        <span className="text-xs font-semibold mt-0.5"
          style={{ color: "rgba(167,243,208,0.75)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
          {mode === "down" ? t("circle.remaining") : `/ ${fmt(target)}`}
        </span>
        {isCompleted && <span className="mt-1 text-xs font-semibold" style={{ color: "#A7F3D0" }}>✓</span>}
      </div>
    </motion.button>
  );
}

// ── Botanical vine crown ──────────────────────────────────────────────────────
// Two arching vine branches meeting at a central amber rosette.
// Amber tips on each branch echo the ring colour.

function BotanicalHeader() {
  const W = 280, H = 42, cx = W / 2;
  return (
    <div className="w-full overflow-hidden" style={{ height: H, opacity: 0.62 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMin meet" aria-hidden>
        <defs>
          <linearGradient id="em-leaf" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%"   stopColor="#0D7A58" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#7DF9CB" stopOpacity="0.88" />
          </linearGradient>
        </defs>
        {/* Left branch */}
        <path d={`M${cx},${H} Q${cx-18},${H-22} ${cx-38},${H-38}`}
          fill="none" stroke="rgba(13,122,88,0.55)" strokeWidth="1.2" strokeLinecap="round" />
        <g transform={`translate(${cx-12},${H-14}) rotate(-22)`}>
          <path d="M0,0 Q-6,-13 0,-22 Q6,-13 0,0" fill="url(#em-leaf)" />
        </g>
        <g transform={`translate(${cx-25},${H-26}) rotate(-42)`}>
          <path d="M0,0 Q-5,-10 0,-18 Q5,-10 0,0" fill="url(#em-leaf)" />
        </g>
        <g transform={`translate(${cx-38},${H-37}) rotate(-60)`}>
          <path d="M0,0 Q-4,-8 0,-14 Q4,-8 0,0" fill="url(#em-leaf)" />
          <circle cx="0" cy="-14" r="2" fill="#F59E0B" opacity="0.7" />
        </g>
        {/* Right branch — mirror */}
        <path d={`M${cx},${H} Q${cx+18},${H-22} ${cx+38},${H-38}`}
          fill="none" stroke="rgba(13,122,88,0.55)" strokeWidth="1.2" strokeLinecap="round" />
        <g transform={`translate(${cx+12},${H-14}) rotate(22)`}>
          <path d="M0,0 Q6,-13 0,-22 Q-6,-13 0,0" fill="url(#em-leaf)" />
        </g>
        <g transform={`translate(${cx+25},${H-26}) rotate(42)`}>
          <path d="M0,0 Q5,-10 0,-18 Q-5,-10 0,0" fill="url(#em-leaf)" />
        </g>
        <g transform={`translate(${cx+38},${H-37}) rotate(60)`}>
          <path d="M0,0 Q4,-8 0,-14 Q-4,-8 0,0" fill="url(#em-leaf)" />
          <circle cx="0" cy="-14" r="2" fill="#F59E0B" opacity="0.7" />
        </g>
        {/* Central amber rosette */}
        <circle cx={cx} cy={H-1} r="5.5" fill="#F59E0B" opacity="0.60" />
        <circle cx={cx} cy={H-1} r="8.5" fill="none" stroke="#F59E0B" strokeWidth="0.8" opacity="0.32" />
        <circle cx={cx} cy={H-1} r="2.5" fill="#FDE68A" opacity="0.88" />
      </svg>
    </div>
  );
}

// ── Zikr text ─────────────────────────────────────────────────────────────────

function ZikrText({ arabic, translit }: { arabic: string; translit: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 text-center">
      {arabic && (
        <p className="text-2xl font-bold leading-relaxed" dir="rtl" style={{
          color: "#7DF9CB",
          textShadow: "0 0 14px rgba(125,249,203,0.28), 0 2px 4px rgba(0,0,0,0.5)",
          letterSpacing: "0.04em",
        }}>
          {arabic}
        </p>
      )}
      {translit && (
        <p className="text-sm font-semibold italic" style={{ color: "#8FB8A0", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
          {translit}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmeraldCounter({
  counter, target, mode, isCompleted, pulseTrigger, currentZikr,
  onIncrement, onUndo, onReset, focusMode, shouldBlurControls, hasProgress,
  onTargetTap, onNextZikr,
}: EmeraldCounterProps) {
  const t        = useT();
  const language = useTasbihStore(s => s.preferences.language);

  const fmt = useCallback((n: number) =>
    language === "ar" ? n.toLocaleString("ar-SA") :
    language === "ur" ? n.toLocaleString("ur-PK-u-nu-arab") :
    language === "fa" ? n.toLocaleString("fa-IR") : String(n),
  [language]);

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);

  const spawnRipple = useCallback(() => {
    const id = ++rippleId.current;
    setRipples(p => [...p, { id }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== id)), 900);
  }, []);

  const handleTap = useCallback(() => {
    if (isCompleted) return;
    spawnRipple();
    onIncrement();
  }, [isCompleted, spawnRipple, onIncrement]);

  const RING_SIZE   = 264;
  const RING_STROKE = 16;
  const BEAD_SIZE   = RING_SIZE - RING_STROKE * 2 - 16;

  const arabic   = currentZikr?.arabic ?? "";
  const translit = currentZikr ? getTransliteration(currentZikr, language) : "";
  const blurred  = focusMode || shouldBlurControls;

  return (
    <div className="flex flex-col items-center gap-0 select-none">
      <BotanicalHeader />

      <AnimatePresence mode="wait">
        <motion.div key={currentZikr?.id ?? "none"}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }} className="mt-3 mb-1">
          <ZikrText arabic={arabic} translit={translit} />
        </motion.div>
      </AnimatePresence>

      {/* Ring + bead */}
      <div className="relative flex items-center justify-center my-2"
        style={{ width: RING_SIZE, height: RING_SIZE }}>
        <div className="absolute rounded-full" style={{
          width: BEAD_SIZE * 0.85, height: BEAD_SIZE * 0.3, bottom: RING_STROKE + 8,
          background: "radial-gradient(ellipse, rgba(4,41,30,0.55) 0%, transparent 70%)",
          filter: "blur(6px)",
        }} aria-hidden />

        <AmberRing value={counter} target={target} countsDown={mode === "down"}
          isCompleted={isCompleted} size={RING_SIZE} strokeWidth={RING_STROKE} />

        <AnimatePresence>
          {ripples.map(r => (
            <motion.div key={r.id} className="absolute rounded-full pointer-events-none"
              style={{
                width: BEAD_SIZE, height: BEAD_SIZE,
                border: "2px solid rgba(125,249,203,0.50)",
                top: "50%", left: "50%", translateX: "-50%", translateY: "-50%",
              }}
              initial={{ scale: 0.55, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} exit={{}}
              transition={{ duration: 0.85, ease: [0.2, 0.8, 0.4, 1] }} />
          ))}
        </AnimatePresence>

        <EmeraldBead size={BEAD_SIZE} isCompleted={isCompleted} pulseTrigger={pulseTrigger}
          counter={counter} target={target} mode={mode} fmt={fmt}
          onClick={handleTap} disabled={isCompleted || blurred} />
      </div>

      {/* Target */}
      <div className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: "#8FB8A0" }}>
        <span>{t("counter.targetPrefix")}</span>
        {onTargetTap ? (
          <button onClick={onTargetTap}
            className="rounded border px-2 py-0.5 font-bold tabular-nums transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/60"
            style={{ borderColor: "rgba(245,158,11,0.50)", color: "#FDE68A", background: "rgba(10,61,43,0.7)" }}>
            {fmt(target)}
          </button>
        ) : (
          <span className="rounded border px-2 py-0.5 font-bold tabular-nums"
            style={{ borderColor: "rgba(245,158,11,0.35)", color: "#FDE68A", background: "rgba(10,61,43,0.7)" }}>
            {fmt(target)}
          </span>
        )}
        <span>{t("counter.targetSuffix")}</span>
      </div>

      {/* Next zikr */}
      <AnimatePresence>
        {onNextZikr && isCompleted && (
          <motion.button onClick={onNextZikr}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mb-3 w-full max-w-sm rounded-xl px-6 py-4 text-base font-bold transition hover:brightness-110 active:brightness-95"
            style={{ background: "linear-gradient(135deg, #FDE68A 0%, #D97706 100%)", color: "#1C0A00" }}>
            {t("counter.nextZikr")}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Undo + Reset */}
      <div className={`flex w-full max-w-sm items-center justify-between gap-4 px-4 ${blurred ? "blur-[1px] opacity-50 pointer-events-none select-none" : ""}`}>
        <button onClick={onUndo} aria-label={t("counter.ariaUndo")}
          disabled={!hasProgress || blurred}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-110"
          style={{
            borderColor: "rgba(26,92,64,0.65)", background: "rgba(10,61,43,0.55)",
            color: !hasProgress ? "rgba(143,184,160,0.3)" : "#8FB8A0",
            opacity: !hasProgress ? 0.4 : 1,
          }}>
          <RotateCcw size={16} className="mx-auto" style={{ color: "inherit" }} />
        </button>
        <button onClick={onReset} disabled={blurred}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-110"
          style={{
            borderColor: "rgba(26,92,64,0.65)", background: "rgba(10,61,43,0.55)",
            color: !hasProgress ? "rgba(143,184,160,0.3)" : "#8FB8A0",
            opacity: !hasProgress ? 0.4 : 1,
          }}>
          {t("counter.reset")}
        </button>
      </div>
    </div>
  );
}
