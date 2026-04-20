Correctifs globaux — toutes pages
P1
Remplacer FinConsult / Strategy & Finance par le logo HSP (Helvetia Strategy Partners) dans la sidebar. Sous-titre : Strategy & Finance peut rester mais le nom doit être HSP.
P1
Remplacer l'icône rouge générique dans la sidebar par le logo héraldique HSP (blason blanc sur fond rouge #E02020). C'est le seul élément de marque visible en permanence.
P1
Harmoniser la devise : l'app mélange CHF et $ selon les pages. Choisir CHF partout (contexte Suisse/HSP) ou paramétrer une variable globale currency.
P2
Supprimer help@finconsult.io en bas de sidebar. Remplacer par management@hspgroup.ch ou simplement supprimer.
P2
Couleur accent bleu (#378ADD) utilisée pour les revenus positifs : incohérente avec la DA HSP. Remplacer par blanc ou gris clair pour les valeurs neutres, garder le rouge HSP #E02020 pour alertes et CTA uniquement.
P3
Ajouter un favicon HSP et le <title> de l'app : actuellement probablement générique Figma Make.
Page Dashboard
Dashboard
Vue d'ensemble finances
P1
Le graphique "Revenus vs Dépenses" est plat et sans contexte. Ajouter une ligne de référence (objectif mensuel) et des annotations sur les points d'inflexion. Les deux courbes rouge/bleu se ressemblent trop — utiliser rouge #E02020 pour dépenses, blanc pour revenus.
P1
Donut "Répartition des Dépenses" : 3 couleurs trop proches (rouge vif, bleu, rouge foncé). Utiliser : rouge HSP pour la part dominante, #555 gris moyen, #888 gris clair, #aaa pour les petites parts. Lisible en projection.
P2
Les 4 KPI cards n'ont pas de contexte (vs objectif ? vs mois dernier ?). Ajouter sous chaque chiffre une micro-ligne : +12.5% vs mois dernier en vert ou rouge selon la direction — cohérent avec ce qui est déjà fait sur la page Rapports.
P2
La section "Transactions Récentes" est trop granulaire pour un écran de pilotage. La réduire à 3 lignes max avec un lien "Voir tout →" ou la déplacer en bas de page hors du viewport initial.
Page Transactions
Transactions
Revenus & dépenses
P1
Les libellés sont en anglais : Monthly subscription renewals, AWS cloud hosting, January salary payments. Passer en français ou prévoir une règle de saisie. Incohérent avec les autres pages en français.
P1
La card "Différence" affiche $9 500 en rouge alors que c'est potentiellement un solde négatif (dépenses > revenus filtrés). Ajouter un signe explicite − ou + et une icône directionnelle. Le rouge seul est ambigu.
P2
Les catégories sont en anglais : Product Sales, Direct Costs. Franciser : Ventes produit, Coûts directs — ou les lier à un référentiel de catégories paramétrable.
P3
Le bouton "+ Ajouter une transaction" est en blanc sur fond noir — bien. Mais le style (outline blanc) diffère du rouge utilisé sur la page Clients. Harmoniser : soit tous les CTA primaires en rouge HSP, soit tous en blanc outline.
Page Factures
Factures
Fournisseurs & paiements
P1
La card "Factures payées" est vide (pas de montant affiché). Bug ou donnée manquante à corriger — c'est la première chose visible et elle est creuse.
P1
Le bouton "AI Extraction" est en violet #7C3AED — couleur étrangère à la charte HSP. Remplacer par rouge HSP #E02020 ou blanc outline pour rester dans la palette.
P2
Le badge statut "Émise" (bleu) est le seul statut visible. Prévoir et documenter les 4 états : Émise (bleu), Payée (vert), En retard (rouge), En attente (gris) — avec couleurs cohérentes sur toutes les pages.
P2
Catégories en anglais : Infrastructure, Software — à franciser en Infrastructure (ok), Logiciel.
Page Clients
Clients
Portefeuille & relations
P1
Noms de contacts fictifs John Doe, Marie Dupont, Pierre Martin à remplacer par des placeholders neutres type Contact principal ou des initiales dans les données de démo. En RDV client, ça fait template non finalisé.
P2
La colonne "Revenu" par client ne distingue pas revenu brut vs marge. Pour un outil HSP orienté décision, ajouter LTV et/ou CAC par client serait le vrai différenciateur.
P2
Les avatars initiales sont sur fond rouge HSP — cohérent, c'est bien. Mais "Acme Corporation / John Doe" est un placeholder trop générique. Vérifier que les données de démo reflètent le type de clients réels HSP (PME CH/FR).
P3
Pas de tri ni de filtre par revenu/statut visible au premier coup d'œil. Le filtre "Tous les statuts" existe mais le tri par revenu décroissant devrait être le défaut — c'est l'ordre naturel pour un consultant en RDV.
Page Marketing & Growth
Marketing & Growth
ROI & acquisition
P1
Les KPI cards sont empilées en 3 rangées distinctes (ligne 1 : 4 cards, ligne 2 : 2 cards, ligne 3 : 1 card). Hiérarchie incohérente. Réorganiser en 2 rangées max : KPI critiques (CAC, ROAS, Clients acquis, Dépense) en ligne 1, secondaires en ligne 2.
P1
Le graphique "ROI % par canal" utilise du bleu uni #4A90E2 — couleur hors charte. Remplacer par rouge HSP pour le meilleur canal, gris dégradé pour les autres. Permet de lire instantanément quel canal performer.
P1
Le graphique "Dépense vs Revenu par canal" utilise rouge/vert. Le vert est absent de la charte HSP. Remplacer vert par blanc ou gris clair pour "Revenu", garder rouge pour "Dépense". Ajouter une légende explicite dans le graphique.
P2
La table "Détail des campagnes" n'a pas de ligne de total en bas. Ajouter une ligne Total avec somme Dépense, Leads, Clients, et ROAS moyen pondéré — essentiel pour le RDV client.
Page Rapports & Insights
Rapports & Insights
Santé & points d'action
P1
C'est la page la plus forte de l'app — les "Insights Automatiques" (CAC +18%, Runway < 6 mois, Churn +2.1%) sont exactement le différenciateur HSP. Remonter un résumé de ces alertes sur le Dashboard principal (widget "3 alertes actives →").
P1
Le ratio LTV/CAC affiché est 2.5x avec la mention "Seuil 3x" — c'est en dessous du seuil sain. Ajouter une couleur d'alerte rouge sur la card et un lien vers l'insight correspondant. Actuellement c'est neutre visuellement malgré le problème.
P2
Le Cashflow net -$5,500 est en rouge mais le sous-titre dit "En amélioration" en gris discret. Cette contradiction doit être résolue : soit couleur orange (situation critique mais qui s'améliore), soit séparer visuellement valeur absolue et tendance.
P2
Les insights ont un lien d'action ("→ Optimiser les campagnes", "→ Réduire les coûts") mais ces liens ne pointent nulle part. Les connecter aux pages correspondantes : Marketing pour le CAC, Prévisions pour le Runway.
P3
Ajouter un bouton "Exporter en PDF" sur cette page. C'est le document de synthèse naturel à partager après un RDV client — c'est l'usage "support de vente" décrit dans le brief.