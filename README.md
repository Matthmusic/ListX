# ListX - Générateur de Listing Documents

Application desktop (Electron) pour la génération et la gestion de listings de documents techniques pour les bureaux d'études.

## ✨ Nouveautés v1.3.0

### Stockage serveur configurable
- **Dossier de stockage personnalisable** : Choisissez librement l'emplacement de vos données (réseau, local, cloud sync)
- **Configuration au premier lancement** : Interface intuitive pour sélectionner le dossier
- **Architecture simplifiée** : Suppression du mode localStorage (stockage serveur uniquement)
- **Pas de synchronisation** : Plus besoin de gérer les conflits, source de vérité unique
- **Migration automatique** : Vos templates existants migrent automatiquement vers le nouveau système
- **Sauvegardes automatiques** : 5 backups conservés à chaque modification
- **Partage facilité** : Plusieurs utilisateurs peuvent pointer vers le même dossier réseau

## Fonctionnalités principales

### 📁 Gestion hiérarchique
- **Clients** : Organisation par client
- **Projets** : Plusieurs projets par client
- **Listings** : Gestion de listes de documents par projet
- Navigation intuitive avec fil d'Ariane
- Export/Import à tous les niveaux (client, projet, listing)

### 📝 Gestion des documents
- Ajout de documents avec métadonnées complètes (affaire, phase, lot, émetteur, nature, zone, niveau, format, indice, nom)
- Numérotation automatique par catégorie dans l'ordre d'apparition
- Glisser-déposer pour réorganiser les documents et les catégories
- Duplication et suppression de documents
- Conservation des informations du dernier document ajouté
- Bouton "Modifier" pour éditer les documents existants
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
- Sauvegarde automatique dans le stockage serveur
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
    1. AFFAIRE, PHASE, LOT, ÉMETTEUR, NATURE
    2. N° DOC (numéro généré complet)
    3. ETAT, ZONE, NIVEAU, FORMAT, INDICE
    4. DESCRIPTION DU DOC
    5. NOM DU FICHIER
  - Colonnes adaptées automatiquement aux champs utilisés
  - **Système de couleurs arc-en-ciel** basé sur l'ordre d'apparition des catégories :
    - 1ère catégorie utilisée → Bleu pâle
    - 2ème catégorie → Cyan pâle
    - 3ème catégorie → Vert pâle
    - 4ème catégorie → Jaune pâle
    - 5ème catégorie → Orange pâle
    - 6ème catégorie → Violet pâle
  - Largeurs de colonnes intelligentes :
    - Colonnes compactes (PHASE, NATURE, N° DOC, FORMAT, INDICE) : largeur 10
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
  - Même ordre de colonnes que l'export Excel (sans colonne N° de ligne)
  - Même système de couleurs arc-en-ciel basé sur l'ordre des catégories
  - Format A4 paysage
  - Largeur optimisée (tableau aligné sur le titre)
- **Renumérotation automatique** avant export pour garantir l'ordre correct

#### Création d'arborescence
- Génération automatique de la structure de dossiers
- Organisation par nature de document
- Compatible avec l'API File System moderne

### 🎯 Système de Templates et Champs Personnalisables

#### Configuration des champs
- **Interface horizontale à 3 zones** pour une configuration intuitive :
  - **ZONE 1 - Champs Disponibles** : Tous les champs non utilisés (par défaut + personnalisés)
  - **ZONE 2 - Formulaire et Exports** : Définit l'ordre des champs dans le formulaire et les exports Excel/PDF
  - **ZONE 3 - Nom de Fichier** : Définit l'ordre des champs dans le nom de fichier généré

#### Gestion des champs
- **Champs par défaut** (non modifiables) : AFFAIRE, PHASE, LOT, EMETTEUR, NATURE, ETAT, NUMERO, ZONE, NIVEAU, FORMAT, INDICE
- **Champs personnalisés** : Créez vos propres champs avec libellés personnalisables
- **Drag & Drop** :
  - Glissez de Zone 1 → Zone 2 ou Zone 3 pour activer un champ
  - Glissez de Zone 2/3 → Zone 1 pour désactiver un champ
  - Réorganisez l'ordre au sein de chaque zone
  - Auto-ajout : Ajouter à Zone 2 ou 3 ajoute automatiquement aux deux
- **Bouton X au survol** : Retirez rapidement un champ d'une zone spécifique
- **Boutons de copie rapide** :
  - "COPIER ORDRE EN BAS" : Zone 2 → Zone 3
  - "COPIER ORDRE EN HAUT" : Zone 3 → Zone 2

#### Templates
- **Sauvegarde de configurations** : Créez plusieurs templates avec différentes organisations
- **Import/Export** : Partagez vos templates en JSON
- **Template par défaut** : Fourni avec tous les champs standards
- **Persistance** : Sauvegarde automatique sur le serveur (partagés entre utilisateurs)
- **Application rapide** : Basculez entre templates en un clic

#### Ordres indépendants
- **Ordre Formulaire/Exports** : Contrôle l'affichage dans le formulaire d'ajout et les colonnes Excel/PDF
- **Ordre Nom de Fichier** : Contrôle la séquence des champs dans le nom du fichier généré
- **Prévisualisation en temps réel** : Visualisez le nom de fichier qui sera généré

#### Interface optimisée
- **Design compact** : Tout tient sans scroll pour une utilisation rapide
- **Codes couleur** : Gris (disponibles), Bleu (formulaire/exports), Vert (nom de fichier)
- **Feedback visuel** : Animations au drag, boutons au survol, zones clairement identifiées

### 🔄 Mises à jour automatiques
- **Vérification automatique** au démarrage
- **Notification dans l'interface** quand une mise à jour est disponible
- **Installation en un clic** ou au prochain redémarrage
- **Système sécurisé** via GitHub Releases

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
- **Vite 7** : Build tool et dev server ultra-rapide
- **Tailwind CSS** : Styling avec animations personnalisées (vagues animées)
- **Lucide React** : Icônes modernes
- **@dnd-kit** : Bibliothèque drag-and-drop moderne et accessible (compatible React 19)
- **jsPDF + jspdf-autotable** : Génération PDF professionnelle
- **ExcelJS** : Génération Excel avec mise en forme avancée
- **Electron 38** : Application desktop native multiplateforme
- **electron-updater** : Système de mise à jour automatique
- **Stockage serveur** : Fichiers JSON sur dossier configurable (réseau/local)

## Installation

### En tant qu'utilisateur

1. Téléchargez le dernier installateur depuis [Releases](https://github.com/Matthmusic/ListX/releases)
2. Exécutez l'installateur `ListX-Setup-X.X.X.exe`
3. Au premier démarrage, sélectionnez le dossier de stockage
4. L'application se mettra à jour automatiquement

### En tant que développeur

```bash
npm install
```

## Développement

### Mode Web (développement rapide)

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173/`

**Note** : En mode web, certaines fonctionnalités Electron (sélection de dossier, auto-update) ne seront pas disponibles.

### Mode Desktop Electron (test complet)

```bash
npm run electron:dev
```

Une fenêtre Electron s'ouvrira avec votre application complète.

## Build production

### Version Desktop (Application Windows)

```bash
npm run electron:build:win
```

L'installateur sera créé dans le dossier `release/`

**Pour déployer en production** :
1. Créez un tag Git : `git tag v1.X.X && git push origin v1.X.X`
2. GitHub Actions build automatiquement et crée une release
3. Les utilisateurs reçoivent la notification de mise à jour

### Version Web uniquement

```bash
npm run build
```

Les fichiers statiques seront générés dans `dist/`

## Structure du stockage

### Fichier de données (`data.json`)

```json
{
  "clients": {
    "1234567890": {
      "name": "Client A",
      "createdAt": "2025-01-13T...",
      "projects": {
        "1234567891": {
          "name": "Projet 1",
          "createdAt": "2025-01-13T...",
          "listings": {
            "1234567892": {
              "name": "Liste documents",
              "createdAt": "2025-01-13T...",
              "updatedAt": "2025-01-13T...",
              "documents": [...]
            }
          }
        }
      }
    }
  },
  "templates": [
    {
      "name": "PAR DÉFAUT",
      "fieldsOrderDisplay": [...],
      "fieldsOrderFilename": [...],
      "activeFields": [...],
      "customFields": [...]
    }
  ]
}
```

### Sauvegardes automatiques

Le dossier contient également :
- `data.backup.1234567890.json` (5 backups conservés)

## Structure des noms de fichiers

Format : `AFFAIRE_PHASE_LOT_EMETTEUR_NATURE_NUMERO_ZONE_NIVEAU_FORMAT_INDICE - NOM`

Exemple : `ASELYS_PRO_LOT1_BET_NDC_201_ZONE1_R+1_A3_A - BILAN DE PUISSANCE`

## Interface utilisateur

### Design
- **Background animé** : Vagues animées en bleu foncé (#1e3a8a) pour une ambiance professionnelle
- **Favicon personnalisé** : Logo ListX-cmpct.svg dans l'onglet
- **Système de couleurs arc-en-ciel** :
  - Badges de catégories colorés selon leur ordre d'apparition
  - Titres de sections avec fond coloré correspondant
  - Cohérence visuelle totale entre interface, exports Excel et PDF
- **Responsive** : Interface adaptée aux différentes tailles d'écran
- **Thème sombre** : Application en mode sombre (natif Windows)

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

### Persistance et sauvegarde
- Sauvegarde automatique après chaque modification
- 5 backups automatiques conservés
- Structure JSON lisible et versionnable
- Partage facile entre utilisateurs (dossier réseau)

## Sécurité

- **Context Isolation** : Isolation complète du processus renderer
- **Preload Script** : API stricte exposée via IPC
- **Validation des permissions** : Vérification d'écriture avant configuration
- **DevTools désactivés** en production
- **Mises à jour signées** via GitHub

## Auteur

Bureau d'Études - Pièces Graphiques

## Licence

Usage interne

## Changelog

### v1.3.0 (2025-01-13)
- **BREAKING CHANGE** : Passage au stockage serveur uniquement
- Ajout de la sélection du dossier de stockage au premier lancement
- Suppression du mode localStorage
- Migration automatique des templates
- Suppression du système de synchronisation
- Simplification de l'architecture (~300 lignes de code en moins)
- Amélioration de la stabilité et des performances

### v1.2.x
- Export Excel/PDF professionnel
- Système de templates
- Gestion hiérarchique (Clients/Projets/Listings)
- Drag & drop pour organisation
- Mises à jour automatiques
