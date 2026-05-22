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
- `Layout` global avec barre de navigation et zone de contenu.

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
