"use client";

// Ambient background decoration layer for premium themes only.
// Conditionally rendered so non-premium themes never put GPU-blurred textures
// in the status-bar compositing zone, preventing stale-color bleed on theme switch.
import { useSyncExternalStore } from "react";
import { useTasbihStore } from "../store/tasbihStore";

const PREMIUM_THEMES = new Set(["emerald", "obsidian"]);

export function ThemeDecorations() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const theme = useTasbihStore((s) => s.preferences.theme);

  if (!mounted || !PREMIUM_THEMES.has(theme ?? "")) return null;

  return (
    <div
      key={theme}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 10 }}
    >
      {/* Top-right primary glow */}
      <div
        className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full blur-[140px]"
        style={{
          background: "rgba(var(--deco-primary-rgb), var(--deco-opacity, 0))",
          mixBlendMode: "screen",
        }}
      />
      {/* Bottom-left accent glow */}
      <div
        className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full blur-[120px]"
        style={{
          background: "rgba(var(--deco-accent-rgb), var(--deco-accent-opacity, var(--deco-opacity, 0)))",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
