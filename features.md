# Fonctionnalités du projet SaaS Financial Dashboard Design

## Navigation et structure
- Application monopage React avec routage client (`react-router` via `src/app/routes.ts`).
- Pages principales disponibles :
  - Dashboard
  - Transactions
  - Factures
  - Clients
  - Marketing & Growth
  - Prévisions (`Forecast`)
  - Rapports
  - Paramètres
- Pages sécurisées disponibles :
  - Login
  - Changement de mot de passe forcé
  - Super Admin
- `Layout` global avec barre de navigation et zone de contenu.

## Authentification et sessions
- Authentification via Supabase Auth.
- Contexte global `AuthProvider` avec session, utilisateur, login, logout et mise à jour du mot de passe.
- Page de connexion dédiée avec affichage/masquage du mot de passe.
- Redirection automatique des utilisateurs non connectés vers `/login`.
- Redirection des comptes Super Admin vers `/super-admin`.
- Parcours de mot de passe temporaire avec changement forcé au premier login via `must_change_password`.
- Validation de complexité mot de passe :
  - 12 caractères minimum
  - Minuscule
  - Majuscule
  - Chiffre
  - Caractère spécial

## Dashboard
- Vue d'ensemble financière multi-KPI.
- Affichage de cartes KPI pour :
  - Cash disponible
  - Revenus
  - Dépenses
  - Marge brute
  - Burn rate
  - Runway estimé
- Graphiques interactifs :
  - Revenus vs dépenses
  - Répartition des dépenses par catégorie
  - Cashflow (barres)
- Sélecteur de période / comparaison via `DateRangeBar`.
- Export de rapport via bouton `DeferredExportButton`.
- Affichage des transactions récentes.
- Grille de synthèse détaillée.

## Transactions
- Liste des transactions avec tableau personnalisable.
- Recherche en texte libre par libellé ou catégorie.
- Filtres :
  - Type (Revenu / Dépense / Tous)
  - Catégorie
- Statistiques dynamiques :
  - Revenus filtrés
  - Dépenses filtrées
  - Différence
- CRUD transactionnel :
  - Ajouter une transaction
  - Modifier une transaction
  - Supprimer une transaction
- Modaux avec formulaires de saisie : type, statut, libellé, catégorie, montant, date, récurrence.
- Notifications toast pour actions réussies.

## Factures
- Gestion des factures fournisseurs.
- Recherche par fournisseur, numéro ou catégorie.
- Filtre par statut (`Emise`, `Payee`, `Remboursement`).
- Statistiques globales :
  - Montant factures payées
  - Montant factures en attente
  - Total remboursements
- Fonction de marquage comme payée.
- CRUD factures :
  - Ajouter une facture
  - Modifier une facture
  - Supprimer une facture
- Simulation d'IA d'extraction via bouton `AI Extraction`.
- Modaux avec formulaires de saisie : fournisseur, catégorie, statut, montant, date, description.

## Clients
- Portefeuille client avec liste et métadonnées.
- Recherche libre par nom, canal ou segment.
- Filtre par statut client (`Actif`, `Churné`, `En pause`).
- Statistiques clients :
  - Total clients
  - Clients actifs
  - Revenu total
  - Revenu moyen
- CRUD clients :
  - Ajouter un client
  - Modifier un client
  - Supprimer un client
- Formulaire client incluant : nom, segment, canal d'acquisition, date d'acquisition, statut, MRR, revenu total, marge brute, coûts directs.

## Marketing et Growth
- Suivi des métriques marketing et d'acquisition.
- Statistiques marketing :
  - CAC
  - LTV
  - Ratio LTV/CAC
  - Payback period
  - ROI marketing
  - Taux de conversion
  - Dépense marketing
  - Clients acquis
  - Leads, MQL, SQL
- Graphiques et visualisations :
  - LTV vs CAC
  - ROI
  - Dépense vs revenu
- Entonnoir de conversion leads → MQL → SQL → clients.
- Analyse du revenu par canal marketing.
- Table de campagnes marketing avec opérations d'édition et suppression.
- CRUD métriques marketing :
  - Ajouter
  - Modifier
  - Supprimer

## Prévisions / Forecast
- Sélection de scénarios financiers prédéfinis.
- Projections de cash et runway sur 12 mois.
- Simulateur de scénarios avec paramètres ajustables :
  - Variation des revenus
  - Variation des dépenses
  - Coût d'embauche
- Préréglages "What-if" ainsi que saisie manuelle via sliders et champs.
- Comparaison de scénarios et affichage des écarts.
- Graphiques de projection et d'évolution du cash.

## Rapports
- Rapports financiers et insights automatisés.
- Synthèse du mois pour :
  - Revenu mensuel
  - Dépenses mensuelles
  - Cashflow net
- Mesures de santé financière :
  - Marge brute
  - Burn rate
  - Runway
  - Cash disponible
- Résumé marketing :
  - CAC
  - Clients acquis
  - Taux de conversion
  - ROI marketing
- Économie unitaire :
  - ARPU
  - LTV
  - LTV/CAC
  - Payback period
- Rétention clients :
  - Churn rate
  - Retention
  - MRR
  - Clients actifs
- Structure financière :
  - Leverage ratio
  - DSO / DIO / DPO
  - CCC
- Visualisation de la concentration des revenus.
- Analyse de cohortes de revenus par mois.
- Cartes d'insights automatiques dynamiques.
- Graphiques de variation des dépenses.

## Paramètres
- Interface en onglets :
  - Profil
  - Notifications
  - Sécurité
  - Facturation
  - Préférences
- Profil utilisateur :
  - Photo de profil
  - Nom, prénom, email, téléphone, entreprise
- Notifications :
  - Email
  - Alertes de transaction
  - Rapports hebdomadaires
  - Alertes de facturation
  - Mises à jour marketing
- Sécurité :
  - Changement de mot de passe
  - Confirmation de mot de passe
  - Validation de longueur minimale
  - Toggle 2FA et alertes de connexion
- Facturation :
  - Gestion de plan d'abonnement (Starter / Pro / Enterprise)
  - Modification du moyen de paiement
  - Historique des factures et téléchargement de facture
- Préférences :
  - Représentation de l'interface et préférences utilisateur

## Super Admin
- Espace Super Admin isolé du dashboard financier.
- Création d'une entreprise et du premier compte utilisateur associé.
- Création de compte via serveur Express avec `SUPABASE_SERVICE_ROLE_KEY` uniquement côté backend.
- Mot de passe temporaire généré/saisi par la SA, puis changement forcé par l'utilisateur.
- Liste des comptes entreprises avec :
  - Email
  - Nom
  - Entreprise
  - Company ID
  - Statut actif/bloqué
  - Dernière connexion
  - Indicateur de mot de passe à changer
- Actions de gestion :
  - Bloquer un compte
  - Débloquer un compte
  - Supprimer l'accès utilisateur
  - Réinitialiser le mot de passe temporaire
- Confirmations de sécurité par recopie de l'adresse email avant action sensible.
- Protection contre l'auto-blocage et l'auto-suppression du compte SA.

## Sécurité et privacy
- Variables d'environnement sensibles exclues du versioning.
- Clé Supabase publishable côté frontend uniquement.
- Clé Supabase service role limitée au serveur Express.
- Middleware d'autorisation Super Admin avec vérification du JWT Supabase et whitelist `SUPER_ADMIN_EMAILS`.
- CORS whitelist via `ADMIN_CORS_ORIGINS`.
- Rate limiting en mémoire sur les routes `/api/admin/*` et `/api/export`.
- Journalisation applicative prévue pour les actions sensibles SA via `admin_audit_logs`.
- Scripts Supabase privacy dans `supabase/privacy-hardening.sql` :
  - `admin_audit_logs`
  - `privacy_requests`
  - `data_retention_policies`
- Documentation privacy dans `docs/privacy-readiness.md`, base nLPD suisse + RGPD si applicable.
- Les mots de passe, tokens, hash de mots de passe et secrets API ne sont pas journalisés.

## Fonctionnalités globales et utilitaires
- Thème global (`ThemeProvider`) avec bascule `dark` / `light`.
- Sélecteur de devise (`CurrencyProvider`) supportant CHF, EUR, USD.
- Barre de sélection de période (`DateRangeBar`) avec :
  - Presets de date
  - Calendrier personnalisé
  - Comparaisons de période
  - Sélecteur de devise
- Toasts de notifications via composant `useToast`.
- Effets visuels et chargement différé (`Suspense` + placeholders).
- Export CSV / PDF pour comparaisons (via `PeriodComparator` et `ExportActions`).
- Composants UI réutilisables : cartes, tableaux, modaux, boutons, badges, etc.
- Données mockées et calculs de métriques dans `src/app/lib` et `src/app/contexts`.

## Notes techniques
- Application montée avec Vite.
- Architecture orientée `features` + `components` + `contexts`.
- Chargement paresseux des pages et sections critiques.
- Données et logique métier centralisées via `MetricsContext`, `CurrencyContext`, `DateRangeContext`, `ThemeContext`.
- Serveur Express optionnel pour exports et opérations Super Admin sécurisées.
