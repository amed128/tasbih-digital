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
  /** Auto-counter props — only active when mode === "auto" */
  autoRunning?: boolean;
  onAutoToggle?: () => void;
  autoIntervalMs?: number;
  onAutoSpeedChange?: (ms: number) => void;
  isCustomSpeed?: boolean;
  onAutoCustomSpeed?: (ms: number) => void;
  audioRunning?: boolean;
  onAudioToggle?: () => void;
  audioMatchProgress?: number;
  hasAudioSelection?: boolean;
  supportsSpeechRecognition?: boolean;
  targetDisplayText?: string;
  audioHelpText?: string;
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
    <svg width={size} height={size} className="-rotate-90 absolute inset-0" style={{ overflow: "visible" }} aria-hidden>
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
        <filter id="mn-done-glow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#D6E8FF" floodOpacity="0.5" />
        </filter>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(23,48,90,0.7)"    strokeWidth={strokeWidth + 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(214,232,255,0.06)" strokeWidth={strokeWidth - 4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(23,48,90,0.35)"   strokeWidth={strokeWidth} />
      <g className={isCompleted ? "mn-shimmer-ring" : undefined}>
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={isCompleted ? "url(#mn-done)" : "url(#mn-moon)"}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          filter={isCompleted ? "url(#mn-done-glow)" : "url(#mn-glow)"}
        />
      </g>

      {isCompleted && (
        <style>{`
          @keyframes mn-shimmer {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 3px rgba(214,232,255,0.5)); }
            50%       { filter: brightness(1.45) drop-shadow(0 0 8px rgba(255,255,255,0.9)); }
          }
          .mn-shimmer-ring { animation: mn-shimmer 1.8s ease-in-out infinite; }
        `}</style>
      )}
    </svg>
  );
}

// ── Royal sapphire bead ───────────────────────────────────────────────────────
// Deep navy body with a luminous atmosphere glow — like a sapphire in candlelight.
// A subtle gold rim glow connects to the Ottoman gilded-dome aesthetic.

function SapphireBead({ size, isCompleted, pulseTrigger, counter, target, mode, fmt, onClick, disabled, dragX, dragY, isAutoMode, autoRunning, onAutoToggle, isAudioMode, audioRunning, onAudioToggle, hasAudioSelection, supportsSpeechRecognition }: {
  size: number; isCompleted: boolean; pulseTrigger?: number;
  counter: number; target: number; mode: string;
  fmt: (n: number) => string; onClick: () => void; disabled: boolean;
  dragX?: MotionValue<number>;
  dragY?: MotionValue<number>;
  isAutoMode?: boolean;
  autoRunning?: boolean;
  onAutoToggle?: () => void;
  isAudioMode?: boolean;
  audioRunning?: boolean;
  onAudioToggle?: () => void;
  hasAudioSelection?: boolean;
  supportsSpeechRecognition?: boolean;
}) {
  const t = useT();
  const handleClick = isAudioMode && onAudioToggle ? onAudioToggle
    : isAutoMode && onAutoToggle ? onAutoToggle
    : onClick;
  const beadDisabled = isAudioMode
    ? (isCompleted || !hasAudioSelection || !supportsSpeechRecognition)
    : isAutoMode ? isCompleted : disabled;

  const _fallbackX = useMotionValue(0);
  const _fallbackY = useMotionValue(0);
  const mx = dragX ?? _fallbackX;
  const my = dragY ?? _fallbackY;
  const specularX = useTransform(mx, (x: number) => Math.max(-15, Math.min(15, -x * 0.18)));
  const specularY = useTransform(my, (y: number) => Math.max(-15, Math.min(15, -y * 0.18)));

  return (
    <motion.button
      onClick={handleClick} disabled={beadDisabled}
      whileTap={beadDisabled ? {} : { scale: 0.93 }}
      animate={typeof pulseTrigger === "number" ? { scale: [1, 1.07, 1] }
        : isAudioMode && audioRunning && !isCompleted ? { scale: [1, 1.025, 1] }
        : {}}
      transition={isAudioMode && audioRunning && !isCompleted && typeof pulseTrigger !== "number"
        ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        : { duration: 0.22, ease: "easeOut" }}
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
        {isAudioMode ? (
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold mt-0.5" style={{ color: "#D6E8FF", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
              {isCompleted ? t("counter.goalReached")
                : audioRunning ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
                    {t("counter.audioBeadListening")}
                  </motion.span>
                ) : t("counter.audioBeadStart")}
            </span>
            {audioRunning && !isCompleted && (
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {t("counter.audioBeadStop")}
              </span>
            )}
          </div>
        ) : isAutoMode ? (
          <div className="mt-0.5 flex flex-col items-center">
            <span className="text-xs font-semibold" style={{ color: "#D6E8FF" }}>
              {isCompleted ? t("counter.goalReached")
                : autoRunning ? t("counter.autoBeadCounting")
                : t("counter.autoBeadAction")}
            </span>
            {autoRunning && !isCompleted && (
              <span className="text-[10px]" style={{ color: "rgba(214,232,255,0.55)" }}>
                {t("counter.autoBeadStop")}
              </span>
            )}
          </div>
        ) : isCompleted ? (
          <span className="mt-1 text-xs font-semibold" style={{ color: "#D6E8FF" }}>✓</span>
        ) : null}
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
  autoRunning, onAutoToggle, autoIntervalMs, onAutoSpeedChange,
  isCustomSpeed, onAutoCustomSpeed,
  audioRunning, onAudioToggle, audioMatchProgress, hasAudioSelection,
  supportsSpeechRecognition, targetDisplayText, audioHelpText,
}: MidnightCounterProps) {
  const t        = useT();
  const language = useTasbihStore(s => s.preferences.language);
  const isAutoMode = mode === "auto";
  const isAudioMode = mode === "audio";
  const [customInput, setCustomInput] = useState(() =>
    isCustomSpeed ? String(Math.round((autoIntervalMs ?? 5000) / 1000)) : "5"
  );
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedLabel = isCustomSpeed
    ? t("settings.custom")
    : autoIntervalMs === 500 ? "0.5s" : autoIntervalMs === 1000 ? "1s" : "2s";

  const fmt = useCallback((n: number) =>
    language === "ar" ? n.toLocaleString("ar-SA") :
    language === "ur" ? n.toLocaleString("ur-PK-u-nu-arab") :
    language === "fa" ? n.toLocaleString("fa-IR") : String(n),
  [language]);

  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleId = useRef(0);
  const beadContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const beadCenterRef = useRef({ x: 0, y: 0 });

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
    beadCenterRef.current = { x: cx, y: cy };
    setConstraints({
      left:   -(cx - BEAD_SIZE / 2),
      right:  window.innerWidth - cx - BEAD_SIZE / 2,
      top:    -(cy - BEAD_SIZE / 2),
      bottom: window.innerHeight - cy - BEAD_SIZE / 2,
    });
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const update = () => {
      const x = beadCenterRef.current.x + dragX.get();
      const y = beadCenterRef.current.y + dragY.get();
      const mask = `radial-gradient(circle at ${x}px ${y}px, transparent 0%, transparent 96px, black 150px)`;
      overlay.style.maskImage = mask;
      overlay.style.setProperty("-webkit-mask-image", mask);
    };
    const unsubX = dragX.on("change", update);
    const unsubY = dragY.on("change", update);
    update();
    return () => { unsubX(); unsubY(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragX, dragY, focusMode]);

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
    <>
      {focusMode && (
        <div
          ref={overlayRef}
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 48,
            background: "rgba(0, 0, 0, 0.90)",
            pointerEvents: "none",
          }}
        />
      )}

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
            position: "relative",
            width: BEAD_SIZE,
            height: BEAD_SIZE,
          }}
          whileDrag={{ cursor: "grabbing" }}
        >
          {isAudioMode && audioRunning && !isCompleted && (
            <>
              <style>{`
                @keyframes mn-audio-ripple {
                  0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.45; }
                  100% { transform: translate(-50%,-50%) scale(2.1); opacity: 0; }
                }
              `}</style>
              {[0, 0.85, 1.7].map(delay => (
                <div key={delay} className="absolute rounded-full pointer-events-none"
                  style={{
                    width: BEAD_SIZE, height: BEAD_SIZE,
                    top: '50%', left: '50%',
                    border: '1.5px solid rgba(214,232,255,0.45)',
                    animation: `mn-audio-ripple 2.4s ease-out ${delay}s infinite`,
                  }} />
              ))}
            </>
          )}

          <SapphireBead size={BEAD_SIZE} isCompleted={isCompleted} pulseTrigger={pulseTrigger}
            counter={counter} target={target} mode={mode} fmt={fmt}
            onClick={handleTap} disabled={isCompleted || shouldBlurControls}
            dragX={dragX} dragY={dragY}
            isAutoMode={isAutoMode} autoRunning={autoRunning} onAutoToggle={onAutoToggle}
            isAudioMode={isAudioMode} audioRunning={audioRunning} onAudioToggle={onAudioToggle}
            hasAudioSelection={hasAudioSelection} supportsSpeechRecognition={supportsSpeechRecognition} />
        </motion.div>
      </div>

      {/* Audio feedback strip — audio mode only */}
      {isAudioMode && (
        <div className="flex flex-col items-center gap-1.5 mb-1 w-full max-w-[260px]">
          {!hasAudioSelection || !supportsSpeechRecognition ? (
            <span className="text-xs text-center px-2" style={{ color: "#6A82A8" }}>{audioHelpText}</span>
          ) : (
            <>
              <span className="text-xs text-center px-2" style={{ color: "#6A82A8" }}>{t("counter.audioReciteHint")}</span>
              <div className="w-full rounded-full overflow-hidden relative" style={{ height: 3, background: "rgba(214,232,255,0.2)" }}>
                <div className="h-full rounded-full transition-[width] duration-75"
                  style={{ width: `${Math.round((audioMatchProgress ?? 0) * 100)}%`, background: "rgba(214,232,255,0.85)" }} />
                {audioRunning && (audioMatchProgress ?? 0) === 0 && (
                  <>
                    <style>{`
                      @keyframes mn-bar-scan {
                        0%   { transform: translateX(-100%); }
                        100% { transform: translateX(400%); }
                      }
                    `}</style>
                    <div className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(214,232,255,0.6) 50%, transparent 100%)",
                        width: '25%',
                        animation: 'mn-bar-scan 1.6s ease-in-out infinite',
                      }} />
                  </>
                )}
              </div>
              {targetDisplayText && (
                <div className="flex items-center gap-1.5 max-w-full">
                  <span className="text-xs shrink-0" style={{ color: "#6A82A8" }}>{t("counter.audioExpectedZikr")}</span>
                  <span className="text-xs font-semibold truncate" dir="rtl" style={{ color: "#D6E8FF" }}>{targetDisplayText}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Speed selector — auto mode only */}
      {isAutoMode && (
        <div className="flex flex-col items-center gap-1.5 mb-1">
          <div className="relative flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--secondary)" }}>{t("counter.autoSpeed")}:</span>
            <div className="relative">
              <button onClick={() => setSpeedOpen(v => !v)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
                style={{ border: "1px solid rgba(214,232,255,0.5)", color: "#D6E8FF", background: "rgba(214,232,255,0.08)" }}>
                {speedLabel}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-150 ${speedOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {speedOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[80px] overflow-hidden rounded-xl border shadow-lg"
                  style={{ background: "rgba(7,16,32,0.98)", borderColor: "rgba(214,232,255,0.18)" }}>
                  {([500, 1000, 2000] as const).map(ms => {
                    const label = ms === 500 ? "0.5s" : ms === 1000 ? "1s" : "2s";
                    const active = !isCustomSpeed && autoIntervalMs === ms;
                    return (
                      <button key={ms} onClick={() => { onAutoSpeedChange?.(ms); setSpeedOpen(false); }}
                        className="block w-full px-4 py-2 text-left text-xs font-semibold transition hover:bg-white/5"
                        style={{ color: active ? "#D6E8FF" : "#6A82A8" }}>
                        {label}
                      </button>
                    );
                  })}
                  <button onClick={() => { if (!isCustomSpeed) onAutoCustomSpeed?.(5000); setSpeedOpen(false); }}
                    className="block w-full px-4 py-2 text-left text-xs font-semibold transition hover:bg-white/5"
                    style={{ color: isCustomSpeed ? "#D6E8FF" : "#6A82A8", borderTop: "1px solid rgba(214,232,255,0.12)" }}>
                    {t("settings.custom")}
                  </button>
                </div>
              )}
            </div>
            {isCustomSpeed && (
              <div className="flex items-center gap-1">
                <input type="number" min={1} max={120} inputMode="numeric"
                  value={customInput}
                  onChange={(e) => {
                    setCustomInput(e.target.value);
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1 && val <= 120) onAutoCustomSpeed?.(val * 1000);
                  }}
                  onBlur={() => {
                    const val = parseInt(customInput, 10);
                    const clamped = isNaN(val) || val < 1 ? 1 : Math.min(val, 120);
                    setCustomInput(String(clamped));
                    onAutoCustomSpeed?.(clamped * 1000);
                  }}
                  className="w-12 rounded-lg border px-2 py-1 text-center text-xs font-semibold outline-none focus:border-[#D6E8FF]"
                  style={{ borderColor: "rgba(214,232,255,0.4)", color: "#D6E8FF", background: "rgba(7,16,32,0.7)" }}
                />
                <span className="text-xs" style={{ color: "var(--secondary)" }}>s</span>
              </div>
            )}
          </div>
        </div>
      )}

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
    </>
  );
}
