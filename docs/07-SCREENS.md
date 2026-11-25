# 07 — Spécification des écrans

Chaque écran : **light + dark**, testé à **375 px** et **1280 px**. Textes exacts ci‑dessous (à placer dans `i18n/fr.ts`).
Références visuelles : `design-references/screenshots/*.png` (structure) — mais tokens et règles de `06-DESIGN-SYSTEM.md`.

## Routes
| Route | Écran | Accès |
|---|---|---|
| `/` | Accueil invité | public |
| `/admin/login` | Connexion admin | public (redirige vers `/admin` si déjà connecté) |
| `/admin` | Dashboard | admin |
| `*` | 404 « Cette page n'est pas sur la playlist. » + lien accueil | public |

`<title>` : « HEC Color & Chill Party · Playlist », « Connexion admin · Color & Chill », « Dashboard · Color & Chill ».
Meta Open Graph pour le partage WhatsApp : titre « Choisis la musique de la Color & Chill Party 🎶 », image = logo.

---

## 1. Accueil invité `/`

Ordre vertical (mobile) :

### 1.1 Header (sticky, `bg-surface/85 backdrop-blur border-b`)
Logo + « Color & Chill » · ThemeToggle.

### 1.2 Hero
- Badge live : point rouge pulsant + « VENDREDI 27 NOV. · HEC ABIDJAN » · séparateur · « Playlist ouverte » (texte rouge). Si `submissionsOpen=false` (P1) : point gris + « Propositions closes ».
- H1 (display) : « Choisis le son de la **Color** & Chill Party » (« Color » en dégradé) + 🎶.
- Sous‑titre (body‑lg, `fg-muted`) : « Cherche un morceau, écoute l'extrait et ajoute‑le à la playlist de la soirée. Plus il est ajouté, plus il a de chances de passer ! »

### 1.3 Recherche
- Input (cf. design system) — placeholder : « Un titre, un artiste… (ex. Didi B, Burna Boy, Magic System) ».
  `autoComplete="off"`, `enterKeyHint="search"`, `inputMode="search"`, `aria-controls` vers la liste de suggestions, `role="combobox"` + `aria-expanded`.
- Sous l'input, quand il est vide : ligne « Idées : » + chips cliquables qui remplissent l'input et lancent la recherche :
  `Coupé‑Décalé`, `Afrobeats`, `Amapiano`, `Rap Ivoire`, `Zouglou`, `Afro House`.
- Sous le champ en petit (`fg-subtle`) : « Tu peux ajouter jusqu'à 20 sons. » (rappel R6).

### 1.4 Panneau de suggestions (sous l'input, dans le flux — pas un dropdown flottant sur mobile)
Carte `surface` avec en‑tête « RÉSULTATS DEEZER » (label) à gauche et « {n} résultats » à droite.
Ligne de suggestion (hauteur ≥ 64) :
```
[pochette 48 + ▶ superposé au survol desktop]  Titre (title, truncate)  [E]          [▶ Extrait] [＋ Ajouter]
                                               Artiste · 3:12 (caption)  [Déjà ajouté ×5]
```
- Mobile : boutons en icône seule (▶ 40 px rond, ＋ 40 px rond rouge), libellés visibles ≥ 640 px.
- `addedByMe` → bouton remplacé par badge « Ajouté ✓ » (désactivé).
- États :
  - **Chargement** : 4 lignes skeleton.
  - **Vide** : « Aucun résultat pour « {q} ». Essaie avec l'artiste ou une autre orthographe. »
  - **Erreur 503** : icône + « La recherche est momentanément indisponible. » + bouton « Réessayer ».
  - **429** : « Doucement DJ 😅 Réessaie dans un instant. »
- Clic « Ajouter » → bouton en `loading` → succès : comportement US‑3 (vider input, masquer panneau, toast, confettis, refocus input).
  Toasts :
  - nouveau morceau : « 🎉 « {titre} » de {artiste} est dans la playlist ! »
  - déjà présent (ajouté par d'autres) : « 🔥 « {titre} » ajouté ! Tu rejoins {N} autre(s) invité(s). »
  - déjà ajouté par moi : « Tu as déjà ajouté ce son 😉 »
  - erreur : message du tableau des codes (`03-API.md §1`).

### 1.5 Playlist des invités
- En‑tête : point rouge + H2 « La playlist des invités » + compteur « ({total} titres) » ; à droite (ou dessous sur mobile) onglets segmentés : « 🔥 Les plus ajoutés » | « ✨ Récemment ajoutés ».
- Grille de **TrackCard** :
```
[pochette 56, durée en overlay]  Titre (title, truncate)          [×12]
                                  Artiste (body, fg-muted)
                                  [genre badge bleu si connu] [E]
───────────────────────────────────────────────────────────────
[▶ Extrait]                                    [+1 Moi aussi] | [Ajouté ✓]
```
- Les 3 premiers (onglet « plus ajoutés ») : petite médaille 🥇🥈🥉 en coin de pochette.
- Carte nouvellement ajoutée : anneau `ring-2 ring-brand-red` pendant 2 s + scroll doux vers elle si visible.
- En bas : « Charger plus » (secondary) tant que `hasMore` ; sinon « C'est tout pour l'instant — ajoute le prochain hit ! ».
- **Vide** : illustration simple (icône disque + confettis CSS) « La piste de danse est vide… Sois le premier à proposer un son ! » + bouton qui focalise la recherche.
- **Chargement initial** : 6 cartes skeleton.
- **Erreur** : bandeau « Impossible de charger la playlist. » + « Réessayer ».

### 1.6 Mini‑lecteur (P1, mobile)
Barre fixe en bas quand un extrait joue : pochette 40, titre/artiste tronqués, barre de progression rouge, bouton ⏸ / ✕.

### 1.7 Footer
« HEC Abidjan · BDE » — « Color & Chill Party · 27.11.2026 » — « Musique via Deezer » — « © 2026 ». Lien discret « Espace BDE » → `/admin/login`.

---

## 2. Connexion admin `/admin/login`
Basé sur `design-references/screenshots/admin-login-*.png`, avec corrections :
- Fond : light = dégradé `#0652DD → #0544B8` + halo rouge flou en bas à droite ; dark = `bg` + halos bleu/rouge.
- Header : logo HEC (sur pastille blanche en light pour rester lisible sur le bleu) + « COLOR & CHILL · ESPACE BDE » ; à droite **ThemeToggle** (absent des maquettes, obligatoire).
- Carte centrée max 420 px, `surface`, radius xl, padding 32/40.
  - Badge bleu « 🛡 ADMINISTRATION BDE » · H1 « Connexion » · « Accède au tableau de bord de la soirée. »
  - Champ « Adresse email » (icône mail, `autocomplete="username"`, `type=email`).
  - Champ « Mot de passe » (icône cadenas, bouton œil `aria-label="Afficher le mot de passe"`, `autocomplete="current-password"`).
  - Case « Se souvenir de moi ».
  - Bouton primary pleine largeur « Se connecter → » (loading pendant la requête).
  - Erreur : alerte rouge au‑dessus du bouton, `role="alert"`. 429 → « Trop de tentatives. Réessaie dans 15 minutes. »
  - Encadré « Accès restreint — réservé aux membres du BDE HEC Abidjan. »
- Lien sous la carte : « ← Retour à la playlist » → `/`.
- Validation côté client : email valide, mot de passe non vide (messages sous les champs).

---

## 3. Dashboard admin `/admin`
Basé sur `design-references/screenshots/admin-dashboard-light.png`, avec corrections.

### 3.1 Header admin
Logo + « Color & Chill · Admin » · à droite : interrupteur « Synchro auto » (icône sync qui tourne quand actif), email admin (≥ 768 px), ThemeToggle, bouton ghost « Déconnexion ».

### 3.2 Bannière
Carte `rounded-xl` dégradé `#0652DD → #E02424` (identique dans les 2 thèmes, texte blanc) :
- Badges « ● EN DIRECT » + « 📍 HEC Abidjan · 27/11/2026 ».
- H1 « Tableau de bord » + « Suivi en temps réel des sons proposés par les invités. »
- À droite : segmented control **période** « Toute la soirée » | « Dernière heure ».
- (P1) Interrupteur « Propositions ouvertes / closes ».
- Texte discret « Mis à jour il y a {x} s » (`generatedAt`).

### 3.3 KPI (grille 2 col mobile, 4 col desktop)
| Carte | Valeur | Détail |
|---|---|---|
| Morceaux uniques | `uniqueTracks` | icône disque |
| Ajouts totaux | `totalAdditions` | « Moy. {totalAdditions/uniqueTracks, 1 déc.} par titre » |
| Invités participants | `uniqueGuests` | icône personnes |
| Dernière heure | `additionsLastHour` | badge variation `+x %` vert / `−x %` rouge vs `additionsPrevHour` (masqué si prevHour = 0) |

Puis une rangée 2 cartes (1 col mobile) :
- **Artiste le plus demandé** : nom (h2) + « {count} ajouts ».
- **Genres** : barre empilée (bleu, rouge, rose, violet, gris pour « Autres ») + légende avec %.

Puis carte **« Ajouts par 15 min »** : histogramme (recharts `BarChart`, barres `--hec-blue`, dernière barre `--hec-red`, axe X heures `HH:mm`, tooltip « {count} ajouts »). Lire le skill `dataviz` si disponible pour le style.

KPI en chargement : skeleton ; en erreur : carte « — » + icône d'alerte.

### 3.4 Classement
Carte `surface` :
- Titre « Classement des morceaux » + badge « {total} titres » ; sous‑titre « Trié du plus ajouté au moins ajouté. »
- Barre d'outils : recherche (debounce 300 ms) · select **Tri** (Plus ajoutés / Moins ajoutés / Plus récents / A → Z) · select **Statut** (Tous / À jouer / Joués / Masqués) · toggle « Masquer explicites » · (P1) bouton « Exporter CSV ».
- Chips genre avec compteurs : « Tous ({n}) », puis chaque genre renvoyé par l'API.
- Lignes (desktop = tableau, mobile = cartes empilées) :
  `Rang (🥇🥈🥉 puis #n)` · pochette 48 · titre + artiste · genre · `×count` (gros, tabular) · « 1er : 21:04 · dernier : 22:31 » · ▶ extrait · actions :
  - bouton toggle « ✓ Joué » (brand quand actif) — ligne joué = opacité 60 % + titre barré léger ;
  - menu ⋯ : « Masquer de la playlist » / « Réafficher » (confirmation inline « Masquer ce morceau ? Les invités ne le verront plus. » [Annuler] [Masquer]).
- Mise à jour optimiste des actions, rollback + toast en cas d'erreur.
- Pagination : « Page x sur y » + précédent/suivant.
- Vide (aucun ajout) : « Aucun morceau pour l'instant. Partage le lien de la playlist ! » + bouton « Copier le lien » (copie l'URL publique).
- Vide (filtres) : « Aucun morceau ne correspond à ces filtres. » + « Réinitialiser les filtres ».

L'état des filtres est reflété dans l'URL (`?q=&genre=&status=&sort=&page=`) pour pouvoir rafraîchir sans tout perdre.
