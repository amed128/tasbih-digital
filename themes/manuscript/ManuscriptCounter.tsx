"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useAnimationControls,
  animate as animateValue,
} from "framer-motion";
import { useTasbihStore } from "@/store/tasbihStore";
import { getTransliteration } from "@/data/zikrs";
import type { Zikr } from "@/data/zikrs";
import { useT } from "@/hooks/useT";
import { RotateCcw } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ManuscriptCounterProps {
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

type FocusStyle = "vignette" | "candlelight";

// ─── Vellum parchment background ─────────────────────────────────────────────

function VellumBackground({
  focusMode,
  focusStyle,
}: {
  focusMode: boolean;
  focusStyle: FocusStyle;
}) {
  const isCandle   = focusMode && focusStyle === "candlelight";
  const isVignette = focusMode && focusStyle === "vignette";

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden>
        <defs>
          <filter id="ms-vellum-grain" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.72 0.54"
              numOctaves="4" seed="8" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
            <feComposite in="gray" in2="SourceAlpha" operator="in" result="masked" />
            <feBlend in="SourceGraphic" in2="masked" mode="multiply" />
          </filter>
        </defs>
      </svg>

      {/* Base parchment — warms to amber in candlelight */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        animate={{
          background: isCandle
            ? "radial-gradient(ellipse 110% 110% at 50% 55%, #F8E89A 0%, #ECC84A 35%, #D4A030 65%, #A06818 100%)"
            : "radial-gradient(ellipse 110% 110% at 50% 40%, #FAF3DC 0%, #F4EBD0 45%, #EADBB4 75%, #D9C89A 100%)",
        }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
        style={{ zIndex: -2 }}
      />

      {/* Grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: -1, opacity: 0.22, filter: "url(#ms-vellum-grain)", background: "#C8A860" }}
      />

      {/* Candlelight warm flame glow — centered radial bloom */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        animate={{ opacity: isCandle ? 1 : 0 }}
        transition={{ duration: 0.9 }}
        style={{
          zIndex: -1,
          background:
            "radial-gradient(ellipse 55% 45% at 50% 48%, rgba(255,210,80,0.28) 0%, rgba(220,140,20,0.14) 55%, transparent 100%)",
        }}
      />

      {/* Vignette — deepens in vignette focus mode */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        animate={{
          background: isVignette
            ? "radial-gradient(ellipse 72% 72% at 50% 50%, transparent 30%, rgba(28,12,2,0.55) 68%, rgba(12,4,0,0.88) 100%)"
            : "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(101,72,28,0.18) 80%, rgba(60,38,10,0.40) 100%)",
        }}
        transition={{ duration: 0.85, ease: "easeInOut" }}
        style={{ zIndex: -1 }}
      />
    </>
  );
}

// ─── Ottoman geometric header band ───────────────────────────────────────────

function OttomanBand() {
  return (
    <div aria-hidden style={{ position: "relative", width: "100%", height: 28 }}>
      <div style={{
        position: "absolute", inset: 0, opacity: 0.72,
        background: "repeating-linear-gradient(90deg, #1A3A8B 0px, #1A3A8B 6px, #8B6914 6px, #8B6914 8px, #1A3A8B 8px, #1A3A8B 22px, #8B6914 22px, #8B6914 24px)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(212,175,55,0.18) 0%, transparent 50%, rgba(212,175,55,0.18) 100%)",
      }} />
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, transparent, #D4AF37 20%, #8B6914 50%, #D4AF37 80%, transparent)",
        opacity: 0.9,
      }} />
    </div>
  );
}

// ─── The Qalam (Reed Pen) SVG ─────────────────────────────────────────────────

function QalamSVG({ isCompleted, focusMode }: { isCompleted: boolean; focusMode: boolean }) {
  const goldNib = isCompleted || focusMode;
  return (
    <svg viewBox="0 0 240 48" width="200" height="40" aria-hidden style={{ overflow: "visible", display: "block" }}>
      <defs>
        <linearGradient id="ms-shaft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#EDD99A" />
          <stop offset="28%"  stopColor="#C8A460" />
          <stop offset="65%"  stopColor="#A07838" />
          <stop offset="100%" stopColor="#7C5820" />
        </linearGradient>
        <linearGradient id="ms-nib" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={goldNib ? "#B8860B" : "#2C1408"} />
          <stop offset="100%" stopColor={goldNib ? "#FFD700" : "#0D0500"} />
        </linearGradient>
        <linearGradient id="ms-ferrule" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#F5D678" />
          <stop offset="50%"  stopColor="#C9A227" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id="ms-cap" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#4A2C10" />
          <stop offset="100%" stopColor="#1C0A02" />
        </linearGradient>
        <filter id="ms-pen-shadow" x="-10%" y="-40%" width="130%" height="220%">
          <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="rgba(44,20,4,0.40)" />
        </filter>
      </defs>
      <g filter="url(#ms-pen-shadow)">
        <rect x="0"   y="14" width="22"  height="20" rx="6" fill="url(#ms-cap)" />
        <rect x="21"  y="16" width="152" height="16" fill="url(#ms-shaft)" />
        {[60, 100, 140].map((x) => (
          <line key={x} x1={x} y1="16" x2={x} y2="32"
            stroke="rgba(100,60,10,0.35)" strokeWidth="2" />
        ))}
        <rect x="170" y="15" width="34" height="18" rx="2" fill="rgba(60,28,4,0.28)" />
        <rect x="202" y="12" width="10" height="24" rx="1" fill="url(#ms-ferrule)" />
        <rect x="205" y="12" width="2"  height="24" fill="rgba(255,240,160,0.45)" />
        <path d="M211,14 L238,24 L211,34 Z" fill="url(#ms-nib)" />
        <line x1="222" y1="24" x2="238" y2="24"
          stroke={goldNib ? "rgba(255,215,0,0.5)" : "rgba(200,120,40,0.4)"}
          strokeWidth="1.2" />
        <circle cx="238" cy="24" r={goldNib ? 3.5 : 2.5}
          fill={isCompleted ? "#D4AF37" : focusMode ? "#B8860B" : "#1A1A2E"} />
        <circle cx="236.5" cy="22.5" r="1" fill="rgba(255,255,255,0.30)" />
      </g>
    </svg>
  );
}

// ─── Ink drop burst from nib on tap ──────────────────────────────────────────

interface InkDrop { id: number; x: number; y: number; size: number }

function InkDropBurst({ pulseTrigger }: { pulseTrigger?: number }) {
  const [drops, setDrops] = useState<InkDrop[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (typeof pulseTrigger !== "number") return;
    const count = 5 + Math.floor(Math.random() * 4);
    const batch: InkDrop[] = Array.from({ length: count }, () => ({
      id: ++idRef.current,
      x: (Math.random() - 0.5) * 30,
      y: (Math.random() - 0.5) * 22,
      size: 3 + Math.round(Math.random() * 4),
    }));
    setDrops((p) => [...p, ...batch]);
    const timer = setTimeout(() => {
      setDrops((p) => p.filter((d) => !batch.some((b) => b.id === d.id)));
    }, 700);
    return () => clearTimeout(timer);
  }, [pulseTrigger]);

  return (
    <div aria-hidden className="pointer-events-none absolute"
      style={{ right: 20, top: "72%", width: 0, height: 0 }}>
      <AnimatePresence>
        {drops.map((d) => (
          <motion.div key={d.id} className="absolute rounded-full"
            style={{ width: d.size, height: d.size, background: "#1A1A2E", top: -2, left: -2 }}
            initial={{ x: 0, y: 0, opacity: 0.8, scale: 1 }}
            animate={{ x: d.x, y: d.y, opacity: 0, scale: 0.2 }}
            exit={{}}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Gold dust particles on 33-count milestones ───────────────────────────────

interface GoldParticle { id: number; angle: number; size: number; dist: number }

function GoldDustParticles({ counter }: { counter: number }) {
  const [particles, setParticles] = useState<GoldParticle[]>([]);
  const prevRef = useRef(Math.floor(counter / 33));
  const idRef   = useRef(0);

  useEffect(() => {
    const m = Math.floor(counter / 33);
    if (counter > 0 && m !== prevRef.current) {
      prevRef.current = m;
      const batch: GoldParticle[] = Array.from({ length: 14 }, () => ({
        id: ++idRef.current,
        angle: Math.random() * 360,
        size:  3 + Math.random() * 3,
        dist:  30 + Math.random() * 65,
      }));
      setParticles((p) => [...p, ...batch]);
      setTimeout(() => setParticles((p) => p.filter((x) => !batch.some((b) => b.id === x.id))), 1400);
    }
  }, [counter]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          return (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ width: p.size, height: p.size,
                background: "radial-gradient(circle, #F5D678 0%, #D4AF37 55%, transparent 100%)" }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: Math.cos(rad) * p.dist, y: Math.sin(rad) * p.dist, opacity: 0, scale: 0.2 }}
              exit={{}}
              transition={{ duration: 1.3, ease: "easeOut" }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Ink progress bar ─────────────────────────────────────────────────────────

function InkProgressBar({
  value, target, countsDown, isCompleted,
}: {
  value: number; target: number; countsDown: boolean; isCompleted: boolean;
}) {
  const progress = target > 0
    ? Math.min(1, Math.max(0, countsDown ? (target - value) / target : value / target))
    : 0;

  return (
    <div className="relative overflow-hidden" style={{
      width: STAGE_W, height: 12, borderRadius: 3,
      background: "rgba(92,58,20,0.14)",
      border: "1px solid rgba(139,105,20,0.22)",
      boxShadow: "inset 0 1px 3px rgba(44,20,4,0.18)",
    }} aria-hidden>
      <motion.div
        style={{ height: "100%", borderRadius: 3, originX: 0 }}
        animate={{ scaleX: progress }}
        initial={{ scaleX: 0 }}
        transition={{ type: "spring", stiffness: 90, damping: 22 }}
      >
        <div style={{
          width: "100%", height: "100%", borderRadius: 3,
          background: isCompleted
            ? "linear-gradient(90deg, #8B6914, #D4AF37, #F5D678, #D4AF37, #8B6914)"
            : "linear-gradient(90deg, #1A1A2E 0%, #2E2E5C 60%, #1A3A8B 100%)",
          backgroundSize: isCompleted ? "200% 100%" : "100% 100%",
          animation: isCompleted ? "ms-ink-shimmer 2.2s ease-in-out infinite" : "none",
        }} />
      </motion.div>
      {[0.25, 0.5, 0.75].map((frac) => (
        <div key={frac} style={{
          position: "absolute", left: `${frac * 100}%`, top: 0,
          width: 1, height: "100%", background: "rgba(139,105,20,0.30)",
        }} />
      ))}
      <style>{`
        @keyframes ms-ink-shimmer {
          0%   { background-position: 0%   50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0%   50%; }
        }
      `}</style>
    </div>
  );
}

// ─── Qalam writing stage (card + pen) ────────────────────────────────────────

const STAGE_W = 268;
const STAGE_H = 200;

// Pen positions: top of the pen wrapper div (absolute inside card)
// In counting mode: pen sits in lower half, nib angled DOWN toward ink bar
// In completed mode: pen floats to upper area, nib angled UP away from ink bar
const PEN_TOP_COUNTING   = 118; // px from top of card — nib points toward bar below
const PEN_TOP_COMPLETED  = 10;  // px from top of card — nib points upward
const PEN_ROTATE_COUNTING   = 34;   // deg — clockwise, nib aims down-right
const PEN_ROTATE_COMPLETED  = -34;  // deg — counter-clockwise, nib aims up-right

// Pen geometry (card-space coordinates, origin = top-left of card)
// SVG is 200px wide, 40px tall — pen center = (STAGE_W/2, PEN_TOP_COUNTING + 20)
const PEN_CENTER_X  = STAGE_W / 2;          // 134
const PEN_CENTER_Y  = PEN_TOP_COUNTING + 20; // 138 — counting resting y
const NIB_HALF_LEN  = 100;                   // half of 200px SVG — nib is 100px right of center
// Ink bar center Y in card-space: card height + gap + half bar height
const BAR_Y_IN_CARD = STAGE_H + 8 + 6;      // ≈ 214

function QalamStage({
  counter, target, mode, isCompleted, pulseTrigger,
  onClick, disabled, fmt, focusMode,
}: {
  counter: number; target: number; mode: string;
  isCompleted: boolean; pulseTrigger?: number;
  onClick: () => void; disabled: boolean;
  fmt: (n: number) => string; focusMode: boolean;
}) {
  const t = useT();
  const countsDown = mode === "down";

  // Single controls for the pen: handles both rest-position transitions and dips
  const penControls = useAnimationControls();
  const prevPulse   = useRef<number | undefined>(undefined);

  // Counting ↔ completed: spring the pen between bottom (nib-down) and top (nib-up)
  useEffect(() => {
    penControls.start({
      top:    isCompleted ? PEN_TOP_COMPLETED  : PEN_TOP_COUNTING,
      rotate: isCompleted ? PEN_ROTATE_COMPLETED : PEN_ROTATE_COUNTING,
      x: 0, y: 0,
      transition: { type: "spring", stiffness: 85, damping: 15 },
    });
  }, [isCompleted, penControls]);

  // Dip: rotate + slide to aim nib at the fill-edge, then return
  useEffect(() => {
    if (typeof pulseTrigger !== "number") return;
    if (pulseTrigger === prevPulse.current) return;
    prevPulse.current = pulseTrigger;
    if (isCompleted) return;

    const progress = target > 0
      ? Math.min(1, Math.max(0, countsDown ? (target - counter) / target : counter / target))
      : 0;

    // Fill-edge target in card-space
    const fillEdgeX = progress * STAGE_W;

    // Vector from pen center to the fill-edge on the bar
    const dx   = fillEdgeX - PEN_CENTER_X;
    const dy   = BAR_Y_IN_CARD - PEN_CENTER_Y; // always 76
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Rotation so nib aims exactly at fill-edge
    const aimAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // If target is beyond nib reach, slide the whole pen toward it ("coulisser")
    let tx = 0, ty = 0;
    if (dist > NIB_HALF_LEN) {
      const excess = dist - NIB_HALF_LEN;
      tx = (dx / dist) * excess;
      ty = (dy / dist) * excess;
    }

    // Pen is a direct child of the unrotated card → x/y are pure screen-space translations
    penControls.start({
      rotate: [PEN_ROTATE_COUNTING, aimAngle, PEN_ROTATE_COUNTING],
      x:      [0, tx, 0],
      y:      [0, ty, 0],
      transition: { duration: 0.44, ease: [0.25, 0.46, 0.45, 0.94] },
    });
  }, [pulseTrigger, isCompleted, counter, target, countsDown, penControls]);

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={t("counter.tap")}
      whileTap={disabled ? {} : { scale: 0.984 }}
      className="relative outline-none"
      style={{
        width: STAGE_W, height: STAGE_H, borderRadius: 18,
        overflow: "visible",
        background: "linear-gradient(160deg, rgba(255,248,225,0.84) 0%, rgba(240,224,176,0.74) 100%)",
        border: "1.5px solid rgba(139,105,20,0.30)",
        boxShadow: "inset 0 1px 6px rgba(200,160,80,0.25), inset 0 -2px 8px rgba(44,20,4,0.12), 0 4px 24px rgba(44,20,4,0.18)",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
      }}
    >
      {/* Corner diamond ornaments */}
      {([{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }] as React.CSSProperties[]).map((pos, i) => (
        <div key={i} aria-hidden style={{
          position: "absolute", ...pos, width: 8, height: 8,
          background: isCompleted ? "#D4AF37" : "rgba(139,105,20,0.45)",
          transform: "rotate(45deg)", transition: "background 0.5s",
        }} />
      ))}

      {/* Decorative lines */}
      <div aria-hidden style={{
        position: "absolute", top: 20, left: 20, right: 20, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(139,105,20,0.30), transparent)",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: 20, left: 20, right: 20, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(139,105,20,0.30), transparent)",
      }} />

      {/* Counter — always centered in the card */}
      <div className="absolute flex flex-col items-center select-none"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}>
        <motion.span
          key={counter}
          initial={{ opacity: 0.6, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14 }}
          style={{
            fontSize: 44, fontWeight: 700, lineHeight: 1.05,
            fontFamily: "Georgia, 'Times New Roman', serif",
            color: isCompleted ? "#8B6914" : "#1A0E04",
            textShadow: isCompleted
              ? "0 0 18px rgba(212,175,55,0.55)"
              : "0 1px 0 rgba(255,240,180,0.5)",
            letterSpacing: "-0.01em",
          }}
        >
          {fmt(counter)}
        </motion.span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: isCompleted ? "rgba(139,105,20,0.80)" : "rgba(60,36,10,0.50)",
          letterSpacing: "0.06em",
        }}>
          {countsDown ? t("circle.remaining") : `/ ${fmt(target)}`}
        </span>
        {isCompleted && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 12, fontWeight: 700, color: "#D4AF37",
              textShadow: "0 0 8px rgba(212,175,55,0.6)", marginTop: 3,
            }}
          >
            ✦ {t("counter.completed")} ✦
          </motion.span>
        )}
      </div>

      {/* Reed Pen — single motion.div: position + rotation + dip all via penControls */}
      <motion.div
        animate={penControls}
        initial={{
          top: PEN_TOP_COUNTING, rotate: PEN_ROTATE_COUNTING, x: 0, y: 0,
        }}
        style={{
          position: "absolute",
          left: "50%",
          marginLeft: -100,
          zIndex: 1,
        }}
        aria-hidden
      >
        <div style={{
          filter: isCompleted
            ? "drop-shadow(0 0 9px rgba(212,175,55,0.65))"
            : "drop-shadow(1px 3px 5px rgba(44,20,4,0.32))",
          transition: "filter 0.5s",
        }}>
          <QalamSVG isCompleted={isCompleted} focusMode={focusMode} />
        </div>
      </motion.div>

      {/* Ink drops burst from nib tip */}
      <InkDropBurst pulseTrigger={pulseTrigger} />

      {/* Gold dust on milestones */}
      <GoldDustParticles counter={counter} />
    </motion.button>
  );
}

// ─── Zikr calligraphic text ───────────────────────────────────────────────────

function ZikrText({ arabic, translit }: { arabic: string; translit: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-5 text-center">
      {arabic && (
        <p className="text-2xl font-bold leading-relaxed" dir="rtl" style={{
          color: "#1A0E04",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textShadow: "0 1px 0 rgba(255,240,180,0.5), 0 2px 6px rgba(26,58,139,0.10)",
          letterSpacing: "0.04em",
        }}>
          {arabic}
        </p>
      )}
      {translit && (
        <p className="text-sm italic" style={{
          color: "#5C4020", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 500,
        }}>
          {translit}
        </p>
      )}
    </div>
  );
}

// ─── Focus style toggle ───────────────────────────────────────────────────────

function FocusStyleToggle({
  value, onChange,
}: {
  value: FocusStyle; onChange: (v: FocusStyle) => void;
}) {
  return (
    <div className="flex items-center gap-1.5" style={{ opacity: 0.75 }}>
      <span style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
        color: "#5C4020", fontFamily: "Georgia, 'Times New Roman', serif",
        textTransform: "uppercase",
      }}>
        Focus
      </span>
      {(["vignette", "candlelight"] as FocusStyle[]).map((style) => {
        const active = value === style;
        return (
          <button
            key={style}
            onClick={() => onChange(style)}
            title={style === "vignette" ? "Vignette — edges darken" : "Candlelight — warm glow"}
            style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "2px 8px", borderRadius: 10,
              border: `1px solid ${active ? "rgba(139,105,20,0.60)" : "rgba(139,105,20,0.22)"}`,
              background: active ? "rgba(212,175,55,0.18)" : "rgba(244,235,208,0.70)",
              color: active ? "#6B4E10" : "rgba(92,64,32,0.55)",
              fontSize: 11, fontWeight: active ? 700 : 500,
              fontFamily: "Georgia, 'Times New Roman', serif",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <span style={{ fontSize: 12 }}>
              {style === "vignette" ? "◉" : "☀"}
            </span>
            {style === "vignette" ? "Vignette" : "Candlelight"}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ManuscriptCounter({
  counter, target, mode, isCompleted, pulseTrigger,
  currentZikr, onIncrement, onUndo, onReset,
  focusMode, shouldBlurControls, hasProgress, onTargetTap, onNextZikr,
}: ManuscriptCounterProps) {
  const t = useT();
  const language = useTasbihStore((s) => s.preferences.language);
  const [focusStyle, setFocusStyle] = useState<FocusStyle>("vignette");

  const fmt = useCallback(
    (n: number) =>
      language === "ar" ? n.toLocaleString("ar-SA")
      : language === "ur" ? n.toLocaleString("ur-PK-u-nu-arab")
      : language === "fa" ? n.toLocaleString("fa-IR")
      : String(n),
    [language]
  );

  const countsDown = mode === "down";

  // Draggable group: card + ink bar move together in focus mode
  const groupRef      = useRef<HTMLDivElement>(null);
  const groupCenterRef = useRef({ x: 0, y: 0 });
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [constraints, setConstraints] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  useEffect(() => {
    const el = groupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    groupCenterRef.current = { x: cx, y: cy };
    setConstraints({
      left:   -(cx - STAGE_W / 2),
      right:  window.innerWidth - cx - STAGE_W / 2,
      top:    -(cy - STAGE_H / 2),
      bottom: window.innerHeight - cy - STAGE_H / 2,
    });
  }, []);

  // Spring-return when focus mode exits
  useEffect(() => {
    if (!focusMode) {
      animateValue(dragX, 0, { type: "spring", stiffness: 200, damping: 20 });
      animateValue(dragY, 0, { type: "spring", stiffness: 200, damping: 20 });
    }
  }, [focusMode, dragX, dragY]);

  const handleTap = useCallback(() => {
    if (isCompleted) return;
    onIncrement();
  }, [isCompleted, onIncrement]);

  const arabic   = currentZikr?.arabic ?? "";
  const translit = currentZikr ? getTransliteration(currentZikr, language) : "";
  const controlsBlurred = focusMode || shouldBlurControls;

  return (
    <>
      <VellumBackground focusMode={focusMode} focusStyle={focusStyle} />

      <div className="flex flex-col items-center gap-0 select-none">
        <OttomanBand />

        {/* Zikr text */}
        {arabic && (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentZikr?.id ?? "none"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="mt-4 mb-3"
            >
              <ZikrText arabic={arabic} translit={translit} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Draggable group: card + ink bar */}
        <div ref={groupRef} className="relative my-2">
          <motion.div
            drag={focusMode}
            dragMomentum={false}
            dragConstraints={constraints}
            style={{
              x: dragX, y: dragY,
              zIndex: focusMode ? 50 : 0,
              cursor: focusMode ? "grab" : "default",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
            }}
            whileDrag={{ cursor: "grabbing" }}
          >
            <QalamStage
              counter={counter}
              target={target}
              mode={mode}
              isCompleted={isCompleted}
              pulseTrigger={pulseTrigger}
              onClick={handleTap}
              disabled={isCompleted || shouldBlurControls}
              fmt={fmt}
              focusMode={focusMode}
            />
            <InkProgressBar
              value={counter}
              target={target}
              countsDown={countsDown}
              isCompleted={isCompleted}
            />
          </motion.div>
        </div>

        {/* Focus style toggle — visible only when not in focus mode */}
        <AnimatePresence>
          {!focusMode && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mb-2"
            >
              <FocusStyleToggle value={focusStyle} onChange={setFocusStyle} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Target display */}
        <div className="flex items-center gap-1.5 text-sm font-semibold mb-2"
          style={{ color: "#5C4020", fontFamily: "Georgia, 'Times New Roman', serif" }}>
          <span>{t("counter.targetPrefix")}</span>
          {onTargetTap ? (
            <button onClick={onTargetTap}
              className="rounded border px-2 py-0.5 font-bold tabular-nums transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{ borderColor: "rgba(139,105,20,0.40)", color: "#1A0E04", background: "rgba(244,235,208,0.90)" }}>
              {fmt(target)}
            </button>
          ) : (
            <span className="rounded border px-2 py-0.5 font-bold tabular-nums"
              style={{ borderColor: "rgba(139,105,20,0.30)", color: "#1A0E04", background: "rgba(244,235,208,0.90)" }}>
              {fmt(target)}
            </span>
          )}
          <span>{t("counter.targetSuffix")}</span>
        </div>

        {/* Next zikr */}
        <AnimatePresence>
          {onNextZikr && isCompleted && (
            <motion.button onClick={onNextZikr}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
              className="mb-3 w-full max-w-sm rounded-xl px-6 py-4 text-base font-bold transition hover:brightness-110 active:brightness-95"
              style={{
                background: "linear-gradient(135deg, #D4AF37 0%, #8B6914 100%)",
                color: "#1C1008", fontFamily: "Georgia, 'Times New Roman', serif",
              }}>
              {t("counter.nextZikr")}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Undo + Reset */}
        <div className={`flex w-full max-w-sm items-center justify-between gap-4 px-4 ${
          controlsBlurred ? "blur-[1px] opacity-50 pointer-events-none select-none" : ""
        }`}>
          <button onClick={onUndo} aria-label={t("counter.ariaUndo")}
            disabled={!hasProgress || controlsBlurred}
            className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-95"
            style={{
              borderColor: "rgba(139,105,20,0.30)", background: "rgba(244,235,208,0.90)",
              color: !hasProgress ? "rgba(92,74,30,0.30)" : "#1A0E04",
              opacity: !hasProgress ? 0.4 : 1,
            }}>
            <RotateCcw size={16} className="mx-auto" style={{ color: "inherit" }} />
          </button>
          <button onClick={onReset} disabled={controlsBlurred}
            className="flex-1 rounded-xl border px-4 py-4 text-sm font-semibold transition hover:brightness-95"
            style={{
              borderColor: "rgba(139,105,20,0.30)", background: "rgba(244,235,208,0.90)",
              color: !hasProgress ? "rgba(92,74,30,0.30)" : "#1A0E04",
              opacity: !hasProgress ? 0.4 : 1,
            }}>
            {t("counter.reset")}
          </button>
        </div>
      </div>
    </>
  );
}
