# 🚀 REFONTE LISTX - Système de Templates

## 📌 Vision du projet

Transformer ListX d'une application à champs fixes vers un système flexible basé sur des templates configurables, permettant de :
- Définir des champs personnalisés (nom, type, ordre, obligation)
- Sauvegarder et réutiliser des configurations (templates)
- Partager des templates entre membres d'équipe
- Adapter automatiquement les exports PDF/Excel

---

## 🎯 Objectifs

### Objectifs fonctionnels
- ✅ Créer/éditer/supprimer des templates
- ✅ Configurer les champs : nom, type, ordre, obligation
- ✅ Limite de 12 champs par template (pour v1)
- ✅ Import/export de templates (JSON)
- ✅ Import/export de projets complets (template + données)
- ✅ Formulaire de saisie dynamique basé sur le template actif
- ✅ Exports PDF/Excel adaptatifs

### Objectifs techniques
- 📁 Stockage : Fichiers JSON locaux via Electron
- 🔄 Pas de migration des données existantes (v1)
- 🧩 Types de champs de base : text, select, number, date
- 🎨 Interface intuitive avec wizard optionnel

---

## 📊 Décisions d'architecture

### 1. Stockage des données

**Templates** : `AppData/ListX/templates/`
```json
{
  "id": "uuid-v4",
  "nom": "Template BET Structure",
  "description": "Template pour projets de structure",
  "version": "1.0.0",
  "dateCreation": "2025-10-27T10:30:00Z",
  "dateModification": "2025-10-27T10:30:00Z",
  "champs": [
    {
      "id": "field_uuid",
      "nom": "Affaire",
      "type": "text",
      "obligatoire": true,
      "ordre": 1,
      "visible": true,
      "inclureDansNom": true,
      "cleDeCatégorie": false,
      "largeurColonne": 15,
      "placeholder": "Nom de l'affaire",
      "options": null
    }
  ],
  "exportConfig": {
    "afficherCategories": false
  }
}
```

**Projets** : `AppData/ListX/projets/`
```json
{
  "id": "uuid-v4",
  "nom": "Projet Hôpital Saint-Jean",
  "templateId": "uuid-template",
  "templateSnapshot": { /* copie du template */ },
  "dateCreation": "2025-10-27T10:30:00Z",
  "dateModification": "2025-10-27T11:45:00Z",
  "documents": [
    {
      "id": 12345,
      "valeurs": {
        "field_uuid": "HSJ",
        "field_uuid2": "PRO",
        // ...
      },
      "nomComplet": "HSJ_PRO_...",
      "numero": "1.01"
    }
  ],
  "exportConfig": {
    "nomProjet": "Hôpital Saint-Jean",
    "nomListe": "Plans Structure",
    "logoClient": "base64...",
    "logoBE": "base64...",
    "date": "2025-10-27",
    "indice": "A"
  }
}
```

### 2. Types de champs supportés (v1)

| Type | Description | Validation | Exemple |
|------|-------------|------------|---------|
| `text` | Texte libre | Longueur max 100 | "Affaire", "Zone" |
| `select` | Liste déroulante | Options définies | "Phase", "Nature" |
| `number` | Numérique | Min/Max optionnels | "Lot" (si numérique) |
| `date` | Sélecteur de date | Format ISO | "Date émission" |

### 3. Compatibilité et migration

**v1** : Pas de migration automatique
- Les anciens projets restent accessibles en "mode legacy"
- Option manuelle de conversion vers nouveau format (v2)

**Stratégie de compatibilité** :
- Template snapshot dans chaque projet (indépendance)
- Versionning des templates (v1.0.0)
- Détection de format au chargement

---

## 🏗️ Plan de développement

### **SPRINT 1 : Infrastructure de base** ✅ TERMINÉ

#### Objectifs
- [x] Document de suivi créé
- [x] Structure de données templates définie
- [x] API Electron pour gestion fichiers (IPC)
- [x] Fonctions CRUD templates (Create, Read, Update, Delete)
- [x] Système de stockage JSON persistant
- [x] Tests de lecture/écriture

#### Livrables ✅
- ✅ `src/models/Template.js` : Classe Template avec validation
- ✅ `src/models/Project.js` : Classe Project
- ✅ `src/models/Field.js` : Classe Field
- ✅ `src/utils/validation.js` : Fonctions de validation
- ✅ `src/utils/uuid.js` : Générateur d'UUID
- ✅ `electron/templateManager.js` : Gestionnaire de fichiers templates
- ✅ `electron/projectManager.js` : Gestionnaire de fichiers projets
- ✅ `electron/main.js` : IPC handlers ajoutés (12 endpoints)
- ✅ `electron/preload.js` : API exposée (templates + projects)
- ✅ `test-infrastructure.html` : Suite de tests interactifs
- ✅ `src/templates/defaults/` : Templates par défaut (BET Structure, Simple)

#### Fichiers à créer/modifier
```
listx/
├── src/
│   ├── models/
│   │   ├── Template.js          [NOUVEAU]
│   │   ├── Project.js           [NOUVEAU]
│   │   └── Field.js             [NOUVEAU]
│   └── utils/
│       ├── validation.js        [NOUVEAU]
│       └── uuid.js              [NOUVEAU]
├── electron/
│   ├── templateManager.js       [NOUVEAU]
│   ├── projectManager.js        [NOUVEAU]
│   ├── main.js                  [MODIFIER]
│   └── preload.js               [MODIFIER]
└── REFONTE_TEMPLATES.md         [CE FICHIER]
```

---

### **SPRINT 2 : Éditeur de templates** ⏳ Estimation : 2-3 jours

#### Objectifs
- [ ] Écran de sélection de template
- [ ] Écran d'édition de template
- [ ] Gestion des champs (ajouter/supprimer/réorganiser)
- [ ] Configuration des propriétés de champs
- [ ] Drag & drop pour réorganisation
- [ ] Prévisualisation du formulaire
- [ ] Sauvegarde/chargement de templates

#### Livrables
- `src/components/TemplateSelector.jsx`
- `src/components/TemplateEditor.jsx`
- `src/components/FieldEditor.jsx`
- `src/components/FieldList.jsx`

#### Maquette UI
```
┌────────────────────────────────────────────────┐
│ ListX - Édition Template                       │
├────────────────────────────────────────────────┤
│ Nom : [BET Structure_______________]           │
│ Description : [____________________]           │
│                                                │
│ Champs configurés (3/12) :                    │
│ ┌──────────────────────────────────────────┐  │
│ │ ≡ Affaire        [Text ▼] ☑ Obligatoire │  │
│ │   Placeholder: [Nom de l'affaire]        │  │
│ │   Largeur: [15] [🗑️]                     │  │
│ │                                           │  │
│ │ ≡ Phase          [Select ▼] ☑ Oblig.    │  │
│ │   Options: DIAG,APS,APD,AVP,PRO...       │  │
│ │   Largeur: [10] [🗑️]                     │  │
│ │                                           │  │
│ │ ≡ Lot            [Text ▼] ☐ Oblig.      │  │
│ │   Placeholder: [Numéro de lot]           │  │
│ │   Largeur: [10] [🗑️]                     │  │
│ │                                           │  │
│ │ [+ Ajouter un champ]                     │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ [Prévisualiser] [Enregistrer] [Annuler]       │
└────────────────────────────────────────────────┘
```

---

### **SPRINT 3 : Formulaire dynamique** ⏳ Estimation : 2 jours

#### Objectifs
- [ ] Génération dynamique du formulaire de saisie
- [ ] Validation basée sur le template actif
- [ ] Gestion des valeurs par champ dynamique
- [ ] Conservation de la logique métier (numérotation, etc.)
- [ ] Tests de saisie avec différents templates

#### Livrables
- `src/components/DynamicForm.jsx`
- `src/hooks/useTemplate.js`
- `src/hooks/useProject.js`
- Refactorisation de `DocumentListingApp.jsx`

#### Architecture
```javascript
// Avant (état statique)
const [affaire, setAffaire] = useState('');
const [phase, setPhase] = useState('');
// ...

// Après (état dynamique)
const [valeurs, setValeurs] = useState({}); // { field_uuid: 'valeur' }
const { template } = useTemplate();

// Accès aux valeurs
valeurs[template.champs[0].id] // Au lieu de 'affaire'
```

---

### **SPRINT 4 : Exports dynamiques** ⏳ Estimation : 2-3 jours

#### Objectifs
- [ ] Adaptation du générateur PDF
  - Colonnes dynamiques basées sur template
  - Largeurs de colonnes configurables
  - Ordre des champs respecté
- [ ] Adaptation du générateur Excel
  - Headers dynamiques
  - Largeurs adaptatives
  - Formules optionnelles
- [ ] Tests d'export avec templates variés
- [ ] Gestion des champs vides/cachés

#### Livrables
- `src/utils/pdfGenerator.js` (refactorisé)
- `src/utils/excelGenerator.js` (refactorisé)
- Tests d'export

#### Défis techniques
```javascript
// Génération dynamique des colonnes PDF
const columns = template.champs
  .filter(c => c.visible)
  .sort((a, b) => a.ordre - b.ordre)
  .map(champ => ({
    header: champ.nom,
    dataKey: champ.id,
    width: champ.largeurColonne
  }));

// Mapping des données
const rows = documents.map(doc => {
  const row = {};
  template.champs.forEach(champ => {
    row[champ.id] = doc.valeurs[champ.id] || '';
  });
  return row;
});
```

---

### **SPRINT 5 : Fonctions avancées** ⏳ Estimation : 1-2 jours

#### Objectifs
- [ ] Import/export de templates (JSON)
- [ ] Import/export de projets complets (template + données)
- [ ] Duplication de templates
- [ ] Templates par défaut pré-configurés
- [ ] Wizard de premier lancement (optionnel)
- [ ] Documentation utilisateur

#### Livrables
- `src/components/ImportExport.jsx`
- `src/templates/defaults/` (templates par défaut)
- `GUIDE_UTILISATEUR.md`

#### Templates par défaut inclus
1. **Template BET Structure** : Affaire, Phase, Lot, Émetteur, Nature, N° Doc, Format, Indice, Nom
2. **Template Simple** : Affaire, Phase, Nature, Format, Indice, Nom
3. **Template Architecture** : Affaire, Phase, Étage, Zone, Nature, Format, Indice, Nom
4. **Template Vierge** : 3 champs minimaux (Affaire, Nature, Nom)

---

## 🎨 Wizard de premier lancement (proposition)

### Étape 1 : Bienvenue
```
┌────────────────────────────────────────┐
│  Bienvenue dans ListX 2.0 !            │
│                                        │
│  Cette nouvelle version vous permet    │
│  de créer des templates personnalisés  │
│  pour vos listings de documents.       │
│                                        │
│  Voulez-vous :                         │
│  ○ Partir d'un template par défaut    │
│  ○ Créer un template personnalisé     │
│  ○ Importer un template existant      │
│                                        │
│         [Suivant]    [Passer]          │
└────────────────────────────────────────┘
```

### Étape 2 : Choix du template (si option 1)
```
┌────────────────────────────────────────┐
│  Choisissez un template de départ :    │
│                                        │
│  ○ BET Structure (recommandé)          │
│    9 champs | Affaire, Phase, Lot...  │
│                                        │
│  ○ Simple                              │
│    6 champs | Configuration minimale  │
│                                        │
│  ○ Architecture                        │
│    8 champs | Avec Étage et Zone      │
│                                        │
│  ○ Vierge                              │
│    3 champs | À personnaliser          │
│                                        │
│    [Retour]    [Suivant]    [Passer]   │
└────────────────────────────────────────┘
```

### Étape 3 : Personnalisation (optionnelle)
```
┌────────────────────────────────────────┐
│  Personnalisez votre template :        │
│                                        │
│  Nom : [Mon Template BET Structure]    │
│                                        │
│  Voulez-vous modifier les champs ?     │
│  ○ Non, utiliser tel quel              │
│  ○ Oui, ouvrir l'éditeur               │
│                                        │
│  [Prévisualiser]                       │
│                                        │
│    [Retour]    [Terminer]              │
└────────────────────────────────────────┘
```

### Étape 4 : Confirmation
```
┌────────────────────────────────────────┐
│  ✓ Votre template est prêt !           │
│                                        │
│  Nom : Mon Template BET Structure      │
│  Champs : 9                            │
│                                        │
│  Vous pouvez maintenant :              │
│  • Commencer à saisir des documents    │
│  • Modifier ce template                │
│  • Créer d'autres templates            │
│                                        │
│  ☐ Ne plus afficher ce wizard          │
│                                        │
│         [Commencer]                    │
└────────────────────────────────────────┘
```

---

## 📦 Import/Export

### Export de template
**Format** : `template_nom_v1.0.0.json`
```json
{
  "type": "listx-template",
  "version": "1.0.0",
  "exportDate": "2025-10-27T10:30:00Z",
  "data": { /* contenu du template */ }
}
```

### Export de projet complet
**Format** : `projet_nom_2025-10-27.listx` (JSON)
```json
{
  "type": "listx-project",
  "version": "1.0.0",
  "exportDate": "2025-10-27T10:30:00Z",
  "template": { /* snapshot du template */ },
  "project": { /* données du projet */ }
}
```

### Interface d'import/export
```
Menu : Fichier
  ├── Nouveau projet
  ├── Ouvrir projet...
  ├── Enregistrer projet
  ├── ─────────────────
  ├── Importer
  │   ├── Template (.json)
  │   └── Projet complet (.listx)
  ├── Exporter
  │   ├── Template actuel
  │   ├── Projet complet
  │   ├── ─────────────
  │   ├── PDF
  │   └── Excel
  └── ─────────────────
```

---

## ✅ Décisions validées

### 1. **Navigation entre projets** → Option B
**Décision** : Bouton "Changer de projet" en haut à gauche qui ouvre une modal de sélection

```
┌─────────────────────────────────┐
│ [🔄 Projet] Hôpital St-Jean     │ ← Clic → Modal
├─────────────────────────────────┤
│ Formulaire...                   │
```

**Avantages** :
- ✅ Interface propre et non encombrée
- ✅ Un seul projet actif à la fois (simplicité)
- ✅ Modal permet d'afficher les projets récents

### 2. **Projets récents**
- ✅ Liste des 5 derniers projets ouverts
- ✅ Accès rapide dans la modal de sélection
- ✅ Stockage dans `AppData/ListX/recents.json`

### 3. **Validation des champs** → Simplifiée
**Décision** : Validation minimale pour v1, ajustements futurs selon besoin

**Text** :
- ✅ Longueur max : 100 caractères
- ✅ Transformation automatique : uppercase + trim
- ⏳ Regex optionnelle : Phase 2

**Select** :
- ✅ Minimum 2 options, maximum 20 options
- ✅ Valeur par défaut optionnelle

**Number / Date** :
- ⏳ Validation basique uniquement (type natif HTML)
- ⏳ Validations avancées : Phase 2

### 4. **Gestion des doublons de champs**
**Décision** :
- ✅ IDs uniques en interne (UUID)
- ✅ Warning si noms similaires
- ⚠️ Interdiction stricte des noms identiques

### 5. **Nomenclature des fichiers** → Option C
**Décision** : Checkbox "Inclure dans nom fichier" sur chaque champ

```
Configuration du champ :
┌───────────────────────────────────┐
│ Nom : [Affaire___________]        │
│ Type : [Text ▼]                   │
│ ☑ Obligatoire                     │
│ ☑ Inclure dans nom de fichier     │ ← NOUVEAU
│ ☑ Visible dans exports            │
└───────────────────────────────────┘
```

**Génération du nom** : Concaténation des champs cochés, dans l'ordre du template
- Exemple : `HSJ_PRO_PLN_1.01_A3_A - Plan de coffrage`

### 6. **Catégorisation des documents** → Par Nature uniquement
**Décision** : Catégorie = Champ "Nature" uniquement

**Justification** :
- ✅ Simple et prévisible
- ✅ Correspond au besoin métier actuel
- ✅ Évite de créer trop de catégories
- ⚠️ Si besoin d'évolution → Phase 2

**Implémentation** :
- Le champ marqué comme "Clé de catégorie" dans le template détermine la catégorisation
- Par défaut : champ nommé "Nature"
- Fallback : Premier champ de type `select` si "Nature" absent

### 7. **Portabilité inter-équipes** → Logos inclus
**Décision** : Inclure les logos en base64 dans les exports de projets

**Format d'export** :
```json
{
  "type": "listx-project",
  "version": "1.1.0",
  "exportDate": "2025-10-27T10:30:00Z",
  "template": { /* snapshot complet du template */ },
  "project": {
    /* ... */
    "exportConfig": {
      "logoClient": "data:image/png;base64,iVBORw0KGgo...",
      "logoBE": "data:image/png;base64,iVBORw0KGgo..."
    }
  }
}
```

**Avantages** :
- ✅ Fichiers autonomes (pas de dépendances)
- ✅ Partage simplifié entre équipes
- ⚠️ Taille fichier : +50-200 KB (acceptable)

---

## 🔮 Fonctionnalités futures (Phase 2)

### Templates favoris
- Marquer des templates comme favoris
- Affichage prioritaire dans la modal
- Icône ⭐ dans la liste

### Champs calculés / automatiques
- Type spécial `computed`
- Formules de calcul configurables
- Exemples : `numero`, `nomComplet`, `dateCreation`

### Validations avancées
- Regex personnalisées pour champs text
- Plages de dates min/max
- Min/Max pour champs number
- Unités pour les nombres (mm, €, etc.)

### Catégorisation avancée
- Catégorie par combinaison de plusieurs champs
- Configuration : `categorieConfig: { champs: ['phase', 'nature'] }`

### Réorganisation des documents
- Note : Aucun impact lors du changement d'ordre des champs car :
  - Documents stockent les valeurs par `field_id`
  - Ordre défini par `template.champs[].ordre`
  - Affichage dynamique à chaque chargement

---

## 🚨 Risques et points d'attention

### Performance
- **Limite 12 champs** : Suffisant pour v1
- Templates lourds → Parsing JSON peut ralentir
- **Mitigation** : Cache en mémoire, lazy loading

### UX
- Ne pas perdre l'utilisateur dans la config
- Préserver la simplicité de l'app actuelle
- **Mitigation** : Wizard + templates par défaut

### Compatibilité
- Versionning des formats de fichiers
- Détection de version à l'import
- **Mitigation** : Champ `version` dans tous les JSON

### Données
- Perte de données si mauvaise manipulation
- **Mitigation** :
  - Backups automatiques avant modif
  - Confirmation avant suppression
  - Snapshotting du template dans les projets

---

## 📝 Décisions finalisées

### ✅ Toutes les décisions sont prises !
1. ✅ Stockage : JSON local
2. ✅ Types de champs : text, select, number, date
3. ✅ Migration : Non (v1)
4. ✅ Limite : 12 champs
5. ✅ Interface : Modal de sélection (pas de wizard complexe)
6. ✅ Navigation entre projets : **Option B** (Bouton + Modal)
7. ✅ Validation des champs : **Simplifiée** (essentiel uniquement)
8. ✅ Nomenclature fichiers : **Option C** (Checkbox par champ)
9. ✅ Catégorisation : **Par Nature uniquement**
10. ✅ Logos dans export : **Oui** (inclus en base64)

### ✅ Prêt pour Sprint 1
- [x] Structure JSON des templates validée
- [x] Structure JSON des projets validée
- [x] Arborescence des fichiers définie
- [x] Toutes les options architecturales choisies
- [x] Interface simplifiée (modal au lieu de wizard complexe)

---

## 📚 Ressources

### Documentation technique
- [Electron IPC](https://www.electronjs.org/docs/latest/api/ipc-main)
- [React Hooks](https://react.dev/reference/react)
- [jsPDF API](https://github.com/parallax/jsPDF)
- [ExcelJS API](https://github.com/exceljs/exceljs)

### Bibliothèques potentielles
- `uuid` : Génération d'identifiants uniques
- `joi` ou `yup` : Validation de schémas
- `react-beautiful-dnd` : Drag & drop pour réorganisation
- `react-hook-form` : Gestion de formulaires dynamiques

---

**Dernière mise à jour** : 2025-10-27
**Version du document** : 1.2.0
**Statut** : ✅ Sprint 1 terminé - Prêt pour Sprint 2 (Éditeur de templates)
