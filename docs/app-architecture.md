# App Architecture

This document is the technical reference for how Tasbih Digital is structured today and how future features should be integrated.

It has two goals:

1. Explain the current architecture clearly enough that a developer can work safely in the codebase.
2. Define the future architecture direction, especially for platform-aware features across Web, PWA, iOS, and Android.

This document is intentionally practical. It is not a tutorial, but it should become the backbone for a future developer book or learning guide.

## 1. Product Shape

Tasbih Digital is a mobile-first zikr counter built as a Next.js App Router application.

Current product areas:

- Counter: active counting flow, modes, target, feedback
- Lists: built-in zikr library and user-created lists
- Stats: history, totals, streaks, weekly chart
- Settings: theme, language, feedback, legal/about entry points
- Legal: about and privacy pages for app-store readiness

The current top-level routes are:

- `/` Counter
- `/listes` Lists
- `/stats` Stats
- `/reglages` Settings
- `/about` About
- `/privacy` Privacy policy

## 2. Runtime Stack

The app currently uses:

- Next.js 16 App Router
- React 19
- TypeScript
- Zustand for persisted state
- Framer Motion for UI animation
- Recharts for charts
- next-pwa for production PWA support

Build and release flow in `package.json`:

- `npm run dev` for local development
- `npm run build` for production build
- `npm run start` for production server
- `npm run lint` for linting
- `npm run test:e2e:smoke` for Playwright smoke tests
- `npm run release:*` for version bumping and tag publishing

Important build detail:

- Production builds intentionally use webpack via `next build --webpack` because the PWA integration relies on it.
- After production build, `scripts/sync-pwa-assets.mjs` copies generated service worker assets into `public/` so they are served correctly.

## 3. Folder Responsibilities

### `app/`

App Router pages and route-level UI.

- `app/page.tsx`: counter experience and list execution flow
- `app/listes/page.tsx`: zikr library and custom list management
- `app/stats/page.tsx`: charts and historical summaries
- `app/reglages/page.tsx`: global preferences and settings entry points
- `app/about/page.tsx`: about/legal/product info
- `app/privacy/page.tsx`: privacy policy page

### `components/`

Reusable UI primitives and shared visual pieces.

Examples:

- navigation
- progress ring
- modal
- theme synchronization

### `data/`

Bundled static zikr content and predefined list definitions.

- `data/zikrs.ts` is the main source for built-in zikr entries and default list structure.

### `store/`

Global client state and persistence.

- `store/tasbihStore.ts` is the core application state model.

This is the most important state layer in the app. It owns:

- current zikr and counter session
- active list mode
- custom lists and custom zikrs
- stats/history
- user preferences
- migration/normalization of old persisted state

### `hooks/`

Reusable client-side hooks.

- `hooks/useT.ts` resolves translated strings from the selected language.

### `i18n/`

Translation dictionaries.

- `i18n/translations.ts` is the source of all user-facing translated text.

### `public/`

Static assets.

- manifest
- icons
- generated PWA worker assets after production build

### `scripts/`

Utility scripts for project tooling.

- icon generation
- PWA asset synchronization after build

### `.github/`

Repository automation and collaboration standards.

- CI workflow
- release workflow
- release notes categories
- PR and issue templates

## 4. State Architecture

The app is local-first.

Persistence model:

- storage medium: `localStorage`
- store implementation: Zustand
- persistence key: managed inside `store/tasbihStore.ts`

Persisted domains include:

- counter state
- current zikr / active list
- custom lists and custom entries
- stats/history
- user preferences

Important architectural trait:

- the store already contains migration logic to normalize legacy persisted shapes and old naming.

That means future data changes should continue to follow the same pattern:

1. extend the state shape carefully
2. provide backward-compatible migration behavior
3. avoid silent data loss

## 5. Data Flow

The app follows a straightforward client-side flow:

1. Static zikr content is loaded from `data/zikrs.ts`.
2. The Zustand store resolves the current runtime state from persisted storage plus defaults.
3. Pages subscribe to only the store slices they need.
4. UI actions dispatch store actions.
5. Derived UI state stays close to the route component unless it must persist.

Practical split:

- Persisted state belongs in the store.
- Temporary visual/UI-only state belongs in the page/component.

Examples of local UI state that should stay local:

- dropdown open/closed
- modal visibility
- temporary search input
- animation triggers

Examples of state that should stay in the store:

- current active zikr or list
- counter progress
- list content
- stats history
- theme/language/preferences

## 6. UX Information Architecture

The app already has a good four-tab core structure:

- Counter for doing
- Lists for choosing
- Stats for reflecting
- Settings for configuring

This should remain the primary IA.

Future work should avoid creating new top-level tabs for every feature idea.

Recommended ownership of future features:

### Counter

Owns live practice and counting controls.

Good fit:

- auto-counter
- focus mode
- strong completion feedback
- resume current routine

Bad fit:

- backup/import/export
- reminder configuration
- deep analytics setup

### Lists

Owns content, routines, templates, and starting flows.

Good fit:

- preset routines
- pinned or favorite routines
- curated practice sets

### Stats

Owns reflection and progress understanding.

Good fit:

- richer insights
- consistency trends
- routine completion analysis
- heatmaps and longer-range summaries

### Settings

Owns global behavior, support state, and continuity tools.

Recommended future settings groups:

- Appearance
- Feedback
- Practice
- Data
- Device support
- About

## 7. Platform-Aware Feature Architecture

Future features must not assume equal support across Web, PWA, iOS, and Android.

The app should support one shared product model, but runtime availability should be computed by capability.

### Design Principle

Every feature gets two decisions:

1. Product decision: should the feature exist in the app?
2. Runtime decision: can the current platform/browser/device support it?

### Recommended availability states

Use four states:

- `available`
- `permission-required`
- `limited`
- `unsupported`

Recommended type shape:

```ts
type FeatureStatus =
  | "available"
  | "permission-required"
  | "limited"
  | "unsupported";

type FeatureAvailability = {
  status: FeatureStatus;
  label?: string;
  reason?: string;
};
```

### Why this matters

This allows the same feature to be:

- fully usable on one platform
- partially usable on another
- visible but disabled on another

Example:

- volume-button counting can exist in product design
- but be rendered as unsupported in current web/PWA builds
- with an explanation like `Not supported in this browser/PWA`

## 8. Capability Layer Proposal

Do not scatter platform checks across route components.

Introduce a small capability layer instead.

Recommended future files:

- `lib/platform.ts`
- `lib/capabilities.ts`
- `lib/featureAvailability.ts`
- `hooks/useFeatureAvailability.ts`
- `components/FeatureGate.tsx`

### `lib/platform.ts`

Responsibility:

- environment classification for messaging

Examples:

- iOS
- Android
- desktop
- installed PWA / standalone mode
- browser mode

### `lib/capabilities.ts`

Responsibility:

- raw browser/runtime support checks

Examples:

- vibration API
- notification support and permission
- service worker support
- wake lock support
- share API

### `lib/featureAvailability.ts`

Responsibility:

- combine product decision + platform + capability into final user-facing availability

### `hooks/useFeatureAvailability.ts`

Responsibility:

- React-facing consumption of the feature availability matrix

### `components/FeatureGate.tsx`

Responsibility:

- standardized rendering of:
  - available controls
  - limited controls with notes
  - disabled unsupported controls with explanations

## 9. Initial Capability Matrix

This is the recommended conceptual matrix for future roadmap work.

| Feature | Web/Desktop | Android Browser/PWA | iOS Safari/PWA | Notes |
|---|---|---|---|---|
| Export/import backup | available | available | available | pure client-side |
| Preset routines | available | available | available | pure product feature |
| Auto-counter | available | available | available | app logic only |
| Focus mode | available | available | available | UI-only feature |
| Haptics/vibration | limited or unsupported | available or limited | limited or unsupported | depends on API support |
| Sound feedback | available | available | available | direct user gesture flow helps |
| Wake lock | limited | limited or available | limited | depends on browser |
| Reminders/notifications | permission-required or limited | permission-required or limited | limited or unsupported | must message clearly |
| Volume-button counting | unsupported | unsupported in web/PWA | unsupported | likely native-only later |
| Fingerprint counting | unsupported | unsupported | unsupported | native-only later |
| Advanced stats | available | available | available | local data feature |
| Optional sync | available later | available later | available later | backend-gated, not browser-gated |

## 10. Rendering Rules

UI behavior should follow the availability state.

### `available`

- render normally
- allow interaction

### `permission-required`

- render normally or semi-enabled
- show a clear CTA to enable permission
- include note explaining requirement

### `limited`

- render normally
- include note that behavior may vary by browser/platform

### `unsupported`

- render visible but disabled
- reduce opacity
- add lock/info note
- do not rely on blur alone

This is especially appropriate in Settings.

## 11. Grouping Future Features

To avoid turning the app into a collection of disconnected toggles, future work should be grouped into four product epics.

### A. Practice

Includes:

- preset routines
- quick resume
- reminders later

Primary homes:

- Lists
- Counter
- Settings for reminder config

### B. Counting Experience

Includes:

- auto-counter
- focus mode
- wake lock
- milestone cue improvements
- no-look alternatives

Primary homes:

- Counter
- Settings for defaults/preferences

### C. Data & Continuity

Includes:

- export/import
- clear local data
- optional sync later

Primary home:

- Settings

### D. Reflection

Includes:

- advanced stats
- completion trends
- usage patterns

Primary home:

- Stats

## 12. Recommended Implementation Order

Future roadmap work should be sequenced as follows.

### Phase 1

- capability layer
- feature availability types
- reusable `FeatureGate`
- support-state UI in Settings

### Phase 2

- export/import backup
- preset routines

### Phase 3

- auto-counter
- focus mode
- wake lock support where available

### Phase 4

- richer stats

### Phase 5

- reminders/notifications

### Phase 6

- optional sync

This order is intentional:

- universal features first
- capability-dependent features after the support model exists
- backend-dependent work last

## 13. Architecture Constraints to Preserve

When extending the app, keep these constraints intact:

1. Keep Counter minimal and fast.
2. Keep Lists content-focused, not settings-heavy.
3. Keep Stats reflective, not operational.
4. Keep Settings as the platform/support explanation surface.
5. Keep the store migration-safe.
6. Keep the app local-first by default.
7. Prefer capability detection over hard-coded platform branching.

## 14. Foundation for a Future Developer Book

This document should become the base outline for a future friendly technical guide.

Suggested future guide chapters:

1. Product model: what Tasbih Digital is and is not
2. Next.js App Router structure in this app
3. Zustand state design and persistence
4. Translation and localization flow
5. Motion, charts, and component composition
6. PWA build pipeline and service worker handling
7. Testing strategy: lint, build, smoke tests
8. Release workflow and tagged publishing
9. Platform-aware feature design
10. How to safely add new features without breaking persisted data

That future guide can be more narrative and educational, while this document stays as the technical source of truth.
