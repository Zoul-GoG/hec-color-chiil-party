# CLAUDE.md — HEC Color & Chill Party · Playlist collaborative

> Fichier lu automatiquement par Claude Code. Il résume le projet et les règles.
> Les spécifications détaillées sont dans `docs/` : **lis le document concerné avant de coder une fonctionnalité.**

## 1. Le projet en 30 secondes

Application web pour la soirée **« HEC Color & Chill Party »** de HEC Abidjan (**vendredi 27 novembre 2026**, campus HEC Abidjan).
Les invités scannent un QR code, cherchent un morceau (API Deezer), écoutent l'extrait de 30 s, puis l'ajoutent à la playlist commune.
Quand plusieurs invités ajoutent le même morceau, un **compteur** s'incrémente. Le BDE (admin) dispose d'un **dashboard** (KPI + classement filtrable)
protégé par une **page de connexion** (email + mot de passe).

**Échéance dure : en production jeudi 26/11 au soir.** Priorité absolue aux items `P0` de `docs/09-IMPLEMENTATION-PLAN.md`.
Ne pas commencer un `P1` tant qu'un `P0` est incomplet.

## 2. Stack (non négociable)

| Couche | Choix |
|---|---|
| Monorepo | pnpm workspaces : `apps/api`, `apps/web`, `packages/shared` |
| Front | React 18 + Vite + TypeScript strict, Tailwind CSS v4, React Router, TanStack Query, `sonner` (toasts), `canvas-confetti`, `lucide-react` (icônes) |
| Back | NestJS 11 + TypeScript strict, Mongoose (`@nestjs/mongoose`), `@nestjs/config` (+ validation zod des 4 variables d'env), `@nestjs/throttler`, `@nestjs/jwt`, `bcryptjs`, `cookie-parser`, `helmet`, `lru-cache`, `bottleneck` |
| Base | MongoDB (Atlas) via `MONGODB_URI` |
| Musique | API publique Deezer (sans clé) — **appelée uniquement par le backend** |
| Déploiement | **un seul service** : NestJS sert l'API sous `/api` et le build React en statique (même origine → cookie httpOnly simple) |
| Tests | API : Jest + supertest + `mongodb-memory-server` · Web : Vitest + Testing Library · (P1) Playwright smoke |

## 3. Carte de la documentation

| Fichier | Quand le lire |
|---|---|
| `docs/01-PRD.md` | Toujours en premier : périmètre, user stories, critères d'acceptation |
| `docs/02-ARCHITECTURE.md` | Avant de créer des modules / dossiers ; flux et décisions techniques |
| `docs/03-API.md` | Contrat REST exact (routes, DTO, codes d'erreur) — front et back doivent s'y conformer |
| `docs/04-DATA-MODEL.md` | Schémas Mongoose, index, logique atomique d'ajout |
| `docs/05-DEEZER.md` | Intégration Deezer : format des réponses, quotas, cache, expiration des extraits |
| `docs/06-DESIGN-SYSTEM.md` | Tokens couleurs light/dark, typo, composants. **Source de vérité visuelle** |
| `docs/07-SCREENS.md` | Spécification écran par écran (états vides, chargement, erreur, mobile) |
| `docs/08-DEPLOYMENT.md` | Variables d'environnement, build, déploiement, checklist jour J |
| `docs/09-IMPLEMENTATION-PLAN.md` | Plan par phases avec cases à cocher. **Mets-le à jour au fur et à mesure** |
| `design-references/` | Maquettes HTML d'origine + captures + logo + affiche. **Inspiration seulement** : en cas de conflit, `docs/06` et `docs/07` gagnent |

## 4. Commandes

```bash
pnpm install
pnpm dev            # api (http://localhost:3000) + web (http://localhost:5173, proxy /api -> 3000)
pnpm build          # build shared, web puis api (le build web est copié/servi par l'api)
pnpm start          # node apps/api/dist/main.js (prod, sert aussi le front)
pnpm test           # tous les tests
pnpm lint && pnpm typecheck
pnpm --filter api seed:admin   # crée/maj l'admin depuis ADMIN_EMAIL / ADMIN_PASSWORD
```

## 5. Règles de code

- **Langue** : code, noms de variables, commits en anglais. **Tous les textes UI en français** (tutoiement, ton festif).
  Centraliser les chaînes UI dans `apps/web/src/i18n/fr.ts`.
- TypeScript `strict: true`, pas de `any` non justifié. Les types d'échange API vivent dans `packages/shared` et sont importés des deux côtés.
- Le **front n'appelle jamais `api.deezer.com`** (pas de CORS + quotas) : toujours via `/api/...`.
- Le back **ne fait jamais confiance aux métadonnées envoyées par le client** : à l'ajout, le client n'envoie que `deezerId`, le back refetch le morceau chez Deezer.
- Un morceau est identifié par son **`trackKey`** (ISRC, sinon id Deezer) : Deezer publie le même titre sous plusieurs ids (`docs/05-DEEZER.md §3`).
- **Configuration minimale** : seulement 4 variables d'env (`MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET`). Tout autre réglage est une constante dans le code avec une valeur par défaut. N'ajoute pas de variable d'env.
- **Ménager Deezer** (limites inconnues) : respecter strictement `docs/05-DEEZER.md §5` (debounce 1 s, cache, limiteur, disjoncteur).
- Couleurs : **uniquement via les tokens** (`bg-surface`, `text-fg`, `bg-brand-red`…). Aucun hex en dur dans les composants.
  Chaque écran doit être vérifié en **light ET dark**.
- **Mobile-first** : 90 % des invités seront sur téléphone. Concevoir pour 360 px de large, puis élargir.
- Pas de données inventées dans l'UI (pas de « 94 % Party Match », « Boost », « Tendance » : ces éléments des maquettes sont **supprimés**).
- Accessibilité : boutons icône avec `aria-label`, focus visible, toasts dans une région `aria-live`, respect de `prefers-reduced-motion`.
- Erreurs API : format unique `{ statusCode, code, message }` (voir `docs/03-API.md §1`). Le front mappe `code` → message FR.
- Pas de secret dans le code ; tout passe par `.env` (voir `.env.example`). Ne jamais committer `.env`.

## 6. Définition de « terminé » (pour chaque tâche)

1. Conforme au contrat `docs/03-API.md` et aux écrans `docs/07-SCREENS.md`.
2. `pnpm lint`, `pnpm typecheck`, `pnpm test` passent.
3. Vérifié visuellement en light + dark, à 375 px et 1280 px.
4. États **chargement / vide / erreur** gérés.
5. Case cochée dans `docs/09-IMPLEMENTATION-PLAN.md` (+ note courte si écart à la spec).

## 7. Si quelque chose est ambigu

Choisis l'option la plus simple qui respecte le PRD, note-la dans la section « Décisions prises » en bas de
`docs/09-IMPLEMENTATION-PLAN.md`, et continue. Ne bloque pas.
