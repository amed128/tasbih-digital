"use client";

/**
 * ThemeEngine — Factory that resolves which Counter component to render.
 *
 * Standard themes (light / dark / blue / emerald / obsidian / midnight) return
 * null, meaning the caller falls back to its own default rendering.
 *
 * Premium overlay themes (al-andalus, …) return the dedicated component class.
 */

import type { Theme } from "@/store/tasbihStore";
import type { AlAndalusCounterProps } from "./al-andalus/AlAndalusCounter";
import { AlAndalusCounter } from "./al-andalus/AlAndalusCounter";

export const PREMIUM_OVERLAY_THEMES: ReadonlySet<Theme> = new Set(["al-andalus"]);

export function isOverlayTheme(theme: Theme): boolean {
  return PREMIUM_OVERLAY_THEMES.has(theme);
}

type OverlayCounterProps = AlAndalusCounterProps;

export function ThemeCounterOverlay(props: OverlayCounterProps & { theme: Theme }) {
  const { theme, ...rest } = props;
  if (theme === "al-andalus") return <AlAndalusCounter {...rest} />;
  return null;
}
