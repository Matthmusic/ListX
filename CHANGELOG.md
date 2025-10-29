# Changelog - ListX

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.1.0] - 2025-10-29

### ✨ Nouveautés

#### Système de Templates et Champs Personnalisables
- **Interface horizontale à 3 zones** pour une configuration intuitive
  - Zone 1 : Champs disponibles
  - Zone 2 : Ordre formulaire et exports (Excel/PDF)
  - Zone 3 : Ordre nom de fichier
- **Champs personnalisés** : Créez vos propres champs avec libellés modifiables
- **Drag & Drop moderne** avec @dnd-kit (compatible React 19)
  - Glissez entre zones pour activer/désactiver
  - Réorganisez l'ordre au sein de chaque zone
  - Auto-ajout : ajouter à une zone ajoute automatiquement aux deux
- **Bouton X au survol** pour retirer rapidement un champ d'une zone
- **Boutons de copie rapide** pour dupliquer l'ordre entre zones
- **Prévisualisation en temps réel** du nom de fichier généré
- **Gestion des templates**
  - Sauvegardez plusieurs configurations
  - Import/Export en JSON
  - Basculez entre templates en un clic
- **Ordres indépendants** : Formulaire/Exports vs Nom de fichier

### 🔧 Améliorations

- **Interface optimisée** : Design compact qui tient sans scroll
- **Détection de zone améliorée** : Chaque zone utilise des IDs préfixés pour éviter les conflits
- **Suppression intelligente** : Retirer d'une zone ne retire que de cette zone
- **Blocage des mouvements directs** : Impossible de passer directement de Zone 2 à Zone 3 (passer par Zone 1 ou boutons de copie)
- **Feedback visuel** : Codes couleur (Gris/Bleu/Vert), animations au drag, boutons au survol
- **Persistance** : Templates et configurations sauvegardés dans localStorage

### 🐛 Correctifs

- Correction de la détection de collision lors du drag-and-drop
- Fix de la limite de 8 éléments dans les zones droppables
- Correction de l'ordre des champs dans le formulaire
- Fix des champs personnalisés en minuscules (maintenant en MAJUSCULES)

---

## [1.0.4] - 2025-10-28

### ✨ Nouveautés
- Suppression de la colonne N° dans les exports Excel et PDF
- Alignement des noms de colonnes entre PDF et Excel (ÉMETTEUR, N° DOC)
- Remplacement des 2 boutons d'export par un bouton unique avec popup de sélection
- Conservation des infos du dernier document dans les champs de saisie
- Ajout d'un bouton Modifier pour éditer les documents existants

### 🔧 Améliorations
- Simplification de la configuration d'icône (suppression des scripts de génération)
- Modification de la copie d'arborescence (suppression du préfixe avant @)
- Amélioration des animations du glisser-déposer avec feedback visuel
- Suppression du panneau de paramètres (barre d'options)

---

## [1.0.3] - 2025-10-27

### ✨ Nouveautés
- Système de numérotation par ordre d'apparition des catégories
- Couleurs arc-en-ciel basées sur l'ordre d'apparition
- Drag & drop pour réorganiser les documents et catégories
- Renumérotation automatique lors des modifications

### 🔧 Améliorations
- Interface utilisateur améliorée avec background animé
- Favicon personnalisé
- Export Excel avec largeurs de colonnes intelligentes
- Export PDF format A4 paysage optimisé

---

## [1.0.2] - 2025-10-26

### ✨ Nouveautés
- Export Excel professionnel avec logos
- Export PDF professionnel avec logos
- Création d'arborescence de dossiers

### 🔧 Améliorations
- Système d'autocomplete pour les affaires
- Validation des champs obligatoires
- Conversion automatique en majuscules

---

## [1.0.1] - 2025-10-25

### ✨ Nouveautés
- Ajout de documents avec métadonnées complètes
- Numérotation automatique par catégorie
- Suppression de documents

---

## [1.0.0] - 2025-10-24

### ✨ Release initiale
- Application de base pour la gestion de listings de documents
- Support Electron pour version desktop
- Persistance localStorage

---

*Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/)*
