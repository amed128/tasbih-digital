# Repository Setup

Use these GitHub settings to keep the repository consistent and reviewable.

## Recommended Repository Description

`Mobile-first tasbih and zikr counter built with Next.js, Zustand, and PWA support.`

## Suggested Labels

- `bug`
- `enhancement`
- `documentation`
- `ui`
- `accessibility`
- `mobile`
- `pwa`
- `translations`
- `state`
- `good first issue`

## Branch Protection

Recommended settings for `main`:

- require pull requests before merging
- require at least 1 approval
- require status checks to pass
- require branches to be up to date before merging
- require conversation resolution before merging
- restrict direct pushes if the repo is collaborative

Required status checks:

- `lint-build`

## Pull Request Settings

- enable squash merge
- disable merge commits if you want a cleaner history
- enable auto-delete head branches after merge

## Issue Settings

- keep issue templates enabled
- ask for screenshots for UI regressions
- ask whether a bug happens in browser mode or installed PWA mode

## Review Checklist

- wording uses `Zikr` consistently
- both French and English strings are updated when UI text changes
- mobile viewport behavior is checked
- local storage changes are documented when persistence shape changes
- `npm run lint` and `npm run build` pass before merge