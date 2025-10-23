# ListX - Générateur de Listing Documents

Application web pour la génération et la gestion de listings de documents techniques pour les bureaux d'études.

## Fonctionnalités principales

### 📝 Gestion des documents
- Ajout de documents avec métadonnées complètes (affaire, phase, lot, émetteur, nature, zone, niveau, format, indice, nom)
- Numérotation automatique par catégorie dans l'ordre d'apparition
- Glisser-déposer pour réorganiser les documents et les catégories
- Suppression de documents
- Validation des champs obligatoires
- Limitation de caractères (5 max pour Lot, Zone, Niveau)

### 🎨 Organisation intelligente
- **Numérotation par ordre d'apparition** : La première catégorie créée obtient 1XX, la deuxième 2XX, etc.
- **Réorganisation par drag & drop** : Déplacez les catégories pour modifier leur numérotation
- **Renumérotation automatique** : Les numéros se mettent à jour automatiquement lors des modifications
- Deux modes de numérotation :
  - Par catégorie : 101, 102, 201, 202...
  - Générale séquentielle : 001, 002, 003...

### 💾 Gestion des affaires
- Système d'autocomplete pour les affaires existantes
- Sauvegarde automatique dans le localStorage
- Chargement de l'affaire précédente au démarrage
- Création de nouvelles affaires à la volée

### 📤 Exports multiples

#### Export Excel professionnel
- **En-tête personnalisable avec logos** :
  - Zone logo client (2 colonnes fusionnées)
  - Zone titre centrale (nom du projet)
  - Zone logo bureau d'études (dernière colonne)
  - Nom de la liste en sous-titre
- **Tableau dynamique** :
  - Ordre des colonnes optimisé :
    1. N° (numéro de ligne)
    2. AFFAIRE, PHASE, LOT, ÉMETTEUR, NATURE
    3. N° DOC (numéro généré complet)
    4. ETAT, ZONE, NIVEAU, FORMAT, INDICE
    5. DESCRIPTION DU DOC
    6. NOM DU FICHIER
  - Colonnes adaptées automatiquement aux champs utilisés
  - **Système de couleurs arc-en-ciel** basé sur l'ordre d'apparition des catégories :
    - 1ère catégorie utilisée → Bleu pâle
    - 2ème catégorie → Cyan pâle
    - 3ème catégorie → Vert pâle
    - 4ème catégorie → Jaune pâle
    - 5ème catégorie → Orange pâle
    - 6ème catégorie → Violet pâle
  - Largeurs de colonnes intelligentes :
    - Colonnes compactes (N°, PHASE, NATURE, N° DOC, FORMAT, INDICE) : largeur 10
    - NOM DU FICHIER : auto-adaptatif selon contenu (min 25, max 60)
    - DESCRIPTION DU DOC : auto-adaptatif (min 20, max 45)
    - Autres colonnes : auto-adaptatif (min 12, max 20)
  - Cadre gris avec offset pour une meilleure présentation
- **Renumérotation automatique** avant export pour garantir l'ordre correct

#### Export PDF professionnel
- **En-tête personnalisable** :
  - Upload de logos client et bureau d'études (ratios préservés)
  - Nom du projet et nom de la liste personnalisés
- **Tableau dynamique** :
  - Même ordre de colonnes que l'export Excel
  - Numérotation de ligne (N°) pour faciliter les références
  - Même système de couleurs arc-en-ciel basé sur l'ordre des catégories
  - Format A4 paysage
  - Largeur optimisée (tableau aligné sur le titre)
- **Renumérotation automatique** avant export pour garantir l'ordre correct

#### Création d'arborescence
- Génération automatique de la structure de dossiers
- Organisation par nature de document
- Compatible avec l'API File System moderne

### ⚙️ Paramètres
- Mode de numérotation configurable (par plage/séquentiel)
- Visualisation de l'ordre des catégories
- Sauvegarde des préférences

## Types de documents supportés

- **NOT** : Notice
- **NDC** : Note de Calcul
- **PLN** : Plan
- **SYN** : Synoptique
- **SCH** : Schéma
- **LST** : Listing

## Phases supportées

DIAG, APS, APD, AVP, PRO, DCE, ACT, EXE

## Formats supportés

A0+, A0, A1, A2, A3, A4

## Technologies utilisées

- **React 19** : Framework UI
- **Vite** : Build tool et dev server
- **Tailwind CSS** : Styling avec animations personnalisées (vagues animées)
- **Lucide React** : Icônes
- **jsPDF + jspdf-autotable** : Génération PDF
- **ExcelJS** : Génération Excel avec mise en forme avancée
- **LocalStorage** : Persistence des données
- **Electron** : Application desktop native
- **electron-updater** : Système de mise à jour automatique

## Installation

```bash
npm install
```

## Développement

### Mode Web (développement rapide)

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173/`

### Mode Desktop Electron (test complet)

```bash
npm run electron:dev
```

Une fenêtre Electron s'ouvrira avec votre application.

## Build production

### Version Desktop (Application Windows)

```bash
npm run electron:build:win
```

L'installateur sera créé dans le dossier `release/`

**Pour déployer en production** : Voir [QUICKSTART.md](QUICKSTART.md) ou [DEPLOIEMENT.md](DEPLOIEMENT.md)

### Version Web uniquement

```bash
npm run build
```

## Structure des noms de fichiers

Format : `AFFAIRE_PHASE_LOT_EMETTEUR_NATURE_NUMERO_ZONE_NIVEAU_FORMAT_INDICE - NOM`

Exemple : `ASELYS_PRO_LOT1_BET_NDC_201_ZONE1_R+1_A3_A - BILAN DE PUISSANCE`

## Interface utilisateur

### Design
- **Background animé** : Vagues animées en bleu foncé (#1e3a8a) pour une ambiance professionnelle
- **Favicon personnalisé** : Logo ListX-cmpct.svg dans l'onglet du navigateur
- **Boutons cohérents** : Bouton "Ajouter un document" avec la même couleur que le background (#1e3a8a)
- **Système de couleurs arc-en-ciel** :
  - Badges de catégories colorés selon leur ordre d'apparition
  - Titres de sections avec fond coloré correspondant
  - Cohérence visuelle totale entre interface, exports Excel et PDF
- **Responsive** : Interface adaptée aux différentes tailles d'écran

## Fonctionnalités avancées

### Numérotation intelligente
- La numérotation s'adapte automatiquement à l'ordre de création des catégories
- Évite les "trous" dans la numérotation si certaines catégories ne sont pas utilisées
- Renumérotation en temps réel lors du drag & drop

### Validation des données
- Champs obligatoires : Affaire, Phase, Nature, Format, Indice, Nom
- Conversion automatique en majuscules
- Limitation de caractères pour Lot, Zone et Niveau (5 caractères max)
- Notification des erreurs et succès

### Persistance
- Sauvegarde automatique après chaque modification
- Chargement automatique de la dernière affaire au démarrage
- Historique des affaires accessibles via autocomplete

## Auteur

Bureau d'Études - Pièces Graphiques

## Licence

Usage interne
