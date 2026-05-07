"use client";

// Ambient background decoration layer for premium themes only.
// Conditionally rendered so non-premium themes never put GPU-blurred textures
// in the status-bar compositing zone, preventing stale-color bleed on theme switch.
//
// IMPORTANT — concrete colors, not CSS variables:
// blur-[140px] promotes these divs to dedicated GPU compositor layers.
// CSS custom properties inside a composited layer are not guaranteed to
// recompute when the variable changes on the root element; the stale value
// can persist across theme transitions (visible as a lingering colored glow
// in the status-bar area). Using fully-resolved RGBA strings means React
// patches the inline style directly on re-render — no variable indirection,
// no stale compositor state.
import { useSyncExternalStore } from "react";
import { useTasbihStore } from "../store/tasbihStore";

type DecoConfig = { primary: string; accent: string };

const DECO_CONFIG: Record<string, DecoConfig> = {
  emerald: {
    primary: "rgba(125,249,203,0.10)",
    accent:  "rgba(143,184,160,0.10)",
  },
  obsidian: {
    primary: "rgba(138,92,246,0.12)",
    accent:  "rgba(79,70,229,0.07)",
  },
  midnight: {
    primary: "rgba(30,100,255,0.14)",
    accent:  "rgba(80,140,255,0.09)",
  },
};

export function ThemeDecorations() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const theme = useTasbihStore((s) => s.preferences.theme);

  const config = theme ? DECO_CONFIG[theme] : undefined;
  if (!mounted || !config) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {/* Top-right primary glow */}
      <div
        className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full blur-[140px]"
        style={{
          background: config.primary,
          mixBlendMode: "screen",
        }}
      />
      {/* Bottom-left accent glow */}
      <div
        className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full blur-[120px]"
        style={{
          background: config.accent,
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
