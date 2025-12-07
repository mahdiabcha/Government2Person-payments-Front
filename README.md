# Government2Person-payments-Front

## Vue d’ensemble

**Government-to-Person (G2P) Payments Portal** est le front-end web d’une plateforme de gestion des aides financières publiques destinées aux ménages vulnérables.  
L’application couvre le parcours complet **citoyen + administrateur** :  
**inscription → enrôlement → éligibilité → suivi des demandes → paiements → notifications**. :contentReference[oaicite:3]{index=3}

Ce front a été développé après un PoC basé sur **OpenG2P**, dont les limites (doc incomplète, couplage fort, dépendances Python/Odoo, personnalisation difficile) ont motivé une réimplémentation interne **plus simple, modulaire et maîtrisée**. :contentReference[oaicite:4]{index=4}

---

## Objectifs

- Digitaliser de bout en bout la distribution des aides sociales.
- Offrir une expérience citoyen claire et traçable (statuts visibles, historique).
- Permettre à l’administrateur de gérer programmes, cycles et paiements depuis une seule interface.
- Réduire erreurs/fraudes via un enrôlement structuré et un suivi des droits de paiement. :contentReference[oaicite:5]{index=5}

---

## Fonctionnalités

### Acteur 1 : Citoyen (bénéficiaire)
- **Création de compte** et connexion sécurisée.
- **Complétion/gestion du profil** (infos personnelles et socio-économiques).
- **Vérification d’éligibilité** aux programmes actifs.
- **Demande d’enrôlement** dans un programme d’aide.
- **Suivi de statut des demandes** : en attente / approuvée / rejetée.
- **Recevoir et consulter les paiements** (historique + état).
- **Notifications** relatives à l’enrôlement et aux paiements. :contentReference[oaicite:6]{index=6}

### Acteur 2 : Administrateur
- **Création et activation de programmes**.
- **Définition des règles d’éligibilité** par programme.
- **Gestion des cycles d’aide** (périodes de versement).
- **Approbation / rejet des enrôlements** soumis par les citoyens.
- **Préparation et approbation des droits de paiement**.
- **Création et dispatch des lots (batchs) de paiement**. :contentReference[oaicite:7]{index=7}:contentReference[oaicite:8]{index=8}

> Tech principale : Angular 17 (Angular CLI) + TailwindCSS.

---

## Stack technique

- **Angular 17 / TypeScript** (SPA)
- **TailwindCSS** (styles utilitaires)
- **SCSS** pour les styles globaux (si utilisés dans `src/styles.*`)
- **Proxy Angular** pour éviter le CORS en dev (`proxy.conf.json`)

---

## Prérequis

- **Node.js** ≥ 18 (recommandé LTS)
- **npm** ≥ 9
- **Angular CLI** 17.x

```bash
npm install -g @angular/cli@17

