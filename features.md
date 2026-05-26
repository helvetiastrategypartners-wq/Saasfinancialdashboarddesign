# Fonctionnalités du projet SaaS Financial Dashboard Design

Ce document sert d'inventaire fonctionnel et technique du dashboard financier HSP.

## Vue d'ensemble

L'application est une SPA React/Vite avec routage client, dashboard financier, modules métier, authentification Supabase et espace Super Admin.

Parcours principaux :

- utilisateur entreprise : connexion, consultation et gestion des chiffres de son entreprise ;
- super-admin : création et gestion des comptes entreprises ;
- administration sécurité : audit, rate limiting, privacy readiness et durcissement Supabase.

## Navigation

Pages métier :

- Dashboard
- Transactions
- Factures
- Clients
- Marketing & Growth
- Prévisions
- Rapports
- Paramètres

Pages sécurisées :

- Login
- Changement de mot de passe forcé
- Super Admin

Le `Layout` global fournit la navigation latérale, la zone de contenu et les contrôles de thème/session. Le `SuperAdminLayout` isole l'espace SA du dashboard financier.

## Authentification

- Authentification via Supabase Auth.
- Contexte global `AuthProvider` avec session, utilisateur, login, logout et mise à jour du mot de passe.
- Page de connexion avec affichage/masquage du mot de passe.
- Redirection des utilisateurs non connectés vers `/login`.
- Redirection des comptes Super Admin vers `/super-admin`.
- Mot de passe temporaire avec changement forcé au premier login via `must_change_password`.
- Validation de complexité :
  - 12 caractères minimum
  - minuscule
  - majuscule
  - chiffre
  - caractère spécial

## Super Admin

- Espace Super Admin isolé du dashboard financier.
- Création d'une entreprise et du premier compte utilisateur associé.
- Création des comptes via serveur Express avec `SUPABASE_SERVICE_ROLE_KEY` uniquement côté backend.
- Mot de passe temporaire saisi par la SA, puis changement forcé par l'utilisateur.
- Liste des comptes entreprises avec email, nom, entreprise, `company_id`, statut, dernière connexion et indicateur de mot de passe à changer.
- Actions de gestion :
  - bloquer un compte ;
  - débloquer un compte ;
  - supprimer l'accès utilisateur ;
  - réinitialiser le mot de passe temporaire.
- Confirmation par recopie de l'adresse email avant action sensible.
- Protection contre l'auto-blocage et l'auto-suppression du compte SA.

## Dashboard

- Vue d'ensemble financière multi-KPI.
- Cartes KPI :
  - cash disponible ;
  - revenus ;
  - dépenses ;
  - marge brute ;
  - burn rate ;
  - runway estimé.
- Graphiques :
  - revenus vs dépenses ;
  - répartition des dépenses par catégorie ;
  - cashflow en barres.
- Sélecteur de période et comparaison via `DateRangeBar`.
- Export de rapport via `DeferredExportButton`.
- Transactions récentes et grille de synthèse.

## Transactions

- Tableau des transactions avec recherche par libellé ou catégorie.
- Filtres par type et catégorie.
- Statistiques dynamiques : revenus filtrés, dépenses filtrées, différence.
- CRUD transactionnel : ajout, modification, suppression.
- Formulaire transaction : type, statut, libellé, catégorie, montant, date, récurrence.
- Notifications toast pour les actions réussies.

## Factures

- Gestion des factures fournisseurs.
- Recherche par fournisseur, numéro ou catégorie.
- Filtre par statut : émise, payée, remboursement.
- Statistiques : montant payé, montant en attente, remboursements.
- Marquage comme payée.
- CRUD factures : ajout, modification, suppression.
- Simulation d'extraction IA via bouton `AI Extraction`.

## Clients

- Portefeuille client avec liste et métadonnées.
- Recherche par nom, canal ou segment.
- Filtre par statut : actif, churné, en pause.
- Statistiques : total clients, clients actifs, revenu total, revenu moyen.
- CRUD clients : ajout, modification, suppression.
- Formulaire client : nom, segment, canal d'acquisition, date, statut, MRR, revenu total, marge brute, coûts directs.

## Marketing & Growth

- Suivi des métriques marketing et d'acquisition.
- KPIs : CAC, LTV, LTV/CAC, payback period, ROI marketing, taux de conversion, dépense marketing, clients acquis, leads, MQL, SQL.
- Graphiques : LTV vs CAC, ROI, dépense vs revenu.
- Entonnoir de conversion leads -> MQL -> SQL -> clients.
- Analyse du revenu par canal.
- Table de campagnes marketing avec édition et suppression.
- CRUD métriques marketing.

## Prévisions

- Sélection de scénarios financiers prédéfinis.
- Projections de cash et runway sur 12 mois.
- Simulateur de scénarios :
  - variation des revenus ;
  - variation des dépenses ;
  - coût d'embauche.
- Préréglages "What-if" et saisie manuelle via sliders/champs.
- Comparaison de scénarios avec écarts.
- Graphiques de projection et d'évolution du cash.

## Rapports

- Rapports financiers et insights automatisés.
- Synthèse mensuelle : revenu, dépenses, cashflow net.
- Santé financière : marge brute, burn rate, runway, cash disponible.
- Résumé marketing : CAC, clients acquis, taux de conversion, ROI marketing.
- Économie unitaire : ARPU, LTV, LTV/CAC, payback period.
- Rétention : churn rate, retention, MRR, clients actifs.
- Structure financière : leverage ratio, DSO, DIO, DPO, CCC.
- Visualisation de concentration des revenus.
- Analyse de cohortes.
- Cartes d'insights dynamiques.

## Paramètres

- Interface en onglets : profil, notifications, sécurité, facturation, préférences.
- Profil : photo, nom, prénom, email, téléphone, entreprise.
- Notifications : email, transactions, rapports hebdomadaires, facturation, marketing.
- Sécurité : changement de mot de passe, confirmation, longueur minimale, toggle 2FA, alertes de connexion.
- Facturation : plans Starter/Pro/Enterprise, moyen de paiement, historique et téléchargement de facture.
- Préférences d'interface.

## Sécurité Et Privacy

- Variables d'environnement sensibles exclues du versioning.
- Clé Supabase publishable côté frontend uniquement.
- Clé Supabase service role limitée au serveur Express.
- Middleware Super Admin avec vérification JWT Supabase et whitelist `SUPER_ADMIN_EMAILS`.
- CORS whitelist via `ADMIN_CORS_ORIGINS`.
- Rate limiting en mémoire sur `/api/admin/*` et `/api/export`.
- Journalisation applicative prévue pour les actions sensibles SA via `admin_audit_logs`.
- Script Supabase `supabase/privacy-hardening.sql` :
  - `admin_audit_logs` ;
  - `privacy_requests` ;
  - `data_retention_policies`.
- Documentation `docs/privacy-readiness.md`, base nLPD suisse + RGPD si applicable.
- Les mots de passe, tokens, hash de mots de passe et secrets API ne sont pas journalisés.

## Exports Et Utilitaires

- Thème global (`ThemeProvider`) avec bascule dark/light.
- Sélecteur de devise (`CurrencyProvider`) : CHF, EUR, USD.
- Sélecteur de période (`DateRangeBar`) avec presets, calendrier personnalisé, comparaisons et devise.
- Toasts de notifications.
- Chargement différé avec `Suspense`.
- Export CSV/PDF via `PeriodComparator`, `ExportActions` et serveur Express.
- Composants UI réutilisables : cartes, tableaux, modaux, boutons, badges, formulaires.
- Données mockées et calculs de métriques dans `src/app/lib` et `src/app/contexts`.

## Architecture Technique

- Application montée avec Vite.
- Architecture orientée `features`, `components`, `contexts`, `shared`.
- Routage centralisé dans `src/app/routes.ts`.
- Chargement paresseux des pages et sections critiques.
- Logique métier centralisée via `MetricsContext`, `CurrencyContext`, `DateRangeContext`, `ThemeContext` et `AuthContext`.
- Serveur Express optionnel pour exports et opérations Super Admin sécurisées.
- Supabase pour Auth, base de données, RLS et politiques multi-tenant.

