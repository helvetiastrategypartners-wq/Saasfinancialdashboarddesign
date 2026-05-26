# Privacy readiness

Derniere mise a jour: 2026-05-26

Ce document liste ce qui est implemente dans le projet et ce qui doit rester une procedure organisationnelle ou une configuration externe.

Objectif: fournir une base de protection des donnees compatible avec une activite suisse, notamment la nLPD/FADP, et avec le RGPD lorsque le service cible ou traite des personnes situees dans l'UE. Ce document n'est pas un avis juridique.

## Etat actuel

- Authentification deleguee a Supabase Auth.
- Mots de passe geres par Supabase Auth, jamais stockes dans les tables applicatives.
- Espace Super Admin separe du dashboard financier.
- Cle `SUPABASE_SERVICE_ROLE_KEY` uniquement cote serveur Express.
- RLS activee sur les tables sensibles et vues configurees en `security_invoker`.
- Creation de compte entreprise avec mot de passe temporaire et changement force.
- Actions sensibles SA confirmees par recopie de l'adresse mail.
- Rate limiting en memoire sur `/api/admin/*` et `/api/export`.
- Journalisation applicative prevue via `public.admin_audit_logs`.

## SQL a appliquer

Executer `supabase/privacy-hardening.sql` dans Supabase SQL Editor.

Ce script cree:

- `public.admin_audit_logs`: traces des actions sensibles SA.
- `public.privacy_requests`: registre interne des demandes de protection des donnees.
- `public.data_retention_policies`: decisions de conservation documentees.

Les tables ont RLS activee et aucun acces direct `anon` / `authenticated`. Le backend y accede avec la service role.

## Donnees personnelles traitees

- Identite utilisateur: email, nom complet, UUID Supabase.
- Donnees d'entreprise: nom entreprise, devise, `company_id`.
- Donnees financieres: transactions, clients, marketing, creances, dettes, objectifs, inventaire selon les tables actives.
- Donnees techniques: IP, user-agent et horodatage pour les actions sensibles.

## Bases legales / motifs probables

- Execution du contrat: acces au dashboard et gestion des comptes entreprises.
- Interet legitime: securite, logs d'audit, prevention des abus.
- Obligation legale: conservation de certains documents financiers/comptables selon juridiction.

Valider cette section avec un referent juridique avant production, notamment selon le marche vise: Suisse uniquement, Suisse + UE, ou traitement de personnes situees dans l'UE.

## Durees de conservation

Recommandation initiale:

- Logs d'audit SA: 12 mois glissants.
- Demandes de protection des donnees: 5 ans apres cloture.
- Comptes utilisateurs: duree du contrat, puis suppression ou anonymisation.
- Donnees financieres: selon obligations comptables applicables au client.
- Exports temporaires: ne pas stocker cote serveur sauf besoin explicite.

## Procedure droits des personnes

Pour une demande d'acces, rectification, effacement, limitation, portabilite ou opposition, si ces droits s'appliquent selon la loi et le contexte:

1. Identifier le demandeur et l'entreprise concernee.
2. Creer une ligne dans `privacy_requests`.
3. Qualifier le type de demande.
4. Repondre sous 30 jours calendaires, sauf extension justifiee.
5. Tracer la cloture dans `privacy_requests.completed_at`.

### Acces / portabilite

- Exporter les donnees du compte et de l'entreprise depuis Supabase.
- Inclure les donnees personnelles, pas les secrets techniques.
- Ne pas exposer les mots de passe, hashes, tokens ou logs internes non pertinents.

### Rectification

- Corriger `profiles.full_name`, email Auth si necessaire, et donnees metier concernees.
- Tracer l'action dans `admin_audit_logs`.

### Suppression

Clarification importante: supprimer un compte Auth retire l'acces utilisateur, mais ne supprime pas automatiquement les donnees financieres de l'entreprise.

Modes possibles:

- Suppression acces: delete Auth user + profile.
- Anonymisation personne: remplacer nom/email metier par valeurs anonymes si conservation comptable necessaire.
- Suppression entreprise: supprimer les donnees metier si aucune obligation de conservation ne s'y oppose.

## Journalisation

A journaliser:

- Creation compte.
- Blocage / deblocage compte.
- Reset mot de passe temporaire.
- Suppression compte.
- Changements de role ou d'entreprise quand cette fonctionnalite existe.

A ne jamais journaliser:

- Mot de passe temporaire.
- Mot de passe final.
- Hash de mot de passe.
- Access token / refresh token.
- Cle service role.
- Secrets API marketing.

## Mesures externes requises

- HTTPS/TLS pour le deploiement Express.
- MFA fortement recommande pour les comptes Super Admin.
- Contrat de sous-traitance / DPA ou accord equivalent avec Supabase et l'hebergeur.
- Politique de confidentialite publiee et accessible.
- Documentation des transferts internationaux de donnees, notamment si les donnees sortent de Suisse/EEE.
- Procedure violation de donnees: detection, qualification, notification autorite/personnes si necessaire.
- Sauvegardes chiffrees et test de restauration.

## Modele court de politique de confidentialite

HSP traite les donnees de compte, d'entreprise et les donnees financieres renseignees dans le dashboard afin de fournir le service, securiser les acces et administrer les comptes clients.

Les donnees sont accessibles uniquement aux utilisateurs autorises de l'entreprise et aux administrateurs habilites. Les mots de passe sont geres par Supabase Auth et ne sont jamais stockes en clair par l'application.

Les donnees sont conservees pendant la duree necessaire a la fourniture du service et selon les obligations legales applicables. Les utilisateurs peuvent demander l'acces, la rectification, l'effacement, la limitation ou la portabilite de leurs donnees via le contact support.

Sous-traitants principaux: Supabase et hebergeur de l'application.
