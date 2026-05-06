# todoTheme.md — AI Theme Generator Spec

## Problem

When asked to generate a premium theme from a text description, Claude produces results that don't match the developer's visual imagination. The gap is structural: visual aesthetics are easy to *recognize* but hard to *verbalize* precisely enough for one-shot generation.

---

## Solution

A developer-side interactive CLI (`scripts/generate-theme.mjs`) that replaces free-form description with:

1. **One anchor color** — the primary accent hex the developer picks (the one concrete thing they know)
2. **Four design knobs** — structured choices that steer without requiring precise language
3. **Iterative refinement loop** — short one-sentence corrections instead of a full upfront description

---

## Design Knobs

| Knob | Options |
|---|---|
| Mood | Luxurious / Spiritual / Minimal / Bold / Serene |
| Tone | Warm / Cool / Neutral |
| Contrast | High / Medium / Low |
| Surface | Flat / Glassmorphism / Deep shadow |

---

## Session Flow

```
npm run theme:generate

Theme name (slug): burgundy-silk
Anchor color (hex): #8B3A52

Mood:     1. Luxurious  → 1
Tone:     1. Warm       → 1
Contrast: 2. Medium     → 2
Surface:  3. Deep shadow → 3

⏳ Generating…

html[data-theme="burgundy-silk"],
body[data-theme="burgundy-silk"] {
  --background: #1A0A0F;
  --foreground: #F5EAE0;
  ...
}

Rationale: Deep burgundy foundation with warm ivory text evokes aged silk…

[A] Apply to globals.css   [R] Refine   [Q] Quit
> r
What to change: warmer background, less purple
⏳ Refining…
```

---

## Implementation Details

### Dependencies
- `@anthropic-ai/sdk` (dev) — Claude API client
- Model: `claude-opus-4-7` for generation quality
- `ANTHROPIC_API_KEY` read from env or `.env.local`

### npm script
```
"theme:generate": "node scripts/generate-theme.mjs"
```

### CSS variables generated per theme

| Variable | Purpose |
|---|---|
| `--background` | Main page background (darkest layer) |
| `--foreground` | Primary text color |
| `--secondary` | Muted/secondary text |
| `--primary` | Accent color — progress ring, active states |
| `--primary-rgb` | Decimal R,G,B of `--primary` for `rgba()` use |
| `--card` | Counter card, modals, sheets |
| `--border` | Subtle structural dividers |
| `--deco-opacity` | Decorative background glow opacity |
| `--deco-accent-opacity` | Secondary glow opacity |
| `--deco-primary-rgb` | Primary glow color (can be more vivid than `--primary`) |
| `--deco-accent-rgb` | Secondary glow color (contrasting hue) |
| `--tap-button-bg` | Optional custom tap button gradient |
| `--tap-button-color` | Optional tap button text color |

### globals.css injection
Approved themes are inserted directly before the `:root {` global block in `app/globals.css`. Guards against duplicate theme names.

---

## Checklist — After Applying a Theme

- [ ] Add theme slug to `Theme` type in `store/tasbihStore.ts`
- [ ] Add to `PremiumTheme` union if it should be gated
- [ ] Add background hex to the `metaColors` map in `components/ThemeSync.tsx`
- [ ] Add `fr` and `en` display name in `i18n/translations.ts`

---

## What the System Prompt Gives Claude

- Semantics of every CSS variable (what it controls in the UI)
- All 6 existing themes as a quality calibration reference
- WCAG AA contrast requirement (≥ 4.5:1) for foreground vs background
- Rules for card vs background distinctness, border subtlety
- JSON-only output schema (no markdown fences)
