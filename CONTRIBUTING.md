# Contributing

## Scope

This project is a mobile-first Next.js tasbih app. Keep changes focused, small, and consistent with the existing product behavior.

## Development Setup

```bash
npm install
npm run dev
```

Before opening a pull request, run:

```bash
npm run lint
npm run build
```

## Contribution Guidelines

- Preserve the current App Router structure unless there is a clear reason to change it.
- Keep the UI mobile-first.
- Reuse the Zustand store patterns already in `store/tasbihStore.ts`.
- Keep translations in sync in `i18n/translations.ts` when adding UI text.
- Keep theme behavior aligned with the CSS variable system in `app/globals.css`.
- Avoid introducing backend assumptions unless the change explicitly adds backend support.

## Pull Requests

Each pull request should include:

- a short problem statement
- a concise description of the change
- screenshots or screen recordings for UI changes
- notes about state migrations or persistence changes if local storage behavior changed
- test and verification notes

## Documentation

Update `README.md` when you change:

- setup steps
- product capabilities
- architecture or folder responsibilities
- deployment expectations

## Quality Bar

- No unrelated refactors in the same pull request
- No silent breaking changes to persisted state
- No untranslated UI strings
- No desktop-only interaction patterns for core flows