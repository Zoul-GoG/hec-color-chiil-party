# 01 — PRD : HEC Color & Chill Party · Playlist collaborative

## 1. Contexte

- **Événement** : HEC Color & Chill Party — « Bring your bottle », chacun s'habille d'une couleur. Vendredi **27 novembre 2026**, HEC Abidjan.
- **Organisateur** : BDE HEC Abidjan.
- **Besoin** : laisser les invités proposer la musique avant et pendant la soirée, et donner au BDE/DJ une vue claire de ce que la foule veut entendre.
- **Accès invité** : via un lien / QR code affiché sur place et partagé sur les réseaux. **Aucun compte requis.**

## 2. Objectifs & mesures de succès

| Objectif | Indicateur |
|---|---|
| Ajouter un son en moins de 20 s depuis l'ouverture | Parcours : taper → écouter → ajouter, sans écran intermédiaire |
| Zéro doublon dans la liste | 1 morceau Deezer = 1 ligne, avec compteur |
| DJ capable de lire la tendance d'un coup d'œil | Classement trié par nombre d'ajouts + KPI |
| Tenir la charge d'une soirée | 300 invités simultanés, recherche < 1,5 s (p95) |

## 3. Personas

- **Invité** (étudiant, 18–30 ans, sur téléphone, souvent en 4G ou Wi‑Fi saturé, lumière faible → dark mode apprécié).
- **Admin BDE / DJ** (sur laptop ou tablette, veut trier, filtrer, écouter, exporter, marquer « joué »).

## 4. Périmètre

### P0 — indispensable pour vendredi

**Invité — page d'accueil `/`**
- **US-1 Recherche** : je tape un titre/artiste ; après une courte pause de frappe (debounce **600 ms**), les résultats Deezer s'affichent **sous l'input**.
  - Requête lancée à partir de **3 caractères**. `Entrée` lance la recherche immédiatement.
  - Une recherche en cours est **annulée** si je retape (AbortController).
  - Jusqu'à **8 suggestions** : pochette, titre, artiste, durée, badge « E » si explicite.
  - Si le morceau est déjà dans la playlist : badge « Déjà ajouté ×N » ; si c'est moi qui l'ai ajouté : « Ajouté ✓ » (bouton désactivé).
- **US-2 Extrait** : chaque suggestion a un bouton ▶ qui joue l'extrait de 30 s. Un seul extrait joue à la fois. Le bouton affiche la progression et passe en ⏸.
  Si Deezer ne fournit pas d'extrait, le bouton est désactivé avec l'info-bulle « Extrait indisponible ».
- **US-3 Ajout** : je clique « Ajouter ». Alors :
  1. l'extrait en cours s'arrête ;
  2. **l'input est vidé et les suggestions disparaissent** ; le focus revient dans l'input ;
  3. un **toast** confirme : « 🎉 « *Titre* » de *Artiste* a été ajouté à la playlist ! » (et si d'autres l'avaient déjà ajouté : « Tu rejoins *N* autres invités ») ;
  4. une petite pluie de confettis aux couleurs Color & Chill (désactivée si `prefers-reduced-motion`) ;
  5. la liste se met à jour et la carte concernée est brièvement mise en surbrillance.
  - Si j'ai **déjà** ajouté ce morceau : toast neutre « Tu as déjà ajouté ce son 😉 », pas d'incrément.
- **US-4 Playlist des invités** (sous la recherche) : liste de **tous** les morceaux ajoutés, avec pour chacun pochette, titre, artiste, durée et **compteur** « ×N » (nombre d'invités distincts qui l'ont ajouté).
  - Onglets : **« Les plus ajoutés »** (défaut, tri `addCount` desc puis `lastAddedAt` desc) et **« Récemment ajoutés »** (tri `firstAddedAt` desc).
  - Bouton ▶ extrait et bouton **« +1 »** (« Moi aussi ») qui revient à ajouter le morceau (même logique que US-3, sans vider l'input).
  - Pagination « Charger plus » par 24.
  - Rafraîchissement automatique toutes les **15 s** (polling) + immédiat après un ajout.
  - Les morceaux **masqués** par l'admin n'apparaissent pas.
- **US-5 Thème** : bouton clair/sombre dans l'en-tête de **chaque page**. Défaut = préférence système ; choix mémorisé (localStorage).

**Admin — connexion `/admin/login`**
- **US-6** : email + mot de passe → accès au dashboard. Afficher/masquer le mot de passe. Message d'erreur générique « Email ou mot de passe incorrect ».
  Session = cookie httpOnly signé (JWT, 12 h). Toute page `/admin/*` redirige vers `/admin/login` si non connecté. Bouton « Déconnexion ».
  « Se souvenir de moi » → cookie 7 jours au lieu de 12 h. « Mot de passe oublié » : **retiré** (un seul compte, géré par variable d'env).
- 5 tentatives échouées / 15 min / IP → `429`.

**Admin — dashboard `/admin`**
- **US-7 KPI** (période sélectionnable : « Toute la soirée » / « Dernière heure ») :
  - Morceaux uniques · Ajouts totaux · Invités participants (guestId distincts) · Ajouts sur la dernière heure (+ variation vs l'heure précédente)
  - Artiste le plus demandé · Répartition par genre (barre empilée, top 4 + « Autres »)
  - Graphique « Ajouts par tranche de 15 min » (barres) sur la période
- **US-8 Classement** : tableau trié par défaut du plus ajouté au moins ajouté : rang (médailles top 3), pochette, titre, artiste, genre, compteur, premier/dernier ajout, extrait ▶, actions.
  - Filtres : recherche texte (titre/artiste), genre (chips), période (toute la soirée / dernière heure).
  - Tris : plus ajoutés, moins ajoutés, plus récents, A→Z.
  - Pagination 50.
  - Actions par ligne : **Marquer joué / non joué**, **Masquer / Réafficher** (un morceau masqué disparaît de la liste publique et ne peut plus être ajouté).
- **US-9 Synchro auto** : le dashboard se rafraîchit toutes les 15 s, en permanence (interrupteur retiré le 25/11).

### P1 — si le temps le permet (après tous les P0)
- **US-10 Export Excel (.xlsx)** du classement filtré (pour le DJ), sans les morceaux masqués.
- **US-11 Ouvrir/fermer les propositions** (interrupteur admin). Fermé → page invité en lecture seule avec bandeau « Les propositions sont closes, place à la fête ! ».
- **US-12 Mini-lecteur collant** en bas d'écran mobile quand un extrait joue (titre + pause + progression).
- **US-13 Raccourci ⌘K / Ctrl+K** pour focaliser la recherche (desktop).
- **US-14** Test e2e Playwright du parcours invité.

### Hors périmètre
Comptes invités, pseudo, commentaires, votes négatifs, lecture complète des morceaux, intégration directe avec le logiciel du DJ, multi-événements, réinitialisation du mot de passe par email.

## 5. Identité invité & anti-abus (décision)
- Au premier chargement, le front génère un **`guestId` (UUID v4)** stocké en `localStorage` et l'envoie dans l'en-tête `X-Guest-Id`.
- Le compteur = **nombre de guestId distincts** ayant ajouté le morceau (index unique `{trackKey, guestId}`).
- Limitation : un invité qui vide son stockage peut ré-ajouter. Acceptable pour une soirée étudiante ; atténué par le rate‑limit par guestId **et** par IP (voir `02-ARCHITECTURE.md §6`).
- ⚠️ Beaucoup d'invités partageront la **même IP publique** (Wi‑Fi du campus) : la limite par IP doit rester large.

## 6. Règles métier

| # | Règle |
|---|---|
| R1 | Un morceau est identifié par son `trackKey` = ISRC (sinon id Deezer). Deux ids Deezer du même titre = un seul morceau, un seul compteur. Les suggestions sont dédoublonnées de la même façon. |
| R2 | Un même invité ne compte qu'une fois par morceau. |
| R3 | Seul un morceau trouvé chez Deezer peut être ajouté (pas de saisie libre). |
| R4 | Un morceau masqué : invisible côté public, ajout refusé (`TRACK_HIDDEN`), compteur conservé côté admin. |
| R5 | Les explicites sont autorisés (badge « E ») ; l'admin peut les masquer un par un. |
| R6 | ~~Max 20 ajouts / invité / 10 min~~ — **retiré** (25/11) : pas de plafond par invité ; seule la limite large par IP (300 / 10 min) subsiste. |

## 7. Exigences non fonctionnelles
- Performance : LCP < 2,5 s en 4G ; bundle JS initial < 250 kB gzip ; images pochettes en `loading="lazy"`.
- Disponibilité : un seul service + Atlas ; si Deezer tombe, la liste et le dashboard restent utilisables (seule la recherche affiche une erreur).
- Sécurité : helmet, CORS fermé (même origine), cookies `httpOnly` + `SameSite=Lax` + `Secure` en prod, validation de toutes les entrées, regex de recherche échappées.
- Accessibilité : WCAG AA pour les contrastes texte dans les deux thèmes.
- Langue : UI 100 % française.
