# Tasbih Digital — Donation System Roadmap

## Overview
Add a donation flow to Tasbih Digital that is purpose-driven, non-intrusive, and keeps the app free and ad-free. Three phases: payment integration, UI integration into Settings/About, and app store deployment.

---

## Phase 1 — Payment Integration

### Decision: Choose a Payment Platform

| Option | Fee | Backend Needed | Tax/VAT | Notes |
|---|---|---|---|---|
| **Stripe Checkout** | 2.9% + $0.30 | Yes (Node.js API route) | Manual | Most control, lowest fees |
| **Lemon Squeezy** | 8% + $0.30 | No (embed link) | Automatic | Easiest to start |
| **Ko-fi** (test first) | 0% (free tier) | No | No | Good for early traction before investing in Stripe |

**Recommended path:** Ko-fi to validate demand → Stripe for scale.

---

### Option A — Stripe Checkout (Primary Infrastructure)

- [ ] Install Stripe SDK: `npm install @stripe/stripe-js stripe`
- [ ] Add env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Create API route `app/api/create-checkout-session/route.ts`:
  - Accept `{ amount: number }` in POST body
  - Create a Stripe Checkout session (`mode: 'payment'`)
  - `success_url` → `/donate?success=true`
  - `cancel_url` → `/donate`
  - Return `{ id: session.id }`
- [ ] Create `components/DonateButton.tsx`:
  - Preset amounts: `[{ label: 'Coffee', value: 5 }, { label: 'Meal', value: 15 }, { label: 'Month', value: 30 }]`
  - `handleDonate(amount)` loads Stripe and calls `redirectToCheckout`
  - Match existing card/button styling (`rounded-2xl bg-[var(--card)]`, `bg-[var(--primary)] text-black`)
- [ ] Create `/app/donate/page.tsx`:
  - Show `DonateButton`
  - Handle `?success=true` query param → show thank-you message
  - On success, write to `localStorage`: `tasbih_supporter` key with `{ date, amount, anonymous }`

### Option B — Lemon Squeezy (Fallback / Tax-Friendly)

- [ ] Create a product on Lemon Squeezy dashboard
- [ ] Replace `DonateButton` with a simple `<a>` tag linking to the checkout URL
- [ ] No backend changes required

---

## Phase 2 — UI Integration

### Settings Page (`app/reglages/page.tsx`)

- [ ] Add a "Support Development" `<Link>` card pointing to `/donate`, styled consistently with the existing nav cards (General, Appearance, etc.)
- [ ] Position: between the About link and the version string at the bottom

### About Page (`app/about/page.tsx`)

- [ ] Add a supporter recognition banner:
  - Read `localStorage.getItem('tasbih_supporter')` on mount
  - If present and `!anonymous`, render a thank-you line styled with `text-amber-700` or `text-[var(--primary)]`
  - Example text: "Thank you for supporting Tasbih Digital"
- [ ] Add a small "Support this app" button/link as a secondary CTA (not intrusive)

### Donate Page (`app/donate/page.tsx`)

- [ ] New page, accessible from Settings and About
- [ ] Layout consistent with other pages: `max-w-md`, `pb-32`, `BottomNav` at bottom
- [ ] Sections:
  - Header with app purpose message ("Tasbih Digital is free and always will be...")
  - `DonateButton` with preset amounts
  - Impact messaging: "Helps keep this free for everyone — no ads, no tracking"
  - Success state: friendly confirmation after redirect

### i18n

- [ ] Add translation keys for all new strings in `i18n/` (EN + FR minimum):
  - `donate.title`, `donate.subtitle`, `donate.impact`, `donate.success`
  - `settings.supportTitle`, `settings.supportHint`
  - `about.supporterThankYou`

---

## Phase 3 — App Store Deployment

### Android (Google Play)

- [ ] Verify Capacitor Android platform is added: `npx cap add android`
- [ ] Build: `npm run build && npx cap sync android`
- [ ] Generate signed APK/AAB in Android Studio
- [ ] Create Google Play Console account ($25 one-time fee)
- [ ] Prepare store listing:
  - App icon, feature graphic, screenshots (phone + tablet)
  - Short description (80 chars), full description
  - Privacy policy URL (already exists at `/privacy`)
- [ ] Submit for review (3–5 business days typical)

### iOS (App Store)

- [ ] Complete Capacitor iOS setup (already in progress via Xcode)
- [ ] Publish to TestFlight first for beta testing
- [ ] Create App Store Connect listing:
  - Screenshots for iPhone 6.7" and 6.5"
  - App description, keywords, support URL
- [ ] Submit for App Store review ($99/year Apple Developer account)

---

## Phase 4 — Donor Recognition & Trust

- [ ] `localStorage` schema:
  ```ts
  interface SupporterRecord {
    date: string;       // ISO string
    amount: number;     // USD
    anonymous: boolean; // user opt-in
  }
  // key: 'tasbih_supporter'
  ```
- [ ] On Stripe success redirect (`?success=true`), prompt user: "Show as supporter in app? (anonymous by default)"
- [ ] Display in About page only if `!anonymous`
- [ ] No server-side tracking — fully client-local

---

## Revenue Expectations (Reference)

| Active Users | Expected Monthly | Notes |
|---|---|---|
| 500 | $20–$50 | ~3–5 donors |
| 2,000 | $80–$200 | ~1–2% conversion |
| 5,000+ | $300–$800 | + Google Play revenue |

Key success factors already in place:
- App is genuinely useful
- Streak feature drives retention
- No ads or dark patterns
- Clear "free forever" messaging builds trust

---

## Notes & Decisions Pending

- [ ] **Choose platform**: Stripe vs Lemon Squeezy vs Ko-fi (start Ko-fi, migrate to Stripe at ~$50/mo)
- [ ] **Currency**: USD only to start, or support EUR/GBP via Stripe's multi-currency?
- [ ] **Recurring donations**: Stripe supports `mode: 'subscription'` — consider monthly option alongside one-time
- [ ] **Webhook**: If using Stripe, add a webhook handler for `checkout.session.completed` to log (anonymously) donation counts for analytics
