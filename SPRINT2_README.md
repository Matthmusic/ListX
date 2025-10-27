# 🎨 Sprint 2 - Interface de Sélection - EN COURS

## 📋 Résumé

Le Sprint 2 ajoute les premières interfaces utilisateur pour interagir avec l'infrastructure du Sprint 1 :
- Hooks React personnalisés (useTemplate, useProject)
- Modal de sélection de projet au démarrage
- Modal de sélection de template pour nouveau projet
- Chargement automatique des templates par défaut

---

## 📁 Fichiers créés/modifiés

```
listx/
├── src/
│   ├── hooks/
│   │   ├── useTemplate.js        ✅ Hook pour gérer les templates
│   │   └── useProject.js         ✅ Hook pour gérer les projets
│   ├── components/
│   │   ├── ProjectSelector.jsx   ✅ Modal de sélection de projet
│   │   └── TemplateSelector.jsx  ✅ Modal de sélection de template
│   ├── models/                   (importés depuis Sprint 1)
│   ├── utils/                    (importés depuis Sprint 1)
│   └── App.jsx                   ✅ Orchestration des modales
├── electron/
│   ├── loadDefaultTemplates.js  ✅ Chargement templates par défaut
│   └── main.js                  ✅ Modifié (load templates)
└── SPRINT2_README.md            ✅ Ce fichier
```

---

## 🎯 Fonctionnalités implémentées

### ✅ Hooks React

#### **useTemplate**
```javascript
const { template, loading, error, loadTemplate, saveTemplate, createTemplate, updateTemplate, resetTemplate } = useTemplate(templateId);
```

#### **useTemplateList**
```javascript
const { templates, loading, error, loadTemplates, deleteTemplate, importTemplate, exportTemplate } = useTemplateList();
```

#### **useProject**
```javascript
const { project, loading, error, loadProject, saveProject, createProject, updateProject, addDocument, updateDocument, removeDocument, clearDocuments, getTemplate, resetProject } = useProject(projectId);
```

#### **useProjectList**
```javascript
const { projects, recents, loading, error, loadProjects, loadRecents, deleteProject, importProject, exportProject } = useProjectList();
```

---

## 🎨 Interfaces créées

### 1. ProjectSelector (Modal au démarrage)

**Fonctionnalités** :
- ✅ Affiche les projets récents (5 max)
- ✅ Affiche tous les projets avec infos
- ✅ Bouton "Nouveau projet"
- ✅ Bouton "Importer un projet"
- ✅ Suppression de projet avec confirmation
- ✅ Affichage des dates relatives (Il y a Xh, hier, etc.)
- ✅ Loading states et gestion d'erreurs

**Design** :
- Gradient bleu dans le header
- Cards interactives hover
- Icons Lucide React
- Responsive (grid adaptatif)

### 2. TemplateSelector (Nouveau projet)

**Fonctionnalités** :
- ✅ Input pour le nom du projet (obligatoire)
- ✅ Templates par défaut mis en avant
- ✅ Mes templates personnalisés
- ✅ Bouton "Créer un template" (TODO)
- ✅ Bouton "Importer un template"
- ✅ Export de template
- ✅ Suppression avec confirmation
- ✅ Bouton retour vers ProjectSelector

**Design** :
- Gradient indigo dans le header
- Templates par défaut avec badge "DÉFAUT"
- Différenciation visuelle (bleu = défaut, gris = custom)
- Actions au hover (export, delete)

---

## 🔄 Flux de navigation

```
1. Démarrage de l'app
   ↓
2. ProjectSelector s'affiche
   ├─ Sélectionner un projet existant
   │  └─ Charger le projet → App principale
   ├─ Nouveau projet
   │  └─ TemplateSelector s'affiche
   │     ├─ Sélectionner un template
   │     │  └─ Créer projet → App principale
   │     ├─ Créer un template (TODO Sprint 2.5)
   │     │  └─ TemplateEditor (À venir)
   │     └─ Retour → ProjectSelector
   └─ Importer un projet
      └─ Charger le projet → App principale
```

---

## 🚀 Comment tester

### 1. Lancer l'application

```bash
npm run dev
```

### 2. Au démarrage

Tu verras **ProjectSelector** :
- Si aucun projet : Message "Aucun projet trouvé"
- Boutons : "Nouveau projet" et "Importer un projet"

### 3. Cliquer sur "Nouveau projet"

**TemplateSelector** s'affiche :
- Entre un nom de projet (ex: "Test Hôpital")
- Choisis un template (BET Structure recommandé)
- Le projet est créé et sauvegardé automatiquement

### 4. Vérification

- Les templates par défaut se chargent automatiquement
- Vérifie dans `AppData/ListX/templates/` :
  - `default-bet-structure.json`
  - `default-simple.json`

- Un projet est créé dans `AppData/ListX/projets/`
- Il apparaît dans `recents.json`

### 5. Relancer l'app

- Le projet apparaît dans "Projets récents"
- Clique dessus pour le charger

---

## 📊 État d'avancement Sprint 2

### ✅ Terminé

- [x] Hook useTemplate + useTemplateList
- [x] Hook useProject + useProjectList
- [x] Composant ProjectSelector
- [x] Composant TemplateSelector
- [x] Intégration dans App.jsx
- [x] Chargement templates par défaut
- [x] Navigation entre modales

### ✅ Terminé (Phase 2)

- [x] TemplateEditor (création/édition de template)
- [x] FieldEditor (édition de champs individuels)
- [x] Drag & drop pour réorganiser les champs
- [x] Prévisualisation du formulaire
- [x] Transformation uppercase automatique sur tous les champs
- [x] Séparateur virgule avec preview en temps réel

### ⏳ À faire (Sprint 3)

- [ ] Adaptation de DocumentListingApp pour utiliser le projet
- [ ] Formulaire dynamique basé sur le template
- [ ] Exports PDF/Excel dynamiques

---

## 🎨 Design System

### Couleurs

```javascript
// ProjectSelector
Header: gradient-to-r from-blue-600 to-blue-800
Cards récents: bg-blue-50 hover:bg-blue-100
Border: border-blue-200 hover:border-blue-400

// TemplateSelector
Header: gradient-to-r from-indigo-600 to-indigo-800
Templates défaut: from-blue-50 to-indigo-50
Templates custom: bg-gray-50 hover:bg-gray-100

// Boutons d'action
Nouveau: from-green-500 to-green-600
Importer: from-purple-500 to-purple-600
Supprimer: bg-red-600 (confirmation)
```

### Icons (Lucide React)

- `FolderOpen` : Projets
- `FileText` : Templates / Documents
- `Plus` : Créer nouveau
- `Upload` : Importer
- `Download` : Exporter
- `Clock` : Projets récents
- `Trash2` : Supprimer
- `Star` : Templates recommandés
- `ArrowLeft` : Retour
- `Edit` : Éditer

---

## 🐛 Points d'attention

### 1. Import des modèles

Les composants importent les classes depuis `/src/models/` :
```javascript
import { Template } from './models/Template'
import { Project } from './models/Project'
```

**Important** : Vérifier que les chemins sont corrects selon la configuration Vite.

### 2. electronAPI

Les hooks utilisent `window.electronAPI` :
```javascript
await window.electronAPI.templates.list()
await window.electronAPI.projects.load(id)
```

**Vérification** : S'assurer que le preload.js expose correctement l'API.

### 3. Templates par défaut

Les templates sont chargés depuis `src/templates/defaults/` :
- `bet-structure.json`
- `simple.json`

Ils sont copiés dans `AppData/ListX/templates/` au premier lancement.

### 4. DocumentListingApp

L'app principale reçoit maintenant des props :
```javascript
<DocumentListingApp
  project={project}
  onSaveProject={saveProject}
/>
```

**TODO** : Adapter DocumentListingApp pour utiliser ces props (Sprint 3).

---

## 🔜 Prochaines étapes (Sprint 2.5 - Éditeur)

### TemplateEditor

Interface d'édition complète de template :
- Liste des champs avec drag & drop
- Ajout/suppression de champs
- Configuration des propriétés
- Prévisualisation en temps réel
- Sauvegarde/annulation

### FieldEditor

Éditeur de champ individuel :
- Type (text, select, number, date)
- Propriétés (obligatoire, visible, inclureDansNom, etc.)
- Options pour select
- Validation en temps réel

---

## 💡 Améliorations futures

### Persistance du dernier projet

```javascript
// Dans App.jsx
useEffect(() => {
  const lastProjectId = localStorage.getItem('lastProjectId')
  if (lastProjectId) {
    loadProject(lastProjectId)
    setCurrentStep('app')
  }
}, [])
```

### Recherche de projets

```javascript
const [search, setSearch] = useState('')
const filteredProjects = projects.filter(p =>
  p.nom.toLowerCase().includes(search.toLowerCase())
)
```

### Templates favoris

```javascript
const [favorites, setFavorites] = useState([])
const toggleFavorite = (templateId) => {
  // ...
}
```

### Duplication de projet

```javascript
const duplicateProject = async (projectId) => {
  const project = await loadProject(projectId)
  const duplicate = {
    ...project,
    id: generateUUID(),
    nom: `${project.nom} (copie)`,
    dateCreation: new Date().toISOString()
  }
  await saveProject(duplicate)
}
```

---

## 📝 Notes de développement

### Performance

- Les hooks chargent automatiquement au montage
- Pas de polling, uniquement refresh manuel
- Cache en mémoire géré par Electron (templateManager, projectManager)

### Sécurité

- Validation côté frontend (hooks)
- Validation côté backend (managers Electron)
- Backups automatiques avant suppression

### UX

- Loading states sur toutes les actions async
- Messages d'erreur explicites
- Confirmations pour actions destructives (suppression)
- Dates relatives pour meilleure lisibilité

---

## 🎯 Objectifs Sprint 2 (Phase 1)

✅ Interfaces de sélection fonctionnelles
✅ Navigation fluide entre modales
✅ Intégration avec l'infrastructure Sprint 1
✅ Chargement automatique des templates par défaut
✅ Design moderne et cohérent

**Sprint 2 : 100% terminé** 🎉🎉🎉

### 🆕 Fonctionnalités ajoutées (Phase 2)

#### TemplateEditor
- ✅ Création de template from scratch
- ✅ Édition du nom et description (uppercase automatique)
- ✅ Ajout/suppression de champs (limite 12)
- ✅ Drag & drop pour réorganiser les champs
- ✅ Prévisualisation du formulaire en temps réel
- ✅ Validation avant sauvegarde
- ✅ Création automatique d'un projet après sauvegarde

#### FieldEditor
- ✅ Édition de champ individuel
- ✅ Types : Text, Select, Number, Date
- ✅ Configuration complète :
  - Nom (uppercase auto)
  - Type
  - Obligatoire
  - Placeholder
  - Largeur colonne
  - Options pour select (séparées par virgules, preview live)
  - Visible dans exports
  - Inclure dans nom de fichier
  - Clé de catégorie
- ✅ Collapse/expand pour paramètres avancés
- ✅ Preview des options en badges colorés

### 🎨 Améliorations UX

- ✅ **Uppercase automatique** sur tous les champs de texte (nom template, nom champs, options)
- ✅ **Preview en temps réel** des options de select (badges bleus)
- ✅ **Virgules visibles** dans le champ d'input pendant la saisie
- ✅ **Transformation CSS** au lieu de blocage de saisie
- ✅ **Drag & drop fluide** avec feedback visuel

### 📁 Fichiers ajoutés

```
src/
├── components/
│   ├── TemplateEditor.jsx    ✅ Éditeur complet de template
│   └── FieldEditor.jsx        ✅ Éditeur de champ individuel
└── hooks/
    ├── useTemplate.js         ✅ (déjà créé Phase 1)
    └── useProject.js          ✅ (déjà créé Phase 1)
```

---

## 🎯 Résultat final Sprint 2

L'utilisateur peut maintenant :
1. ✅ Sélectionner ou créer un projet (ProjectSelector)
2. ✅ Choisir un template existant ou créer le sien (TemplateSelector)
3. ✅ **Créer un template personnalisé** avec l'éditeur visuel (TemplateEditor)
4. ✅ **Configurer chaque champ** en détail (FieldEditor)
5. ✅ **Réorganiser les champs** par drag & drop
6. ✅ **Prévisualiser** le formulaire avant sauvegarde
7. ✅ Le projet est automatiquement créé avec le template

### 📊 Progression globale

```
✅ Sprint 1 (Infrastructure)        : 100%
✅ Sprint 2 Phase 1 (Sélection)     : 100%
✅ Sprint 2 Phase 2 (Éditeur)       : 100%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ Sprint 3 (Formulaire dynamique)  : 0%
⏳ Sprint 4 (Exports dynamiques)    : 0%
```

---

**Version** : 2.1.0
**Date** : 2025-10-27
**Statut** : ✅ Sprint 2 COMPLET - Prêt pour Sprint 3
**Auteur** : Claude + Équipe ListX
