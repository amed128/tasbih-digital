# CLAUDE.md — Tasbih Digital

## Tech stack

- **Next.js** (App Router) + **React 19** + **TypeScript** (strict)
- **Zustand** (persisted) — single store at `store/tasbihStore.ts`
- **Tailwind CSS v4** + CSS variables for theming
- **Framer Motion** for animations, **Lucide React** for icons
- **Capacitor** iOS wrapper + **next-pwa** service worker
- **Vitest** (unit) + **Playwright** (E2E)

---

## Commands

```bash
npm run dev              # Dev server (localhost:3000)
npm run build            # Production build (webpack, not Turbopack — required for next-pwa)
npm run lint             # ESLint
npm run test:unit        # Vitest
npm run test:e2e:smoke   # Playwright smoke (chromium only)
npm run release:patch    # Bump patch + git tag
npm run release:push     # Push commit + tags
```

Pre-commit sanity check: `npm run lint && npm run build && npm run test:e2e:smoke`

---

## Project structure

```
app/                    # Next.js App Router pages
  page.tsx              # Counter screen (main, 86KB)
  listes/               # Lists & zikr library
  stats/                # Statistics dashboard
  reglages/             # Settings (French routes)
    general/ auto/ audio/ apparence/ selection-mode/
  about/ privacy/
components/             # Reusable UI primitives
store/tasbihStore.ts    # Single Zustand store (~55KB, 200+ actions)
i18n/translations.ts    # All strings, FR + EN (~44KB)
hooks/useT.ts           # Translation hook
lib/                    # Platform detection, capabilities, push notifications
data/zikrs.ts           # Built-in library: 450+ zikrs across 10 categories
docs/                   # Architecture & developer guides (detailed references)
```

---

## State management

Single Zustand store, persisted to `localStorage` under key `"tasbihDigitalStateV1"`.

```ts
// Subscribe to a slice — always use selectors to avoid unnecessary re-renders
const counter = useTasbihStore((s) => s.counter)
const increment = useTasbihStore((s) => s.increment)
```

Store owns: counter state, zikr selection, active list execution, stats/history, user content (custom lists/zikrs), preferences (40+ fields), UI state.

Migration logic is built into the store — never drop old data silently.

---

## i18n

Languages: `fr` (default) and `en`. All strings in `i18n/translations.ts`.

```ts
const t = useT()
t("counter.tap")                          // simple key
t("stats.total", { count: 1234 })         // with variable
```

Variables in strings use `{{ varName }}` syntax. Always add both `fr` and `en` keys when adding new strings.

See `TodoLanguage.md` for the full implementation checklist, RTL steps, and stream idle timeout strategy.

---

## Theming

3 themes: `blue` (default), `dark`, `light`. Applied via `data-theme` on `<html>` by `ThemeSync.tsx`.

Use CSS variables — **never hardcode colors**:

```css
var(--background)   var(--foreground)   var(--primary)
var(--card)         var(--border)       var(--secondary)
var(--success)      var(--danger)
```

---

## Key conventions

**Hydration guard** — every page that reads store state uses this pattern to prevent SSR mismatch:

```tsx
const mounted = useSyncExternalStore(() => () => {}, () => true, () => false)
if (!mounted) return null
```

**Zikr type:**
```ts
type Zikr = {
  id: string          // e.g. "tasbih-1"
  arabic: string
  transliteration: string
  translation_fr: string
  translation_en: string
  defaultTarget: number
  category: ZikrCategory
}
```

**Counter modes:** `"up"` | `"down"` | `"auto"` | `"audio"`

**Routing:** Settings routes are in French (`/reglages`, `/apparence`) — keep this consistent.

**Border radius:** `rounded-xl` for buttons, `rounded-2xl` for cards.

**Focus rings:** `focus:ring-2 focus:ring-[var(--primary)]` on all interactive elements.

**ConfirmDialog:** Use `components/ConfirmDialog.tsx` for all destructive confirmations — do not duplicate inline.

---

## Platform awareness

Use `lib/platform.ts` and `lib/capabilities.ts` for feature gating — never check `navigator.userAgent` directly in components. Use `components/FeatureGate.tsx` for conditional UI.

---

## Docs

- `docs/app-architecture.md` — complete technical reference (state flow, folder responsibilities, capability matrix)
- `docs/developer-guide.md` — guide for adding features safely, migration patterns
- `docs/tolerance-spec.md` — audio recognition tolerance algorithm
