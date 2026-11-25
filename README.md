# HEC Color & Chill Party — Playlist collaborative

Les invités de la soirée HEC Abidjan (vendredi 27/11/2026) proposent les morceaux qu'ils veulent entendre ; le BDE suit le classement en direct.

- **Front** : React + Vite + Tailwind (light/dark) · **Back** : NestJS · **Base** : MongoDB · **Musique** : API Deezer

## Démarrer avec Claude Code

1. Ouvre ce dossier dans un terminal et lance `claude`.
2. Colle le prompt de `docs/00-KICKOFF-PROMPT.md`.
3. Renseigne `.env` (copie de `.env.example`) avec l'URL MongoDB et les identifiants admin.

## Documentation
Voir `CLAUDE.md` (règles + carte des docs) et le dossier `docs/`.
Les maquettes d'origine, captures, logo et affiche sont dans `design-references/`.

## Développement local

```bash
pnpm install
cp .env.example .env   # laisse MONGODB_URI vide : MongoDB en mémoire (données non persistées)
pnpm dev               # http://localhost:5173 (admin : /admin/login avec ADMIN_EMAIL / ADMIN_PASSWORD)
pnpm lint && pnpm typecheck && pnpm test
```

## Mise en ligne (Render + MongoDB Atlas)

1. **Atlas** : crée un cluster M0, un utilisateur, et autorise l'accès réseau (`0.0.0.0/0` ou les IP sortantes de Render).
   Copie l'URI `mongodb+srv://…/hec_color_chill`.
2. **Render** : « New → Blueprint » sur ce dépôt (`render.yaml`, offre *free*, région Frankfurt),
   puis renseigne les 4 secrets : `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `JWT_SECRET` (`openssl rand -hex 32`).
   Alternative : n'importe quel hébergeur Docker avec le `Dockerfile` (port `PORT`, health check `/api/health`).
3. Vérifie `https://<url>/api/health` → `{"status":"ok","db":"up"}`, puis connecte-toi sur `/admin/login`.
4. Déroule la checklist `docs/08-DEPLOYMENT.md §4` (vrais téléphones, extrait > 15 min, charge, `reset-data`, QR code).

**Offre Free de Render** :
- le service **s'endort après 15 min sans visite** (réveil ≈ 1 min). Le soir J, garde-le éveillé avec un ping externe
  gratuit (ex. UptimeRobot, monitor HTTP toutes les 5 min sur `https://<url>/api/health`) — ou passe en *starter* pour la soirée ;
- **pas de shell Render** : les scripts de maintenance se lancent depuis ton poste, pointés sur la base Atlas :
  `MONGODB_URI='mongodb+srv://…' pnpm --filter api reset-data -- --yes` (idem `recount`, `seed:admin`).
