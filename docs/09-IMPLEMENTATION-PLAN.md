# 09 — Plan d'implémentation (à cocher au fur et à mesure)

Règle : terminer chaque phase (tests verts + critères « Terminé quand ») avant la suivante. Les items `P1` sont regroupés en Phase 7.
Commit à la fin de chaque phase : `feat(phase-N): …`.

## Phase 0 — Socle (≈ 1 h)
- [x] Monorepo pnpm : `apps/api` (Nest CLI), `apps/web` (Vite React TS), `packages/shared` (TS, build `tsup` ou `tsc`).
- [x] TS strict partout, ESLint + Prettier, scripts racine `dev` (concurrently), `build`, `start`, `test`, `lint`, `typecheck`.
- [x] `.env.example` (cf. `08-DEPLOYMENT.md §1`), `config/env.ts` (zod), `.gitignore`.
- [x] Nest : préfixe `/api`, helmet, cookie-parser, compression, `trust proxy`, `ValidationPipe({ whitelist: true, transform: true })`, `AllExceptionsFilter`, `MongooseModule.forRootAsync`.
- [x] `GET /api/health`.
- [x] Vite : proxy `/api` → `http://localhost:3000`.
- [x] Fixture de recherche **déjà fournie** (`apps/api/test/fixtures/deezer-search-bahi.json`) ; enregistrer `/track/{id}` et `/album/{id}` (`curl`) en `deezer-track.json` / `deezer-album.json`.
- [x] Config : 4 variables (`08-DEPLOYMENT.md §1`), constantes dans `config/constants.ts` et `web/src/config.ts`.
- **Terminé quand** : `pnpm dev` lance les deux apps, `curl localhost:5173/api/health` → ok, fixtures présentes.

## Phase 1 — Backend public (≈ 3 h)
- [x] `packages/shared` : types de `03-API.md §2` + `ErrorCode`.
- [x] `DeezerModule` : `search`, `getTrack`, `getAlbumGenre`, mapping + `trackKey`, dédoublonnage ISRC, cache LRU 5 min, limiteur bottleneck (20 / 5 s), file bornée, disjoncteur quota, dédoublonnage en vol, timeout 5 s, gestion `body.error`, `parsePreviewExpiry` — + tests du `05-DEEZER.md §8`.
- [x] Schémas `Track`, `Addition` + index (`04-DATA-MODEL.md`).
- [x] Décorateur `@GuestId()` (lit/valide `X-Guest-Id`).
- [x] `GET /api/search` (enrichi `addCount`/`addedByMe`, exclut masqués).
- [x] `POST /api/additions` (flux atomique §3.2, genre en tâche de fond).
- [x] `GET /api/tracks` (popular/recent, pagination, `addedByMe`).
- [x] `GET /api/tracks/:trackKey/preview` (rafraîchissement si expiré, extraits ≈ 15 min).
- [x] Throttling (tableau `02-ARCHITECTURE.md §6`).
- [x] Tests :
  - unitaires DeezerService (fixtures, quota code 4 → retry → 503, 800 → 404, cache hit) ;
  - e2e (mongodb-memory-server, Deezer mocké) : ajout → 201 ; même invité même morceau → 200 `alreadyAddedByMe` et `addCount` inchangé ; 2ᵉ invité → `addCount=2` ; ajout de l'id 745229932 puis 1014597302 (même ISRC) par 2 invités → **un seul** track avec `addCount=2` ; 20 ajouts concurrents de 20 invités → `addCount=20` exactement ; morceau masqué → 409 ; sans `X-Guest-Id` → 400 ; tri popular correct.
- **Terminé quand** : tous les tests passent ; `curl` manuel de chaque route conforme au contrat.

## Phase 2 — Front invité (≈ 4 h)
- [x] Tailwind v4 + `styles/tokens.css` (copie de `06 §3`), polices, script anti‑flash, `ThemeProvider` + `ThemeToggle` (localStorage `hcc-theme`).
- [x] `lib/guestId.ts` (UUID via `crypto.randomUUID()`, clé `hcc-guest-id`), `lib/api.ts` (fetch typé, en‑tête `X-Guest-Id`, parse erreurs → `ApiError{code}`), `i18n/fr.ts`.
- [x] Composants UI de base (Button, Badge, CountBadge, Chip, Card, Skeleton, PreviewButton), Header, Footer.
- [x] `AudioPreviewProvider` : un seul `HTMLAudioElement`, `play(trackKey, urlOrResolver)`, `pause()`, état `{currentKey, progress, status}`, stop à la fin, retry via `/preview` sur erreur.
- [x] `SearchBox` + `useDebouncedValue` + `useSearch` (TanStack Query, `enabled: q.length>=2`, `signal` d'annulation, `staleTime` 60 s) + chips d'idées.
- [x] `SuggestionList` avec tous ses états.
- [x] `useAddTrack` (mutation) : stop audio → vider input → toasts selon réponse → confettis → `invalidateQueries(['tracks'])` → highlight.
- [x] `PlaylistGrid` + `TrackCard` + onglets + « Charger plus » (`useInfiniteQuery`) + polling 15 s + bouton « +1 ».
- [x] Responsive 375 / 768 / 1280 ; light + dark ; `prefers-reduced-motion`.
- [x] Tests Vitest : debounce (pas d'appel avant 1000 ms ni sous 3 caractères, 1 seul appel après frappe rapide) ; après ajout l'input est vide et les suggestions masquées ; toast affiché avec titre et artiste ; « Ajouté ✓ » quand `addedByMe`.
- **Terminé quand** : parcours US‑1 → US‑5 réalisable de bout en bout sur mobile, en light et dark.

## Phase 3 — Auth admin (≈ 1,5 h)
- [x] Schéma `Admin`, seed au démarrage + script `seed:admin`.
- [x] `login` / `logout` / `me`, JWT cookie (`remember` → 7 j sinon 12 h), `JwtCookieGuard`, throttle 5/15 min.
- [x] Page `/admin/login` (`07-SCREENS.md §2`), `RequireAdmin`, redirections.
- [x] Tests e2e : mauvais mot de passe → 401 `INVALID_CREDENTIALS` ; bon → cookie + `me` 200 ; route admin sans cookie → 401 ; logout → `me` 401.
- **Terminé quand** : impossible d'atteindre `/admin` sans être connecté ; ThemeToggle présent.

## Phase 4 — Dashboard admin (≈ 4 h)
- [x] `GET /api/admin/stats` (agrégations `04 §5`, tranches vides complétées).
- [x] `GET /api/admin/tracks` (filtres, tris, rang global, liste des genres) + `PATCH /api/admin/tracks/:id`.
- [x] Page dashboard : bannière, période, KPI, artiste top, barre genres, histogramme, classement + filtres synchronisés à l'URL, actions optimistes, pagination, synchro auto.
- [x] Tests e2e : stats sur jeu de données connu (valeurs exactes) ; filtre `status=hidden` ; `sort=count_asc` ; regex spéciale `q=(` ne plante pas.
- **Terminé quand** : US‑7 → US‑9 OK, light + dark, tablette 768 px lisible.

## Phase 5 — Durcissement (≈ 1,5 h)
- [ ] Revue a11y (navigation clavier complète, `aria-*`, contrastes) ; Lighthouse mobile ≥ 90 perf/a11y sur `/`.
- [ ] Messages d'erreur FR partout ; page 404 ; Open Graph.
- [ ] Logs propres, aucune donnée sensible loguée (mots de passe, IP en clair).
- [ ] Scripts `recount` et `reset-data --yes`.

## Phase 6 — Déploiement (≈ 1 h)
- [ ] `Dockerfile` + config hébergeur, build prod servi par Nest, cache headers.
- [ ] Checklist `08-DEPLOYMENT.md §4`.

## Phase 7 — P1 (si temps)
- [ ] US‑10 Export CSV
- [ ] US‑11 Ouvrir/fermer les propositions (+ `GET /api/settings/public`)
- [ ] US‑12 Mini‑lecteur mobile
- [ ] US‑13 Raccourci ⌘K
- [ ] US‑14 Playwright smoke (recherche → ajout → carte visible ; login → dashboard)

---

## Décisions prises en cours de route
> Format : `AAAA-MM-JJ — décision — raison`. À compléter par l'agent.

- 2026-11-25 — Debounce 1 s, min 3 caractères — prudence Deezer, cf. ADR D2.
- 2026-11-25 — Pas d'ajout en texte libre — dédoublonnage impossible, cf. ADR D3.
- 2026-11-25 — Identité morceau = ISRC (`trackKey`) — doublons constatés dans la réponse réelle `/search?q=bahi`, cf. ADR D8.
- 2026-11-25 — 4 variables d'env seulement, cf. ADR D9.
- 2026-11-25 — Versions figées : Nest 11, React 18, TS 5.9, ESLint 9, Vite 7, Vitest 3, Mongoose 8, Jest 29, zod 4 — stack imposée (Nest 11 / React 18) ; majors plus récents (Nest 12, TS 7, Vite 8) évités la veille de la prod.
- 2026-11-25 — `packages/shared` buildé par `tsup` (ESM + CJS) : consommé en CJS par Nest et en ESM par Vite ; `ErrorCode` est un objet `as const` + type union (pas d'`enum`).
- 2026-11-25 — Code d'erreur `NOT_FOUND` (404) ajouté pour les routes API inconnues ; 403 génériques mappés sur `UNAUTHORIZED` — le tableau `03 §1` ne couvrait pas ces cas.
- 2026-11-25 — Script anti-flash du thème servi en fichier externe bloquant (`public/theme-init.js`) au lieu d'un script inline : même effet, et la CSP helmet reste `script-src 'self'`.
- 2026-11-25 — Sans `MONGODB_URI` hors production, l'API démarre sur mongodb-memory-server (warning) ; en production `MONGODB_URI` est obligatoire (zod). `.env` local créé sans URI.
- 2026-11-25 — pnpm 12 : builds autorisés via `allowBuilds` dans `pnpm-workspace.yaml` (esbuild, mongodb-memory-server, @nestjs/core).
- 2026-11-25 — Rate-limit : `@nestjs/throttler` avec throttlers nommés (`global`, `search`, `addGuest`, `addIp`, `login`) activés par route via `@RateLimit(...)` ; clé = guestId sinon IP. Le 20/10 min compte les **tentatives** d'ajout (y compris « déjà ajouté ») — plus simple, suffisant pour R6.
- 2026-11-25 — `GET /api/tracks/:trackKey/preview` soumis à la même limite que la recherche (40/min/invité) : il peut déclencher un appel Deezer.
- 2026-11-25 — Ajout : pré-contrôle « masqué » sur `deezerIds` avant tout appel Deezer, puis contrôle par `trackKey` ; en cas de course sur l'upsert (E11000), une relance en mise à jour.
- 2026-11-25 — `DeezerService.search` renvoie la liste dédoublonnée complète (≤ 15) ; le filtrage des masqués puis la coupe à `limit` (8 par défaut) se font dans `TracksService`, pour garder 8 résultats même si certains sont masqués.
- 2026-11-25 — Certains albums Deezer n'ont aucun genre (`genres.data: []`) → `genre: null`, affiché « Autres ».
- 2026-11-25 — `useSearch` : `enabled` à **3** caractères et `staleTime` **5 min** (le plan Phase 2 disait 2 car. / 60 s) — on suit le PRD US-1 et `05-DEEZER §5`, plus prudents envers Deezer.
- 2026-11-25 — L'input est vidé **après** la réponse de l'API (et pas au clic) : en cas d'erreur, l'invité garde sa recherche. L'audio est coupé dès le clic.
- 2026-11-25 — iOS : pour les extraits résolus via `/preview` (playlist, dashboard), un WAV silencieux est joué de façon synchrone dans le clic pour débloquer l'élément audio avant l'appel réseau.
- 2026-11-25 — Raccourci ⌘K / Ctrl+K branché dès la Phase 2 (le badge ⌘K du design system l'annonce) ; US-13 sera cochée en Phase 7.
- 2026-11-25 — Highlight après ajout : anneau rouge 2 s ; défilement doux seulement si la carte est déjà partiellement à l'écran (pas de saut de page pendant que le focus revient dans l'input).
- 2026-11-25 — Vitest sous Node ≥ 22 : `--no-experimental-webstorage` dans les workers (le `localStorage` natif de Node masque celui de jsdom).
- 2026-11-25 — Vérif visuelle : captures Playwright (Chromium headless) light/dark × 375/1280 + parcours réel (recherche → extrait → ajout → toast → highlight) sans erreur console.
- 2026-11-25 — Limite de connexion : compteur maison des **échecs** par IP hachée (LRU, 5 / 15 min, fenêtre ancrée sur le 1er échec) plutôt que `@nestjs/throttler`, qui compterait aussi les connexions réussies. Au-delà : 429 même avec le bon mot de passe.
- 2026-11-25 — Seed admin : un seul compte ; si `ADMIN_EMAIL` change, l'ancien compte est supprimé. Email inconnu → comparaison bcrypt sur un hash factice (pas de fuite par le timing). Le JWT n'est accepté que si l'admin existe encore.
- 2026-11-25 — `seed:admin` = `nest build && node dist/scripts/seed-admin.js` (pas de ts-node) ; le seed tourne aussi à chaque démarrage.
- 2026-11-25 — Histogramme « Ajouts par 15 min » en barres CSS/SVG maison au lieu de recharts (≈ 100 kB évités) : une série, barres bleues + dernière tranche rouge, info-bulle au survol/focus, tableau `sr-only`. Palette des genres validée avec le script du skill dataviz (light OK ; en dark le rose sort légèrement de la bande de luminosité, compensé par la légende + %).
- 2026-11-25 — Pages admin chargées en lazy (`React.lazy`) : la page invité ne télécharge pas le dashboard.
- 2026-11-25 — Stats : les KPI `range=all` (`uniqueTracks`, artiste, genres) ignorent les morceaux masqués ; `totalAdditions` / `uniqueGuests` comptent toutes les additions (comme dans `04 §5`). Timeline `all` : depuis le 1er ajout, 15 min, 30 min au-delà de 48 tranches, puis seules les 48 dernières tranches sont gardées.
- 2026-11-25 — Classement admin : genre `null` filtré et affiché comme « Autres » ; « Plus récents » = `firstAddedAt` desc (même sens que l'onglet public) ; tri A→Z avec collation `fr`. Un morceau masqué garde le rang qu'aurait son compteur.
- 2026-11-25 — La période (bannière) et le filtre `range` du classement partagent le même paramètre d'URL `range`. L'état « Synchro auto » est mémorisé en localStorage (`hcc-auto-sync`).
- 2026-11-25 — Variation « Dernière heure » : badge vert pâle (`party-green/15`, texte `fg` + icône verte) car le vert de fête n'atteint pas AA en texte sur fond clair.
