"use client";

// ── Volcanic Glass ────────────────────────────────────────────────────────────
// Near-black obsidian sphere with a razor-sharp glass specular highlight,
// steel-chrome progress ring, minimal diamond geometric header.
// Everything is sparse and stark — the volcanic glass aesthetic.

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as animateValue, type MotionValue } from "framer-motion";
import { useTasbihStore } from "@/store/tasbihStore";
import { getTransliteration } from "@/data/zikrs";
import type { Zikr } from "@/data/zikrs";
import { useT } from "@/hooks/useT";
import { RotateCcw } from "lucide-react";

export interface ObsidianCounterProps {
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

// ── Steel-chrome progress ring ────────────────────────────────────────────────

function ChromeRing({ value, target, countsDown, isCompleted, size, strokeWidth }: {
  value: number; target: number; countsDown: boolean;
  isCompleted: boolean; size: number; strokeWidth: number;
}) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = target > 0 ? Math.min(1, Math.max(0, countsDown ? (target - value) / target : value / target)) : 0;

  return (
    <svg width={size} height={size} className="-rotate-90 absolute inset-0" aria-hidden>
      <defs>
        <linearGradient id="ob-chrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#E8EBF8" />
          <stop offset="30%"  stopColor="#B0BAD4" />
          <stop offset="65%"  stopColor="#7888A8" />
          <stop offset="100%" stopColor="#3A4560" />
        </linearGradient>
        <linearGradient id="ob-done" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#E0E8FF" />
          <stop offset="100%" stopColor="#7890C8" />
        </linearGradient>
        <filter id="ob-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#9AAAC8" floodOpacity="0.40" />
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(36,36,48,0.8)"   strokeWidth={strokeWidth + 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(192,200,216,0.06)" strokeWidth={strokeWidth - 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(36,36,48,0.5)"   strokeWidth={strokeWidth} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={isCompleted ? "url(#ob-done)" : "url(#ob-chrome)"}
        strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ type: "spring", stiffness: 100, damping: 22 }}
        filter="url(#ob-glow)"
      />
    </svg>
  );
}

// ── Obsidian glass bead ───────────────────────────────────────────────────────
// The defining feature: a tiny, razor-sharp specular highlight (0–5% of the
// gradient) that drops immediately to near-black — exactly how volcanic glass
// catches light.

function ObsidianBead({ size, isCompleted, pulseTrigger, counter, target, mode, fmt, onClick, disabled, dragX, dragY }: {
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
      whileTap={disabled ? {} : { scale: 0.94 }}
      animate={typeof pulseTrigger === "number" ? { scale: [1, 1.07, 1] } : {}}
      transition={{ duration: 0.22, ease: "easeOut" }}
      aria-label={t("counter.tap")}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-full outline-none focus:ring-4 focus:ring-[#C0C8D8]/30"
    >
      {/* Obsidian body — near-black with razor specular */}
      <div className="absolute inset-0 rounded-full" style={{
        background: isCompleted
          ? "radial-gradient(circle at 35% 28%, #FFFFFF 0%, #D0D8F0 12%, #8090B8 42%, #2A2D3E 72%, #17171D 100%)"
          : "radial-gradient(circle at 26% 21%, rgba(255,255,255,0.96) 0%, rgba(210,220,240,0.62) 4.5%, rgba(80,90,118,0.30) 9%, #181A24 20%, #0D0D10 55%)",
        boxShadow: isCompleted
          ? "0 16px 48px rgba(120,136,168,0.45), 0 6px 20px rgba(0,0,0,0.7), inset 0 -4px 12px rgba(0,0,0,0.5)"
          : "0 20px 60px rgba(0,0,0,0.85), 0 6px 20px rgba(0,0,0,0.65), inset 0 -4px 12px rgba(0,0,0,0.55)",
      }} />

      {/* Iridescent sheen — subtle cool blue-violet shimmer */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        background: "linear-gradient(218deg, rgba(160,180,240,0.10) 0%, transparent 38%, rgba(80,100,180,0.07) 62%, transparent 80%)",
      }} />

      {/* Specular overlay — shifts toward light source as bead drags away from center */}
      <motion.div className="absolute rounded-full pointer-events-none" style={{
        width: size * 0.30, height: size * 0.20,
        top: size * 0.10, left: size * 0.16,
        background: "radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        filter: "blur(3px)",
        x: specularX,
        y: specularY,
      }} />

      {/* Deep shadow underside — adds volume */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{
        background: "radial-gradient(circle at 55% 78%, rgba(0,0,0,0.45) 0%, transparent 50%)",
      }} />

      {/* Text */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <motion.span key={counter} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.18 }}
          className="text-5xl font-bold leading-tight tabular-nums"
          style={{
            color: isCompleted ? "#E8EFFF" : "#C0C8D8",
            textShadow: isCompleted
              ? "0 2px 8px rgba(120,136,200,0.5), 0 1px 2px rgba(0,0,0,0.8)"
              : "0 2px 10px rgba(0,0,0,0.8), 0 0 20px rgba(192,200,216,0.15)",
          }}>
          {fmt(counter)}
        </motion.span>
        <span className="text-xs font-semibold mt-0.5"
          style={{ color: "rgba(160,168,200,0.65)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
          {mode === "down" ? t("circle.remaining") : `/ ${fmt(target)}`}
        </span>
        {isCompleted && <span className="mt-1 text-xs font-semibold" style={{ color: "#C8D4F0" }}>✓</span>}
      </div>
    </motion.button>
  );
}

// ── Diamond geometric header ──────────────────────────────────────────────────
// Five diamond shapes along a thin horizontal line.
// Spare and minimal — nothing extraneous.

function GeometricHeader() {
  const W = 280, H = 26;
  const pts = [0.14, 0.31, 0.50, 0.69, 0.86].map(f => f * W);
  const S = 7; // half-size of each diamond

  return (
    <div className="w-full" style={{ height: H, opacity: 0.38 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-hidden>
        {/* Horizontal rule */}
        <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="rgba(192,200,216,0.22)" strokeWidth="0.6" />
        {pts.map((cx, i) => {
          const isCentre = i === 2;
          return (
            <path key={i}
              d={`M${cx},${H/2 - S} L${cx+S},${H/2} L${cx},${H/2 + S} L${cx-S},${H/2} Z`}
              fill={isCentre ? "rgba(192,200,216,0.28)" : "none"}
              stroke="#C0C8D8"
              strokeWidth={isCentre ? 1.0 : 0.7}
              opacity={isCentre ? 0.75 : 0.42 - Math.abs(2-i) * 0.08}
            />
          );
        })}
        {/* Inner centre diamond */}
        <path d={`M${W/2},${H/2 - S*0.45} L${W/2 + S*0.45},${H/2} L${W/2},${H/2 + S*0.45} L${W/2 - S*0.45},${H/2} Z`}
          fill="#C0C8D8" opacity="0.55" />
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
          color: "#C0C8D8",
          textShadow: "0 0 16px rgba(192,200,216,0.18), 0 2px 4px rgba(0,0,0,0.7)",
          letterSpacing: "0.04em",
        }}>
          {arabic}
        </p>
      )}
      {translit && (
        <p className="text-sm font-semibold italic" style={{ color: "#70758A", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
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

export function ObsidianCounter({
  counter, target, mode, isCompleted, pulseTrigger, currentZikr,
  onIncrement, onUndo, onReset, focusMode, shouldBlurControls, hasProgress,
  onTargetTap, onNextZikr,
}: ObsidianCounterProps) {
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
      return `drop-shadow(${sx}px ${sy}px ${blur}px rgba(0,0,0,0.55))`;
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
    if (!shouldBlurControls) {
      animateValue(dragX, 0, { type: "spring", stiffness: 200, damping: 20 });
      animateValue(dragY, 0, { type: "spring", stiffness: 200, damping: 20 });
    }
  }, [shouldBlurControls, dragX, dragY]);

  const arabic   = currentZikr?.arabic ?? "";
  const translit = currentZikr ? getTransliteration(currentZikr, language) : "";
  const blurred  = focusMode || shouldBlurControls;

  return (
    <div className="flex flex-col items-center gap-0 select-none">
      <GeometricHeader />

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
          background: "radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, transparent 70%)",
          filter: "blur(8px)",
        }} aria-hidden />

        <ChromeRing value={counter} target={target} countsDown={mode === "down"}
          isCompleted={isCompleted} size={RING_SIZE} strokeWidth={RING_STROKE} />

        {/* Silver ripples */}
        <AnimatePresence>
          {ripples.map(r => (
            <motion.div key={r.id} className="absolute rounded-full pointer-events-none"
              style={{
                width: BEAD_SIZE, height: BEAD_SIZE,
                border: "1.5px solid rgba(192,200,216,0.38)",
                top: "50%", left: "50%", translateX: "-50%", translateY: "-50%",
              }}
              initial={{ scale: 0.55, opacity: 0.65 }} animate={{ scale: 1.9, opacity: 0 }} exit={{}}
              transition={{ duration: 0.85, ease: [0.2, 0.8, 0.4, 1] }} />
          ))}
        </AnimatePresence>

        {/* Obsidian bead — draggable when focus mode is active */}
        <motion.div
          drag={shouldBlurControls}
          dragMomentum={false}
          dragConstraints={constraints}
          style={{
            x: dragX,
            y: dragY,
            zIndex: shouldBlurControls ? 50 : 0,
            filter: filterShadow,
            cursor: shouldBlurControls ? "grab" : "default",
          }}
          whileDrag={{ cursor: "grabbing" }}
        >
          <ObsidianBead size={BEAD_SIZE} isCompleted={isCompleted} pulseTrigger={pulseTrigger}
            counter={counter} target={target} mode={mode} fmt={fmt}
            onClick={handleTap} disabled={isCompleted || shouldBlurControls}
            dragX={dragX} dragY={dragY} />
        </motion.div>
      </div>

      {/* Target */}
      <div className="flex items-center gap-1.5 text-sm font-semibold mb-2" style={{ color: "#70758A" }}>
        <span>{t("counter.targetPrefix")}</span>
        {onTargetTap ? (
          <button onClick={onTargetTap}
            className="rounded border px-2 py-0.5 font-bold tabular-nums transition hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-[#C0C8D8]/40"
            style={{ borderColor: "rgba(192,200,216,0.35)", color: "#C0C8D8", background: "rgba(23,23,29,0.8)" }}>
            {fmt(target)}
          </button>
        ) : (
          <span className="rounded border px-2 py-0.5 font-bold tabular-nums"
            style={{ borderColor: "rgba(192,200,216,0.25)", color: "#C0C8D8", background: "rgba(23,23,29,0.8)" }}>
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
            style={{ background: "linear-gradient(135deg, #B0BAD4 0%, #5A6888 100%)", color: "#0D0D10" }}>
            {t("counter.nextZikr")}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Undo + Reset */}
      <div className={`flex w-full max-w-sm items-center justify-between gap-4 px-4 ${blurred ? "blur-[1px] opacity-50 pointer-events-none select-none" : ""}`}>
        <button onClick={onUndo} aria-label={t("counter.ariaUndo")}
          disabled={!hasProgress || blurred}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-125"
          style={{
            borderColor: "rgba(36,36,48,0.9)", background: "rgba(23,23,29,0.75)",
            color: !hasProgress ? "rgba(112,117,138,0.3)" : "#70758A",
            opacity: !hasProgress ? 0.4 : 1,
          }}>
          <RotateCcw size={16} className="mx-auto" style={{ color: "inherit" }} />
        </button>
        <button onClick={onReset} disabled={blurred}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-125"
          style={{
            borderColor: "rgba(36,36,48,0.9)", background: "rgba(23,23,29,0.75)",
            color: !hasProgress ? "rgba(112,117,138,0.3)" : "#70758A",
            opacity: !hasProgress ? 0.4 : 1,
          }}>
          {t("counter.reset")}
        </button>
      </div>
    </div>
  );
}
