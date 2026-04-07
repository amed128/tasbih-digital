# TODO — Tasbih Digital

---

## Codemagic _(à faire plus tard — nécessite l'inscription Apple Developer Program à $99/an)_
- [ ] S'inscrire à l'Apple Developer Program (developer.apple.com/programs/enroll)
- [ ] Connecter le repo sur codemagic.io
- [ ] Configurer les secrets (App Store Connect Issuer ID, Key ID, clé .p8, certificate private key)
- [ ] Enregistrer l'iPhone dans le portail Apple Developer
- [ ] Lancer un premier build et vérifier TestFlight

---

## Audit Design/UX

### 🔴 Critique

- [x] Ajouter `focus:ring` visible sur BottomNav, selects (`GeneralSettings.tsx:25,83`), boutons toggles (`reglages/page.tsx`)
- [x] Corriger touch targets insuffisants — bouton close `Modal.tsx:137` (`p-2` → min 44px), `BottomNav.tsx:52` (`px-2 py-2`)
- [x] Remplacer `return null` par un skeleton/loading state dans `stats/page.tsx:305` et `reglages/page.tsx:154`
- [x] Remplacer `window.alert()` par une UI notification dans `reglages/page.tsx:69`

### 🟠 Haute priorité

- [x] Harmoniser espacements — `reglages/general/page.tsx:11` utilise `gap-1/pt-2` au lieu de `gap-5/pt-6`
- [x] Standardiser border-radius — `rounded-xl` pour boutons, `rounded-2xl` pour cards, appliquer partout
- [x] Remplacer couleurs hardcodées par CSS vars :
  - `#A5D6A7` / `#2E7D32` → `reglages/page.tsx:402` ✅
  - `#E7B4B4` / `#C62828` → `stats/page.tsx:555` ✅
  - `#22C55E` → `CircleProgress.tsx:18` ✅
  - rgba hardcodés restants → `stats/page.tsx:421,479` ✅

### 🟡 Moyen

- [x] Créer composant `ConfirmDialog.tsx` réutilisable — code dupliqué dans `stats/page.tsx:569` et `reglages/page.tsx:428`
- [x] Standardiser composant breadcrumb/back button pour toutes les sous-pages settings
- [x] Harmoniser durées d'animation à `0.2s` — revoir `0.15s`, `0.18s`, `0.25s`, `0.4s` dans les composants
- [x] Ajouter hover states sur Link cards dans `reglages/page.tsx:173` et `BottomNav.tsx`

### 🔵 Bas

- [x] Corriger `aria-label="Fermer"` hardcodé dans `Modal.tsx:140` — utiliser la clé i18n
- [x] Corriger `<label>` sans `htmlFor` dans `stats/page.tsx:513`
- [x] Remplacer `<footer>` par `<nav role="navigation">` dans `BottomNav.tsx:40`

---

## Auto-compteur — Audit

### 🔴 Critique
- [x] `setAutoCounterWakeLock` déclaré dans le store mais jamais implémenté → supprimé (redondant avec wakeLockEnabled général)
- [x] `autoCounterDefaultEnabled` : préférence sauvegardée mais le compteur démarrait toujours OFF
- [x] `setAudioDebugTelemetry` déclaré dans le store mais jamais implémenté → setter ajouté
- [x] Custom speed (1s/2s) ne restait pas en mode Custom après navigation → `autoCounterSpeedIsCustom` persisté dans le store
- [x] Panneau compteur affichait "2s" au lieu de "Custom: 2s" quand mode Custom actif

### 🟠 Settings présents dans l'UI mais jamais lus par le compteur (dead settings)
- [x] `autoCounterResumeAfterReset` — implémenté
- [x] `autoCounterStopAtGoal` — implémenté
- [x] `autoCounterEntryAutoStart` — implémenté
- [x] `blurActionControlsWhileAuto` — implémenté
- [x] `autoCounterConfirmOnStop` — implémenté
- [x] `autoCounterSoundOnTick` — implémenté

### 🟡 Moyen
- [x] `autoCounterVibrateOnTick` et `autoCounterSoundOnTick` — UI supprimée volontairement
- [x] `resetPreferences()` ne réinitialise pas les préférences auto-compteur — corrigé

---

## Navigation

- [x] Barre des onglets instable en entrant dans l'auto-compteur — corrigé
- [x] BottomNav absent dans zikr selection mode — corrigé
- [x] Retour sur l'onglet Settings : restaurer la dernière sous-page visitée
- [x] Clic sur onglet Settings depuis une sous-page : revenir à la page principale Settings

---

## Déploiement Android (Google Play)

- [ ] Vérifier que la plateforme Capacitor Android est ajoutée : `npx cap add android`
- [ ] Build : `npm run build && npx cap sync android`
- [ ] Générer l'APK/AAB signé dans Android Studio
- [ ] Créer un compte Google Play Console ($25 unique)
- [ ] Préparer la fiche store (icône, captures, description, politique de confidentialité)
- [ ] Soumettre pour révision

---

## Backlog — À discuter / Explorer

- [x] **Bug reporting** — Lien GitHub Issues dans la page About
- [ ] **Notifications push / abonnements** — Les notifications sont-elles alignées avec la politique de l'app (PWA, App Store) ? Valeur ajoutée vs friction d'autorisation, RGPD, pertinence pour une app de dhikr ?
- [ ] **IA audio adaptative** — Intégrer un modèle/algo capable d'apprendre et d'affiner la reconnaissance vocale selon la voix/l'accent de l'utilisateur ? (on-device vs cloud, vie privée, complexité, valeur réelle vs ASR existant)
- [x] **Nom de l'application** — Renommage effectué → **Dhakir** (ذاكر, "celui qui se souvient d'Allah").
- [ ] **SEO / Visibilité PWA et app stores** — Optimisation SEO (meta tags, Open Graph, sitemap, structured data), fiche Google Play et App Store (mots-clés, captures, description optimisée ASO).
- [ ] **Marketing et réseaux sociaux** — Stratégie de publicité et de présence sur les réseaux (à discuter : plateformes cibles, contenu, budget, timing par rapport au lancement).
- [ ] **Monétisation — Thèmes premium** — L'app sera gratuite ; seuls des thèmes premium payants seront proposés pour soutenir le développement. Concevoir et sélectionner les meilleurs thèmes possibles avant de lancer cette offre.
- [x] **Page d'aide / FAQ** — Page `/aide` avec intro, 4 cartes de modes et accordion FAQ 8 questions. FR + EN.

## Backlog

- [x] **Target field — popup d'édition** — Remplacer l'édition inline du champ target par un popup similaire au popup de reset (avec bouton de confirmation).
- [x] **Mode button — dropdown** — Transformer le bouton Mode en dropdown tout en conservant sa taille et son design actuels. Ajouter une petite flèche vers le bas indiquant que c'est un dropdown. Le dropdown doit s'ouvrir vers le bas avec un petit espace entre le bouton et le menu (comme le dropdown "All zikrs"), reprendre le style/couleur du bouton, et proposer 4 options : Increment, Decrement, Auto-counter, Audio-counter.
- [ ] **Logo de l'app** — Améliorer le logo actuel.
- [x] **Icône du bouton Undo** — Remplacée par RotateCcw (Lucide).
- [x] Renommer "Mode de sélection" → "Mode sélection de zikr" (FR) et "Selection Mode" → "Zikr selection mode" (EN)
- [x] Ajouter un setting dans Mode sélection de zikr : réinitialiser ou non le compteur en cours au retour sur un zikr précédent
- [x] Chips container (mode sélection de zikr) — rendre la scrollbar verticale visible (track + thumb) via CSS vars
- [x] Pouvoir modifier le count cible des zikrs ajoutés depuis la bibliothèque lors de la création/édition d'un zikr custom
- [x] Supprimer l'option langue Arabe (non implémentée)
- [x] Note iOS PWA pour les paramètres de vibration et d'icône

---

## Système de dons — Roadmap

### Phase 1 — Intégration paiement

**Choix de plateforme :**

| Option | Frais | Backend | TVA | Notes |
|---|---|---|---|---|
| **Stripe Checkout** | 2.9% + $0.30 | Oui (API route) | Manuel | Plus de contrôle, frais réduits |
| **Lemon Squeezy** | 8% + $0.30 | Non (lien embed) | Auto | Le plus simple |
| **Ko-fi** (tester d'abord) | 0% (tier gratuit) | Non | Non | Bon pour valider la demande |

**Chemin recommandé :** Ko-fi pour valider → Stripe à l'échelle.

#### Option A — Stripe Checkout

- [ ] Installer Stripe SDK : `npm install @stripe/stripe-js stripe`
- [ ] Ajouter les vars d'env : `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] Créer la route API `app/api/create-checkout-session/route.ts`
- [ ] Créer `components/DonateButton.tsx` avec montants préréglés (5$, 15$, 30$)
- [ ] Créer `/app/donate/page.tsx` avec gestion du `?success=true`

#### Option B — PayPal

- [ ] Créer un bouton de don PayPal (Me.pay ou bouton embed officiel)
- [ ] Ajouter le lien/bouton PayPal dans `/donate` comme alternative à Ko-fi/Stripe

#### Option C — Lemon Squeezy (fallback)

- [ ] Créer un produit sur le dashboard Lemon Squeezy
- [ ] Remplacer `DonateButton` par un simple lien vers l'URL de checkout

### Phase 2 — Intégration UI

- [x] Ajouter une card "Soutenir le développement" dans `app/reglages/page.tsx` → `/donate`
- [x] Ajouter une bannière de reconnaissance dans `app/about/page.tsx` (lecture `localStorage`)
- [x] Créer la page `/app/donate/page.tsx` (layout cohérent, BottomNav, message d'impact)
- [x] Ajouter les clés i18n FR/EN : `donate.title`, `donate.subtitle`, `donate.impact`, `donate.success`, `settings.supportTitle`, `about.supporterThankYou`

### Phase 3 — Déploiement app stores

#### Android (Google Play)
- [ ] Vérifier que la plateforme Capacitor Android est ajoutée : `npx cap add android`
- [ ] Build : `npm run build && npx cap sync android`
- [ ] Générer l'APK/AAB signé dans Android Studio
- [ ] Créer un compte Google Play Console ($25 unique)
- [ ] Préparer la fiche store (icône, captures, description, politique de confidentialité)
- [ ] Soumettre pour révision

#### iOS (App Store)
- [ ] Finaliser la configuration Capacitor iOS (en cours via Xcode)
- [ ] Publier sur TestFlight pour les tests bêta
- [ ] Créer la fiche App Store Connect (captures iPhone 6.7" et 6.5")
- [ ] Soumettre pour révision ($99/an Apple Developer Program)

### Phase 4 — Reconnaissance des donateurs

- [ ] Schéma `localStorage` : `{ date, amount, anonymous }` sous la clé `tasbih_supporter`
- [ ] Sur le redirect Stripe (`?success=true`), proposer : "Apparaître comme supporter ?"
- [ ] Afficher uniquement dans la page About si `!anonymous`
- [ ] Aucun tracking serveur — 100% client local

### Décisions en attente

- [ ] **Plateforme** : Ko-fi d'abord, migrer vers Stripe à ~$50/mois
- [ ] **Devise** : USD uniquement ou multi-devises via Stripe ?
- [ ] **Dons récurrents** : envisager `mode: 'subscription'` Stripe en option mensuelle
- [ ] **Webhook** : gestionnaire `checkout.session.completed` pour compter les dons anonymement
