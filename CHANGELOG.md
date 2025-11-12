# Changelog - ListX

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [1.2.8] - 2025-11-12

### 🐛 Correctifs

- **Fix CRITIQUE : Race condition de sauvegarde** : Correction définitive du problème de sauvegarde à 0 pendant le chargement
  - Remplacement du système de déblocage dans `finally` par un useEffect de surveillance
  - Ajout d'un compteur `loadingExpectedCount` pour attendre que React mette à jour l'état
  - Le déblocage ne se fait plus qu'après confirmation que les documents sont réellement dans l'état
  - Résolution définitive de la séquence : chargement → sauvegarde à 0 → perte de documents

### 📝 Note technique

React setState est asynchrone - le `finally` block s'exécutait avant que `setDocuments()` ne mette à jour l'état.
Solution : un useEffect surveille `documents.length` et ne débloque la sauvegarde qu'après confirmation de la mise à jour.

---

## [1.2.7] - 2025-11-12

### 🐛 Correctifs

- **Fix : Protection contre la sauvegarde pendant le chargement** : Les documents ne sont plus écrasés à 0 pendant le rechargement
  - Ajout d'un flag `isLoadingDocuments` pour bloquer la sauvegarde pendant le chargement
  - La sauvegarde ne se déclenche plus avec `Documents: 0` pendant le chargement
  - Résolution de la séquence : chargement → sauvegarde à 0 → perte de documents

### 📝 Note technique

Le useEffect de sauvegarde se déclenchait pendant que le chargement était en cours, créant une fenêtre où `documents` était vide.
Le flag `isLoadingDocuments` empêche maintenant la sauvegarde pendant cette période transitoire.

---

## [1.2.6] - 2025-11-12

### 🐛 Correctifs

- **Fix CRITIQUE : Extraction des IDs** : Correction majeure de l'utilisation des IDs pour le chargement/sauvegarde
  - Les appels à `loadListing()` et `saveListing()` utilisent maintenant `.id` au lieu des objets complets
  - Les documents sont maintenant réellement chargés depuis le Z: (ils retournaient null avant)
  - Les documents sont maintenant réellement sauvegardés sur le Z: avec les bons IDs
  - Résolution du problème "Listing chargé: null" dans les logs

### 📝 Note technique

Le contexte AppContext stocke des objets `{id, name, ...}` mais les fonctions de storage attendent des strings (IDs).
Cette version corrige tous les appels pour extraire `.id` avant de passer aux fonctions de storage.

---

## [1.2.5] - 2025-11-12

### 🐛 Correctifs

- **Fix critique : Rechargement des documents** : Les documents sont maintenant correctement rechargés à chaque retour sur DocumentListingApp
  - Ajout d'une clé de rechargement (loadKey) qui force le refresh à chaque montage
  - Correction du useEffect de chargement qui ne se déclenchait pas au retour
  - Amélioration des logs de debug pour le chargement
  - Les documents ne disparaissent plus quand on navigue entre les pages

### 🔧 Améliorations

- Amélioration de la sauvegarde pour ne pas écraser les métadonnées du listing
- Ajout de logs détaillés pour le debug du chargement/sauvegarde

---

## [1.2.4] - 2025-11-12

### 🐛 Correctifs

- **Fix erreur de build** : Correction de l'import storageService (loadData → loadListing)
- Validation du build avant release

---

## [1.2.3] - 2025-11-12

### 🐛 Correctifs

- **Fix critique : Export/Import des documents** : Les documents ajoutés dans les listes sont maintenant correctement inclus dans les exports JSON
  - Les documents sont sauvegardés dans la structure centralisée (clients → projets → listes → documents)
  - Les documents se synchronisent correctement sur le Z:
  - Les documents sont restaurés lors des imports sur un autre poste
  - Correction du système de sauvegarde qui utilisait uniquement localStorage

### 🔧 Améliorations

- Migration du stockage des documents vers le service centralisé (storageService)
- Ajout d'un fallback pour la rétro-compatibilité avec l'ancien système localStorage
- Amélioration de la robustesse du chargement et sauvegarde des documents

---

## [1.1.1] - 2025-10-29

### 🔧 Améliorations

- **Inversion des icônes Import/Export** : Icônes plus intuitives
  - Import : Icône Download (⬇️) - télécharger/importer des données
  - Export : Icône Upload (⬆️) - envoyer/exporter des données
- **Réorganisation de l'ordre des boutons** : Import à gauche, Export à droite
- Amélioration de la cohérence visuelle dans toute l'application

---

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
