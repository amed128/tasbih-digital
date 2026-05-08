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
 * ── Props contract (AlAndalusCounterProps — template for future themes) ───────
 *
 *   counter, target, mode, isCompleted, pulseTrigger   — counter state
 *   currentZikr                                         — active zikr or undefined
 *   onIncrement, onUndo, onReset                        — action callbacks
 *   focusMode, shouldBlurControls, hasProgress          — UI state
 *   onTargetTap?: () => void    — open target-edit popup; undefined when locked
 *   onNextZikr?: () => void     — advance to next zikr; only provided in list
 *                                 mode when !autoAdvanceNextZikr && !isListComplete
 *
 * ── Integration rules (must be respected by callers in page.tsx) ─────────────
 *
 * 1. Placement — isOverlayTheme() must be called INSIDE renderCompteur() and
 *    renderListMode(), not at the top level of the render function. Top-level
 *    placement drops the header and mode/focus dropdown outside the overlay.
 *
 * 2. List mode: replace BOTH motion.div blocks — renderListMode() has two
 *    blocks (ring+zikr text, tap+controls). Replacing only the tap button
 *    leaves an orphan CircleProgress ring visually detached from the bead.
 *
 * 3. Next-zikr button is owned by the overlay — pass onNextZikr so the
 *    component renders it in the correct position (above undo/reset). Do NOT
 *    render a second next-zikr button outside ThemeCounterOverlay in list mode.
 *
 * 4. onTargetTap guard — pass openTargetPopup only when:
 *      !focusMode && !isTargetLocked && isTargetEditable
 *    Omit the prop (pass undefined) otherwise; the overlay renders the target
 *    as a non-interactive span when the prop is absent.
 *
 * 5. Sound & haptic — overlay components must NOT implement their own audio or
 *    haptic. onIncrement → handleIncrement → triggerHaptic() in page.tsx
 *    already covers the user's sound preference. Duplicating it produces double
 *    audio + double haptic on every tap.
 *
 * 6. Completed state — do NOT add a "Goal reached" badge inside the overlay.
 *    The bead's color change (lapis → green) + ✓ label signals completion.
 *    The onNextZikr button appears automatically when provided.
 *
 * 7. Focus mode torch overlay — when focusMode is true, render a
 *    position:fixed full-screen div (zIndex 48, background rgba(0,0,0,0.90))
 *    with a CSS mask-image radial-gradient that punches a ~96px clear circle
 *    (≈1 inch) centered on the bead's live screen position. Update the mask
 *    imperatively via dragX/dragY motion-value subscriptions (no re-renders).
 *    The draggable bead wrapper must carry zIndex 50 so it sits above the overlay.
 *    Obsidian implements the reference implementation — copy that pattern.
 *
 * ── CSS variables every premium theme must define in globals.css ──────────────
 *
 *   Core tokens (required — used by shared components):
 *     --background, --foreground, --secondary
 *     --primary, --primary-rgb
 *     --card, --border
 *     --deco-opacity, --deco-primary-rgb, --deco-accent-rgb
 *     --tap-button-bg, --tap-button-color
 *
 *   Semantic action colors (override to match the palette; if omitted the
 *   root defaults apply — generic red / green — which may clash):
 *     --danger        text color for destructive buttons (reset stats, confirm)
 *     --danger-border border color for the same
 *     --restore       text color for restore buttons (purchases, defaults)
 *     --restore-border border color for the same
 *
 *   Al-Andalus example:
 *     --danger: #8B3A1A          sienna/terracotta — warm on parchment
 *     --danger-border: rgba(139, 58, 26, 0.40)
 *     --restore: #2E5FA3         lapis blue — mirrors the bead gemstone
 *     --restore-border: rgba(46, 95, 163, 0.40)
 *
 *   Theme-private tokens (prefix with --aa- or similar to avoid collisions):
 *     anything used only inside the overlay component
 *
 * ── StatusBar / meta-color ────────────────────────────────────────────────────
 *
 *   Update ThemeSync.tsx THEME_META_COLOR with the theme's background hex.
 *   Set StatusBar style to Style.Light for light-background themes (al-andalus),
 *   Style.Dark for dark-background themes. See the existing switch in ThemeSync.
 *
 * ── Layout sizing constraint ──────────────────────────────────────────────────
 *
 *   Keep the total rendered height of the overlay component under ~520 px so
 *   that the completed state (next-zikr button + undo/reset row) fits above
 *   the bottom nav on iPhone SE (smallest supported screen, ~667 px viewport
 *   minus ~80 px nav = ~587 px usable minus ~70 px page header = ~517 px).
 *   Al-Andalus uses RING_SIZE=264 / RING_STROKE=16 to stay within budget.
 *
 * ── Adding a new premium overlay theme — checklist ───────────────────────────
 *
 *   a. themes/<name>/<Name>Counter.tsx
 *      - Export a Props interface extending AlAndalusCounterProps (or copy it).
 *        Always include onTargetTap? and onNextZikr?.
 *      - No custom audio/haptic — delegate to onIncrement.
 *      - Keep rendered height under the sizing constraint above.
 *      - Implement the focus mode torch overlay (rule 7 above).
 *        Reference: ObsidianCounter.tsx — overlayRef, beadCenterRef, the
 *        useEffect that subscribes to dragX/dragY and writes mask-image.
 *
 *   b. ThemeEngine.tsx (this file)
 *      - Add the theme string to PREMIUM_OVERLAY_THEMES.
 *      - Add a branch in ThemeCounterOverlay.
 *      - Widen OverlayCounterProps if the new props interface adds fields.
 *
 *   c. store/tasbihStore.ts
 *      - Add to PremiumTheme union.
 *      - Add to Theme union.
 *      - Add case to normalizeTheme() guard.
 *      - Add to unlockTheme() / preferences.unlockedThemes logic if needed.
 *
 *   d. app/globals.css
 *      - Add html[data-theme="<name>"], body[data-theme="<name>"] block.
 *      - Define all required core tokens + semantic overrides (danger/restore).
 *      - Prefix private tokens with --<abbrev>-.
 *
 *   e. components/ThemeSync.tsx
 *      - Add entry to THEME_META_COLOR.
 *      - Add theme to the StatusBar.Light condition if background is light.
 *
 *   f. app/reglages/themes/page.tsx
 *      - Add ThemeCard entry (value, labelKey, bg, card, primary, border, premium).
 *      - Add PREMIUM_MODAL_CONFIG entry (bg, border, previewBg, previewBorder,
 *        primary, secondary, previewColors, titleKey, descKey).
 *
 *   g. i18n/translations.ts (all 14 languages)
 *      - settings.themeXxx
 *      - settings.premiumThemeXxxModalTitle
 *      - settings.premiumThemeXxxModalDesc
 *      Pre-commit hook enforces exactly 502 keys per language — it will block
 *      the commit if any language is missing the new strings.
 *
 *   h. app/reglages/themes/page.tsx — applyThemeToDom colors record
 *      - Add "<name>": "<background-hex>" to the colors map.
 */

import type { Theme } from "@/store/tasbihStore";
import type { AlAndalusCounterProps } from "./al-andalus/AlAndalusCounter";
import { AlAndalusCounter } from "./al-andalus/AlAndalusCounter";
import { EmeraldCounter } from "./emerald/EmeraldCounter";
import { ObsidianCounter } from "./obsidian/ObsidianCounter";
import { MidnightCounter } from "./midnight/MidnightCounter";

export const PREMIUM_OVERLAY_THEMES: ReadonlySet<Theme> = new Set([
  "al-andalus",
  "emerald",
  "obsidian",
  "midnight",
]);

export function isOverlayTheme(theme: Theme): boolean {
  return PREMIUM_OVERLAY_THEMES.has(theme);
}

type OverlayCounterProps = AlAndalusCounterProps;

export function ThemeCounterOverlay(props: OverlayCounterProps & { theme: Theme }) {
  const { theme, ...rest } = props;
  if (theme === "al-andalus") return <AlAndalusCounter {...rest} />;
  if (theme === "emerald")    return <EmeraldCounter    {...rest} />;
  if (theme === "obsidian")   return <ObsidianCounter   {...rest} />;
  if (theme === "midnight")   return <MidnightCounter   {...rest} />;
  return null;
}
