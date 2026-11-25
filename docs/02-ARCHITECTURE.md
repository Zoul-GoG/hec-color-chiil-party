# 02 — Architecture

## 1. Vue d'ensemble

```
 Téléphone invité / Laptop admin
            │  HTTPS (même origine)
            ▼
 ┌────────────────────────────────────────────┐
 │  NestJS (1 service)                        │
 │   ├─ /api/*      → contrôleurs REST        │
 │   └─ /*          → build React (statique,  │
 │                    fallback index.html)    │
 │                                            │
 │   DeezerModule ── cache LRU + limiteur ────┼──► https://api.deezer.com
 │   TracksModule / AdditionsModule           │
 │   AdminModule (auth JWT cookie, stats)     │
 └──────────────┬─────────────────────────────┘
                ▼
           MongoDB Atlas
```

Pourquoi un seul service : pas de CORS, cookie httpOnly trivial, un seul déploiement à surveiller le soir J.

## 2. Arborescence cible

```
.
├── CLAUDE.md
├── package.json              # scripts racine (dev, build, test, lint, typecheck)
├── pnpm-workspace.yaml
├── .env.example
├── docs/ … design-references/ …
├── packages/
│   └── shared/
│       └── src/
│           ├── index.ts
│           ├── track.ts      # TrackDto, SearchResultDto
│           ├── admin.ts      # StatsDto, AdminTrackDto, filtres
│           └── errors.ts     # ErrorCode enum
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── main.ts               # helmet, cookie-parser, prefix /api, trust proxy, static
│   │       ├── app.module.ts
│   │       ├── config/env.ts         # schéma zod des variables d'env
│   │       ├── common/               # filtre d'exceptions, guards, décorateur @GuestId, utils (escapeRegex, hashIp)
│   │       ├── deezer/               # DeezerService (search, getTrack, getAlbumGenre), mapping, cache, limiter
│   │       ├── tracks/               # schéma Track, TracksService, PublicTracksController (/tracks, /search, /preview)
│   │       ├── additions/            # schéma Addition, AdditionsService (ajout atomique)
│   │       ├── settings/             # schéma Settings (submissionsOpen) — P1
│   │       ├── admin/
│   │       │   ├── auth/             # login/logout/me, JwtCookieGuard, schéma Admin, seed
│   │       │   ├── stats/            # agrégations KPI
│   │       │   └── tracks/           # liste filtrée, PATCH played/hidden, export CSV
│   │       └── health/
│   │   └── test/                     # e2e supertest + fixtures Deezer
│   └── web/
│       ├── index.html
│       ├── public/hec-abidjan-logo.png
│       └── src/
│           ├── main.tsx, App.tsx (routes)
│           ├── styles/tokens.css     # tokens light/dark (copie de docs/06 §3)
│           ├── i18n/fr.ts
│           ├── lib/                  # api client (fetch + guestId header), guestId, format (durée, dates), theme
│           ├── hooks/                # useDebouncedValue, useSearch, useTracks, useAddTrack, useAudioPreview, useTheme
│           ├── components/           # ui/ (Button, Badge, Chip, Card, Skeleton, Toggle, ThemeToggle…), Header, Footer, TrackCover, PreviewButton
│           ├── features/
│           │   ├── guest/            # GuestPage, SearchBox, SuggestionList, PlaylistGrid, TrackCard
│           │   └── admin/            # LoginPage, DashboardPage, KpiCards, AdditionsChart, GenreBar, TracksTable, Filters, RequireAdmin
│           └── test/
```

## 3. Flux clés

### 3.1 Recherche
1. `SearchBox` : valeur → `useDebouncedValue(600 ms)` → si `q.trim().length >= 3` → `GET /api/search?q=…` avec `X-Guest-Id`, annulable.
2. Back : normalise `q` (trim, minuscules, espaces multiples → 1) → cache LRU (TTL 5 min) → sinon Deezer `/search?q=…&limit=15` via le limiteur → dédoublonnage par `trackKey` → 8 premiers.
3. Back enrichit chaque résultat avec `addCount` et `addedByMe` (1 requête `tracks.find({trackKey: {$in}})` + 1 `additions.find({guestId, trackKey: {$in}})`), filtre les morceaux masqués.

### 3.2 Ajout (atomique, sans transaction)
1. Front : `POST /api/additions { deezerId }` + `X-Guest-Id`.
2. Back :
   1. vérifie `submissionsOpen` (P1) et que le morceau n'est pas masqué ;
   2. récupère les métadonnées **chez Deezer** (`getTrack(deezerId)`, cache 5 min) → calcule `trackKey` → 404 `TRACK_NOT_FOUND` sinon ;
   3. **insère l'`Addition`** `{trackKey, deezerId, guestId}` → si erreur de clé dupliquée `E11000` → répond `200 { alreadyAddedByMe: true, track }` ;
   4. sinon `tracks.findOneAndUpdate({trackKey}, {$inc:{addCount:1}, $set:{lastAddedAt:now, previewUrl, previewExpiresAt}, $addToSet:{deezerIds:deezerId}, $setOnInsert:{deezerId, firstAddedAt:now, …}}, {upsert:true, new:true})` (cf. `04 §5`) ;
   5. si l'étape 4 échoue → supprimer l'Addition (compensation) et renvoyer 500 ;
   6. si le morceau vient d'être créé et n'a pas de genre → **en tâche de fond** (sans `await`) `getAlbumGenre(albumId)` puis `$set genre`.
3. Réponse `201 { track, created, alreadyAddedByMe:false, othersCount: addCount-1 }`.
4. Front : stop audio, vide input + suggestions, toast, confettis, `invalidateQueries(['tracks'])`.

### 3.3 Extrait audio
- Lecture directe de l'URL MP3 Deezer (`dzcdn.net`) par un **unique** `HTMLAudioElement` partagé (hook `useAudioPreview`, contexte global).
- Les URLs d'extrait **expirent** (paramètre `hdnea=exp=<timestamp>`). Pour les morceaux de la playlist/du dashboard, le front appelle
  `GET /api/tracks/:trackKey/preview` juste avant de jouer ; le back renvoie l'URL en base si encore valide > 60 s, sinon la rafraîchit via Deezer. **Les extraits expirent en ≈ 15 min** (`05-DEEZER.md §7`).
- Pour les suggestions de recherche, l'URL fraîche de la recherche est utilisée directement.
- En cas d'erreur de lecture (`audio.onerror`) : un seul retry via `/preview`, puis toast « Extrait indisponible ».

### 3.4 Rafraîchissement
- Polling TanStack Query `refetchInterval: 15000` (page invité et dashboard), suspendu quand l'onglet est caché (`refetchIntervalInBackground: false`).
  Choix volontairement simple (pas de WebSocket) : robuste derrière n'importe quel hébergeur.

### 3.5 Authentification admin
- `POST /api/admin/auth/login` → compare bcrypt → JWT `{ sub, email }` signé `JWT_SECRET` → cookie `hcc_admin` (`httpOnly`, `SameSite=Lax`, `Secure` en prod, `path=/api`).
- `JwtCookieGuard` sur toutes les routes `/api/admin/*` sauf `login`.
- Front : `RequireAdmin` appelle `GET /api/admin/auth/me` ; 401 → `navigate('/admin/login')`.
- Compte admin : créé/mis à jour au démarrage (et via `pnpm --filter api seed:admin`) à partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD` (hash bcrypt, coût 12).

## 4. Décisions (ADR courts)

| # | Décision | Raison |
|---|---|---|
| D1 | Deezer appelé côté back uniquement | L'API Deezer n'envoie pas d'en-têtes CORS ; quotas à protéger par un cache commun |
| D2 | Debounce 600 ms, min 3 caractères | Compromis réactivité / prudence vis‑à‑vis de Deezer (limites inconnues). Constante `SEARCH_DEBOUNCE_MS` dans `apps/web/src/config.ts` |
| D3 | Pas de bouton « ajout en texte libre » (présent dans la maquette) | Sans morceau Deezer (ISRC), impossible de dédoublonner et de compter |
| D8 | Identité = `trackKey` (ISRC) | La réponse réelle de `/search` contient le même titre sous plusieurs ids |
| D9 | 4 variables d'env seulement | Mise en ligne rapide ; le reste en constantes |
| D4 | Compteur dénormalisé `tracks.addCount` + collection `additions` | Lecture de liste O(1) + unicité garantie par index ; recalcul possible (`recount`) |
| D5 | Genre récupéré via `/album/{id}` en tâche de fond | `/search` ne renvoie pas de genre ; 1 appel par **nouveau** morceau seulement |
| D6 | Polling 15 s plutôt que SSE/WebSocket | Simplicité et fiabilité pour une soirée |
| D7 | Front servi par Nest | Même origine, un déploiement |

## 5. Gestion d'erreurs
- `AllExceptionsFilter` global → `{ statusCode, code, message }`. `code` ∈ `ErrorCode` (`packages/shared/src/errors.ts`).
- Les erreurs Deezer (timeout 5 s, quota, 5xx) → `503 DEEZER_UNAVAILABLE`. Jamais de stack trace renvoyée.
- Logs : `Logger` Nest, une ligne par appel Deezer en debug, erreurs en `error`.

## 6. Rate limiting (`@nestjs/throttler`, stockage mémoire)
| Route | Clé | Limite |
|---|---|---|
| `GET /api/search` | guestId (sinon IP) | 40 / min |
| `POST /api/additions` | IP | 300 / 10 min (IP partagée du campus !) |
| `POST /api/admin/auth/login` | IP | 5 / 15 min |
| Global | IP | 600 / min |

`app.set('trust proxy', 1)` pour obtenir la vraie IP derrière l'hébergeur. L'IP n'est jamais stockée en clair (`sha256(ip + JWT_SECRET)`).
