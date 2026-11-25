# 00 — Prompt de démarrage à coller dans Claude Code

> Copier tout le bloc ci‑dessous dans Claude Code, à la racine du projet.

```
Tu vas développer l'application « HEC Color & Chill Party — Playlist collaborative ».

1. Lis CLAUDE.md, puis docs/01-PRD.md, docs/02-ARCHITECTURE.md, docs/03-API.md, docs/04-DATA-MODEL.md,
   docs/05-DEEZER.md, docs/06-DESIGN-SYSTEM.md, docs/07-SCREENS.md, docs/08-DEPLOYMENT.md et docs/09-IMPLEMENTATION-PLAN.md.
   Regarde les captures de design-references/screenshots/ pour la structure visuelle (les docs 06 et 07 priment en cas de conflit).
2. Exécute docs/09-IMPLEMENTATION-PLAN.md phase par phase, dans l'ordre. Pour chaque phase :
   - crée une liste de tâches ;
   - écris le code ET les tests listés ;
   - lance lint, typecheck et tests jusqu'à ce qu'ils passent ;
   - coche les cases dans docs/09-IMPLEMENTATION-PLAN.md et note toute décision dans « Décisions prises » ;
   - commit `feat(phase-N): …` ;
   - fais-moi un résumé de 5 lignes max, puis enchaîne la phase suivante sans attendre, sauf si un secret/une info te manque
     (ex. MONGODB_URI) : dans ce cas utilise mongodb-memory-server en local et signale-le.
3. Priorité absolue aux items P0 : l'application doit être en production jeudi 26/11 au soir.
4. Avant de toucher au front, vérifie chaque écran en light ET dark, à 375 px et 1280 px (lance le dev server et contrôle visuellement si tu as un navigateur ; sinon relis les classes de chaque état).

Commence par la Phase 0.
```

## Prompts utiles ensuite
- « Fais une revue complète de l'écran d'accueil par rapport à docs/07-SCREENS.md §1 et liste les écarts, puis corrige‑les. »
- « Lance la checklist de docs/08-DEPLOYMENT.md §4 et dis‑moi ce qui reste à faire de mon côté. »
- « Ajoute l'export CSV (US‑10) en respectant docs/03-API.md. »
