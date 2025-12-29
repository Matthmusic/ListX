# Changelog - ListX

## [1.3.17] - 2025-12-29

### Correctifs

- **Correction CRITIQUE de l'icône Windows** : Résolution du problème d'icône Electron dans la barre des tâches.
  - Activation de la modification de l'exécutable (`signAndEditExecutable` rétabli).
  - Intégration réelle du logo LX.ico dans l'exécutable via rcedit.
  - Utilisation de `src/assets/LX.ico` comme source officielle pour le build.
  - Script de nettoyage du cache d'icônes Windows amélioré.

---

## [1.3.12] - 2025-11-21

### Correctifs

- Retour à la config d'icône validée (v1.3.10) : icône LX en PNG/ICO packagée dans resources/assets et utilisée pour l'installeur/raccourcis.

---
## [1.3.11] - 2025-11-21

### Correctifs

- Icône ListX forçée en .ico (multi-tailles) dans le runner Windows et packagée en resources/build pour la barre des tâches/raccourcis.

---

## [1.3.10] - 2025-11-21

### Correctifs

- Icone ListX empaquetee comme ressource dediee (PNG/ICO/SVG) et chargee depuis resources/assets pour eviter toute chute sur licone Electron en production.

---

## [1.3.8] - 2025-11-21

### Correctifs

- Ic¶ne Windows rÚgÚnÚrÚe (multi-tailles) et intÚgrÚe dans le build pour remplacer dÚfinitivement l'ic¶ne Electron.

---

## [1.3.7] - 2025-11-21

### Correctifs

- Nouveau logo ListX (LX) pour l'ic¶ne applicative (ICO/PNG/SVG dans uild/) utilisÚ par l'installeur, la fenÛtre et les raccourcis.

---

## [1.3.6] - 2025-11-21

### Correctifs

- Ic?ne Windows : priorit? au fichier hors asar (`resources/build/icon.ico`) pour ?viter les probl?mes d?ic?ne manquante dans la barre des t?ches et les raccourcis.

---

## [1.3.5] - 2025-11-21

### Correctifs

- Ic?ne Windows forc?e hors de l'asar (copie en ressources + chemin prioritaire) pour que le logo ListX apparaisse sur la fen?tre, la barre des t?ches et les raccourcis.

---

## [1.3.4] - 2025-11-14

### Correctifs

- Ic?ne Windows : AppUserModelID forc? et recherche ?largie dans les ressources (asar/unpacked) pour afficher le logo ListX dans la barre des t?ches et les raccourcis.

---

## [1.2.8] - 2025-11-12

### ­ƒÉø Correctifs

- **Fix CRITIQUE : Race condition de sauvegarde** : Correction d├®finitive du probl├¿me de sauvegarde ├á 0 pendant le chargement
  - Remplacement du syst├¿me de d├®blocage dans `finally` par un useEffect de surveillance
  - Ajout d'un compteur `loadingExpectedCount` pour attendre que React mette ├á jour l'├®tat
  - Le d├®blocage ne se fait plus qu'apr├¿s confirmation que les documents sont r├®ellement dans l'├®tat
  - R├®solution d├®finitive de la s├®quence : chargement ÔåÆ sauvegarde ├á 0 ÔåÆ perte de documents

### ­ƒôØ Note technique

React setState est asynchrone - le `finally` block s'ex├®cutait avant que `setDocuments()` ne mette ├á jour l'├®tat.
Solution : un useEffect surveille `documents.length` et ne d├®bloque la sauvegarde qu'apr├¿s confirmation de la mise ├á jour.

---

## [1.2.7] - 2025-11-12

### ­ƒÉø Correctifs

- **Fix : Protection contre la sauvegarde pendant le chargement** : Les documents ne sont plus ├®cras├®s ├á 0 pendant le rechargement
  - Ajout d'un flag `isLoadingDocuments` pour bloquer la sauvegarde pendant le chargement
  - La sauvegarde ne se d├®clenche plus avec `Documents: 0` pendant le chargement
  - R├®solution de la s├®quence : chargement ÔåÆ sauvegarde ├á 0 ÔåÆ perte de documents

### ­ƒôØ Note technique

Le useEffect de sauvegarde se d├®clenchait pendant que le chargement ├®tait en cours, cr├®ant une fen├¬tre o├╣ `documents` ├®tait vide.
Le flag `isLoadingDocuments` emp├¬che maintenant la sauvegarde pendant cette p├®riode transitoire.

---

## [1.2.6] - 2025-11-12

### ­ƒÉø Correctifs

- **Fix CRITIQUE : Extraction des IDs** : Correction majeure de l'utilisation des IDs pour le chargement/sauvegarde
  - Les appels ├á `loadListing()` et `saveListing()` utilisent maintenant `.id` au lieu des objets complets
  - Les documents sont maintenant r├®ellement charg├®s depuis le Z: (ils retournaient null avant)
  - Les documents sont maintenant r├®ellement sauvegard├®s sur le Z: avec les bons IDs
  - R├®solution du probl├¿me "Listing charg├®: null" dans les logs

### ­ƒôØ Note technique

Le contexte AppContext stocke des objets `{id, name, ...}` mais les fonctions de storage attendent des strings (IDs).
Cette version corrige tous les appels pour extraire `.id` avant de passer aux fonctions de storage.

---

## [1.2.5] - 2025-11-12

### ­ƒÉø Correctifs

- **Fix critique : Rechargement des documents** : Les documents sont maintenant correctement recharg├®s ├á chaque retour sur DocumentListingApp
  - Ajout d'une cl├® de rechargement (loadKey) qui force le refresh ├á chaque montage
  - Correction du useEffect de chargement qui ne se d├®clenchait pas au retour
  - Am├®lioration des logs de debug pour le chargement
  - Les documents ne disparaissent plus quand on navigue entre les pages

### ­ƒöº Am├®liorations

- Am├®lioration de la sauvegarde pour ne pas ├®craser les m├®tadonn├®es du listing
- Ajout de logs d├®taill├®s pour le debug du chargement/sauvegarde

---

## [1.2.4] - 2025-11-12

### ­ƒÉø Correctifs

- **Fix erreur de build** : Correction de l'import storageService (loadData ÔåÆ loadListing)
- Validation du build avant release

---

## [1.2.3] - 2025-11-12

### ­ƒÉø Correctifs

- **Fix critique : Export/Import des documents** : Les documents ajout├®s dans les listes sont maintenant correctement inclus dans les exports JSON
  - Les documents sont sauvegard├®s dans la structure centralis├®e (clients ÔåÆ projets ÔåÆ listes ÔåÆ documents)
  - Les documents se synchronisent correctement sur le Z:
  - Les documents sont restaur├®s lors des imports sur un autre poste
  - Correction du syst├¿me de sauvegarde qui utilisait uniquement localStorage

### ­ƒöº Am├®liorations

- Migration du stockage des documents vers le service centralis├® (storageService)
- Ajout d'un fallback pour la r├®tro-compatibilit├® avec l'ancien syst├¿me localStorage
- Am├®lioration de la robustesse du chargement et sauvegarde des documents

---

## [1.1.1] - 2025-10-29

### ­ƒöº Am├®liorations

- **Inversion des ic├┤nes Import/Export** : Ic├┤nes plus intuitives
  - Import : Ic├┤ne Download (Ô¼ç´©Å) - t├®l├®charger/importer des donn├®es
  - Export : Ic├┤ne Upload (Ô¼å´©Å) - envoyer/exporter des donn├®es
- **R├®organisation de l'ordre des boutons** : Import ├á gauche, Export ├á droite
- Am├®lioration de la coh├®rence visuelle dans toute l'application

---

## [1.1.0] - 2025-10-29

### Ô£¿ Nouveaut├®s

#### Syst├¿me de Templates et Champs Personnalisables
- **Interface horizontale ├á 3 zones** pour une configuration intuitive
  - Zone 1 : Champs disponibles
  - Zone 2 : Ordre formulaire et exports (Excel/PDF)
  - Zone 3 : Ordre nom de fichier
- **Champs personnalis├®s** : Cr├®ez vos propres champs avec libell├®s modifiables
- **Drag & Drop moderne** avec @dnd-kit (compatible React 19)
  - Glissez entre zones pour activer/d├®sactiver
  - R├®organisez l'ordre au sein de chaque zone
  - Auto-ajout : ajouter ├á une zone ajoute automatiquement aux deux
- **Bouton X au survol** pour retirer rapidement un champ d'une zone
- **Boutons de copie rapide** pour dupliquer l'ordre entre zones
- **Pr├®visualisation en temps r├®el** du nom de fichier g├®n├®r├®
- **Gestion des templates**
  - Sauvegardez plusieurs configurations
  - Import/Export en JSON
  - Basculez entre templates en un clic
- **Ordres ind├®pendants** : Formulaire/Exports vs Nom de fichier

### ­ƒöº Am├®liorations

- **Interface optimis├®e** : Design compact qui tient sans scroll
- **D├®tection de zone am├®lior├®e** : Chaque zone utilise des IDs pr├®fix├®s pour ├®viter les conflits
- **Suppression intelligente** : Retirer d'une zone ne retire que de cette zone
- **Blocage des mouvements directs** : Impossible de passer directement de Zone 2 ├á Zone 3 (passer par Zone 1 ou boutons de copie)
- **Feedback visuel** : Codes couleur (Gris/Bleu/Vert), animations au drag, boutons au survol
- **Persistance** : Templates et configurations sauvegard├®s dans localStorage

### ­ƒÉø Correctifs

- Correction de la d├®tection de collision lors du drag-and-drop
- Fix de la limite de 8 ├®l├®ments dans les zones droppables
- Correction de l'ordre des champs dans le formulaire
- Fix des champs personnalis├®s en minuscules (maintenant en MAJUSCULES)

---

## [1.0.4] - 2025-10-28

### Ô£¿ Nouveaut├®s
- Suppression de la colonne N┬░ dans les exports Excel et PDF
- Alignement des noms de colonnes entre PDF et Excel (├ëMETTEUR, N┬░ DOC)
- Remplacement des 2 boutons d'export par un bouton unique avec popup de s├®lection
- Conservation des infos du dernier document dans les champs de saisie
- Ajout d'un bouton Modifier pour ├®diter les documents existants

### ­ƒöº Am├®liorations
- Simplification de la configuration d'ic├┤ne (suppression des scripts de g├®n├®ration)
- Modification de la copie d'arborescence (suppression du pr├®fixe avant @)
- Am├®lioration des animations du glisser-d├®poser avec feedback visuel
- Suppression du panneau de param├¿tres (barre d'options)

---

## [1.0.3] - 2025-10-27

### Ô£¿ Nouveaut├®s
- Syst├¿me de num├®rotation par ordre d'apparition des cat├®gories
- Couleurs arc-en-ciel bas├®es sur l'ordre d'apparition
- Drag & drop pour r├®organiser les documents et cat├®gories
- Renum├®rotation automatique lors des modifications

### ­ƒöº Am├®liorations
- Interface utilisateur am├®lior├®e avec background anim├®
- Favicon personnalis├®
- Export Excel avec largeurs de colonnes intelligentes
- Export PDF format A4 paysage optimis├®

---

## [1.0.2] - 2025-10-26

### Ô£¿ Nouveaut├®s
- Export Excel professionnel avec logos
- Export PDF professionnel avec logos
- Cr├®ation d'arborescence de dossiers

### ­ƒöº Am├®liorations
- Syst├¿me d'autocomplete pour les affaires
- Validation des champs obligatoires
- Conversion automatique en majuscules

---

## [1.0.1] - 2025-10-25

### Ô£¿ Nouveaut├®s
- Ajout de documents avec m├®tadonn├®es compl├¿tes
- Num├®rotation automatique par cat├®gorie
- Suppression de documents

---

## [1.0.0] - 2025-10-24

### Ô£¿ Release initiale
- Application de base pour la gestion de listings de documents
- Support Electron pour version desktop
- Persistance localStorage

---

*Format bas├® sur [Keep a Changelog](https://keepachangelog.com/fr/)*
