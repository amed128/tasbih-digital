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

## Bug — Statut barre iOS (native Capacitor)

- [ ] **Vérifier que `env(safe-area-inset-top)` se résout correctement** dans le build Capacitor.
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
  - [ ] **Avant production** — Restreindre les thèmes premium aux apps natives uniquement + connecter StoreKit (iOS) / Play Billing (Android). Supprimer l'accès PWA et l'endpoint factice.
  - [ ] **Idées de thèmes premium concrets**
    - [x] **Obsidian** — Quasi-noir avec halo ambiant violet subtil, primaire argent/blanc
    - [ ] **Midnight** — Bleu marine profond, ambiance saphir, accents blanc glacé
    - [ ] **Rose Gold** — Charbon chaud foncé, primaire or rose, bloom ambiant pêche
    - [ ] **Sandstone** — Brun foncé chaud, primaire or vieilli, texture grain ambre
- [x] **Page d'aide / FAQ** — Page `/aide` avec intro, 4 cartes de modes et accordion FAQ 9 questions (dont "À quoi sert la Sync optionnelle ?"). FR + EN.

## Backlog

- [x] **Target field — popup d'édition** — Remplacer l'édition inline du champ target par un popup similaire au popup de reset (avec bouton de confirmation).
- [x] **Mode button — dropdown** — Transformer le bouton Mode en dropdown tout en conservant sa taille et son design actuels. Ajouter une petite flèche vers le bas indiquant que c'est un dropdown. Le dropdown doit s'ouvrir vers le bas avec un petit espace entre le bouton et le menu (comme le dropdown "All zikrs"), reprendre le style/couleur du bouton, et proposer 4 options : Increment, Decrement, Auto-counter, Audio-counter.
- [x] **Logo de l'app** — Design choisi : Option 02 Classical Cinzel. Icône app générée (light default + dark + blue alternates). Switching natif iOS/Android via plugin Capacitor. Caché sur PWA.
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

## SEO upgrades after real domain name

- [ ] **Canonical URL** — Ajouter `alternates: { canonical: '/' }` dans `layout.tsx` une fois le domaine de production connu.
- [ ] **hreflang tags** — Ajouter `<link rel="alternate" hreflang="fr">` et `hreflang="en"` pour le ciblage linguistique international (FR + EN).
- [ ] **FAQ JSON-LD sur `/aide`** — Ajouter un schema `FAQPage` pour que Google affiche les Q&A directement dans les résultats de recherche.
- [ ] **Google Search Console** — Soumettre le sitemap sur `search.google.com/search-console` pour surveiller l'indexation et les performances.
- [ ] **Smart App Banner iOS** — Ajouter `<meta name="apple-itunes-app">` dans `layout.tsx` une fois l'app publiée sur l'App Store.

---

## Internationalisation (i18n)

### État actuel
- 2 langues UI : **Français** (défaut) et **Anglais**
- Translittération : champ unique `transliteration: string` par zikr — phonétique anglaise/latine, partagé par toutes les langues UI
- Type store : `language: "fr" | "en"` (`store/tasbihStore.ts`)
- 450+ zikrs dans `data/zikrs.ts` avec `translation_fr` + `translation_en` déjà séparés

### Phase 1 — Langues décidées (6 langues au total)
- [x] Français (`fr`) ✅
- [x] Anglais (`en`) ✅
- [ ] **Allemand (`de`)** — diaspora turque/arabe en Allemagne, App Store top 5 Europe, script latin
- [ ] **Espagnol (`es`)** — large marché Play Store/App Store, communautés musulmanes Espagne + Amérique latine, script latin
- [ ] **Portugais (`pt`)** — Brésil = top 3 Play Store mondial, Mozambique/Guinée-Bissau, script latin
- [ ] **Hindi (`hi`)** — ~200M musulmans en Inde, Play Store #1 mondial, script Devanagari

### Phase 2 — Backlog (Latin, sans RTL)
- [ ] **Indonésien (`id`)** — ~270M musulmans, Indonésie = top 3 Play Store mondial
- [ ] **Turc (`tr`)** — ~85M musulmans, marché App Store/Play Store solide
- [ ] **Malais (`ms`)** — trivial si `id` est fait, même base linguistique

### Phase 3 — Backlog (RTL requis — effort layout séparé)
- [ ] **Arabe (`ar`)** — 330M locuteurs natifs / langue liturgique de 1,8Md de musulmans. Translittération inutile (lisent le script arabe directement)
- [ ] **Ourdou (`ur`)** — ~170M musulmans (Pakistan), script Nastaliq
- [ ] **Persan/Dari (`fa`)** — ~80M musulmans (Iran, Afghanistan)

### Phase 4 — Backlog (script propre, effort élevé)
- [ ] **Bengali (`bn`)** — ~170M musulmans, Bangladesh = Play Store en forte croissance
- [ ] **Russe (`ru`)** — ~20M musulmans russophone (Tatarstan, Asie centrale)

### Translittération par langue — refactoring requis (bloquant Phase 1)

**Refactoring du type `Zikr` (`data/zikrs.ts`) :**
```ts
// Avant
transliteration: string   // phonétique anglaise uniquement

// Après (Phase 1)
transliteration_en: string   // identique à l'actuel
transliteration_fr: string   // phonétique française
transliteration_de: string   // phonétique allemande (proche EN)
transliteration_es: string   // phonétique espagnole (h muet → convention j)
transliteration_pt: string   // phonétique portugaise (proche ES)
transliteration_hi: string   // Devanagari phonétique (script propre)
```

Stratégie par langue pour les 450+ zikrs :

| Langue | Effort | Stratégie | Exemple : سُبْحَانَ اللهِ |
|---|---|---|---|
| Anglais (`en`) | 0 | Champ actuel renommé | `SubhanaLlah` |
| Français (`fr`) | Moyen | `u`→`ou`, `h` muet marqué, voyelles longues | `Soubhânallâh` |
| Allemand (`de`) | Faible | Quasi-identique à EN, `ü` pour voyelles longues | `SubhanaLlah` *(~identique)* |
| Espagnol (`es`) | Faible | `h` inaudible en ES → convention `j` pour /h/ | `SubhanaLlah` *(h accepté)* |
| Portugais (`pt`) | Faible | Très proche ES, voyelles nasales | `SubhanaLlah` *(h accepté)* |
| Hindi (`hi`) | Élevé | Transcription Devanagari — génération assistée | `सुब्हानल्लाह` |

Le hook `useT()` résoudrait la bonne clé selon `preferences.language`, avec fallback sur `transliteration_en`.

### Plan d'implémentation Phase 1

1. **Refactoring type `Zikr`** — renommer `transliteration` → `transliteration_en`, ajouter les 5 nouveaux champs dans `data/zikrs.ts` et mettre à jour tous les composants qui lisent `zikr.transliteration`
2. **Remplissage données** — populer les 450+ zikrs avec les nouvelles translittérations (DE/ES/PT proches de EN ; HI nécessite génération Devanagari)
3. **Store** — `language: "fr" | "en" | "de" | "es" | "pt" | "hi"`
4. **Dictionnaires UI** — ajouter DE, ES, PT, HI dans `i18n/translations.ts` (~550 clés × 4 langues)
5. **Hook** — `useT()` résout `transliteration_[lang]` avec fallback `transliteration_en`
6. **Settings** — sélecteur langue passe à 6 options
7. **SEO** — `hreflang` × 6, sitemap mis à jour
