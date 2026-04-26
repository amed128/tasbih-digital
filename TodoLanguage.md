# Language Expansion — Implementation Plan

## Current state
- 12 languages: `fr` `en` `de` `es` `pt` `hi` `ar` `tr` `ur` `bn` `id` `ms`
- All strings in `i18n/translations.ts` (~550 keys per language)
- `Language` type = `keyof typeof translations`
- `useT()` hook resolves by `preferences.language`, falls back to `en`

## Target: 6 languages (Phase 1) - ✅ COMPLETED
French 🇫🇷 · English 🇬🇧 · German 🇩🇪 · Spanish 🇪🇸 · Portuguese 🇧🇷 · Hindi 🇮🇳

---

## Files to change (14 total)

### 1. `store/tasbihStore.ts`
- Line 65: expand `language: "fr" | "en"` → add `| "de" | "es" | "pt" | "hi"`
- Line 191: same for `setLanguage` signature
- Line 679: same for the store action
- Add `normalizeLanguage()` function near `normalizeTheme()` (~line 574)
- Wire `normalizeLanguage` into initial state resolution (like `normalizeTheme`)

### 2. `i18n/translations.ts`
- Add `donate.supportThanks` key to `fr` section: `"Jazak Allahu khayran pour votre soutien."`
- Add `donate.supportThanks` key to `en` section: `"Jazak Allahu khayran for your support."`
- Add complete `de` block (~550 keys)
- Add complete `es` block (~550 keys)
- Add complete `pt` block (~550 keys)
- Add complete `hi` block (~550 keys)

### 3. `components/GeneralSettings.tsx`
- Language `<select>` at lines 147-150: add 4 new `<option>` with flag emojis
```tsx
<option value="fr">🇫🇷 Français</option>
<option value="en">🇬🇧 English</option>
<option value="de">🇩🇪 Deutsch</option>
<option value="es">🇪🇸 Español</option>
<option value="pt">🇧🇷 Português</option>
<option value="hi">🇮🇳 हिन्दी</option>
```

### 4. `app/stats/page.tsx`
- Line 166: replace `language === "fr" ? "fr-FR" : "en-US"` with:
```ts
const LOCALE_MAP: Record<string, string> = { fr: "fr-FR", de: "de-DE", es: "es-ES", pt: "pt-BR", hi: "hi-IN" };
const locale = LOCALE_MAP[language ?? "en"] ?? "en-US";
```

### 5. `components/ReminderScheduler.tsx`
- Lines 28-31: replace hardcoded `language === "fr"` ternary with a `Record<string, string>` map covering all 6 languages

### 6. `app/reglages/page.tsx`
- Lines 87-90: same — replace `preferences.language === "fr"` ternary with a map

### 7. `app/donate/page.tsx`
- Lines 82-85: replace inline `language === "fr" ? ... : ...` with `{t("donate.supportThanks")}`
- Remove now-unused `language` selector and `useTasbihStore` import

### 8. `data/zikrs.ts`
- Extend `Zikr` type with optional fields:
```ts
translation_de?: string;
translation_es?: string;
translation_pt?: string;
translation_hi?: string;
```
- Add `getTranslation(zikr, lang)` helper that falls back to `translation_en`

---

## Translation key structure (per language, ~550 keys)

```
modal      → close
nav        → counter, lists, stats, settings
counter    → 60+ keys including nested targetModal, resetModal, quitModal
lists      → 50+ keys
stats      → 35 keys
settings   → 100+ keys
donate     → 20 keys incl. supportThanks
circle     → 5 keys
about      → 35 keys incl. nested bugForm
help       → 30 keys (4 modes + 9 FAQ)
```

---

## Translation notes per language

| Language | Decimal sep. | `speed0_5s` | Notes |
|----------|-------------|-------------|-------|
| de       | comma       | `0,5s`      | Formal `Sie` register |
| es       | comma       | `0,5s`      | Neutral Latin-American Spanish |
| pt       | comma       | `0,5s`      | Brazilian Portuguese |
| hi       | period      | `0.5s`      | Devanagari script for UI |

## Transliteration strategy
- `zikr.transliteration` stays **canonical English phonetics** — used for audio ASR matching
- New optional `getTranslation(zikr, lang)` helper for display-only fallback
- Audio matcher always uses `transliteration` + `translation_en` + `translation_fr` (unchanged)

---

## Notification strings (handled inline, not via t())
These are native OS notification bodies — not rendered in React, so handled with a local map in each file:

**`ReminderScheduler.tsx`**:
```ts
const REMINDER_BODY: Record<string, string> = {
  fr: "Petit rappel : prenez un moment pour votre zikr.",
  de: "Erinnerung: Nehmen Sie sich einen Moment für Ihren Zikr.",
  es: "Recordatorio: tómate un momento para tu zikr.",
  pt: "Lembrete: reserve um momento para o seu zikr.",
  hi: "याद दिलाना: अपने ज़िक्र के लिए एक पल निकालें।",
};
const body = REMINDER_BODY[language ?? "en"] ?? "Gentle reminder: take a moment for your zikr.";
```

**`reglages/page.tsx`** (test notification):
```ts
const TEST_BODY: Record<string, string> = {
  fr: "Rappel de zikr: qu'Allah accepte vos invocations.",
  de: "Zikr-Erinnerung: Möge Allah Ihre Gebete annehmen.",
  es: "Recordatorio de zikr: que Allah acepte tus invocaciones.",
  pt: "Lembrete de zikr: que Allah aceite suas invocações.",
  hi: "ज़िक्र अनुस्मारक: अल्लाह आपकी दुआएं कबूल करे।",
};
const body = TEST_BODY[preferences.language ?? "en"] ?? "Zikr reminder: may Allah accept your invocations.";
```

---

## Recommended implementation order - ✅ Phase 1 Completed
- [x] 1. `data/zikrs.ts` — type extension + helper (no risk)
- [x] 2. `store/tasbihStore.ts` — type expansion + normalizeLanguage
- [x] 3. All hardcoded `language === "fr"` fixes (7, 8 above — small targeted changes)
- [x] 4. `components/GeneralSettings.tsx` — flag selector
- [x] 5. `i18n/translations.ts` — add `donate.supportThanks` to fr + en
- [x] 6. `i18n/translations.ts` — add `de` block
- [x] 7. `i18n/translations.ts` — add `es` block
- [x] 8. `i18n/translations.ts` — add `pt` block
- [x] 9. `i18n/translations.ts` — add `hi` block
- [x] 10. Commit + push

Steps 1–5 and 6–9 can be done in separate commits so each translation is independently reviewable.

---

## Future phases (roadmap)
- Phase 2: ~~Arabic 🇸🇦~~ ✅, ~~Turkish 🇹🇷~~ ✅, ~~Urdu 🇵🇰~~ ✅, ~~Bengali 🇧🇩~~ ✅ — COMPLETED
- Phase 3: ~~Indonesian 🇮🇩~~ ✅, ~~Malay 🇲🇾~~ ✅ — COMPLETED
- Phase 4: Hausa 🇳🇬, Swahili 🇰🇪, Persian 🇮🇷, Russian 🇷🇺

See `Todo.md` for full roadmap and Muslim population analysis.
