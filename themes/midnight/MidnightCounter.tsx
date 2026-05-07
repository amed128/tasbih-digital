"use client";

// ── Ottoman Celestial Court ───────────────────────────────────────────────────
// The midnight theme already carries an Islamic geometric carpet pattern.
// This overlay extends it upward: a celestial dome arch header with scattered
// stars, a royal sapphire bead (Ottoman court jewel aesthetic), and a pale
// moonlight progress ring. The gold rim on the bead deliberately introduces
// warmth into the cool palette — evoking gilded dome edges.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as animateValue, type MotionValue } from "framer-motion";
import { useTasbihStore } from "@/store/tasbihStore";
import { getTransliteration } from "@/data/zikrs";
import type { Zikr } from "@/data/zikrs";
import { useT } from "@/hooks/useT";
import { RotateCcw } from "lucide-react";

export interface MidnightCounterProps {
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

// ── Moonlight progress ring ───────────────────────────────────────────────────

function MoonRing({ value, target, countsDown, isCompleted, size, strokeWidth }: {
  value: number; target: number; countsDown: boolean;
  isCompleted: boolean; size: number; strokeWidth: number;
}) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = target > 0 ? Math.min(1, Math.max(0, countsDown ? (target - value) / target : value / target)) : 0;

  return (
    <svg width={size} height={size} className="-rotate-90 absolute inset-0" aria-hidden>
      <defs>
        <linearGradient id="mn-moon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#EEF5FF" />
          <stop offset="30%"  stopColor="#A0C0F0" />
          <stop offset="65%"  stopColor="#4A70B8" />
          <stop offset="100%" stopColor="#1B3060" />
        </linearGradient>
        <linearGradient id="mn-done" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D6E8FF" />
        </linearGradient>
        <filter id="mn-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#6A82A8" floodOpacity="0.55" />
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(23,48,90,0.7)"    strokeWidth={strokeWidth + 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(214,232,255,0.06)" strokeWidth={strokeWidth - 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(23,48,90,0.35)"   strokeWidth={strokeWidth} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={isCompleted ? "url(#mn-done)" : "url(#mn-moon)"}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ type: "spring", stiffness: 100, damping: 22 }}
        filter="url(#mn-glow)"
      />
    </svg>
  );
}

// ── Royal sapphire bead ───────────────────────────────────────────────────────
// Deep navy body with a luminous atmosphere glow — like a sapphire in candlelight.
// A subtle gold rim glow connects to the Ottoman gilded-dome aesthetic.

function SapphireBead({ size, isCompleted, pulseTrigger, counter, target, mode, fmt, onClick, disabled, dragX, dragY }: {
  size: number; isCompleted: boolean; pulseTrigger?: number;
  counter: number; target: number; mode: string;
  fmt: (n: number) => string; onClick: () => void; disabled: boolean;
  dragX?: MotionValue<number>;
  dragY?: MotionValue<number>;
}) {
  const t = useT();

  const _fallbackX = useMotionValue(0);
  const _fallbackY = useMotionValue(0);
  const mx = dragX ?? _fallbackX;
  const my = dragY ?? _fallbackY;
  const specularX = useTransform(mx, (x: number) => Math.max(-15, Math.min(15, -x * 0.18)));
  const specularY = useTransform(my, (y: number) => Math.max(-15, Math.min(15, -y * 0.18)));

  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.93 }}
      animate={typeof pulseTrigger === "number" ? { scale: [1, 1.07, 1] } : {}}
      transition={{ duration: 0.22, ease: "easeOut" }}
      aria-label={t("counter.tap")}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-full outline-none focus:ring-4 focus:ring-[#D6E8FF]/35"
    >
      {/* Sapphire body */}
      <div className="absolute inset-0 rounded-full" style={{
        background: isCompleted
          ? "radial-gradient(circle at 38% 30%, #FFFFFF 0%, #E8F4FF 18%, #C0D8FF 48%, #3060C0 78%, #071020 100%)"
          : "radial-gradient(circle at 36% 28%, #EEF5FF 0%, #90B8F0 14%, #1A50C0 46%, #071540 76%, #071020 100%)",
        boxShadow: isCompleted
          ? "0 16px 52px rgba(160,200,255,0.60), 0 6px 20px rgba(0,0,0,0.45), inset 0 -5px 14px rgba(0,0,0,0.3)"
          : "0 16px 52px rgba(26,80,192,0.65), 0 6px 20px rgba(0,0,0,0.55), inset 0 -5px 14px rgba(0,0,0,0.4)",
      }} />

      {/* Atmospheric glow — the characteristic depth of sapphire */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle at 50% 42%, rgba(160,192,255,0.18) 0%, transparent 55%)",
      }} />

      {/* Primary specular — shifts toward light source as bead drags away from center */}
      <motion.div className="absolute rounded-full pointer-events-none" style={{
        width: size * 0.30, height: size * 0.20,
        top: size * 0.10, left: size * 0.18,
        background: "radial-gradient(ellipse, rgba(255,255,255,0.88) 0%, rgba(220,235,255,0.38) 50%, transparent 100%)",
        filter: "blur(2px)",
        x: specularX,
        y: specularY,
      }} />

      {/* Gold rim glow — Ottoman gilded-dome warmth */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle at 70% 80%, rgba(200,160,60,0.18) 0%, transparent 40%)",
      }} />

      {/* Text */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <motion.span key={counter} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.18 }}
          className="text-5xl font-bold leading-tight tabular-nums"
          style={{
            color: isCompleted ? "#FFFFFF" : "#EEF5FF",
            textShadow: "0 2px 8px rgba(0,0,30,0.65), 0 0 20px rgba(100,140,220,0.25)",
          }}>
          {fmt(counter)}
        </motion.span>
        <span className="text-xs font-semibold mt-0.5"
          style={{ color: "rgba(160,192,255,0.72)", textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
          {mode === "down" ? t("circle.remaining") : `/ ${fmt(target)}`}
        </span>
        {isCompleted && <span className="mt-1 text-xs font-semibold" style={{ color: "#D6E8FF" }}>✓</span>}
      </div>
    </motion.button>
  );
}

// ── Celestial dome arch header ────────────────────────────────────────────────
// A pointed Ottoman arch framing seven stars — evoking the domed ceiling of a
// mosque or palace with star motifs in the blue night sky.

function CelestialHeader() {
  const W = 280, H = 46;
  const stars = [
    { x: 48,  y: 34, r: 1.8, o: 0.85 },
    { x: 82,  y: 18, r: 1.2, o: 0.70 },
    { x: 112, y: 28, r: 2.2, o: 0.95 },
    { x: 140, y:  8, r: 1.5, o: 0.80 },
    { x: 168, y: 22, r: 1.0, o: 0.65 },
    { x: 198, y: 14, r: 1.8, o: 0.78 },
    { x: 232, y: 32, r: 1.4, o: 0.88 },
  ];

  return (
    <div className="w-full overflow-hidden" style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden>
        <defs>
          <linearGradient id="mn-arch" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#4A70B8" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#17305A" stopOpacity="0.08" />
          </linearGradient>
          <radialGradient id="mn-star-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#D6E8FF" stopOpacity="1" />
            <stop offset="60%"  stopColor="#D6E8FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D6E8FF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pointed Ottoman arch — the dome silhouette */}
        <path d={`M8,${H} Q${W/2},-28 ${W-8},${H}`}
          fill="url(#mn-arch)" stroke="rgba(74,112,184,0.28)" strokeWidth="0.8" />

        {/* Dome ribs — subtle structural lines */}
        {[0.28, 0.50, 0.72].map((t, i) => {
          const tx  = 8 + t * (W - 16);
          const ty  = H - Math.pow(Math.sin(Math.PI * t), 0.8) * (H + 28);
          return (
            <line key={i} x1={W/2} y1={H} x2={tx} y2={ty}
              stroke="rgba(74,112,184,0.14)" strokeWidth="0.5" />
          );
        })}

        {/* Stars with soft glow */}
        {stars.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.r * 2.5} fill="url(#mn-star-glow)" opacity={s.o * 0.4} />
            <circle cx={s.x} cy={s.y} r={s.r}       fill="#D6E8FF"            opacity={s.o} />
          </g>
        ))}

        {/* Keystone ornament at arch apex */}
        <circle cx={W/2} cy={H - 2} r="3.5" fill="#D6E8FF" opacity="0.75" />
        <circle cx={W/2} cy={H - 2} r="6"   fill="none" stroke="#D6E8FF" strokeWidth="0.7" opacity="0.28" />
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
          color: "#D6E8FF",
          textShadow: "0 0 16px rgba(106,130,168,0.40), 0 2px 4px rgba(0,0,0,0.6)",
          letterSpacing: "0.04em",
        }}>
          {arabic}
        </p>
      )}
      {translit && (
        <p className="text-sm font-semibold italic" style={{ color: "#6A82A8", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {translit}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const RING_SIZE   = 264;
const RING_STROKE = 16;
const BEAD_SIZE   = RING_SIZE - RING_STROKE * 2 - 16;

export function MidnightCounter({
  counter, target, mode, isCompleted, pulseTrigger, currentZikr,
  onIncrement, onUndo, onReset, focusMode, shouldBlurControls, hasProgress,
  onTargetTap, onNextZikr,
}: MidnightCounterProps) {
  const t        = useT();
  const language = useTasbihStore(s => s.preferences.language);

  const fmt = useCallback((n: number) =>
    language === "ar" ? n.toLocaleString("ar-SA") :
    language === "ur" ? n.toLocaleString("ur-PK-u-nu-arab") :
    language === "fa" ? n.toLocaleString("fa-IR") : String(n),
  [language]);

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);
  const beadContainerRef = useRef<HTMLDivElement>(null);

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

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [constraints, setConstraints] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  const filterShadow = useTransform(
    [dragX, dragY] as MotionValue<number>[],
    (latest: number[]) => {
      const [x, y] = latest;
      const dist = Math.sqrt(x * x + y * y);
      if (dist < 2) return "none";
      const t = Math.min(dist / 150, 1);
      const sx = ((x / dist) * t * 10).toFixed(1);
      const sy = ((y / dist) * t * 10).toFixed(1);
      const blur = Math.round(20 + t * 16);
      return `drop-shadow(${sx}px ${sy}px ${blur}px rgba(26,80,192,0.45))`;
    }
  );

  useEffect(() => {
    const el = beadContainerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setConstraints({
      left:   -(cx - BEAD_SIZE / 2),
      right:  window.innerWidth - cx - BEAD_SIZE / 2,
      top:    -(cy - BEAD_SIZE / 2),
      bottom: window.innerHeight - cy - BEAD_SIZE / 2,
    });
  }, []);

  useEffect(() => {
    if (!focusMode) {
      animateValue(dragX, 0, { type: "spring", stiffness: 200, damping: 20 });
      animateValue(dragY, 0, { type: "spring", stiffness: 200, damping: 20 });
    }
  }, [focusMode, dragX, dragY]);

  const arabic   = currentZikr?.arabic ?? "";
  const translit = currentZikr ? getTransliteration(currentZikr, language) : "";
  const blurred  = focusMode || shouldBlurControls;

  return (
    <div className="flex flex-col items-center gap-0 select-none">
      <CelestialHeader />

      <AnimatePresence mode="wait">
        <motion.div key={currentZikr?.id ?? "none"}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }} className="mt-3 mb-1">
          <ZikrText arabic={arabic} translit={translit} />
        </motion.div>
      </AnimatePresence>

      {/* Ring + bead */}
      <div ref={beadContainerRef} className="relative flex items-center justify-center my-2"
        style={{ width: RING_SIZE, height: RING_SIZE }}>
        <div className="absolute rounded-full" style={{
          width: BEAD_SIZE * 0.85, height: BEAD_SIZE * 0.3, bottom: RING_STROKE + 8,
          background: "radial-gradient(ellipse, rgba(7,16,32,0.65) 0%, transparent 70%)",
          filter: "blur(7px)",
        }} aria-hidden />

        <MoonRing value={counter} target={target} countsDown={mode === "down"}
          isCompleted={isCompleted} size={RING_SIZE} strokeWidth={RING_STROKE} />

        {/* Moonlight ripples */}
        <AnimatePresence>
          {ripples.map(r => (
            <motion.div key={r.id} className="absolute rounded-full pointer-events-none"
              style={{
                width: BEAD_SIZE, height: BEAD_SIZE,
                border: "1.5px solid rgba(214,232,255,0.40)",
                top: "50%", left: "50%", translateX: "-50%", translateY: "-50%",
              }}
              initial={{ scale: 0.55, opacity: 0.68 }} animate={{ scale: 1.9, opacity: 0 }} exit={{}}
              transition={{ duration: 0.85, ease: [0.2, 0.8, 0.4, 1] }} />
          ))}
        </AnimatePresence>

        {/* Sapphire bead — draggable when focus mode is active */}
        <motion.div
          drag={focusMode}
          dragMomentum={false}
          dragConstraints={constraints}
          style={{
            x: dragX,
            y: dragY,
            zIndex: focusMode ? 50 : 0,
            filter: filterShadow,
            cursor: focusMode ? "grab" : "default",
          }}
          whileDrag={{ cursor: "grabbing" }}
        >
          <SapphireBead size={BEAD_SIZE} isCompleted={isCompleted} pulseTrigger={pulseTrigger}
            counter={counter} target={target} mode={mode} fmt={fmt}
            onClick={handleTap} disabled={isCompleted || shouldBlurControls}
            dragX={dragX} dragY={dragY} />
        </motion.div>
      </div>

      {/* Target */}
      <div className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: "#6A82A8" }}>
        <span>{t("counter.targetPrefix")}</span>
        {onTargetTap ? (
          <button onClick={onTargetTap}
            className="rounded border px-2 py-0.5 font-bold tabular-nums transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#D6E8FF]/40"
            style={{ borderColor: "rgba(106,130,168,0.45)", color: "#D6E8FF", background: "rgba(12,26,50,0.75)" }}>
            {fmt(target)}
          </button>
        ) : (
          <span className="rounded border px-2 py-0.5 font-bold tabular-nums"
            style={{ borderColor: "rgba(106,130,168,0.30)", color: "#D6E8FF", background: "rgba(12,26,50,0.75)" }}>
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
            style={{ background: "linear-gradient(135deg, #D6E8FF 0%, #6A82A8 100%)", color: "#071020" }}>
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
            borderColor: "rgba(23,48,90,0.9)", background: "rgba(12,26,50,0.60)",
            color: !hasProgress ? "rgba(106,130,168,0.3)" : "#6A82A8",
            opacity: !hasProgress ? 0.4 : 1,
          }}>
          <RotateCcw size={16} className="mx-auto" style={{ color: "inherit" }} />
        </button>
        <button onClick={onReset} disabled={blurred}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-110"
          style={{
            borderColor: "rgba(23,48,90,0.9)", background: "rgba(12,26,50,0.60)",
            color: !hasProgress ? "rgba(106,130,168,0.3)" : "#6A82A8",
            opacity: !hasProgress ? 0.4 : 1,
          }}>
          {t("counter.reset")}
        </button>
      </div>
    </div>
  );
}
