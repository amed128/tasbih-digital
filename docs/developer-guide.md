# Developer Guide — Tasbih Digital

This document is the teaching companion to `app-architecture.md`.

Where the architecture document describes *what* the app is and *how* it is structured, this guide explains *why* decisions were made and *how* a developer learns to work safely in the codebase.

It is written for a developer who is new to this project but has some experience with TypeScript and React.

---

## Chapter 1 — What Tasbih Digital Is (and Is Not)

### What it is

Tasbih Digital is a mobile-first zikr counter built on the web platform.

Its job is simple: help someone count their daily dhikr (remembrance) practice without friction.

The product is intentionally small. Four tabs:

- **Counter** — tap to count, set a target, select a zikr
- **Lists** — build and manage personal routines
- **Stats** — see your consistency over time
- **Settings** — tune appearance, feedback, and language

### What it is not

- Not a social app. No accounts, no feeds.
- Not a backend app. No server, no API, no database.
- Not a feature showcase. Every addition must earn its place by helping the practice itself.

### Design philosophy

The app is **local-first**: your data lives on your device, in browser `localStorage`, and belongs to you. Even the service worker and offline support exist to reinforce this: once installed, it works without a network.

Every feature addition should respect this principle. Before adding a feature, ask: does it help someone do their practice more consistently?

---

## Chapter 2 — Next.js App Router in This App

### Why Next.js for a PWA?

Next.js provides:

- A production-ready build pipeline
- Static asset optimization
- A clean folder-based routing system (App Router)
- Easy integration with `next-pwa` for service worker generation

The app is deployed as a static-like PWA. There is no server-side rendering of dynamic data — the app runs entirely on the client after the initial page load.

### How routing works

The file `app/page.tsx` maps to `/` — the counter screen.

```
app/
  page.tsx          → /
  listes/page.tsx   → /listes
  stats/page.tsx    → /stats
  reglages/page.tsx → /reglages
  about/page.tsx    → /about
  privacy/page.tsx  → /privacy
```

Each `page.tsx` file is a React Server Component by default, but all pages in this app are fully client-side because they top-level mark themselves with `"use client"` and consume Zustand state directly.

### The hydration guard pattern

Because the Zustand store reads `localStorage` on the client, there is a brief moment during server-side rendering where the real state is not yet available.

Every page uses this pattern to avoid hydration mismatches:

```tsx
const mounted = useSyncExternalStore(
  () => () => {},
  () => true,
  () => false
);

if (!mounted) return null;
```

- Server render: `mounted = false` → renders nothing
- Client first pass: `mounted = false` → renders nothing  
- Client second pass: `mounted = true` → renders with real state

This prevents "flash of wrong content" when the user's theme, language, or data is loaded.

### The build pipeline

```
npm run build
  → next build --webpack       # compile with webpack (not Turbopack)
  → node scripts/sync-pwa-assets.mjs  # copy sw.js + workbox to public/
```

Why webpack instead of Turbopack? Because `next-pwa` generates service worker files during Webpack's compilation phase. Turbopack does not call the Webpack plugin hooks, so the service worker is never created.

The `sync-pwa-assets.mjs` script simply copies these generated files into `public/` so the Next.js static serving can expose them at `/sw.js` and `/workbox-*.js`.

---

## Chapter 3 — Zustand State Design and Persistence

### Why Zustand?

Zustand is a minimal client-side state library with a single store object, `useStore` hook consumption, and `persist` middleware for `localStorage` serialization.

In this app, it replaces both React Context and a local database. Everything the user cares about lives in one Zustand store.

### Where the store lives

```
store/tasbihStore.ts
```

This single file defines:

- The state shape (all types)
- All actions (mutations)
- Persistence configuration
- Migration logic for old persisted data

### Reading state in components

Components only subscribe to the slice they need:

```ts
const counter = useTasbihStore((s) => s.counter);
const preferences = useTasbihStore((s) => s.preferences);
```

This prevents unnecessary re-renders when unrelated state changes.

### The migration pattern

Every time the state shape changes (new field, renamed field, removed field), old persisted data in `localStorage` must be handled gracefully.

The store includes a `migrate` function that receives the old persisted state and returns a normalized version:

```ts
migrate: (persisted: unknown, version: number) => {
  // normalize and return a safe shape
}
```

**Rule:** Never remove a state key without adding a migration that handles the old value. Never add a required field without providing a default. Silent data loss will destroy user data that they cannot recover.

### What belongs in the store vs component state

**Belongs in the store:**
- Counter progress
- Current zikr / active list
- Custom lists and zikrs
- Session history
- User preferences (theme, language, vibration, sound, confetti)

**Belongs in local component state:**
- Dropdown open/closed
- Modal visibility
- Temporary search input
- Animation triggers

Rule of thumb: if refreshing the page should forget it, keep it in `useState`. If it should survive navigation, keep it in the store.

---

## Chapter 4 — Translation and Localization Flow

### How it works

All user-facing text lives in one file:

```
i18n/translations.ts
```

It exports a `translations` object with one key per language (`fr`, `en`), each containing a nested tree of string values.

### Using translations in components

```ts
import { useT } from "@/hooks/useT";

const t = useT();
t("settings.vibrationTitle")   // → "Vibration"
t("counter.tap")               // → "Appuyer" or "Tap"
t("counter.target", { count: 33 }) // → "Cible : 33"
```

The `useT` hook resolves the current language from the store's `preferences.language`, then walks the translation tree using a dot-separated key path.

### Interpolation

Variables in strings are wrapped in `{{ }}`:

```ts
"streak: "{{streak}}j streak"
```

Pass variables as the second argument:

```ts
t("stats.streak", { streak: 7 })  // → "7j streak"
```

### Adding a new string

1. Add the key to `translations.fr.yourSection`
2. Add the same key to `translations.en.yourSection`
3. Use `t("yourSection.yourKey")` in the component

Never hardcode user-facing text in components. Add it to `translations.ts` even for strings that seem temporary.

### Current language limitations

The app supports French and English. French is the default. When extending to other languages, the type system will flag any missing keys because `translations` is typed `as const`.

---

## Chapter 5 — Motion, Charts, and Component Composition

### Framer Motion (animations)

Animation in the app is used sparingly and purposefully.

Pages and modals use a simple fade-and-slide-in pattern:

```tsx
<motion.main
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
```

The principle: motion should reinforce a state change or guide attention, not decorate.

Counter tap feedback uses scale animations:

```tsx
<motion.div
  animate={{ scale: [1, 0.96, 1] }}
  transition={{ duration: 0.12 }}
>
```

### Recharts (statistics charts)

The stats screen uses Recharts for the weekly bar chart. Data is derived from the Zustand store sessions history, computed in a memo or directly in the render for now.

Charts should receive pre-computed, clean data arrays — not raw store state.

### Shared components

```
components/
  BottomNav.tsx       Navigation bar
  CircleProgress.tsx  Circular progress ring (SVG)
  Modal.tsx           Overlay modal base
  ThemeSync.tsx       Applies theme to document root on mount
  FeatureGate.tsx     Platform-aware feature rendering
```

`FeatureGate` is the key new component in the platform-aware architecture. See Chapter 9 for details.

---

## Chapter 6 — PWA Build Pipeline and Service Worker

### What the PWA provides

- Installability (Add to Home Screen)
- Offline support via a service worker
- A `manifest.json` for splash screen, icon, and theme configuration

### How the service worker is generated

The build pipeline uses `next-pwa`, which hooks into Webpack during `next build` to generate:

- `sw.js` — the service worker entry
- `workbox-*.js` — the Workbox runtime that handles caching strategies

These files land in `.next/` after the Webpack build.

The `scripts/sync-pwa-assets.mjs` script then copies them to `public/`, where Next.js can serve them as static assets.

### Why this is not in Turbopack

Turbopack does not call Webpack plugin lifecycle hooks. `next-pwa` relies on the `AfterEmitPlugin` pattern. Because of this, the production build uses the explicit flag:

```json
"build:next": "next build --webpack"
```

If this ever changes (Turbopack gains plugin support, or a native Next.js PWA mechanism emerges), this workaround can be removed.

### Service worker scope

The service worker is registered at the root scope `/`. The manifest points to `/sw.js`. The service worker uses Workbox to cache static assets and HTML with a stale-while-revalidate strategy.

---

## Chapter 7 — Testing Strategy

The project has three levels of quality gates:

### Lint

```
npm run lint
```

ESLint catches type errors, unused imports, and code style issues across all source files. The generated PWA files (`public/sw.js`, `public/workbox-*.js`) are excluded from linting.

### Build

```
npm run build
```

A passing `next build` confirms that all routes compile, all TypeScript types check, and all imports resolve. This is the strongest quality gate — a broken build is a broken app.

### Smoke tests

```
npm run test:e2e:smoke
```

Playwright smoke tests verify that all six routes are reachable and return HTTP 200. These run against the built production server, not the dev server.

They check:
- `/`
- `/listes`
- `/stats`
- `/reglages`
- `/about`
- `/privacy`

### What is not tested yet

- Unit tests for store logic
- Component interaction tests
- Accessibility audits
- Visual regression testing

These are good additions for future phases.

---

## Chapter 8 — Release Workflow and Tagged Publishing

### Version bumping

```bash
npm run release:patch   # 0.2.1 → 0.2.2
npm run release:minor   # 0.2.1 → 0.3.0
npm run release:major   # 0.2.1 → 1.0.0
```

These commands use `npm version` to update `package.json`, commit the change, and create a git tag.

### Pushing to remote

```bash
npm run release:push
```

This pushes both the commit and the tag to GitHub (`git push && git push --tags`).

### GitHub Actions

A `.github/workflows/release.yml` workflow triggers automatically when a `v*` tag is pushed. It runs the build and prepares a release.

### Semantic versioning conventions

- **Patch**: bug fixes, copy changes, style corrections
- **Minor**: new features, new settings, new screen sections
- **Major**: architectural changes, breaking state migrations, major redesigns

---

## Chapter 9 — Platform-Aware Feature Design

### The problem

Not all features work equally well on all platforms:

- Vibration: works on Android, largely unavailable on iOS Safari
- Wake lock: available on Chrome/Android, limited on iOS
- Notifications: require permissions, limited on iOS PWA

If the app scatters `if (/iPhone/.test(navigator.userAgent))` checks across every component, it becomes unmaintainable and inconsistent.

### The solution: a capability layer

The app uses a structured capability layer (`lib/`) that separates three concerns:

**1. Platform detection** (`lib/platform.ts`)  
Classifies the runtime environment: iOS, Android, desktop, standalone (installed PWA), or browser.

**2. Raw capability checks** (`lib/capabilities.ts`)  
Checks whether specific browser APIs exist: `navigator.vibrate`, `navigator.wakeLock`, `Notification`, etc.

**3. Feature availability resolution** (`lib/featureAvailability.ts`)  
Combines product decision + platform + capability to produce a final `FeatureAvailability` result with one of four statuses:

```ts
type FeatureStatus =
  | "available"
  | "permission-required"
  | "limited"
  | "unsupported";
```

### The React hook

```ts
const availability = useFeatureAvailability("vibration");
// → { status: "limited", reason: "Limited on iOS Safari" }
```

`hooks/useFeatureAvailability.ts` wraps the resolver and returns `{ status: "unsupported" }` during SSR.

### The FeatureGate component

`components/FeatureGate.tsx` provides conditional rendering based on availability:

```tsx
<FeatureGate
  availability={availability}
  available={<VibrationToggle />}
  limited={<VibrationToggle note="May vary by browser" />}
  unsupported={<DisabledRow label="Vibration" reason="Not supported on this device" />}
/>
```

The four render slots map to the four availability states. If an optional slot is not provided, FeatureGate falls back gracefully.

### Where device support appears

The Settings screen is the canonical surface for platform support information.

The "Device support" section (added in Phase 1) shows a row per feature with a clear status badge: Available, Limited, Permission required, or Not supported.

This gives users a single place to understand what works on their device — without cluttering the Counter or Lists experiences.

### Rules for adding new capability-gated features

1. Add detection logic to `lib/capabilities.ts`
2. Add resolution logic to `lib/featureAvailability.ts`
3. Add the feature key to `FeatureKey` union type
4. Consume via `useFeatureAvailability(key)` in the component
5. Render via `FeatureGate` to handle all four states explicitly
6. Display status in Settings device support section

---

## Chapter 10 — How to Safely Add New Features

### Step 1 — Classify the feature

Before writing any code, answer:

- Which tab owns this feature? (Counter / Lists / Stats / Settings)
- Does it need persisted state? (store) or UI-only state? (component)
- Is it platform-dependent? (needs capability layer) or universal? (skip capability layer)
- Does it change the store shape? (needs a migration)

### Step 2 — Add translations first

Write the user-facing strings in both `fr` and `en` before writing UI code. This forces you to think about how the feature is communicated — not just how it works.

### Step 3 — Extend the store safely

If the feature needs new state:

1. Add the new shape to the store type
2. Initialize the new field with a safe default
3. Add a migration in the `migrate` function to populate the field for existing users with the default value
4. Write the action that mutates the field

Never add a field to the persisted state without a matching migration. Old devices storing pre-migration data must be handled without crashing.

### Step 4 — Build the UI close to where it lives

- If it's a Counter feature, build it in `app/page.tsx` + extract to `components/` only when it gets large
- If it's platform-dependent, wrap it in `FeatureGate`
- If it's in Settings, add it to the relevant settings section (not a new tab)

### Step 5 — Validate

Before committing:

```bash
npm run lint && npm run build && npm run test:e2e:smoke
```

All three must pass. A lint warning is acceptable if it is clearly justified. A build failure is never acceptable. A failed smoke test means a route is broken.

### Step 6 — Follow the release workflow

Once the work is clean:

```bash
git add [your files]
git commit -m "feat: [description]"
npm run release:patch    # or minor
npm run release:push
```

---

## Quick Reference

### Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Full production build |
| `npm run lint` | Run ESLint |
| `npm run test:e2e:smoke` | Run Playwright smoke tests |
| `npm run release:patch` | Bump patch version + tag |
| `npm run release:minor` | Bump minor version + tag |
| `npm run release:push` | Push commit + tags to remote |

### Key files

| File | Purpose |
|---|---|
| `app/page.tsx` | Counter screen |
| `app/listes/page.tsx` | Lists screen |
| `app/stats/page.tsx` | Stats screen |
| `app/reglages/page.tsx` | Settings screen |
| `store/tasbihStore.ts` | All persisted state |
| `i18n/translations.ts` | All user-facing strings |
| `data/zikrs.ts` | Built-in zikr library |
| `lib/platform.ts` | Runtime platform detection |
| `lib/capabilities.ts` | Browser API capability checks |
| `lib/featureAvailability.ts` | Feature availability resolver |
| `hooks/useFeatureAvailability.ts` | React hook for feature availability |
| `components/FeatureGate.tsx` | Platform-aware rendering component |
| `scripts/sync-pwa-assets.mjs` | Copy PWA worker files to public/ |

### Capability layer feature keys

| Key | What it checks |
|---|---|
| `"vibration"` | `navigator.vibrate` + iOS detection |
| `"wakeLock"` | `navigator.wakeLock` |
| `"notifications"` | `Notification` API + permission state |
| `"share"` | `navigator.share` |
