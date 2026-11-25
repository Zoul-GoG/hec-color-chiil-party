# 08 — Configuration, déploiement & jour J

## 1. Configuration : 4 variables, c'est tout

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.xxxx.mongodb.net/hec_color_chill
ADMIN_EMAIL=bde@hec.ci
ADMIN_PASSWORD=un-mot-de-passe-long
JWT_SECRET=une-longue-chaine-aleatoire
```

Tout le reste est **en dur dans le code** (`apps/api/src/config/constants.ts`, `apps/web/src/config.ts`) avec des valeurs par défaut :
`PORT` (lu si l'hébergeur le fournit, sinon 3000), nom/date de l'événement, debounce 1000 ms, polling 15 s, réglages Deezer (`05-DEEZER.md §5`).
- Sel de hash des IP = dérivé de `JWT_SECRET`.
- URL publique (bouton « Copier le lien », Open Graph) = `window.location.origin` côté front.
- `NODE_ENV=production` est en général posé par l'hébergeur ; sinon cookie `Secure` activé dès que la requête arrive en HTTPS (`req.secure`).

Validation zod au démarrage : l'API refuse de démarrer si une des 4 variables manque, avec un message clair.
En local sans `MONGODB_URI` : démarrer sur `mongodb-memory-server` avec un avertissement (pratique pour développer).

## 2. Build & exécution
- `pnpm build` : `shared` → `web` (`vite build`) → `api` (`nest build`). `pnpm start` sert l'API sous `/api` et le front en statique (fallback `index.html`).
- Assets Vite hashés : `Cache-Control: max-age=31536000, immutable` ; `index.html` : `no-cache`. Compression gzip activée.

## 3. Hébergement
- **API + front** : Render ou Railway, un seul service Node, région Europe, **offre qui ne s'endort pas**.
  Build `corepack enable && pnpm install --frozen-lockfile && pnpm build` · Start `pnpm start` · Health check `/api/health`.
- **MongoDB Atlas** M0 suffit ; autoriser l'accès réseau depuis l'hébergeur.

## 4. Checklist jeudi 26/11
- [ ] Les 4 variables renseignées, connexion admin testée.
- [ ] `/api/health` → `db: up`.
- [ ] Parcours complet sur un vrai Android + iPhone, en 4G, light + dark (iOS : `audio.play()` appelé directement dans le gestionnaire de clic).
- [ ] Laisser un extrait > 15 min dans la playlist, puis cliquer ▶ : il doit se relancer (rafraîchissement via `/preview`).
- [ ] Charge : `npx autocannon -c 100 -d 30 https://…/api/tracks?sort=popular` (p95 < 500 ms) ; 20 recherches différentes en parallèle → aucun déclenchement du disjoncteur dans les logs.
- [ ] `pnpm --filter api reset-data --yes` pour vider les données de test.
- [ ] QR code vers l'URL (`npx qrcode -o qr.png https://…`) pour l'affiche ; lien partagé sur le WhatsApp de la promo.

## 5. Le soir J
- Dashboard ouvert avec « Synchro auto » chez le DJ.
- Si Deezer sature : la liste reste utilisable, la recherche revient seule.
- Morceau inapproprié : « Masquer » depuis le dashboard.
