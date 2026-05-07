# Premium Theme Engine — Architecture Reference

---

## 1. Theme Interface / Protocol

Every premium overlay theme is a React component that implements `AlAndalusCounterProps`, defined in `themes/al-andalus/AlAndalusCounter.tsx`. This is the canonical contract all four overlay components must satisfy:

```ts
export interface AlAndalusCounterProps {
  // Counter state
  counter: number;
  target: number;
  mode: "up" | "down" | "auto" | "audio";
  isCompleted: boolean;
  pulseTrigger?: number;

  // Active zikr — undefined in simple mode (no list selected)
  currentZikr: Zikr | undefined;

  // Action callbacks — never call Haptics/StatusBar/AudioContext directly
  onIncrement: () => void;
  onUndo: () => void;
  onReset: () => void;

  // UI state
  focusMode: boolean;
  shouldBlurControls: boolean;
  hasProgress: boolean;

  // Optional — only provided when the action is currently valid
  onTargetTap?: () => void;  // absent when target is locked or not editable
  onNextZikr?: () => void;   // absent in simple mode or when autoAdvance is on
}
```

Key rules enforced by this contract:
- No custom audio or haptics — all tap side-effects delegate to `onIncrement` → `handleIncrement` in `page.tsx`
- `shouldBlurControls` (NOT `focusMode`) is the gate for disabling the tap bead — focus mode only blurs secondary controls (undo/reset/target)
- `currentZikr` is `undefined` in simple mode — components must guard text display with `{arabic && (...)}`

---

## 2. Theme Configuration File Locations

```
Type definitions (Theme, PremiumTheme)
  store/tasbihStore.ts — lines 35, 96

Unlock state (unlockedThemes[])
  store/tasbihStore.ts — persisted in Zustand under "tasbihDigitalStateV1"

CSS variables for all themes
  app/globals.css — one html[data-theme="X"] block per theme

Body background / textures
  app/globals.css — separate html[data-theme="X"] body block per premium theme

Ambient glow decorations
  components/ThemeDecorations.tsx — two GPU-blurred divs at z-index 10

Status bar / meta-color mapping
  components/ThemeSync.tsx — THEME_META_COLOR record

Theme settings UI + premium modal
  app/reglages/themes/page.tsx — THEME_CARDS + PREMIUM_MODAL_CONFIG

Overlay component dispatch
  themes/ThemeEngine.tsx — PREMIUM_OVERLAY_THEMES set + ThemeCounterOverlay factory

Per-theme counter components
  themes/al-andalus/AlAndalusCounter.tsx  (557 lines)
  themes/midnight/MidnightCounter.tsx     (370 lines)
  themes/emerald/EmeraldCounter.tsx       (348 lines)
  themes/obsidian/ObsidianCounter.tsx     (336 lines)
```

---

## 3. How the App Switches Between Standard and Premium Views

The switch happens at two independent levels:

**Level 1 — CSS variables (applies to all themes including free)**
`ThemeSync.tsx` writes `data-theme="<name>"` onto `<html>` and `<body>` on every theme change. The browser instantly swaps all `var(--background)`, `var(--primary)`, etc. references throughout the UI. Free themes (blue / dark / light) use only this layer — no component swap occurs.

**Level 2 — React component swap (premium overlay themes only)**
`page.tsx` calls `isOverlayTheme(activeTheme)` inside both `renderCompteur()` and `renderListMode()`. When it returns true, the entire counter + controls area is replaced by `ThemeCounterOverlay`, which dispatches to the dedicated component for that theme.

Decision tree:

```
isListMode?
  true  → renderListMode()
            isOverlayTheme? → ThemeCounterOverlay  (full premium UI, currentZikr passed)
                            : CircleProgress + standard controls
  false → renderCompteur()
            isOverlayTheme? → ThemeCounterOverlay  (currentZikr = undefined)
                            : CircleProgress + standard controls
```

Each `<Name>Counter` component owns its own ring SVG, gemstone bead, header decoration (e.g. CelestialHeader for Midnight, MuqarnasHeader for Al-Andalus), and zikr text display. The page-level header (title, dropdown, focus button) always renders outside the overlay, providing a consistent frame across all themes.

Additionally, `ThemeDecorations.tsx` renders a fixed-position layer (z-index 10) with two `blur-[140px]` glow divs that are active for Emerald, Obsidian, and Midnight — this is separate from the counter overlay and runs in parallel.

---

## 4. Tech Stack for UI Rendering

This is a web app (Next.js, App Router) — not Flutter, React Native, or SwiftUI.

```
Framework         Next.js 15 (App Router) + React 19
Language          TypeScript (strict mode)
Styling           Tailwind CSS v4 + CSS custom properties
Animations        Framer Motion — motion.div, AnimatePresence, spring physics
Progress rings    Inline SVG — motion.circle with strokeDashoffset spring animation
Gemstone beads    Pure CSS — layered radial-gradient + box-shadow
Background        CSS background-image — layered radial-gradient +
                  repeating-linear-gradient + SVG data URIs (zero network cost)
Ambient glows     CSS filter:blur(140px) on fixed divs (GPU compositor layers)
Icons             Lucide React
State             Zustand (persisted to localStorage)
Native shell      Capacitor — iOS WKWebView wrapper
                  Uses: StatusBar API, Haptics API
PWA               next-pwa (Workbox service worker)
```

Everything visual is rendered by the browser's CSS/SVG engine. There is no canvas, WebGL, React Native bridge, or native drawing primitive involved.
