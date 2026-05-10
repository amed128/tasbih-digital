"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate as animateValue, type MotionValue } from "framer-motion";
import { useTasbihStore } from "@/store/tasbihStore";
import { getTransliteration } from "@/data/zikrs";
import type { Zikr } from "@/data/zikrs";
import { useT } from "@/hooks/useT";
import { RotateCcw } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AlAndalusCounterProps {
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
  /** Audio-counter props — only active when mode === "audio" */
  audioRunning?: boolean;
  onAudioToggle?: () => void;
  audioMatchProgress?: number;
  hasAudioSelection?: boolean;
  supportsSpeechRecognition?: boolean;
  targetDisplayText?: string;
  audioHelpText?: string;
}

// ─── Water-ripple item ────────────────────────────────────────────────────────

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// ─── Gold-inlay progress ring (SVG) ──────────────────────────────────────────

function GoldRing({
  value,
  target,
  countsDown,
  isCompleted,
  size,
  strokeWidth,
}: {
  value: number;
  target: number;
  countsDown: boolean;
  isCompleted: boolean;
  size: number;
  strokeWidth: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress =
    target > 0
      ? Math.min(1, Math.max(0, countsDown ? (target - value) / target : value / target))
      : 0;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90 absolute inset-0"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aa-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="40%" stopColor="#C9A84C" />
          <stop offset="75%" stopColor="#E8C55A" />
          <stop offset="100%" stopColor="#8B6F2A" />
        </linearGradient>
        <linearGradient id="aa-complete-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#F5D678" />
          <stop offset="40%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        {/* Recessed groove effect */}
        <filter id="aa-ring-shadow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#8B6F2A" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Outer recessed groove */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(100, 80, 40, 0.25)"
        strokeWidth={strokeWidth + 4}
      />
      {/* Inner groove highlight */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 240, 180, 0.12)"
        strokeWidth={strokeWidth - 4}
      />
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(139, 111, 42, 0.18)"
        strokeWidth={strokeWidth}
      />
      {/* Liquid gold fill — shimmer pulse on completion */}
      <g className={isCompleted ? "aa-shimmer-ring" : undefined}>
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isCompleted ? "url(#aa-complete-gradient)" : "url(#aa-gold-gradient)"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          filter="url(#aa-ring-shadow)"
        />
      </g>

      {isCompleted && (
        <style>{`
          @keyframes aa-shimmer {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 3px rgba(212,175,55,0.5)); }
            50%       { filter: brightness(1.45) drop-shadow(0 0 8px rgba(245,214,120,0.9)); }
          }
          .aa-shimmer-ring {
            animation: aa-shimmer 1.8s ease-in-out infinite;
          }
        `}</style>
      )}
    </svg>
  );
}

// ─── Lapis Lazuli gemstone bead ───────────────────────────────────────────────

export function LapisBead({
  size,
  isCompleted,
  pulseTrigger,
  counter,
  target,
  mode,
  fmt,
  onClick,
  disabled,
  dragX,
  dragY,
  focusMode,
  isAutoMode,
  autoRunning,
  onAutoToggle,
  isAudioMode,
  audioRunning,
  onAudioToggle,
  hasAudioSelection,
  supportsSpeechRecognition,
}: {
  size: number;
  isCompleted: boolean;
  pulseTrigger?: number;
  counter: number;
  target: number;
  mode: string;
  fmt: (n: number) => string;
  onClick: () => void;
  disabled: boolean;
  dragX?: MotionValue<number>;
  dragY?: MotionValue<number>;
  focusMode?: boolean;
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
  const countsDown = mode === "down";

  const handleClick = isAudioMode && onAudioToggle ? onAudioToggle
    : isAutoMode && onAutoToggle ? onAutoToggle
    : onClick;

  const beadDisabledAudio = isAudioMode && (isCompleted || !hasAudioSelection || !supportsSpeechRecognition);

  const _fallbackX = useMotionValue(0);
  const _fallbackY = useMotionValue(0);
  const mx = dragX ?? _fallbackX;
  const my = dragY ?? _fallbackY;
  const specularX = useTransform(mx, (x: number) => Math.max(-15, Math.min(15, -x * 0.18)));
  const specularY = useTransform(my, (y: number) => Math.max(-15, Math.min(15, -y * 0.18)));

  const beadDisabled = isAudioMode ? beadDisabledAudio : isAutoMode ? isCompleted : disabled;

  return (
    <motion.button
      onClick={handleClick}
      disabled={beadDisabled}
      whileTap={beadDisabled ? {} : { scale: 0.93 }}
      animate={typeof pulseTrigger === "number" ? { scale: [1, 1.07, 1] } : {}}
      transition={{ duration: 0.22, ease: "easeOut" }}
      aria-label={t("counter.tap")}
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center rounded-full outline-none focus:ring-4 focus:ring-[var(--aa-gold)]/50"
    >
      {/* Gemstone body — radial gradient simulating a 3D sphere */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: isCompleted
            ? "radial-gradient(circle at 38% 32%, #F5E6C8, #C8A870 45%, #8B6035 78%, #4A2E10 96%)"
            : "radial-gradient(circle at 38% 32%, #7BAEE8, #2E5FA3 40%, #1B3A6B 72%, #0D1F3C)",
          boxShadow: focusMode
            ? "none"
            : isCompleted
            ? "0 0 32px rgba(139,96,53,0.50), 0 6px 18px rgba(0,0,0,0.30)"
            : "0 16px 48px rgba(27,58,107,0.65), 0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 16px rgba(0,0,0,0.32)",
        }}
      />

      {/* Specular highlight — shifts toward light source as bead drags away from center */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.32,
          height: size * 0.22,
          top: size * 0.11,
          left: size * 0.18,
          background: "radial-gradient(ellipse, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.25) 55%, transparent 100%)",
          filter: "blur(2px)",
          x: specularX,
          y: specularY,
        }}
      />

      {/* Secondary rim glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 68% 78%, rgba(255,220,120,0.18) 0%, transparent 50%)",
        }}
      />

      {/* Counter value */}
      <div className="relative z-10 flex flex-col items-center select-none">
        <motion.span
          key={counter}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.18 }}
          className="text-5xl font-bold leading-tight tabular-nums"
          style={{
            color: isCompleted ? "#FDF6E8" : "#EEF4FF",
            textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.8)",
          }}
        >
          {fmt(counter)}
        </motion.span>
        <span
          className="text-xs font-semibold mt-0.5"
          style={{
            color: "rgba(200,220,255,0.7)",
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          {countsDown ? t("circle.remaining") : `/ ${fmt(target)}`}
        </span>
        {isAudioMode ? (
          <div className="mt-1 flex flex-col items-center">
            <span className="text-xs font-semibold"
              style={{ color: "#F5E6C8", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
              {isCompleted ? t("counter.goalReached")
                : audioRunning ? t("counter.audioBeadListening")
                : t("counter.audioBeadStart")}
            </span>
            {audioRunning && !isCompleted && (
              <span className="text-[10px]"
                style={{ color: "rgba(245,230,200,0.6)", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                {t("counter.audioBeadStop")}
              </span>
            )}
          </div>
        ) : isAutoMode ? (
          <span className="mt-1 text-xs font-semibold"
            style={{ color: "#F5E6C8", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            {isCompleted ? t("counter.goalReached")
              : autoRunning ? t("counter.autoStop")
              : t("counter.autoBeadAction")}
          </span>
        ) : isCompleted ? (
          <span className="mt-1 text-xs font-semibold"
            style={{ color: "#F5E6C8", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
            ✓
          </span>
        ) : null}
      </div>
    </motion.button>
  );
}

// ─── Muqarnas geometric header strip ─────────────────────────────────────────

function MuqarnasHeader() {
  // A row of stylised pointed arches rendered as inline SVG
  const archCount = 7;
  const w = 40;
  const h = 32;
  const totalW = archCount * w;

  return (
    <div className="w-full overflow-hidden" style={{ height: h, opacity: 0.55 }}>
      <svg
        viewBox={`0 0 ${totalW} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="aa-muq-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8B6F2A" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        {Array.from({ length: archCount }).map((_, i) => {
          const x = i * w;
          return (
            <g key={i}>
              {/* Pointed Moorish arch */}
              <path
                d={`M${x},${h} L${x},${h * 0.55} Q${x + w * 0.5},${-h * 0.15} ${x + w},${h * 0.55} L${x + w},${h} Z`}
                fill="url(#aa-muq-grad)"
              />
              {/* Small inner ornament */}
              <circle cx={x + w / 2} cy={h * 0.6} r={2.5} fill="#C9A84C" opacity="0.6" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Engraved-gold Zikr text ──────────────────────────────────────────────────

function ZikrEngravedText({ arabic, translit }: { arabic: string; translit: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 text-center">
      {arabic && (
        <p
          className="text-2xl font-bold leading-relaxed"
          dir="rtl"
          style={{
            color: "#8B5E1A",
            textShadow:
              "0 1px 0 rgba(255,240,180,0.6), 0 -1px 0 rgba(0,0,0,0.25), 0 2px 6px rgba(139,95,26,0.4)",
            letterSpacing: "0.04em",
          }}
        >
          {arabic}
        </p>
      )}
      {translit && (
        <p
          className="text-sm font-semibold italic"
          style={{
            color: "#A07840",
            textShadow:
              "0 1px 0 rgba(255,240,180,0.4), 0 -1px 0 rgba(0,0,0,0.15)",
          }}
        >
          {translit}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const RING_SIZE   = 264;
const RING_STROKE = 16;
const BEAD_SIZE   = RING_SIZE - RING_STROKE * 2 - 16;

export function AlAndalusCounter({
  counter,
  target,
  mode,
  isCompleted,
  pulseTrigger,
  currentZikr,
  onIncrement,
  onUndo,
  onReset,
  focusMode,
  shouldBlurControls,
  hasProgress,
  onTargetTap,
  onNextZikr,
  autoRunning,
  onAutoToggle,
  autoIntervalMs,
  onAutoSpeedChange,
  isCustomSpeed,
  onAutoCustomSpeed,
  audioRunning,
  onAudioToggle,
  audioMatchProgress,
  hasAudioSelection,
  supportsSpeechRecognition,
  targetDisplayText,
  audioHelpText,
}: AlAndalusCounterProps) {
  const t = useT();
  const language = useTasbihStore((s) => s.preferences.language);
  const isAutoMode = mode === "auto";
  const isAudioMode = mode === "audio";
  const [customInput, setCustomInput] = useState(() =>
    isCustomSpeed ? String(Math.round((autoIntervalMs ?? 5000) / 1000)) : "5"
  );
  const [speedOpen, setSpeedOpen] = useState(false);
  const speedLabel = isCustomSpeed
    ? t("settings.custom")
    : autoIntervalMs === 500 ? "0.5s" : autoIntervalMs === 1000 ? "1s" : "2s";

  const fmt = useCallback(
    (n: number) =>
      language === "ar"
        ? n.toLocaleString("ar-SA")
        : language === "ur"
        ? n.toLocaleString("ur-PK-u-nu-arab")
        : language === "fa"
        ? n.toLocaleString("fa-IR")
        : String(n),
    [language]
  );

  const countsDown = mode === "down";

  // Ripple state
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const rippleIdRef = useRef(0);
  const beadContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef    = useRef<HTMLDivElement>(null);
  const beadCenterRef = useRef({ x: 0, y: 0 });

  const spawnRipple = useCallback(() => {
    const id = ++rippleIdRef.current;
    setRipples((prev) => [...prev, { id, x: 50, y: 50 }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 900);
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
      return `drop-shadow(${sx}px ${sy}px ${blur}px rgba(27,58,107,0.45))`;
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
  }, [focusMode]);

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
  }, [dragX, dragY, focusMode]); // focusMode re-runs so overlayRef is freshly set

  useEffect(() => {
    if (!focusMode) {
      animateValue(dragX, 0, { type: "spring", stiffness: 200, damping: 20 });
      animateValue(dragY, 0, { type: "spring", stiffness: 200, damping: 20 });
    }
  }, [focusMode, dragX, dragY]);

  const arabic = currentZikr?.arabic ?? "";
  const translit = currentZikr ? getTransliteration(currentZikr, language) : "";

  const controlsBlurred = focusMode || shouldBlurControls;

  return (
    <>
      {focusMode && (
        <div
          ref={overlayRef}
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 48,
            background: "rgba(140, 120, 80, 0.90)",
            pointerEvents: "none",
          }}
        />
      )}

      <div className="flex flex-col items-center gap-0 select-none">
      {/* Muqarnas decorative arch strip */}
      <MuqarnasHeader />

      {/* Zikr text — engraved gold, only shown when a zikr is active */}
      {arabic && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentZikr?.id ?? "none"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-3 mb-1"
          >
            <ZikrEngravedText arabic={arabic} translit={translit} />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Gold ring + Lapis bead */}
      <div
        ref={beadContainerRef}
        className="relative flex items-center justify-center my-2"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        {/* Marble shadow beneath the bead */}
        {!focusMode && <div
          className="absolute rounded-full"
          style={{
            width: BEAD_SIZE * 0.85,
            height: BEAD_SIZE * 0.3,
            bottom: RING_STROKE + 8,
            background:
              "radial-gradient(ellipse, rgba(20,30,60,0.35) 0%, transparent 70%)",
            filter: "blur(6px)",
          }}
          aria-hidden="true"
        />}

        {/* Gold inlay progress ring */}
        <GoldRing
          value={counter}
          target={target}
          countsDown={countsDown}
          isCompleted={isCompleted}
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
        />

        {/* Lapis Lazuli bead — draggable when focus mode is active */}
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
          {/* Ripples — inside draggable so they follow the bead */}
          <AnimatePresence>
            {ripples.map((r) => (
              <motion.div
                key={r.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: BEAD_SIZE,
                  height: BEAD_SIZE,
                  border: "2px solid rgba(201,168,76,0.55)",
                  top: "50%",
                  left: "50%",
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                initial={{ scale: 0.55, opacity: 0.7 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{}}
                transition={{ duration: 1.1, ease: [0.2, 0.8, 0.4, 1] }}
              />
            ))}
          </AnimatePresence>

          <LapisBead
            size={BEAD_SIZE}
            isCompleted={isCompleted}
            pulseTrigger={pulseTrigger}
            counter={counter}
            target={target}
            mode={mode}
            fmt={fmt}
            onClick={handleTap}
            disabled={isCompleted || shouldBlurControls}
            dragX={dragX}
            dragY={dragY}
            focusMode={focusMode}
            isAutoMode={isAutoMode}
            autoRunning={autoRunning}
            onAutoToggle={onAutoToggle}
            isAudioMode={isAudioMode}
            audioRunning={audioRunning}
            onAudioToggle={onAudioToggle}
            hasAudioSelection={hasAudioSelection}
            supportsSpeechRecognition={supportsSpeechRecognition}
          />
        </motion.div>
      </div>

      {/* Audio feedback strip — audio mode only */}
      {isAudioMode && (
        <div className="flex flex-col items-center gap-1.5 mb-1 w-full max-w-[260px]">
          {!hasAudioSelection || !supportsSpeechRecognition ? (
            <span className="text-xs text-center px-2" style={{ color: "#8B7355" }}>
              {audioHelpText}
            </span>
          ) : (
            <>
              <span className="text-xs text-center px-2" style={{ color: "#8B7355" }}>
                {t("counter.audioReciteHint")}
              </span>
              <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: "rgba(201,168,76,0.2)" }}>
                <div className="h-full rounded-full transition-[width] duration-75"
                  style={{ width: `${Math.round((audioMatchProgress ?? 0) * 100)}%`, background: "rgba(201,168,76,0.85)" }} />
              </div>
              {targetDisplayText && (
                <div className="flex items-center gap-1.5 max-w-full">
                  <span className="text-xs shrink-0" style={{ color: "#8B7355" }}>{t("counter.audioExpectedZikr")}</span>
                  <span className="text-xs font-semibold truncate" dir="rtl" style={{ color: "#7A5A10" }}>
                    {targetDisplayText}
                  </span>
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
                style={{ border: "1.5px solid rgba(201,168,76,0.85)", color: "#7A5A10", background: "rgba(201,168,76,0.18)" }}>
                {speedLabel}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-150 ${speedOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {speedOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-50 min-w-[80px] overflow-hidden rounded-xl border shadow-lg"
                  style={{ background: "rgba(237,228,210,0.98)", borderColor: "rgba(201,168,76,0.35)" }}>
                  {([500, 1000, 2000] as const).map(ms => {
                    const label = ms === 500 ? "0.5s" : ms === 1000 ? "1s" : "2s";
                    const active = !isCustomSpeed && autoIntervalMs === ms;
                    return (
                      <button key={ms} onClick={() => { onAutoSpeedChange?.(ms); setSpeedOpen(false); }}
                        className="block w-full px-4 py-2 text-left text-xs font-semibold transition hover:bg-black/5"
                        style={{ color: active ? "#8B6314" : "#6B5030" }}>
                        {label}
                      </button>
                    );
                  })}
                  <button onClick={() => { if (!isCustomSpeed) onAutoCustomSpeed?.(5000); setSpeedOpen(false); }}
                    className="block w-full px-4 py-2 text-left text-xs font-semibold transition hover:bg-black/5"
                    style={{ color: isCustomSpeed ? "#8B6314" : "#6B5030", borderTop: "1px solid rgba(201,168,76,0.25)" }}>
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
                  className="w-12 rounded-lg border px-2 py-1 text-center text-xs font-semibold outline-none"
                  style={{ borderColor: "rgba(201,168,76,0.85)", color: "#7A5A10", background: "rgba(255,252,245,0.9)" }}
                />
                <span className="text-xs" style={{ color: "var(--secondary)" }}>s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target line */}
      <div className="flex items-center gap-1.5 text-sm font-semibold mb-2"
        style={{ color: "#8B6F4E" }}>
        <span>{t("counter.targetPrefix")}</span>
        {onTargetTap ? (
          <button
            onClick={onTargetTap}
            className="rounded border px-2 py-0.5 font-bold tabular-nums transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            style={{
              borderColor: "rgba(180,145,72,0.5)",
              color: "#5C3D11",
              background: "rgba(255,248,230,0.7)",
            }}
          >
            {fmt(target)}
          </button>
        ) : (
          <span
            className="rounded border px-2 py-0.5 font-bold tabular-nums"
            style={{
              borderColor: "rgba(180,145,72,0.4)",
              color: "#5C3D11",
              background: "rgba(255,248,230,0.7)",
            }}
          >
            {fmt(target)}
          </span>
        )}
        <span>{t("counter.targetSuffix")}</span>
      </div>

      {/* Next zikr button — list mode only, shown when completed */}
      <AnimatePresence>
        {onNextZikr && isCompleted && (
          <motion.button
            onClick={onNextZikr}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="mb-3 w-full max-w-sm rounded-xl px-6 py-4 text-base font-bold transition hover:brightness-110 active:brightness-95"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #8B6F2A 100%)",
              color: "#1C1008",
            }}
          >
            {t("counter.nextZikr")}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Undo + Reset controls */}
      <div
        className={`flex w-full max-w-sm items-center justify-between gap-4 px-4 ${
          controlsBlurred ? "blur-[1px] opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <button
          onClick={onUndo}
          aria-label={t("counter.ariaUndo")}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-95"
          style={{
            borderColor: "rgba(180,145,72,0.35)",
            background: "rgba(255,252,245,0.85)",
            color: !hasProgress ? "rgba(139,111,78,0.35)" : "#5C3D11",
            opacity: !hasProgress ? 0.4 : 1,
          }}
          disabled={!hasProgress || controlsBlurred}
        >
          <RotateCcw size={16} className="mx-auto" style={{ color: "inherit" }} />
        </button>
        <button
          onClick={onReset}
          disabled={controlsBlurred}
          className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-95"
          style={{
            borderColor: "rgba(180,145,72,0.35)",
            background: "rgba(255,252,245,0.85)",
            color: !hasProgress ? "rgba(139,111,78,0.35)" : "#5C3D11",
            opacity: !hasProgress ? 0.4 : 1,
          }}
        >
          {t("counter.reset")}
        </button>
      </div>
    </div>
    </>
  );
}
