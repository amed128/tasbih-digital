# TODO — Tasbih Digital

---

## 🚀 ÉTAPES OBLIGATOIRES AVANT PRODUCTION

> Ces 5 étapes sont des bloqueurs réels. Rien d'autre ne doit passer avant elles.

- [ ] **1. S'inscrire à l'Apple Developer Program** — $99/an — [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll) — Prérequis pour tout le reste iOS
- [ ] **2. S'inscrire à Google Play Console** — $25 unique — [play.google.com/console](https://play.google.com/console) — Prérequis pour tout le reste Android
- [ ] **3. Intégration RevenueCat (IAP thèmes premium)** — Installer `@capgo/capacitor-purchases`, configurer les produits dans App Store Connect + Play Console, remplacer le faux `handlePurchase`/`restorePurchases`, bloquer PWA via `isNativeApp()` — *Nécessite étapes 1 et 2*
- [ ] **4. Codemagic CI/CD** — Connecter le repo, configurer les secrets Apple/Google, lancer un premier build TestFlight — *Nécessite étapes 1 et 2*
- [ ] **5. SEO final** — Canonical URL, hreflang, FAQ JSON-LD, Google Search Console, Smart App Banner — *Nécessite un nom de domaine de production*

---

## Thème Manuscrit Ancien (`theme/manuscrit`)
> Branche : `theme/manuscrit` — WIP, ne pas merger sur main avant complétion

- [ ] **Peaufiner l'animation du calame** — vérifier que le bec touche exactement le bord du trait d'encre à toutes les valeurs de progression
- [ ] **Tester les deux modes focus** — Vignette (assombrissement des bords) vs Candlelight (virage ambré) ; choisir ou conserver les deux avec le toggle
- [ ] **Mode complété** — valider l'animation du calame remontant vers le haut + shimmer doré sur la barre d'encre
- [ ] **Al-Andalus — état complété doré** — appliquer le shimmer de l'anneau doré du thème Manuscrit sur `GoldRing` dans `AlAndalusCounter.tsx` (voir mémoire `project_andalus_gold_completed.md`)
- [ ] **Particules de poussière d'or** — affiner la position d'émission (bec du calame) et la physique (trajectoire réaliste depuis la pointe)
- [ ] **Focus drag** — tester le déplacement carte + barre ensemble sur iPhone SE (écran 667 px)
- [ ] **Police calligraphique** — évaluer le chargement d'une police Naskh/Thuluth via Google Fonts (`Amiri`, `Scheherazade New`) pour le texte du zikr
- [ ] **Intégration page.tsx** — s'assurer que `isOverlayTheme("manuscript")` est bien appelé à l'intérieur de `renderCompteur()` / `renderListMode()` et non au niveau supérieur

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

## Bug — Statut barre iOS (native Capacitor)

- [x] **Vérifier que `env(safe-area-inset-top)` se résout correctement** dans le build Capacitor.
  Symptôme : la couleur de la barre de statut reste celle du thème précédent lors d'un switch entre thèmes premium (obsidian ↔ emerald).
  Fix appliqué : `setBackgroundColor({ color })` appelé avant `setOverlaysWebView({ overlay: true })` dans le double-RAF + au montage, pour que iOS ait la bonne couleur de fallback même si le mode overlay clignote. Le `::before` CSS reste en place comme couche défensive. À valider sur device.

---

## Backlog — À discuter / Explorer

- [x] **Bug reporting** — Lien GitHub Issues dans la page About
- [x] **Notifications push / abonnements** — Décision : Capacitor `LocalNotifications` uniquement (on-device, aucune donnée serveur). Visible seulement dans l'app native. Stack web-push supprimée.
- [ ] **IA audio adaptative** — Intégrer un modèle/algo capable d'apprendre et d'affiner la reconnaissance vocale selon la voix/l'accent de l'utilisateur ? (on-device vs cloud, vie privée, complexité, valeur réelle vs ASR existant)
- [x] **Nom de l'application** — Décision finale : on garde **At-tasbih**.
- [x] **SEO de base** — Metadata, Open Graph, Twitter card, `lang="en"`, descriptions marketing. Reste : sitemap, JSON-LD, OG image dédiée (voir section SEO en bas).
- [ ] **Marketing et réseaux sociaux** — Stratégie de publicité et de présence sur les réseaux (à discuter : plateformes cibles, contenu, budget, timing par rapport au lancement).
- [x] **Monétisation — Thèmes premium** — Thème Émeraude implémenté (vert émeraude + or luxe). UI avec grille de cartes visuelles + modal achat dans Settings → Apparence. Disponible sur PWA pour l'instant avec endpoint d'achat factice.
  - [ ] **Avant production — URGENT : Intégration RevenueCat** — Installer `@capgo/capacitor-purchases`, configurer les produits IAP dans App Store Connect + Google Play Console (un produit non-consommable par thème, ex. `theme.andalus`), remplacer le faux `handlePurchase` et `restorePurchases` par les appels RevenueCat réels, bloquer l'accès PWA aux thèmes premium via `isNativeApp()`, supprimer l'endpoint factice. Nécessite les comptes développeur Apple ($99/an) et Google Play ($25) actifs en prérequis. Paiement géré nativement par Apple/Google (Face ID, Apple Pay, Google Pay) — l'utilisateur ne quitte jamais l'app.
  - [ ] **Idées de thèmes premium concrets**
    - [x] **Obsidian** — Quasi-noir avec halo ambiant violet subtil, primaire argent/blanc
    - [x] **Midnight** — Bleu marine profond, ambiance saphir, accents blanc glacé
    - [ ] **Rose Gold** — Charbon chaud foncé, primaire or rose, bloom ambiant pêche
    - [ ] **Sandstone** — Brun foncé chaud, primaire or vieilli, texture grain ambre
- [x] **Page d'aide / FAQ** — Page `/aide` avec intro, 4 cartes de modes et accordion FAQ 9 questions (dont "À quoi sert la Sync optionnelle ?"). FR + EN.

## Backlog

- [x] **Target field — popup d'édition** — Remplacer l'édition inline du champ target par un popup similaire au popup de reset (avec bouton de confirmation).
- [x] **Mode button — dropdown** — Transformer le bouton Mode en dropdown tout en conservant sa taille et son design actuels. Ajouter une petite flèche vers le bas indiquant que c'est un dropdown. Le dropdown doit s'ouvrir vers le bas avec un petit espace entre le bouton et le menu (comme le dropdown "All zikrs"), reprendre le style/couleur du bouton, et proposer 4 options : Increment, Decrement, Auto-counter, Audio-counter.
- [x] **Logo de l'app** — Design choisi : Option 02 Classical Cinzel. Icône app générée (light default + dark + blue alternates). Switching natif iOS/Android via plugin Capacitor. Caché sur PWA.
- [x] **Fix new app icon and logo**
- [x] **Fix manual zikr panel and cancel button** — The cancel button should replace the "Add manually" button during edit mode in the manual zikr panel
- [ ] **Enhance zikr library** — Improve the existing library UI/UX and propose new zikr ideas to enrich the collection
- [x] **Icône du bouton Undo** — Remplacée par RotateCcw (Lucide).
- [x] Renommer "Mode de sélection" → "Mode sélection de zikr" (FR) et "Selection Mode" → "Zikr selection mode" (EN)
- [x] Ajouter un setting dans Mode sélection de zikr : réinitialiser ou non le compteur en cours au retour sur un zikr précédent
- [x] Chips container (mode sélection de zikr) — rendre la scrollbar verticale visible (track + thumb) via CSS vars
- [x] Pouvoir modifier le count cible des zikrs ajoutés depuis la bibliothèque lors de la création/édition d'un zikr custom
- [x] Supprimer l'option langue Arabe (non implémentée)
- [x] Note iOS PWA pour les paramètres de vibration et d'icône

---

## Système de dons

### État actuel ✅
- [x] Page `/donate` créée avec Ko-fi uniquement (`ko-fi.com/attasbihapp`)
- [x] Card "Soutenir le développement" dans Settings → `/donate`
- [x] Bannière de reconnaissance dans About (lecture `localStorage`)
- [x] Clés i18n FR/EN complètes
- [x] PayPal, Stripe, Lemon Squeezy abandonnés — Ko-fi couvre les deux (PayPal + carte)

### À faire plus tard
- [ ] **Reconnaissance des donateurs** — Stocker `{ date, amount }` dans `localStorage` après un don Ko-fi (via webhook Ko-fi ou redirect `?success=true`), afficher un message de remerciement dans About
- [ ] **Migrer vers Stripe** si les dons dépassent ~$50/mois (Ko-fi prend 0% sur le tier gratuit)

---

## Backlog - New Features

- [ ] **Focus mode — exit on tap outside bead ball** — In premium themes, tapping outside the bead ball area should exit focus mode
- [ ] **Bigger font size option** — Add a larger text/police size option (see Enhanced Accessibility below)
- [ ] **Help/Donate button in simple mode** — Add a help and donate button on the main page when in simple (non-list) mode
- [ ] **Blur mode button on premium themes when counting starts** — Blur/dim the mode button on premium themes once counting begins
- [ ] **Next zikr button before tap button in free themes (selection mode)** — On free themes, reorder the controls in selection mode so the "next zikr" button appears before the tap button
- [ ] **General settings verification on premium themes** — Audit all settings (especially selection mode settings) to confirm they apply correctly on premium themes; identify and fix any that are ignored or behave differently
- [ ] **Guided Zikr Programs & Sequences:** Create pre-packaged sequences of zikrs. For example, a "Morning Routine" or a "Post-Prayer Sequence" that guides the user through a series of zikrs without them having to manually select each one. This reduces friction and mental overhead, providing structure for both new and experienced users.
- [ ] **Personal Goals & Gentle Reminders:** Allow users to set personal, private goals (e.g., "Complete 1,000 counts of Tasbih Fatima this week"). Implement opt-in, non-intrusive notifications to let users schedule gentle reminders for specific times they want to practice. This fosters consistency and mindfulness in a way that respects the user's autonomy.
- [ ] **Advanced Statistics & Personal Insights:** Enhance the stats page to show a calendar heatmap of activity, trends over time, and breakdowns of which zikrs are practiced most often. This allows for personal reflection on one's practice and can be a powerful motivator.
- [x] **"Zen Mode" / Focus Mode:** Focus button blurs and disables all non-essential controls (mode, zikr picker, undo, reset), leaving Tap, Next Zikr, BottomNav, and the Focus button itself fully active. Available in both counter and selection mode.
- [ ] **Enhanced Accessibility:** Add an "Accessibility" section in the settings to allow users to increase font size, choose higher-contrast themes, and potentially enable system fonts. This makes the app more inclusive and ensures that users with visual impairments can still benefit from it.

---

## SEO — Done ✅

- [x] **OG image 1200×630** — `app/opengraph-image.tsx` (dynamic via Next.js ImageResponse)
- [x] **sitemap.xml** — `app/sitemap.ts`
- [x] **robots.txt** — `app/robots.ts`
- [x] **Métadonnées par page** — layouts pour stats, listes, about, aide
- [x] **Données structurées (JSON-LD)** — bloc `SoftwareApplication` dans `layout.tsx`
- [x] **metadataBase** — via `NEXT_PUBLIC_APP_URL` env var

## SEO upgrades — Domaine attasbih.com acquis ✅

- [x] **Domaine** — `attasbih.com` acheté sur Namecheap, DNS configuré, Vercel valide ✅
- [x] **NEXT_PUBLIC_APP_URL** — `https://attasbih.com` défini dans les variables d'environnement Vercel ✅
- [ ] **Fallback URL** — Remplacer `https://at-tasbih.app` par `https://attasbih.com` comme fallback dans `layout.tsx:21` et `:75`
- [ ] **Canonical URL** — Ajouter `alternates: { canonical: '/' }` dans `layout.tsx`
- [ ] **hreflang tags** — Ajouter `<link rel="alternate" hreflang="fr">` et `hreflang="en"` pour le ciblage linguistique international (FR + EN)
- [ ] **FAQ JSON-LD sur `/aide`** — Ajouter un schema `FAQPage` pour que Google affiche les Q&A directement dans les résultats de recherche
- [ ] **Google Search Console** — Soumettre le sitemap sur `search.google.com/search-console` pour surveiller l'indexation et les performances
- [ ] **Smart App Banner iOS** — Ajouter `<meta name="apple-itunes-app">` dans `layout.tsx` une fois l'app publiée sur l'App Store *(bloqué : nécessite App Store ID)*

## Marketing — À faire maintenant que le domaine est connu

- [ ] **Créer @attasbihapp** sur Instagram, TikTok, Twitter/X, YouTube
- [ ] **Mettre à jour la page Ko-fi** — ajouter la référence à attasbih.com
- [ ] **Préparer les assets App Store** — screenshots premium, vidéo de preview 30s, descriptions localisées (FR, EN, AR, ID, UR en priorité)

---

## Internationalisation (i18n) ✅

### Phase 1 — Langues décidées (6 langues au total)
- [x] Français (`fr`) ✅
- [x] Anglais (`en`) ✅
- [x] **Allemand (`de`)** ✅
- [x] **Espagnol (`es`)** ✅
- [x] **Portugais (`pt`)** ✅
- [x] **Hindi (`hi`)** ✅

### Phase 2 — Latin, sans RTL
- [x] **Indonésien (`id`)** ✅
- [x] **Turc (`tr`)** ✅
- [x] **Malais (`ms`)** ✅

### Phase 3 — RTL
- [x] **Arabe (`ar`)** ✅
- [x] **Ourdou (`ur`)** ✅
- [x] **Persan/Dari (`fa`)** ✅

### Phase 4 — Scripts propres
- [x] **Bengali (`bn`)** ✅
- [x] **Russe (`ru`)** ✅
