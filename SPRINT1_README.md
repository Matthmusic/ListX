# 🚀 Sprint 1 - Infrastructure de Base - TERMINÉ ✅

## 📋 Résumé

Le Sprint 1 établit les fondations du système de templates pour ListX :
- Modèles de données (Template, Project, Field)
- Gestionnaires de fichiers Electron
- API IPC pour communication React ↔ Electron
- Système de validation
- Tests interactifs

---

## 📁 Structure des fichiers créés

```
listx/
├── src/
│   ├── models/
│   │   ├── Template.js          ✅ Classe Template avec méthodes CRUD
│   │   ├── Project.js           ✅ Classe Project
│   │   └── Field.js             ✅ Classe Field + factory
│   ├── utils/
│   │   ├── validation.js        ✅ Fonctions de validation
│   │   └── uuid.js              ✅ Générateur d'UUID v4
│   └── templates/
│       └── defaults/
│           ├── bet-structure.json  ✅ Template BET Structure (10 champs)
│           └── simple.json         ✅ Template Simple (6 champs)
├── electron/
│   ├── templateManager.js       ✅ CRUD templates (AppData/ListX/templates)
│   ├── projectManager.js        ✅ CRUD projets (AppData/ListX/projets)
│   ├── main.js                  ✅ 12 IPC handlers ajoutés
│   └── preload.js               ✅ API exposée (window.electronAPI)
├── test-infrastructure.html     ✅ Suite de tests interactifs (11 tests)
├── REFONTE_TEMPLATES.md         ✅ Document de suivi v1.2.0
└── SPRINT1_README.md            ✅ Ce fichier
```

---

## 🔧 API Electron exposée

### Templates API

```javascript
// Lister tous les templates
const templates = await window.electronAPI.templates.list();

// Charger un template
const template = await window.electronAPI.templates.load(templateId);

// Sauvegarder un template (avec backup automatique)
await window.electronAPI.templates.save(templateData);

// Supprimer un template (avec backup)
await window.electronAPI.templates.delete(templateId);

// Importer un template (ouvre un dialog)
const imported = await window.electronAPI.templates.import();

// Exporter un template (ouvre un dialog)
const filePath = await window.electronAPI.templates.export(templateId);
```

### Projects API

```javascript
// Lister tous les projets
const projects = await window.electronAPI.projects.list();

// Charger un projet
const project = await window.electronAPI.projects.load(projectId);

// Sauvegarder un projet (avec backup automatique)
await window.electronAPI.projects.save(projectData);

// Supprimer un projet (avec backup)
await window.electronAPI.projects.delete(projectId);

// Récupérer les 5 projets récents
const recents = await window.electronAPI.projects.recents();

// Importer un projet .listx
const imported = await window.electronAPI.projects.import();

// Exporter un projet .listx (avec logos en base64)
const filePath = await window.electronAPI.projects.export(projectId);
```

---

## 💾 Stockage des données

### Emplacement des fichiers

- **Windows**: `C:\Users\{User}\AppData\Roaming\ListX\`
- **macOS**: `~/Library/Application Support/ListX/`
- **Linux**: `~/.config/ListX/`

### Structure

```
AppData/ListX/
├── templates/
│   ├── {template-uuid-1}.json
│   ├── {template-uuid-2}.json
│   └── backups/
│       └── {template-uuid}_2025-10-27.json
├── projets/
│   ├── {project-uuid-1}.json
│   ├── {project-uuid-2}.json
│   └── backups/
│       └── {project-uuid}_2025-10-27.json
└── recents.json
```

---

## 🧪 Tester l'infrastructure

### Option 1 : Page de tests interactive

1. Lancer l'application en mode développement :
   ```bash
   npm run dev
   ```

2. Ouvrir `test-infrastructure.html` dans Electron

3. Exécuter les tests dans l'ordre :
   - **Templates** : 6 tests (créer, lister, charger, modifier, exporter, supprimer)
   - **Projets** : 5 tests (créer, lister, récents, documents, exporter)

### Option 2 : Console développeur

```javascript
// Import des modèles
import { Template } from './src/models/Template.js';
import { Project } from './src/models/Project.js';
import { Field, FIELD_TYPES, createDefaultField } from './src/models/Field.js';

// Créer un template
const template = new Template({ nom: 'Mon Template' });
template.addField(createDefaultField(FIELD_TYPES.TEXT, 1));
template.addField(createDefaultField(FIELD_TYPES.SELECT, 2));

// Valider
const validation = template.validate();
console.log('Valide ?', validation.valid);

// Sauvegarder
await window.electronAPI.templates.save(template.toJSON());

// Créer un projet
const project = Project.fromTemplate('Mon Projet', template);
await window.electronAPI.projects.save(project.toJSON());
```

---

## 📚 Modèles de données

### Template

```javascript
{
  id: 'uuid',
  nom: 'Template BET Structure',
  description: 'Description du template',
  version: '1.1.0',
  dateCreation: '2025-10-27T10:30:00Z',
  dateModification: '2025-10-27T10:30:00Z',
  champs: [
    {
      id: 'field-uuid',
      nom: 'Affaire',
      type: 'text', // text | select | number | date
      obligatoire: true,
      ordre: 1,
      visible: true,
      inclureDansNom: true,
      cleDeCatégorie: false,
      largeurColonne: 15,
      placeholder: 'Nom de l\'affaire',
      options: null // Array pour type 'select'
    }
  ],
  exportConfig: {
    afficherCategories: true
  }
}
```

### Project

```javascript
{
  id: 'uuid',
  nom: 'Projet Hôpital Saint-Jean',
  templateId: 'template-uuid',
  templateSnapshot: { /* copie du template */ },
  dateCreation: '2025-10-27T10:30:00Z',
  dateModification: '2025-10-27T11:45:00Z',
  documents: [
    {
      id: 12345,
      valeurs: {
        'field-uuid-1': 'HSJ',
        'field-uuid-2': 'PRO'
      },
      nomComplet: 'HSJ_PRO_PLN_01',
      numero: '1.01'
    }
  ],
  exportConfig: {
    nomProjet: 'Hôpital Saint-Jean',
    nomListe: 'Plans Structure',
    logoClient: 'data:image/png;base64,...',
    logoBE: 'data:image/png;base64,...',
    date: '2025-10-27',
    indice: 'A'
  }
}
```

### Field

```javascript
{
  id: 'field-uuid',
  nom: 'Affaire',
  type: 'text', // Types disponibles: text, select, number, date
  obligatoire: true,
  ordre: 1,
  visible: true,
  inclureDansNom: true,        // Pour nomenclature fichier
  cleDeCatégorie: false,       // Pour catégorisation documents
  largeurColonne: 15,          // Pour exports PDF/Excel
  placeholder: 'Entrez...',
  options: null                // Array pour select: ['Option1', 'Option2']
}
```

---

## ✨ Fonctionnalités implémentées

### Validation

- ✅ Validation des templates (nom, champs, limites)
- ✅ Validation des champs (type, options, ordre)
- ✅ Détection de doublons de noms
- ✅ Distance de Levenshtein pour similarité

### Gestion des fichiers

- ✅ Création de répertoires automatique
- ✅ Backups automatiques avant modification/suppression
- ✅ Import/export avec dialogs natifs
- ✅ Gestion des projets récents (5 max)

### Sécurité

- ✅ Génération d'UUID uniques
- ✅ Vérification d'existence avant opérations
- ✅ Gestion d'erreurs complète
- ✅ Logs détaillés (console)

### Templates par défaut

- ✅ **BET Structure** : 10 champs (Affaire, Phase, Lot, Émetteur, Nature, Zone, Niveau, Format, Indice, Nom)
- ✅ **Simple** : 6 champs (Affaire, Phase, Nature, Format, Indice, Description)

---

## 🔜 Prochaines étapes (Sprint 2)

### Éditeur de templates

1. **TemplateSelector.jsx** : Modal de sélection/création
2. **TemplateEditor.jsx** : Interface d'édition complète
3. **FieldEditor.jsx** : Éditeur de champ individuel
4. **FieldList.jsx** : Liste avec drag & drop

### Fonctionnalités Sprint 2

- [ ] Modal de sélection au démarrage
- [ ] Éditeur visuel de templates
- [ ] Ajout/suppression/réorganisation de champs
- [ ] Configuration des propriétés de champs
- [ ] Prévisualisation du formulaire
- [ ] Duplication de templates
- [ ] Chargement des templates par défaut

---

## 🐛 Problèmes connus

Aucun problème identifié pour le moment.

---

## 📝 Notes de développement

### Conventions de nommage

- **Templates** : Fichiers nommés par UUID (`{uuid}.json`)
- **Projets** : Fichiers nommés par UUID (`{uuid}.json`)
- **Exports** :
  - Templates : `template_{nom}_v{version}.json`
  - Projets : `projet_{nom}_{date}.listx`

### Gestion des erreurs

Toutes les fonctions IPC utilisent try-catch et loggent les erreurs :
```javascript
try {
  return await manager.operation();
} catch (error) {
  console.error('[IPC] Erreur operation:', error);
  throw error;
}
```

### Performances

- ✅ Parsing JSON optimisé
- ✅ Backups en arrière-plan
- ✅ Initialisation lazy des répertoires
- ✅ Cache en mémoire (managers Electron)

---

## 🎯 Objectifs atteints

✅ Infrastructure de base complète et testée
✅ API Electron fonctionnelle (12 endpoints)
✅ Modèles de données validés
✅ Système de validation robuste
✅ Gestion des fichiers avec backups
✅ Templates par défaut prêts
✅ Documentation complète

**Sprint 1 : 100% terminé** 🎉

---

**Version** : 1.0.0
**Date** : 2025-10-27
**Auteur** : Claude + Équipe ListX
