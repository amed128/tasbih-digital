"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
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
}

// ─── Water-ripple item ────────────────────────────────────────────────────────

interface Ripple {
  id: number;
  x: number;
  y: number;
}

// ─── Web-Audio stone-on-stone synthesiser ─────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playStoneClick(volume = 0.55) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const sampleRate = ctx.sampleRate;
  const duration = 0.09; // 90 ms percussive click
  const len = Math.floor(sampleRate * duration);
  const buf = ctx.createBuffer(1, len, sampleRate);
  const data = buf.getChannelData(0);

  for (let i = 0; i < len; i++) {
    // White noise with steep exponential decay
    const env = Math.pow(1 - i / len, 6);
    data[i] = (Math.random() * 2 - 1) * env;
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;

  // High-mid bandpass — gives stone / mineral quality
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1400;
  bp.Q.value = 0.6;

  // Slight high-shelf boost for brightness
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 3000;
  shelf.gain.value = 6;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  src.connect(bp);
  bp.connect(shelf);
  shelf.connect(gain);
  gain.connect(ctx.destination);
  src.start();
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
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#16A34A" />
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
      {/* Liquid gold fill */}
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
    </svg>
  );
}

// ─── Lapis Lazuli gemstone bead ───────────────────────────────────────────────

function LapisBead({
  size,
  isCompleted,
  pulseTrigger,
  counter,
  target,
  mode,
  fmt,
  onClick,
  disabled,
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
}) {
  const t = useT();
  const countsDown = mode === "down";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.93 }}
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
            ? "radial-gradient(circle at 38% 32%, #6EE7B7, #22C55E 45%, #15803D 80%, #064E3B)"
            : "radial-gradient(circle at 38% 32%, #7BAEE8, #2E5FA3 40%, #1B3A6B 72%, #0D1F3C)",
          boxShadow: isCompleted
            ? "0 16px 48px rgba(22,163,74,0.55), 0 6px 18px rgba(0,0,0,0.35), inset 0 -6px 16px rgba(0,0,0,0.28)"
            : "0 16px 48px rgba(27,58,107,0.65), 0 6px 18px rgba(0,0,0,0.45), inset 0 -6px 16px rgba(0,0,0,0.32)",
        }}
      />

      {/* Specular highlight — catches the light */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 0.32,
          height: size * 0.22,
          top: size * 0.11,
          left: size * 0.18,
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.25) 55%, transparent 100%)",
          filter: "blur(2px)",
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
            color: isCompleted ? "#ECFDF5" : "#EEF4FF",
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
        {isCompleted && (
          <span
            className="mt-1 text-xs font-semibold"
            style={{ color: "#A7F3D0", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}
          >
            ✓
          </span>
        )}
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
}: AlAndalusCounterProps) {
  const t = useT();
  const language = useTasbihStore((s) => s.preferences.language);
  const vibrationEnabled = useTasbihStore((s) => s.preferences.vibration);
  const tapSound = useTasbihStore((s) => s.preferences.tapSound);

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

  const spawnRipple = useCallback(() => {
    const id = ++rippleIdRef.current;
    setRipples((prev) => [...prev, { id, x: 50, y: 50 }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 900);
  }, []);

  const handleTap = useCallback(() => {
    if (isCompleted) return;

    // Stone-on-stone sound
    if (tapSound !== "off") playStoneClick();

    // Sharp haptic pulse
    if (vibrationEnabled) {
      Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {
        if (typeof window?.navigator?.vibrate === "function") {
          window.navigator.vibrate([12]);
        }
      });
    }

    spawnRipple();
    onIncrement();
  }, [isCompleted, tapSound, vibrationEnabled, spawnRipple, onIncrement]);

  const RING_SIZE = 288;
  const RING_STROKE = 18;
  const BEAD_SIZE = RING_SIZE - RING_STROKE * 2 - 16;

  const arabic = currentZikr?.arabic ?? "";
  const translit = currentZikr ? getTransliteration(currentZikr, language) : "";

  const controlsBlurred = focusMode || shouldBlurControls;

  return (
    <div className="flex flex-col items-center gap-0 select-none">
      {/* Muqarnas decorative arch strip */}
      <MuqarnasHeader />

      {/* Zikr text — engraved gold */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentZikr?.id ?? "none"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-4 mb-2"
        >
          <ZikrEngravedText arabic={arabic} translit={translit} />
        </motion.div>
      </AnimatePresence>

      {/* Gold ring + Lapis bead */}
      <div
        ref={beadContainerRef}
        className="relative flex items-center justify-center my-4"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
        {/* Marble shadow beneath the bead */}
        <div
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
        />

        {/* Gold inlay progress ring */}
        <GoldRing
          value={counter}
          target={target}
          countsDown={countsDown}
          isCompleted={isCompleted}
          size={RING_SIZE}
          strokeWidth={RING_STROKE}
        />

        {/* Water ripple overlays */}
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
              animate={{ scale: 1.9, opacity: 0 }}
              exit={{}}
              transition={{ duration: 0.85, ease: [0.2, 0.8, 0.4, 1] }}
            />
          ))}
        </AnimatePresence>

        {/* Lapis Lazuli bead */}
        <LapisBead
          size={BEAD_SIZE}
          isCompleted={isCompleted}
          pulseTrigger={pulseTrigger}
          counter={counter}
          target={target}
          mode={mode}
          fmt={fmt}
          onClick={handleTap}
          disabled={isCompleted || controlsBlurred}
        />
      </div>

      {/* Target line */}
      <div className="flex items-center gap-1.5 text-sm font-semibold mb-4"
        style={{ color: "#8B6F4E" }}>
        <span>{t("counter.targetPrefix")}</span>
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
        <span>{t("counter.targetSuffix")}</span>
      </div>

      {/* Completed badge */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className="mb-3 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.35)",
              color: "#15803D",
            }}
          >
            <span>✓</span> {t("circle.objectiveReached")}
          </motion.div>
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
  );
}
