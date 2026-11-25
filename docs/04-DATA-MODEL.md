# 04 — Modèle de données (MongoDB / Mongoose)

Base : celle indiquée dans `MONGODB_URI` (défaut `hec_color_chill` si l'URI n'en précise pas). Toutes les collections ont `timestamps: true`.

> **Identité d'un morceau = `trackKey`** (`isrc:<ISRC>` sinon `dz:<deezerId>`), car Deezer publie le même titre sous plusieurs ids (cf. `05-DEEZER.md §3`).

## 1. `tracks` — un document par morceau de la playlist

| Champ | Type | Notes |
|---|---|---|
| `trackKey` | String | **unique** |
| `isrc` | String \| null | |
| `deezerId` | Number | id Deezer de référence (premier ajouté) — sert à rafraîchir l'extrait |
| `deezerIds` | Number[] | tous les ids Deezer vus pour ce morceau (`$addToSet`) |
| `title` | String | |
| `artistName` | String | |
| `albumTitle` | String | |
| `albumId` | Number | pour le genre |
| `coverSmall` / `coverMedium` | String | |
| `duration` | Number | secondes |
| `explicit` | Boolean | |
| `deezerLink` | String | |
| `previewUrl` | String \| null | expire ≈ 15 min |
| `previewExpiresAt` | Date \| null | |
| `genre` | String \| null | rempli en tâche de fond |
| `addCount` | Number | défaut 0 |
| `firstAddedAt` / `lastAddedAt` | Date | |
| `hidden` | Boolean | défaut false |
| `played` | Boolean | défaut false |
| `playedAt` | Date \| null | |

Index :
```ts
TrackSchema.index({ trackKey: 1 }, { unique: true });
TrackSchema.index({ deezerIds: 1 });
TrackSchema.index({ hidden: 1, addCount: -1, lastAddedAt: -1 }); // liste "popular"
TrackSchema.index({ hidden: 1, firstAddedAt: -1 });               // liste "recent"
TrackSchema.index({ genre: 1 });
```

## 2. `additions` — un document par (invité, morceau)

| Champ | Type | Notes |
|---|---|---|
| `trackKey` | String | |
| `deezerId` | Number | id réellement cliqué (info) |
| `guestId` | String | UUID v4 |
| `ipHash` | String | `sha256(ip + JWT_SECRET)` hex, 16 premiers caractères |
| `createdAt` | Date | |

Index :
```ts
AdditionSchema.index({ trackKey: 1, guestId: 1 }, { unique: true }); // R2 : 1 invité = 1 compte par morceau
AdditionSchema.index({ createdAt: -1 });
AdditionSchema.index({ guestId: 1 });
```

## 3. `admins`
`email` (unique, minuscules), `passwordHash` (bcryptjs, coût 12), `lastLoginAt`.
Seed au démarrage depuis `ADMIN_EMAIL` / `ADMIN_PASSWORD` (upsert ; le hash n'est réécrit que si le mot de passe a changé).

## 4. `settings` (P1) — document unique `_id: "global"` : `{ submissionsOpen: true }`

## 5. Requêtes de référence

**Ajout** (cf. `02-ARCHITECTURE.md §3.2`) :
```ts
const t = await deezer.getTrack(deezerId);             // donne trackKey
try { await additionModel.create({ trackKey: t.trackKey, deezerId, guestId, ipHash }); }
catch (e) { if (e?.code === 11000) return { alreadyAddedByMe: true, … }; throw e; }
await trackModel.findOneAndUpdate(
  { trackKey: t.trackKey },
  { $inc: { addCount: 1 }, $set: { lastAddedAt: now, previewUrl: t.previewUrl, previewExpiresAt: t.previewExpiresAt },
    $addToSet: { deezerIds: deezerId },
    $setOnInsert: { deezerId, isrc: t.isrc, title: t.title, artistName: t.artist, …, firstAddedAt: now } },
  { upsert: true, new: true });
```

**Stats** (`range=all`) :
- `uniqueTracks` = `tracks.countDocuments({ hidden:false })` ; `totalAdditions` = `additions.estimatedDocumentCount()` ;
- `uniqueGuests` = `additions.distinct('guestId').length` ;
- `additionsLastHour/PrevHour` = `countDocuments` sur `createdAt` ;
- `topArtist` / `genres` = `$group` sur `tracks` (`$sum: '$addCount'`, `hidden:false`) ;
- `timeline` = `$dateTrunc { unit:'minute', binSize:15 }` sur `additions.createdAt`, tranches vides complétées à 0.
- `range=1h` : `$match` `additions.createdAt >= now-1h` + `$lookup` sur `tracks` via `trackKey`.

**Recherche admin** : `new RegExp(escapeRegex(q), 'i')` sur `title` / `artistName`.
**Rang global** : tri `addCount` desc de tous les non masqués, rang dense, calculé en mémoire.

## 6. Scripts
- `pnpm --filter api recount` : recalcule `addCount` depuis `additions` (`$group` par `trackKey`).
- `pnpm --filter api reset-data --yes` : vide `additions` et `tracks`.
