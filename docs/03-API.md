# 03 — Contrat d'API REST

Préfixe global : `/api`. JSON uniquement. Dates en ISO 8601 UTC (Abidjan = UTC+0, pratique).
Tous les types ci-dessous sont à définir dans `packages/shared` et utilisés par le front **et** le back.

## 1. Conventions

**En-têtes**
- `X-Guest-Id: <uuid v4>` — envoyé par le front invité sur toutes les requêtes publiques. Obligatoire pour `POST /additions` (sinon `400 INVALID_GUEST_ID`). Validé comme UUID v4.

**Format d'erreur**
```json
{ "statusCode": 409, "code": "TRACK_HIDDEN", "message": "Ce morceau n'est pas disponible." }
```

| code | HTTP | Message FR affiché par le front |
|---|---|---|
| `VALIDATION_ERROR` | 400 | « Requête invalide. » |
| `INVALID_GUEST_ID` | 400 | « Recharge la page et réessaie. » |
| `UNAUTHORIZED` | 401 | (redirection login) |
| `INVALID_CREDENTIALS` | 401 | « Email ou mot de passe incorrect. » |
| `TRACK_NOT_FOUND` | 404 | « Morceau introuvable. » |
| `TRACK_HIDDEN` | 409 | « Ce morceau n'est pas disponible pour la soirée. » |
| `SUBMISSIONS_CLOSED` | 403 | « Les propositions sont closes, place à la fête ! » |
| `RATE_LIMITED` | 429 | « Doucement DJ 😅 Réessaie dans un instant. » |
| `DEEZER_UNAVAILABLE` | 503 | « La recherche est momentanément indisponible. » |
| `EMAIL_TAKEN` | 409 | « Un compte existe déjà avec cet email. » |
| `SUPER_ADMIN_PROTECTED` | 403 | « Action réservée au super admin. » |
| `INTERNAL_ERROR` | 500 | « Oups, une erreur est survenue. » |

## 2. Types partagés

```ts
// packages/shared/src/track.ts
export interface SearchResultDto {
  deezerId: number;
  trackKey: string;     // "isrc:FR9W11916593" ou "dz:745229932" — identité du morceau
  title: string;
  artist: string;
  album: string;
  coverSmall: string;   // 56x56
  coverMedium: string;  // 250x250
  duration: number;     // secondes
  previewUrl: string | null; // null si Deezer n'en fournit pas
  explicit: boolean;
  addCount: number;     // 0 si pas encore dans la playlist
  addedByMe: boolean;
}

export interface TrackDto {
  trackKey: string;
  deezerId: number;     // id Deezer de référence
  title: string;
  artist: string;
  album: string;
  coverSmall: string;
  coverMedium: string;
  duration: number;
  explicit: boolean;
  hasPreview: boolean;
  genre: string | null;
  addCount: number;
  addedByMe: boolean;   // false côté admin
  firstAddedAt: string;
  lastAddedAt: string;
}

export interface Paginated<T> { items: T[]; total: number; page: number; limit: number; hasMore: boolean; }

// packages/shared/src/admin.ts
export interface AdminTrackDto extends TrackDto { rank: number; played: boolean; playedAt: string | null; hidden: boolean; }
export type Range = 'all' | '1h';
export type AdminStatus = 'all' | 'toplay' | 'played' | 'hidden';
export type AdminSort = 'count_desc' | 'count_asc' | 'recent' | 'alpha';
export interface StatsDto {
  range: Range;
  uniqueTracks: number;
  totalAdditions: number;
  uniqueGuests: number;
  additionsLastHour: number;
  additionsPrevHour: number;
  topArtist: { name: string; count: number } | null;
  genres: { name: string; count: number; share: number }[]; // top 4 + "Autres", share ∈ [0,1]
  timeline: { bucketStart: string; count: number }[];      // tranches de 15 min
  generatedAt: string;
}
```

## 3. Routes publiques

### `GET /api/health`
`200 { "status": "ok", "db": "up" }`

### `GET /api/search?q=<string>&limit=<1..10, défaut 8>`
- Résultats dédoublonnés par `trackKey`, 8 max.
- `q` : 3 à 80 caractères après trim, sinon `400 VALIDATION_ERROR`.
- Exclut les morceaux masqués.
```json
200 {
  "items": [
    { "deezerId": 745229932, "trackKey": "isrc:FR9W11916593", "title": "Bâtiment", "artist": "Niska",
      "album": "Mr Sal", "coverSmall": "https://cdn-images.dzcdn.net/images/cover/f78885cc…/56x56-000000-80-0-0.jpg",
      "coverMedium": "https://cdn-images.dzcdn.net/images/cover/f78885cc…/250x250-000000-80-0-0.jpg", "duration": 211,
      "previewUrl": "https://cdnt-preview.dzcdn.net/api/1/1/c/3/e/0/c3ef….mp3?hdnea=exp=1795612481~…", "explicit": true,
      "addCount": 3, "addedByMe": false }
  ]
}
```

### `POST /api/additions`
Corps : `{ "deezerId": number }` (entier positif). En-tête `X-Guest-Id` requis.
- `201` nouvel ajout :
```json
{ "created": true, "alreadyAddedByMe": false, "othersCount": 0, "track": { /* TrackDto, addedByMe: true */ } }
```
  `created` = le morceau n'existait pas encore dans la playlist. `othersCount` = `addCount - 1`.
- `200` déjà ajouté par cet invité : `{ "created": false, "alreadyAddedByMe": true, "othersCount": N, "track": {…} }`
- Erreurs : `400`, `403 SUBMISSIONS_CLOSED` (P1), `404 TRACK_NOT_FOUND`, `409 TRACK_HIDDEN`, `429`, `503`.

### `GET /api/tracks?sort=popular|recent&page=1&limit=24`
- `popular` : `addCount` desc, puis `lastAddedAt` desc. `recent` : `firstAddedAt` desc.
- `limit` max 50. Exclut `hidden`.
- `200 Paginated<TrackDto>` (`addedByMe` calculé avec `X-Guest-Id`).

### `GET /api/tracks/:trackKey/preview?deezerId=<id optionnel>`
`deezerId` sert pour un morceau pas encore dans la playlist (retry d'une suggestion dont l'extrait a expiré).
- `200 { "previewUrl": "https://…mp3?…" }` ; `404 TRACK_NOT_FOUND` ; `{ "previewUrl": null }` si pas d'extrait.

### `GET /api/settings/public` (P1, le front doit tolérer son absence)
`200 { "submissionsOpen": true, "eventName": "HEC Color & Chill Party", "eventDate": "2026-11-27T19:00:00Z" }`

## 4. Routes admin (cookie `hcc_admin` requis, sinon `401 UNAUTHORIZED`)

### `POST /api/admin/auth/login`
Corps `{ "email": string, "password": string, "remember": boolean }` → `200 { "email": "…" }` + `Set-Cookie`. `401 INVALID_CREDENTIALS`. `429`.

### `POST /api/admin/auth/logout` → `204` (efface le cookie)
### `GET /api/admin/auth/me` → `200 { "email": "…" }` | `401`

### `GET /api/admin/stats?range=all|1h`
`200 StatsDto`. Avec `range=1h`, `uniqueTracks`/`totalAdditions`/`uniqueGuests`/`topArtist`/`genres` portent sur les ajouts de la dernière heure ; `timeline` couvre la période (pour `all` : depuis le premier ajout, max 48 tranches — au‑delà, tranches de 30 min).

### `GET /api/admin/tracks`
Paramètres (tous optionnels) :
| param | valeurs | défaut |
|---|---|---|
| `q` | texte (titre ou artiste, insensible à la casse, regex **échappée**) | — |
| `genre` | nom de genre exact | — |
| `range` | `all` `1h` (morceaux ayant ≥1 ajout dans l'heure ; compteur reste global) | `all` |
| `sort` | `count_desc` `count_asc` `recent` `alpha` | `count_desc` |
| `page`, `limit` | ≥1, 1..100 | 1, 50 |

La liste contient **tous** les morceaux, masqués compris (`hidden: true`), pour permettre de les réafficher. Les paramètres `status` / `explicit` ont été retirés (ignorés s'ils sont envoyés).
`200 Paginated<AdminTrackDto>` + champ `genres: { name: string; count: number }[]` (pour construire les chips de filtre avec compteurs).
`rank` = position dans le classement **global** par `addCount` desc (égalité → même rang), indépendant des filtres.

### `PATCH /api/admin/tracks/:trackKey`
Corps : `{ "played"?: boolean, "hidden"?: boolean }` → `200 AdminTrackDto`. `played:true` fixe `playedAt=now`.

### `GET /api/admin/tracks/export.xlsx` (P1)
Mêmes filtres que la liste, sans pagination, **morceaux masqués exclus**.
`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, feuille « Classement », en-tête figé + filtres automatiques. Colonnes :
`Rang | Titre | Artiste | Album | Genre | Ajouts | Premier ajout | Dernier ajout | Joué | Lien Deezer` (dates Excel natives, lien cliquable).

### Gestion des utilisateurs (tous les comptes sont admins)
`login` et `me` renvoient `{ id, email, isSuperAdmin }`. Le **super admin** est le compte dont l'email = `ADMIN_EMAIL`.
- `GET /api/admin/users` → `200 AdminUserDto[]` (`{ id, email, isSuperAdmin, isMe, createdAt, lastLoginAt }`, super admin en tête).
- `POST /api/admin/users` `{ email, password }` (mot de passe ≥ 8) → `201 AdminUserDto` ; `409 EMAIL_TAKEN`.
- `PATCH /api/admin/users/:id` `{ email?, password? }` → `200 AdminUserDto`. Un changement de mot de passe déconnecte les sessions du compte ;
  si c'est le sien, un nouveau cookie est émis (la session courante reste ouverte).
- `DELETE /api/admin/users/:id` → `204` (supprimer son propre compte efface aussi le cookie).
- Super admin : email non modifiable, mot de passe modifiable **par lui seul**, **non supprimable** → `403 SUPER_ADMIN_PROTECTED`. Id inconnu → `404 NOT_FOUND`.

### `PATCH /api/admin/settings` (P1)
Corps `{ "submissionsOpen": boolean }` → `200 { "submissionsOpen": boolean }`.
