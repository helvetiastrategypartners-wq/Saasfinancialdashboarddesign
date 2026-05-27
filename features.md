# Fonctionnalités du projet SaaS Financial Dashboard Design — État réel HSPOS

Dernière mise à jour : 27 mai 2026

Ce document consolide l'état Notion avec l'état réel du code présent dans le projet.

## Légende

- ✅ Fait : présent dans le code et fonctionnel au niveau attendu pour le MVP.
- 🔄 Partiel : présent, mais incomplet, simulé ou dépendant d'une configuration externe.
- ⏳ À faire : non implémenté dans le repo.
- ⚠️ À vérifier : dépend d'un état Supabase/déploiement non entièrement versionné dans le repo.

---

## Synthèse

### ✅ Fait

- Dashboard financier principal.
- Transactions avec CRUD Supabase/fallback local.
- Clients avec CRUD Supabase/fallback local.
- Factures simulées à partir des transactions de dépense.
- Marketing & Growth avec CRUD des métriques marketing internes.
- Prévisions / Strategy Module.
- Rapports financiers.
- Paramètres UI.
- Auth Supabase côté front.
- Login, logout et changement forcé du mot de passe temporaire.
- Espace Super Admin séparé du dashboard.
- Création, liste, blocage, déblocage, suppression et reset mot de passe des comptes entreprise via API Express.
- Middleware Super Admin Express avec JWT Supabase + whitelist `SUPER_ADMIN_EMAILS`.
- CORS whitelist côté serveur admin.
- Rate limiting en mémoire sur `/api/admin/*` et `/api/export`.
- Audit logs applicatifs pour actions Super Admin, dès que `admin_audit_logs` existe en base.
- Exports PDF/CSV via serveur Express.
- Documentation privacy et SQL de durcissement `supabase/privacy-hardening.sql`.
- Migration RLS/security baseline versionnée dans `supabase/migrations/20260527103000_security_rls_baseline.sql`.
- Requêtes de vérification post-migration dans `supabase/verify-security-hardening.sql`.
- Coverage tests unitaires métier maintenue à 100% sur les suites `src/app/lib/metrics-tests/*`.
- Runner de tests en cascade `scripts/run-tests.mjs` avec lancement global ou par domaine.
- `MetricsCalculator` découpé par domaines métier dans `src/app/lib/metrics/*`.
- Refacto maintenabilité des pages features :
  - Settings découpé par panneau ;
  - Marketing découpé en sections visuelles ;
  - Invoices découpé en modales dédiées.

### 🔄 Partiel

- Connexion Supabase réelle limitée aux tables `transactions`, `customers`, `marketing_metrics` côté dashboard.
- RLS/policies Supabase désormais matérialisées en migration baseline, mais l'exécution doit être confirmée dans le projet Supabase.
- Settings : interface complète, mais la plupart des actions sont simulées côté UI.
- Privacy/nLPD/RGPD : base technique et documentation présentes, validation juridique/déploiement à faire.
- Factures : module UI fonctionnel, mais pas encore de vraie table `invoices` branchée côté app.
- Exports : serveur présent, production à valider derrière HTTPS/proxy.

### ⏳ À faire

- Parseurs backend `GoogleAdsParser` et `MetaAdsParser`.
- Intégration réelle Google Ads / Meta Ads.
- Chiffrement AES-256 des futures clés API marketing au repos.
- MFA réel, au minimum pour les comptes Super Admin.
- Reset password autonome sécurisé hors parcours Super Admin.
- HTTPS/TLS côté déploiement Express.
- Migration Supabase complète pour figer RLS, policies, vues et tables privacy.
- Tests E2E/QA sécurité sur les parcours Auth/SA.

---

# Détail Par Module

## Navigation Et Routage

### ✅ Fait

- Routes métier protégées :
  - `/`
  - `/transactions`
  - `/invoices`
  - `/clients`
  - `/marketing`
  - `/forecast`
  - `/reports`
  - `/settings`
- Routes auth/admin :
  - `/login`
  - `/change-password`
  - `/super-admin`
- `ProtectedLayout` pour les utilisateurs entreprise.
- `ProtectedSuperAdminLayout` pour les comptes SA.
- Redirection des utilisateurs non connectés vers `/login`.
- Redirection automatique des SA vers `/super-admin`.
- Isolation du `MetricsProvider` hors espace Super Admin.

---

## Authentification

### ✅ Fait

- `AuthContext` avec session, utilisateur, login, logout et `updatePassword`.
- Authentification via `supabase.auth.signInWithPassword`.
- Page Login avec affichage/masquage du mot de passe.
- Page de changement de mot de passe forcé.
- Complexité mot de passe appliquée côté UI et côté endpoint admin :
  - 12 caractères minimum ;
  - minuscule ;
  - majuscule ;
  - chiffre ;
  - caractère spécial.
- `must_change_password` remis à `false` dans `profiles` après changement.
- Mots de passe hachés et gérés par Supabase Auth, jamais stockés dans les tables applicatives.

### 🔄 Partiel

- La session est celle de Supabase SPA côté navigateur, pas encore un modèle cookie `HttpOnly/Secure` via backend.
- Complexité Supabase Auth à vérifier/configurer aussi côté dashboard Supabase pour défense en profondeur.

### ⏳ À faire

- MFA réel.
- Reset password autonome sécurisé.
- Politique de durée de session/JWT à valider côté Supabase.

---

## Super Admin

### ✅ Fait

- Page `/super-admin`.
- Layout dédié `SuperAdminLayout`.
- API Express protégée par `requireSuperAdmin()`.
- Vérification Bearer JWT via Supabase.
- Whitelist `SUPER_ADMIN_EMAILS`.
- `SUPABASE_SERVICE_ROLE_KEY` uniquement côté serveur.
- Healthcheck admin : `/api/admin/health`.
- Liste des comptes Supabase Auth enrichie avec `profiles` et `companies`.
- Création entreprise + utilisateur Auth + profil.
- Mot de passe temporaire, puis changement forcé par l'utilisateur.
- Blocage/déblocage via `ban_duration`.
- Reset mot de passe temporaire avec `must_change_password`.
- Suppression d'accès : suppression Auth user + profile, sans supprimer l'entreprise ni ses chiffres.
- Protection contre l'auto-blocage et l'auto-suppression.
- Popup de confirmation par recopie de l'adresse email pour actions sensibles.
- Audit logs sur :
  - création ;
  - échec de création ;
  - blocage ;
  - déblocage ;
  - reset mot de passe ;
  - suppression.

### 🔄 Partiel

- Audit logs opérationnels seulement après exécution de `supabase/privacy-hardening.sql`.
- Rate limiting en mémoire : suffisant pour dev/MVP, mais pas distribué en production multi-instance.

### ⏳ À faire

- Page de consultation des `admin_audit_logs`.
- Gestion de rôles plus fine que whitelist email si nécessaire.
- Tests E2E des actions sensibles.

---

## Dashboard

### ✅ Fait

- Page `DashboardPage.tsx`.
- KPI cards :
  - cash disponible ;
  - revenus ;
  - dépenses ;
  - marge brute ;
  - burn rate ;
  - runway estimé.
- Graphiques :
  - revenus vs dépenses ;
  - répartition des dépenses ;
  - cashflow.
- Transactions récentes.
- Grille de synthèse.
- Sélecteur de période/devise via composants globaux.
- Export différé via `DeferredExportButton`.
- Données alimentées par `MetricsContext`.

### 🔄 Partiel

- Les calculs fonctionnent sur données mockées ou Supabase selon disponibilité.
- Pas encore de filtre company dynamique côté utilisateur final : `company_id` actif vient de `getActiveCompanyId()`.

---

## Transactions

### ✅ Fait

- Page `TransactionsPage.tsx`.
- Hook `useTransactionsData`.
- CRUD :
  - ajout ;
  - modification ;
  - suppression.
- Synchronisation Supabase sur table `transactions`.
- Fallback local/mock si Supabase indisponible ou vide.
- Recherche par libellé/catégorie.
- Filtres par type et catégorie.
- Tri chronologique décroissant.
- Cartes de synthèse : revenus, dépenses, différence.
- Formulaire transaction : type, label, catégorie, montant, date, statut, récurrence.
- Rollback UI en cas d'erreur mutation Supabase.

### 🔄 Partiel

- Pas encore de filtre statut dans le hook, contrairement à certaines notes Notion.
- Validation formulaire limitée côté front.

---

## Factures / Invoices

### ✅ Fait

- Page `InvoicesPage.tsx`.
- Hook `useInvoicesData`.
- Factures dérivées des transactions `expense`.
- CRUD via mutations transactions :
  - ajout ;
  - modification ;
  - suppression ;
  - marquage comme payée.
- Recherche par fournisseur, numéro ou catégorie.
- Filtres de statut :
  - Tous ;
  - Payée ;
  - Émise ;
  - Remboursement.
- Simulation `AI Extraction` en 4 étapes.
- Formulaire facture extrait dans `InvoiceFormModal`.
- Modale AI Extraction extraite dans `InvoiceAIModal`.
- Numéro de facture généré depuis l'id transaction.
- Synthèse montants payés, en attente, remboursements.

### 🔄 Partiel

- Pas de table `invoices` réellement branchée dans l'app.
- Le module représente aujourd'hui plutôt des factures fournisseurs/dépenses que des factures clients/créances.

### ⏳ À faire

- Décider produit : factures fournisseurs, factures clients, ou les deux.
- Brancher une table `invoices` ou `receivables` si nécessaire.

---

## Clients

### ✅ Fait

- Page `ClientsPage.tsx`.
- Hook `useClientsData`.
- CRUD :
  - ajout ;
  - modification ;
  - suppression.
- Synchronisation Supabase sur table `customers`.
- Fallback mock/local.
- Recherche par nom, canal ou segment.
- Filtres par statut :
  - actif ;
  - churné ;
  - en pause.
- KPIs :
  - total clients ;
  - clients actifs ;
  - revenu total ;
  - revenu moyen.
- Formulaire client : nom, segment, canal, date, statut, MRR, revenu total, marge brute, coûts directs.
- Rollback UI en cas d'erreur mutation Supabase.

---

## Marketing & Growth

### ✅ Fait

- Page `MarketingPage.tsx`.
- Hook `useMarketingData`.
- CRUD métriques marketing sur table `marketing_metrics`.
- Fallback mock/local.
- KPIs :
  - CAC ;
  - LTV ;
  - LTV/CAC ;
  - payback period ;
  - ROI ;
  - conversion ;
  - dépense ;
  - clients acquis ;
  - revenu généré ;
  - leads ;
  - ROAS moyen.
- Graphiques marketing lazy-loaded.
- Entonnoir leads -> MQL -> SQL -> clients.
- Analyse par canal.
- Sections `MarketingFunnelSection` et `MarketingRevenueByChannelCards` séparées de la page.
- Table campagnes/métriques marketing avec édition/suppression.

### 🔄 Partiel

- Les données externes Google Ads/Meta Ads ne sont pas synchronisées.
- `channel_id` est saisi manuellement, pas encore relié à une table `marketing_channels` dans l'app.

### ⏳ À faire

- `GoogleAdsParser`.
- `MetaAdsParser`.
- OAuth / tokens / refresh.
- Upsert et déduplication backend.
- Synchronisation glissante.
- Conversion devise des imports ads.
- Chiffrement des clés/tokens API marketing au repos.

---

## Prévisions / Forecast

### ✅ Fait

- Page `ForecastPage.tsx`.
- Scénarios financiers prédéfinis.
- Projection cash/runway sur 12 mois.
- Simulation via `calculator.simulateScenario()`.
- Table de synthèse.
- Graphiques de projection.
- Comparaison réel vs prévu.
- Simulateur extrait dans `ForecastSimulator` pour alléger `ForecastPage`.

### 🔄 Partiel

- Pas de persistance Supabase dédiée des scénarios/forecasts.
- Le simulateur reste purement client-side : pas de sauvegarde de scénarios personnalisés.

---

## Rapports / Reporting

### ✅ Fait

- Page `ReportsPage.tsx`.
- Rapport mensuel dynamique.
- Sections financières, marketing, unit economics, rétention, structure financière.
- Insights automatiques.
- Visualisations :
  - concentration des revenus ;
  - leverage gauge ;
  - variations et synthèses.
- Sections de rapport extraites :
  - `ReportInsightsSection` ;
  - `ExpenseVariationCard`.
- Export PDF/CSV via `ExportButton` et serveur Express.

### 🔄 Partiel

- Certains rapports reposent sur données calculées/mock si Supabase n'a pas encore de données.
- Le tableau cohortes revenus reste dans `ReportsPage` et peut encore être extrait proprement.

---

## Paramètres / Settings

### ✅ Fait

- Page `SettingsPage.tsx`.
- Onglets :
  - Profil ;
  - Notifications ;
  - Sécurité ;
  - Facturation ;
  - Préférences.
- UI profil avec upload photo local.
- UI notifications avec toggles.
- UI sécurité avec changement de mot de passe simulé, 2FA toggle et alertes connexion.
- UI facturation avec plans, moyen de paiement simulé, historique et téléchargement `.txt`.
- UI préférences : langue, devise, fuseau horaire, mode sombre, animations, sons.
- Panneaux Settings séparés par fichier :
  - `ProfileSettingsPanel` ;
  - `NotificationSettingsPanel` ;
  - `SecuritySettingsPanel` ;
  - `BillingSettingsPanel` ;
  - `PreferenceSettingsPanel`.

### 🔄 Partiel

- Les réglages ne sont pas persistés en base.
- Le changement de mot de passe de Settings est simulé et n'appelle pas Supabase Auth.
- Le toggle 2FA n'active pas une MFA réelle.
- La facturation est une simulation UI.

---

## Sécurité & Privacy

### ✅ Fait

- Auth Supabase côté front.
- Service role absent du frontend.
- Middleware Express Super Admin.
- JWT Bearer vérifié côté serveur pour les routes `/api/admin/*`.
- CORS whitelist.
- Rate limiting en mémoire :
  - admin : 60 requêtes/min par IP par défaut ;
  - export : 20 requêtes/min par IP par défaut.
- Audit logs applicatifs avec IP, user-agent, acteur, cible et metadata non sensible.
- Script `supabase/privacy-hardening.sql` :
  - `admin_audit_logs` ;
  - `privacy_requests` ;
  - `data_retention_policies`.
- Migration `supabase/migrations/20260527103000_security_rls_baseline.sql` :
  - helper privé `private.current_company_id()` ;
  - RLS multi-tenant par `profiles.company_id` ;
  - révocation `anon` sur tables sensibles ;
  - policies `authenticated` par entreprise ;
  - vues `v_*` en `security_invoker`.
- Script `supabase/verify-security-hardening.sql` pour contrôler RLS, grants, policies, vues et `profiles.must_change_password`.
- Documentation `docs/privacy-readiness.md`.
- RLS et vues Supabase durcies via SQL Editor lors de l'audit précédent.
- Mots de passe/tokens/secrets non journalisés.

### 🔄 Partiel / ⚠️ À vérifier

- La migration RLS/security baseline doit être exécutée et vérifiée dans Supabase.
- Le script privacy reste conservé comme helper historique, mais la migration baseline reprend les tables privacy principales.
- HTTPS/TLS dépend du déploiement.
- La conformité nLPD/RGPD doit être validée juridiquement.

### ⏳ À faire

- MFA réel, surtout pour SA.
- Chiffrement AES-256 des futures clés API marketing.
- Tests sécurité dédiés.
- Journal UI des audit logs.
- Procédure incident opérationnelle côté entreprise.

---

## Exports & Utilitaires

### ✅ Fait

- Export PDF/CSV côté serveur Express.
- Validation format `pdf` / `csv`.
- Export dashboard via `DeferredExportButton`.
- Composants `ExportButton`, `ExportActions`, `PeriodComparator` présents.
- Thème dark/light.
- Sélecteur devise CHF/EUR/USD.
- Sélecteur de période.
- Toasts de notification.
- Chargement différé avec `Suspense`.
- Composants UI réutilisables.
- Calculs centralisés via `MetricsCalculator`.

### 🔄 Partiel

- À harmoniser visuellement/fonctionnellement entre les différents composants export si besoin produit.
- Production Express à valider derrière HTTPS.

---

## Architecture Technique

### ✅ Fait

- SPA React/Vite.
- Architecture par `features`, `components`, `contexts`, `shared`.
- Routage centralisé dans `src/app/routes.ts`.
- Contextes :
  - `AuthContext` ;
  - `MetricsContext` ;
  - `CurrencyContext` ;
  - `DateRangeContext` ;
  - `ThemeContext`.
- Serveur Express pour exports et opérations admin.
- Client Supabase externalisé dans `src/utils/supabase.ts`.
- Types partagés dans `src/shared/types.ts`.
- Schéma SQL de base dans `src/shared/schema.sql`.
- Tests unitaires métier découpés dans `src/app/lib/metrics-tests/`.
- Fixtures de tests centralisées dans `src/app/lib/metrics-tests/fixtures.ts`.
- Runner de tests :
  - `npm run test:all` ;
  - `npm run test:coverage` ;
  - `npm run test:check` ;
  - `npm run test:runner -- <suite>`.

### 🔄 Partiel

- Données réelles Supabase branchées sur une partie des modules seulement.
- Pas encore de pipeline migration Supabase complet.
- Pas encore de tests E2E.

---

# Backlog Priorisé Réel

## Priorité Haute

1. Exécuter `supabase/migrations/20260527103000_security_rls_baseline.sql` dans Supabase.
2. Lancer `supabase/verify-security-hardening.sql` et conserver les résultats.
3. Vérifier l'isolation multi-tenant avec deux utilisateurs/deux `company_id`.
4. Mettre HTTPS/TLS en production pour Express.
5. Ajouter tests QA/E2E sur :
   - login ;
   - changement forcé du mot de passe ;
   - création compte SA ;
   - blocage/déblocage ;
   - suppression accès ;
   - RLS inter-company.

## Priorité Moyenne

6. Rendre Settings persistant ou clarifier que c'est une maquette.
7. Décider et implémenter le vrai modèle Factures :
   - fournisseurs/dépenses ;
   - clients/créances ;
   - ou deux modules séparés.
8. Ajouter consultation des audit logs dans l'espace SA.
9. Ajouter MFA réel pour Super Admin.
10. Implémenter les intégrations Google Ads / Meta Ads.

## Priorité Basse

11. Reset password autonome.
12. Rate limiting distribué si production multi-instance.
13. Export privacy / data subject request assisté.
14. Amélioration investisseurs des exports PDF.
15. Tests visuels et accessibilité.
16. Continuer le refacto léger restant :
   - tableau cohortes de `ReportsPage.tsx` ;
   - formulaires CRUD clients/transactions si le pattern se stabilise ;
   - harmonisation des modales CRUD entre transactions, clients, marketing et invoices.
