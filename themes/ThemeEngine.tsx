"use client";

/**
 * ThemeEngine — Factory that resolves which Counter component to render.
 *
 * Standard themes (light / dark / blue / emerald / obsidian / midnight) return
 * null, meaning the caller falls back to its own default rendering.
 *
 * Premium overlay themes (al-andalus, …) swap the entire Counter view with a
 * dedicated component that owns its own ring, bead, zikr text, and controls.
 *
 * ── Integration rules (must be respected by callers in page.tsx) ─────────────
 *
 * 1. Check placement — isOverlayTheme() must be called INSIDE renderCompteur()
 *    and renderListMode(), NOT at the top level of the render function.
 *    Putting it at the top level drops the header/dropdown outside the overlay.
 *
 * 2. Replace both layout blocks in list mode — renderListMode() has two
 *    motion.div blocks (ring+zikr text, tap+controls). Both must be replaced;
 *    replacing only the tap button leaves an orphan CircleProgress ring.
 *
 * 3. Next-zikr button lives outside the overlay — AlAndalusCounter handles its
 *    own undo/reset; the "next zikr" AnimatePresence block is rendered right
 *    after <ThemeCounterOverlay> in renderListMode(), not inside it.
 *
 * 4. onTargetTap — pass `openTargetPopup` (guarded by !focusMode &&
 *    !isTargetLocked && isTargetEditable) so the target field is editable in
 *    simple mode. Omit the prop in locked/list contexts.
 *
 * 5. Sound & haptic — overlay components must NOT implement their own audio or
 *    haptic feedback. onIncrement → handleIncrement → triggerHaptic() in
 *    page.tsx already handles the user's sound setting. Duplicating it causes
 *    double audio + double haptic.
 *
 * ── Adding a new premium overlay theme ───────────────────────────────────────
 *
 * a. Create themes/<name>/<Name>Counter.tsx — export default props interface
 *    and the Counter component. Use AlAndalusCounterProps as the template;
 *    include onTargetTap?: () => void.
 * b. Add the theme string to PREMIUM_OVERLAY_THEMES below.
 * c. Add a branch in ThemeCounterOverlay.
 * d. Add CSS variables in app/globals.css under [data-theme="<name>"].
 * e. Add the theme to store/tasbihStore.ts: PremiumTheme union, Theme union,
 *    normalizeTheme() guard.
 * f. Add the ThemeCard and PREMIUM_MODAL_CONFIG entry in
 *    app/reglages/themes/page.tsx.
 * g. Add i18n strings (themeXxx, premiumThemeXxxModalTitle/Desc) in all 14
 *    languages in i18n/translations.ts — the pre-commit hook enforces 502 keys.
 * h. Update ThemeSync.tsx THEME_META_COLOR record with the new theme's
 *    background color; set StatusBar style to Light if background is light.
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
