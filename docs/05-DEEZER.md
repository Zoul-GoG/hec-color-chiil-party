# 05 — Intégration API Deezer

API publique, **sans clé**, base `https://api.deezer.com`. Appelée **uniquement par le backend** (`DeezerModule`).

**Fixture réelle fournie** : `apps/api/test/fixtures/deezer-search-bahi.json` = réponse exacte de
`GET https://api.deezer.com/search?q=bahi` (25 résultats, `total: 299`). Tous les tests de mapping s'appuient dessus.
Phase 0 : enregistrer en plus une réponse `/track/{id}` et `/album/{id}` (`deezer-track.json`, `deezer-album.json`).

## 1. Endpoints utilisés

| Usage | Requête |
|---|---|
| Recherche | `GET /search?q=<query>&limit=15` (sans `limit`, Deezer renvoie 25 résultats) |
| Détails d'un morceau (ajout, extrait frais) | `GET /track/{id}` |
| Genre (basse priorité) | `GET /album/{albumId}` → `genres.data[0].name` |

## 2. Forme réelle d'un résultat `/search` (`data[i]`) — extrait de la fixture

```json
{
  "id": 745229932,
  "readable": true,
  "title": "Bâtiment",
  "title_short": "Bâtiment",
  "title_version": "",
  "isrc": "FR9W11916593",
  "link": "https://www.deezer.com/track/745229932",
  "duration": 211,
  "rank": 840508,
  "explicit_lyrics": true,
  "explicit_content_lyrics": 1,
  "explicit_content_cover": 0,
  "preview": "https://cdnt-preview.dzcdn.net/api/1/1/c/3/e/0/c3ef….mp3?hdnea=exp=1795612481~acl=/api/1/1/c/3/e/0/c3ef….mp3*~data=user_id=0,application_id=42~hmac=…",
  "md5_image": "f78885cc63005717be736c0d9750c623",
  "artist": { "id": 5288900, "name": "Niska", "picture_small": "https://cdn-images.dzcdn.net/images/artist/…/56x56-000000-80-0-0.jpg", "…": "…" },
  "album": {
    "id": 109726692, "title": "Mr Sal",
    "cover_small":  "https://cdn-images.dzcdn.net/images/cover/f78885cc…/56x56-000000-80-0-0.jpg",
    "cover_medium": "https://cdn-images.dzcdn.net/images/cover/f78885cc…/250x250-000000-80-0-0.jpg",
    "cover_big":    "https://cdn-images.dzcdn.net/images/cover/f78885cc…/500x500-000000-80-0-0.jpg",
    "md5_image": "f78885cc…", "type": "album"
  },
  "type": "track"
}
```
Top niveau : `{ "data": [...], "total": 299, "next": "https://api.deezer.com/search?q=bahi&index=25" }`.

## 3. Constats tirés de la réponse réelle (à respecter)

1. **Doublons** : le même morceau existe sous plusieurs `id` (single + album, rééditions). Dans la fixture,
   `isrc` `AUQ9D2631393` (BAHI ×2), `FR9W11916593` (Bâtiment ×2), `QTAF22642373` (Bahia ×2).
   → **Clé d'identité d'un morceau = `trackKey`** :
   ```ts
   trackKey = isrc ? `isrc:${isrc.toUpperCase()}` : `dz:${id}`
   ```
   → Dans les résultats de recherche, **dédoublonner par `trackKey`** en gardant celui au `rank` le plus élevé
   (ordre d'origine de Deezer conservé par ailleurs). Test : la fixture `bahi` donne **22** résultats uniques.
   → Le compteur de la playlist se fait par `trackKey` : ajouter « Bâtiment » via l'id 745229932 ou 1014597302 incrémente le **même** morceau.
2. **Expiration courte des extraits** : `hdnea=exp=1795612481` = 25/11/2026 13:14:41 UTC pour un appel vers 13:00 → **validité ≈ 15 min**.
   Tous les résultats d'une même réponse partagent la même expiration.
3. **Images artiste parfois vides** (`…/images/artist//56x56-…`) → n'utiliser que les pochettes d'album ; prévoir un visuel de remplacement (`onError` → dégradé + icône note).
4. `explicit_lyrics` (booléen) suffit pour le badge « E ». Ignorer `explicit_content_*`.
5. Beaucoup de bruit (homonymes « Bahia ») : c'est l'ordre de pertinence de Deezer, on le garde. On affiche **8** résultats après dédoublonnage (on en demande 15 pour compenser).
6. Ignorer les éléments `readable === false` ou `type !== 'track'`.

## 4. Mapping → `SearchResultDto`
`deezerId=id`, `trackKey` (cf. ci‑dessus), `title=title`, `artist=artist.name`, `album=album.title`,
`coverSmall=album.cover_small`, `coverMedium=album.cover_medium`, `duration`, `previewUrl = preview || null`, `explicit = explicit_lyrics`.

## 5. Ménager Deezer (limites inconnues → on est prudent)

On ne connaît pas les limites exactes (la doc historique parle de 50 requêtes / 5 s par IP). Tous les invités passent par **notre** serveur = une seule IP. Défenses, toutes **en dur dans le code** (pas de config) :

| Défense | Valeur |
|---|---|
| Debounce côté front | **1000 ms**, recherche à partir de **3 caractères** |
| Cache front (TanStack Query) | `staleTime` 5 min par requête |
| Cache back des recherches (`lru-cache`) | clé = `q` normalisée (trim, minuscules, sans accents, espaces simples) ; `max 2000`, **`ttl 5 min`** (les extraits restent valides ≥ 10 min) |
| Dédoublonnage des requêtes en vol | `Map<key, Promise>` : 30 invités qui tapent « didi b » = 1 appel |
| Limiteur `bottleneck` global | `reservoir 20` rechargé toutes les **5 s**, `maxConcurrent 5` (≈ moitié de la limite supposée) |
| File d'attente bornée | si > 30 requêtes en attente → `503 DEEZER_UNAVAILABLE` immédiat (pas de blocage) |
| Priorités | recherche & ajout = haute ; `/album` (genre) = basse, abandonnée si la file > 10 |
| Disjoncteur | sur `error.code === 4` (quota) : **pause de tous les appels 10 s**, puis reprise ; pendant la pause, le cache sert ce qu'il a, sinon 503 |
| Timeout | 5 s par appel (`AbortSignal.timeout(5000)`) |

Log `warn` à chaque déclenchement du disjoncteur pour savoir, après coup, si on a frôlé la limite.

## 6. Erreurs Deezer
Deezer répond souvent **HTTP 200** avec `{ "error": { "type": "...", "message": "...", "code": N } }` → toujours tester `body.error` avant `data`.
- `code 4` (quota) → disjoncteur (§5) → `503 DEEZER_UNAVAILABLE`.
- `code 800` / « no data » sur `/track/{id}` → `404 TRACK_NOT_FOUND`.
- Timeout, 5xx, JSON invalide → `503 DEEZER_UNAVAILABLE`.

## 7. Extraits audio (expiration ≈ 15 min)
- `parsePreviewExpiry(url): Date | null` → regex `/exp=(\d+)/`, secondes Unix.
- Stocker `previewUrl` + `previewExpiresAt` à chaque fois qu'on reçoit une réponse Deezer pour un morceau.
- `GET /api/tracks/:trackKey/preview` : si `previewExpiresAt > now + 60 s` → renvoyer l'URL stockée ; sinon `getTrack(deezerId, { fresh: true })` (bypass cache), mettre à jour, renvoyer.
- Cache `/track/{id}` côté back : `ttl 5 min` (jamais plus, à cause de l'expiration).
- Front : les suggestions jouent directement leur `previewUrl` ; si `audio.onerror` (URL expirée parce que l'invité a attendu) → 1 retry via `/api/tracks/:trackKey/preview?deezerId=…`, sinon toast « Extrait indisponible ».
- La playlist et le dashboard passent **toujours** par `/preview` au moment du clic.

## 8. Interface du service
```ts
class DeezerService {
  search(q: string): Promise<DeezerTrack[]>;                              // dédoublonné, ≤ 8, cache + limiteur
  getTrack(id: number, opts?: { fresh?: boolean }): Promise<DeezerTrack>; // 404 → TrackNotFoundError
  getAlbumGenre(albumId: number): Promise<string | null>;                 // basse priorité, cache 24 h
}
```
`DeezerTrack` = type interne normalisé incluant `trackKey`, `isrc`, `previewExpiresAt`.

Tests unitaires obligatoires (avec la fixture `bahi`) : 22 résultats uniques ; pour `FR9W11916593` on garde l'id **745229932** (rank 840508 > 468077) ;
`parsePreviewExpiry` → `2026-11-25T13:14:41Z` ; quota code 4 → disjoncteur ouvert ; 2 recherches identiques simultanées → 1 seul `fetch`.

## 9. Genres
Les genres Deezer sont génériques (« Rap/Hip Hop », « Musique africaine », « Dance »…), pas « Coupé‑Décalé ». Affichés tels quels ; `null` → « Autres ».
