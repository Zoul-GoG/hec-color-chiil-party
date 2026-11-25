# 06 — Design system « HEC Color & Chill »

Source de vérité visuelle. Les maquettes de `design-references/` ont servi d'inspiration ; ce document les **unifie et corrige**.

## 1. Principes
1. **Couleurs de l'école d'abord** : bleu HEC `#0652DD` et rouge HEC `#E02424`, échantillonnés sur le logo officiel.
2. **« Color » = touches festives**, pas un arc‑en‑ciel partout : la palette de l'affiche (rose, jaune, vert, violet, orange) sert aux chips de genre, aux confettis et au dégradé du mot « Color ». Le reste de l'UI reste propre et lisible.
3. **Règle des rôles** (identique en light et dark) :
   - **Rouge = action principale & live** : « Ajouter », « +1 », « Se connecter », point « en direct », onglet actif, compteur.
   - **Bleu = marque & navigation** : liens, focus, filtres actifs, graphiques, interrupteurs, en‑tête de la page de connexion.
   - Neutres pour tout le reste.
4. **Mobile‑first, lisible dans le noir** : contrastes AA vérifiés, cibles tactiles ≥ 44 px.
5. Pas d'élément décoratif qui ressemble à une donnée (supprimer « Boost », « Party Match », « Tendance », « VIP »).

## 2. Corrections par rapport aux maquettes
| Problème constaté | Correction |
|---|---|
| Deux systèmes incompatibles (Inter vs Hanken Grotesk, bleu `#2563EB` vs rouge `#E11D48` comme « primary » selon le thème) | Un seul système, mêmes rôles dans les deux thèmes |
| `borderRadius.full` redéfini à `0.75rem` dans la config Tailwind → les « pills » ne sont pas rondes | Ne jamais surcharger `full` (9999px) |
| Logo cassé (`img` gris) | `public/hec-abidjan-logo.png` (logo officiel fourni) |
| Badges qui se chevauchent avec la ligne artiste (« Tendance à Abidjan ») et onglets qui passent sur 2 lignes (« Les plus votés ») | `whitespace-nowrap`, `truncate`, badges masqués < 400 px, onglets en `inline-flex` |
| Pied de page « HEC Paris & Abidjan · 2025 » | « HEC Abidjan · BDE · © 2026 » |
| Bouton « Ajouter la musique » en texte libre | Supprimé (voir ADR D3) ; l'ajout se fait depuis une suggestion |
| Contours rosés/brun du thème sombre (`outline #ac8889`) | Neutres bleu nuit |
| Thème sombre de la page d'accueil identique à la light avec couleurs inversées approximatives | Tokens sombres dédiés ci‑dessous |

## 3. Tokens (à copier tel quel dans `apps/web/src/styles/tokens.css`)

```css
@import "tailwindcss";

/* Dark mode piloté par la classe .dark sur <html> */
@custom-variant dark (&:where(.dark, .dark *));

:root {
  /* Marque */
  --hec-blue: #0652DD;
  --hec-blue-hover: #0544B8;
  --hec-blue-soft: #E7EEFD;     /* fonds de badge/filtre */
  --hec-blue-text: #0652DD;     /* liens, texte bleu */
  --hec-red: #E02424;
  --hec-red-hover: #C81E1E;
  --hec-red-soft: #FDECEC;
  --hec-red-text: #C81E1E;

  /* Surfaces & texte */
  --bg: #F7F8FC;
  --surface: #FFFFFF;
  --surface-2: #F1F4FA;         /* inputs, zones en retrait */
  --surface-3: #E7ECF5;         /* hover */
  --border: #E2E8F0;
  --fg: #0F172A;
  --fg-muted: #475569;
  --fg-subtle: #64748B;
  --overlay: rgb(15 23 42 / 0.55);

  /* Fête (affiche Color & Chill) */
  --party-pink: #FF3EA5;
  --party-yellow: #FFC93C;
  --party-green: #22C55E;
  --party-purple: #8B5CF6;
  --party-orange: #FF8A1F;

  /* Ombres */
  --shadow-sm: 0 1px 3px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04);
  --shadow-lg: 0 10px 25px -5px rgb(15 23 42 / 0.08), 0 4px 10px -2px rgb(15 23 42 / 0.04);
  --glow-red: 0 6px 20px rgb(224 36 36 / 0.25);
}

.dark {
  --hec-blue: #2E6BF0;          /* fond de bouton, texte blanc AA 4.7:1 */
  --hec-blue-hover: #4A80F5;
  --hec-blue-soft: rgb(46 107 240 / 0.16);
  --hec-blue-text: #7EA6FF;     /* 7.2:1 sur surface */
  --hec-red: #E02424;
  --hec-red-hover: #F03A3A;
  --hec-red-soft: rgb(224 36 36 / 0.16);
  --hec-red-text: #FF6B6B;      /* 6.2:1 sur surface */

  --bg: #0B1020;
  --surface: #121A2E;
  --surface-2: #18223A;
  --surface-3: #22304D;
  --border: rgb(255 255 255 / 0.08);
  --fg: #F1F5FF;
  --fg-muted: #A9B4CC;
  --fg-subtle: #8592AD;
  --overlay: rgb(0 0 0 / 0.6);

  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 16px 40px rgb(0 0 0 / 0.5), 0 0 24px rgb(46 107 240 / 0.12);
  --glow-red: 0 0 20px rgb(224 36 36 / 0.45);
}

@theme inline {
  --color-brand-blue: var(--hec-blue);
  --color-brand-blue-hover: var(--hec-blue-hover);
  --color-brand-blue-soft: var(--hec-blue-soft);
  --color-brand-blue-text: var(--hec-blue-text);
  --color-brand-red: var(--hec-red);
  --color-brand-red-hover: var(--hec-red-hover);
  --color-brand-red-soft: var(--hec-red-soft);
  --color-brand-red-text: var(--hec-red-text);
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-border: var(--border);
  --color-fg: var(--fg);
  --color-fg-muted: var(--fg-muted);
  --color-fg-subtle: var(--fg-subtle);
  --color-party-pink: var(--party-pink);
  --color-party-yellow: var(--party-yellow);
  --color-party-green: var(--party-green);
  --color-party-purple: var(--party-purple);
  --color-party-orange: var(--party-orange);

  --font-display: "Sora", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  --shadow-card: var(--shadow-sm);
  --shadow-float: var(--shadow-lg);
  --shadow-glow-red: var(--glow-red);
}

html { color-scheme: light; }
html.dark { color-scheme: dark; }
body { @apply bg-bg text-fg font-sans antialiased; }
.tabular { font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

Classes à utiliser : `bg-surface`, `bg-surface-2`, `border-border`, `text-fg`, `text-fg-muted`, `bg-brand-red hover:bg-brand-red-hover text-white`, `text-brand-blue-text`, `rounded-lg`, `shadow-card`…

**Anti‑flash du thème** : dans `index.html`, script inline avant le CSS :
```html
<script>
  (function(){try{var t=localStorage.getItem('hcc-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark',d);}catch(e){}})();
</script>
```

## 4. Typographie
Google Fonts : `Sora:wght@600;700;800` et `Inter:wght@400;500;600;700` (`display=swap`, `preconnect`).

| Style | Police | Taille / interligne | Graisse | Usage |
|---|---|---|---|---|
| display | Sora | 40/48 (mobile 30/36), tracking −0.02em | 800 | H1 accueil |
| h1 | Sora | 32/40 (mobile 26/32) | 700 | Titres de page admin |
| h2 | Sora | 22/28 | 700 | Titres de section |
| title | Sora | 16/22 | 600 | Titre de morceau |
| body-lg | Inter | 16/24 | 400 | Sous‑titre |
| body | Inter | 14/20 | 400 | Texte courant, artiste |
| caption | Inter | 12/16 | 500 | Métadonnées, durée |
| label | Inter | 11/14, tracking 0.06em, MAJUSCULES | 700 | Badges, en‑têtes KPI |

Chiffres (compteurs, durées, KPI) : classe `tabular`.

## 5. Espacements & grille
- Échelle 4 px. Marges de page : 16 px mobile, 24 px tablette, 32 px desktop. Conteneur max 1200 px.
- Grille playlist : 1 col (< 640), 2 col (≥ 640), 3 col (≥ 1024), gap 16 px.

## 6. Composants

**Button**
| Variante | Style | Usage |
|---|---|---|
| `primary` | `bg-brand-red text-white hover:bg-brand-red-hover shadow-glow-red` (glow en dark seulement) | Ajouter, +1, Se connecter |
| `secondary` | `bg-surface-2 text-fg border border-border hover:bg-surface-3` | Extrait, Charger plus |
| `brand` | `bg-brand-blue text-white hover:bg-brand-blue-hover` | Synchro, actions admin positives |
| `ghost` | transparent, `hover:bg-surface-2` | Icônes, déconnexion |
Hauteurs : `sm` 32, `md` 40, `lg` 48 (min 44 sur mobile). Radius `md`. Focus : `focus-visible:outline-2 outline-offset-2 outline-brand-blue`. État `loading` : spinner + `aria-busy`.

**PreviewButton** (▶/⏸) : rond 40 px, anneau de progression SVG (`stroke: var(--hec-red)`) sur 30 s, `aria-label="Écouter un extrait de {titre}"` / `"Mettre en pause"`. Désactivé si pas d'extrait.

**CountBadge** : pill `bg-brand-red-soft text-brand-red-text tabular`, contenu `×12`, `title="Ajouté par 12 invités"`. Animation « pop » (scale 1 → 1.15 → 1) quand la valeur augmente.

**Badge** : `label`, pill, variantes `neutral` (surface‑2), `blue` (blue‑soft / blue‑text), `red`, `explicit` (carré 16 px « E », surface‑3).

**GenreChip** : pill ; inactive `bg-surface-2 text-fg` ; active `bg-brand-blue text-white`. Dans les idées de recherche de l'accueil, chaque chip a un petit point de couleur `party-*` (rotation pink, yellow, green, purple, orange).

**Card** : `bg-surface border border-border rounded-lg shadow-card p-4`. Hover desktop : `shadow-float`.

**Input recherche** : hauteur 52, `rounded-full`, `bg-surface border border-border`, icône loupe `text-brand-blue-text` à gauche, spinner pendant la requête, bouton ✕ pour vider à droite, badge `⌘K` (desktop seulement). Focus : `ring-2 ring-brand-blue`.

**Toast** (`sonner`) : position `top-center` sur mobile, `top-right` desktop ; fond `surface`, bordure `border`, icône colorée ; durée 3,5 s.

**ThemeToggle** : bouton rond 40 px, icône `Moon` (light) / `Sun` (dark), `aria-label="Activer le mode sombre"` / `"Activer le mode clair"`.

**Skeleton** : `bg-surface-3 animate-pulse rounded-md`.

**Confettis** (`canvas-confetti`) : 80 particules, `colors: ['#0652DD','#E02424','#FF3EA5','#FFC93C','#22C55E','#8B5CF6']`, origine = bouton cliqué. Rien si `prefers-reduced-motion`.

## 7. Éléments de marque
- **Header** : logo HEC Abidjan (hauteur 32 px) + séparateur vertical + « Color & Chill » (Sora 700) ; à droite ThemeToggle (et en admin : email + Déconnexion).
- **Titre festif** : le mot « Color » en dégradé `linear-gradient(90deg, var(--party-pink), var(--party-yellow), var(--party-green), #0652DD, var(--party-purple))` via `bg-clip-text text-transparent`.
- **Fond d'ambiance** (accueil + login) : 2–3 halos flous `blur-3xl` (bleu HEC 10 % et rouge HEC 8 % en light ; 18 % / 12 % en dark), `pointer-events-none`, `aria-hidden`.
- Favicon : dérivé du logo (carré bleu avec « HEC »), ou le logo redimensionné.
