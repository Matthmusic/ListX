# Système de Versioning - ListX

Ce document décrit la convention de versioning utilisée pour ListX.

## Format de version

Le format utilisé est : `MAJEUR.MINEUR.PATCH` (semantic versioning standard).

## Règles de versioning

### 1. Correctifs et petites améliorations → **x.x.PATCH (+1)**

**Quand l'utiliser :**
- Bugs cosmétiques mineurs
- Corrections de style/CSS
- Petits ajustements qui n'affectent pas vraiment l'utilisation
- Typos dans l'interface
- Petits ajustements de performance
- Ajout d'une petite fonctionnalité
- Amélioration mineure d'une feature existante
- Ajout d'un nouveau paramètre/option
- Petite amélioration UX

**Exemples :**
- `1.0.3` → `1.0.4` → `1.0.5` ... → `1.0.11` → `1.0.12` (pas de limite)
- `1.2.0` → `1.2.1` → `1.2.2`

**Cas concret :**
- Fix d'un chemin d'icône qui ne s'affiche pas correctement → `1.0.4`
- Correction d'une couleur dans le thème → `1.0.5`
- Ajout de l'affichage de la version en bas de l'app → `1.0.6`
- Ajout d'un bouton pour vider la liste → `1.0.7`
- Ajout d'un raccourci clavier → `1.0.8`
- Inversion des icônes Import/Export → `1.1.1`

---

### 2. Grosse nouvelle fonctionnalité → **x.MINEUR (+1).0**

**Quand l'utiliser :**
- Ajout d'une fonctionnalité importante
- Nouveau module/section de l'application
- Refonte d'une partie majeure de l'UI
- Ajout d'une intégration externe importante

**Exemples :**
- `1.0.5` → `1.1.0` → `1.2.0` ... → `1.15.0` → `1.16.0` (pas de limite)
- `2.5.0` → `2.6.0`

**Cas concret :**
- Ajout d'un système de templates avec gestion des champs → `1.1.0`
- Système de configuration avancée des champs (3 zones, drag-and-drop, ordres multiples) → `1.2.0`
- Intégration avec OneDrive/SharePoint → `1.3.0`
- Système de gestion des utilisateurs → `1.4.0`
- Mode collaboratif → `1.5.0`

---

### 3. Refonte complète → **MAJEUR (+1).0.0**

**Quand l'utiliser :**
- Refonte complète de l'architecture
- Changement majeur du design/UX
- Migration technologique majeure
- Breaking changes importants

**Exemples :**
- `1.5.3` → `2.0.0`
- `2.8.5` → `3.0.0`

**Cas concret :**
- Migration de Electron vers Tauri → `2.0.0`
- Refonte complète de l'UI en Material Design → `2.0.0`
- Passage d'une app desktop à une app web → `2.0.0`

---

## Exemples de progression

### Exemple 1 : Développement normal
```
1.0.0   → Release initiale
1.0.1   → Ajout d'un filtre de recherche
1.0.2   → Ajout de l'export en CSV
1.0.3   → Ajout du dark mode + icône personnalisée
1.0.4   → Fix de l'icône en production
1.0.5   → Ajout de raccourcis clavier
1.1.0   → Ajout du système de templates (grosse feature)
1.1.1   → Amélioration des icônes Import/Export
1.1.2   → Correction d'un bug d'affichage
```

### Exemple 2 : Avec refonte
```
1.8.5   → Dernière version de la v1
2.0.0   → Refonte complète de l'interface
2.0.1   → Corrections post-refonte
2.0.2   → Ajout d'animations
2.1.0   → Nouveau système de plugins
3.0.0   → Migration vers nouvelle techno
```

---

## Notes importantes

1. **Pas de limite numérique** : On peut aller au-delà de 9 (ex: `1.0.12`, `1.15.0`)

2. **Semantic Versioning** : Ce système suit le standard semver (https://semver.org/) pour garantir la compatibilité avec les gestionnaires de versions et l'auto-updater.

3. **Cohérence** : Toujours se référer à ce document avant de créer une nouvelle version.

4. **Auto-update** : Les utilisateurs recevront une notification de mise à jour pour toutes les versions (y compris les révisions).

---

## Changelog

Chaque release doit avoir un changelog clair avec :
- 🐛 **Correctifs** : Liste des bugs corrigés
- ✨ **Nouveautés** : Nouvelles fonctionnalités
- 🔧 **Améliorations** : Optimisations et améliorations
- ⚠️ **Breaking changes** : Changements qui cassent la compatibilité (surtout pour MAJEUR)

---

*Document créé le 23 octobre 2025*
