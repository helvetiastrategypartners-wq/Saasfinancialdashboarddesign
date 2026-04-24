# Proposition d’amélioration complète — SaaS Financial Dashboard

Date de l’analyse : 23 avril 2026

## 1) Résumé exécutif

Le projet est une application React + Vite de dashboard financier, avec une base UI riche, une logique métier centralisée dans `MetricsCalculator`, et une connexion Supabase prête à l’usage. La base fonctionnelle est solide et le build passe, mais l’analyse met en évidence plusieurs risques de maintenabilité, de performance et de robustesse en production.

Priorités globales recommandées :

1. **Fiabiliser la couche data et les erreurs Supabase** (gestion des erreurs, rollback optimiste, multi-tenant réel).
2. **Réduire le poids JS/CSS en production** (chunking, lazy loading ciblé, réduction dépendances).
3. **Renforcer la qualité logicielle** (TypeScript strict, linting, conventions, architecture par domaine).
4. **Industrialiser la livraison** (CI avec tests + build + checks qualité + sécurité).

---

## 2) Méthodologie d’audit

- Lecture de l’architecture front, contextes, pages et librairies métier.
- Vérification des scripts de build/test et exécution des checks.
- Revue du schéma SQL partagé et des points d’intégration Supabase.
- Analyse de la configuration TypeScript/Vite et de la structure du repo.

---

## 3) Points forts observés

- **Découpage route-level par lazy loading** déjà en place.
- **Moteur métier (`MetricsCalculator`)** plutôt riche et partiellement testable (helpers purs).
- **Tests unitaires présents** (Vitest) avec bonne couverture fonctionnelle du module métriques.
- **Schéma SQL structuré** avec index de base et tables principales cohérentes.
- **UI moderne** avec un socle composants conséquent (Radix/Shadcn + charting).

---

## 4) Constats majeurs (gaps)

### 4.1 Architecture & maintenabilité

- Le `MetricsContext` concentre beaucoup de responsabilités (fetch, state, calculs, mutations), ce qui complique l’évolution.
- Une partie de la logique métier dépend de mock data et de constantes globales (ex. `COMPANY_ID = "company-1"`) qui limite le vrai multi-tenant.
- Le projet mélange fichiers `.tsx`, `.ts`, `.js`, `.jsx` sans conventions fortes documentées.

### 4.2 Qualité TypeScript

- `strict: false` dans `tsconfig.json` : risque d’erreurs runtime silencieuses.
- Absence de script lint/format/check-types officiel dans `package.json`.
- Certaines zones utilisent des casts permissifs (`as`) sans validation runtime explicite.

### 4.3 Robustesse data & Supabase

- Mutations optimistes (add/update/delete) sans rollback en cas d’erreur distante.
- Gestion d’erreur hétérogène (parfois `console.error`, parfois `setError`, parfois `void` sans handling).
- Le client Supabase n’intègre pas de garde stricte en cas de variables d’environnement manquantes.

### 4.4 Performance front

- Build OK, mais chunks lourds (> 500 kB), notamment bundle principal et modules export/reporting.
- Beaucoup de dépendances lourdes simultanément (`xlsx`, `jspdf`, `html2canvas`, etc.) : charge initiale et mémoire accrues.
- Plugin `rollup-plugin-visualizer` configuré avec `open: true`, non optimal en CI / environnements headless.

### 4.5 Sécurité & gouvernance

- Pas de pipeline CI visible pour exécuter systématiquement build/tests/quality gates.
- Pas de stratégie explicite de validation d’entrées côté client (schémas Zod/Yup par exemple).
- Gouvernance RLS/Supabase présente côté SQL, mais à relier à une authentification applicative concrète côté front.

### 4.6 Produit / UX / observabilité

- Pas de télémétrie ni tracing fonctionnel visible (Sentry, logs structurés, tracking erreurs UI).
- Peu d’indicateurs métier de qualité des données (fraîcheur, complétude, cohérence, anomalies).

---

## 5) Plan d’amélioration complet (priorisé)

## Phase 1 — Stabilisation (1 à 2 semaines)

### Objectif
Sécuriser la prod et diminuer les incidents sans refonte lourde.

### Actions
1. **Durcir TypeScript** : activer progressivement `strict` (au moins `noImplicitAny`, `strictNullChecks`).
2. **Ajouter outillage qualité** : ESLint + Prettier + scripts `lint`, `typecheck`, `test`.
3. **Normaliser erreurs Supabase** : wrapper unique API (résultat typé success/error).
4. **Rollback optimiste** : implémenter stratégie de restauration d’état en cas d’échec mutation.
5. **Nettoyage Vite config** : `visualizer.open = false` hors local.

### Livrables
- Gates qualité dans package scripts.
- Surface d’erreurs homogène + notifications utilisateur.
- PRs de correction sans modification fonctionnelle majeure.

---

## Phase 2 — Performance & architecture (2 à 4 semaines)

### Objectif
Réduire le temps de chargement et améliorer la lisibilité du code.

### Actions
1. **Split des modules lourds** : lazy import au clic pour export PDF/XLSX.
2. **Réduction bundle** : audit dépendances, remplacement libs lourdes si possible.
3. **Refactor contexte** : découper `MetricsContext` en hooks/domaines :
   - `useMetricsQueries`
   - `useMetricsMutations`
   - `useMetricsComputed`
4. **Data access layer** : introduire `repositories/services` et DTO typés.
5. **Gestion cache** : envisager TanStack Query pour synchro/invalidations/retries.

### Livrables
- Diminution taille chunk principal et amélioration TTI.
- Architecture modulaire par domaine.

---

## Phase 3 — Industrialisation (2 à 3 semaines)

### Objectif
Assurer qualité continue et conformité sécurité.

### Actions
1. **CI/CD** : pipeline GitHub Actions (install, typecheck, lint, test, build).
2. **Sécurité dépendances** : audit npm + dépendabot/renovate.
3. **Tests** : ajouter tests d’intégration UI et flows critiques (CRUD, reporting).
4. **Observabilité** : Sentry + logs corrélés + métriques web-vitals.
5. **Documentation dev** : conventions, ADRs, modèle de branches, release notes.

### Livrables
- Chaîne de livraison fiable.
- Réduction du risque de régression.

---

## Phase 4 — Évolution produit (continu)

### Objectif
Passer d’un dashboard vitrine à une plateforme analytique exploitable à l’échelle.

### Actions
1. **Multi-tenant réel** : récupérer `company_id` depuis session/auth, plus de constante fixe.
2. **Qualité des données** : règles de validation, contrôles de cohérence, alerting anomalies.
3. **Modèle de permissions** : rôles par fonctionnalité (RBAC fin).
4. **Snapshots & forecasting** : historisation automatisée et scénarios prédictifs versionnés.

---

## 6) Backlog recommandé (top 15)

1. Activer `strictNullChecks` + corriger erreurs bloquantes.
2. Ajouter script `npm run typecheck`.
3. Ajouter ESLint + règles React/TS.
4. Centraliser appels Supabase dans un service unique.
5. Implémenter rollback optimiste.
6. Supprimer `COMPANY_ID` hardcodé.
7. Introduire gestion session/auth partout data-access.
8. Lazy import des fonctions d’export PDF/XLSX.
9. Segmenter bundle via `manualChunks` Vite.
10. Désactiver `visualizer.open` en CI.
11. Ajouter tests d’intégration de 3 parcours critiques.
12. Ajouter monitoring erreurs front.
13. Ajouter politique de dépendances (audit régulier).
14. Documenter architecture cible et conventions code.
15. Mettre en place roadmap de migration progressive des mocks vers données réelles.

---

## 7) Estimation macro (effort)

- **Phase 1** : 5 à 10 j.h
- **Phase 2** : 10 à 20 j.h
- **Phase 3** : 8 à 15 j.h
- **Phase 4** : continu (sprints dédiés)

Total initial conseillé : **23 à 45 jours.homme** pour un socle production robuste.

---

## 8) Risques si non traité

- Dégradation progressive de la vélocité (complexité croissante du contexte central).
- Bugs silencieux en prod (TS non strict + gestion erreurs hétérogène).
- Temps de chargement élevé sur réseaux limités et devices modestes.
- Faible confiance dans la donnée pour pilotage financier.

---

## 9) KPI de succès à suivre

- **Technique** : taille bundle initiale, TTI/LCP, taux d’échec build CI, couverture tests.
- **Qualité** : bugs critiques/mois, temps moyen de résolution, incidents data.
- **Produit** : adoption fonctionnalités d’export, fréquence d’usage dashboard, rétention utilisateurs.

---

## 10) Conclusion

Le projet est une excellente base produit/design, mais il nécessite un **durcissement ingénierie** pour être opéré à l’échelle et en production durable. Le plan proposé permet une montée en maturité progressive sans “big bang”, avec impact rapide dès la Phase 1 sur la fiabilité perçue.

