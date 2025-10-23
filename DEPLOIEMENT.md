# 🚀 Guide de déploiement - ListX Desktop

Guide complet pour transformer votre projet en application desktop avec système de mise à jour automatique.

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Configuration initiale](#configuration-initiale)
3. [Premier build local (TEST)](#premier-build-local-test)
4. [Configuration GitHub](#configuration-github)
5. [Premier déploiement](#premier-déploiement)
6. [Workflow quotidien (MAJ)](#workflow-quotidien-maj)
7. [Dépannage](#dépannage)

---

## 🎯 PRÉREQUIS

### Sur votre machine de développement :
- ✅ Node.js (déjà installé)
- ✅ Git (déjà installé)
- ✅ Compte GitHub

### Pour vos utilisateurs :
- Windows 10 ou 11
- Connexion Internet (pour les mises à jour)

---

## ⚙️ CONFIGURATION INITIALE

### Étape 1 : Mettre à jour package.json

**IMPORTANT** : Ouvrez [package.json](package.json:78) et modifiez la ligne 83 :

```json
"publish": {
  "provider": "github",
  "owner": "VOTRE_USERNAME_GITHUB",  // ← CHANGEZ ICI
  "repo": "listx"                     // ← ET ICI si votre repo s'appelle différemment
}
```

**Exemple** : Si votre GitHub est `https://github.com/jean-dupont/listx-app`
```json
"owner": "jean-dupont",
"repo": "listx-app"
```

---

## 🧪 PREMIER BUILD LOCAL (TEST)

Avant de déployer, testons localement :

### 1. Tester en mode développement

```bash
npm run electron:dev
```

**Ce qui se passe** :
- Vite démarre sur http://localhost:5173
- Electron ouvre une fenêtre avec votre app
- Hot reload activé (modifications en temps réel)
- DevTools ouvertes pour debug

**Test à faire** :
- ✅ L'application s'ouvre correctement
- ✅ Toutes les fonctionnalités marchent (export Excel, PDF, etc.)
- ✅ Le localStorage fonctionne
- ✅ Pas d'erreurs dans la console

### 2. Builder l'application (PREMIER BUILD)

```bash
npm run electron:build:win
```

**Durée** : 2-5 minutes la première fois

**Ce qui se passe** :
1. Vite build votre React app → dossier `dist/`
2. Electron-builder package tout → dossier `release/`
3. Création de l'installateur Windows

**Résultat** :
```
release/
├── ListX Setup 1.0.0.exe        ← Installateur (~150-200 Mo)
└── latest.yml                   ← Fichier de vérification des MAJ
```

### 3. Tester l'installateur

1. Double-cliquez sur `ListX Setup 1.0.0.exe`
2. Installez l'application
3. Lancez ListX depuis le menu démarrer
4. Vérifiez que tout fonctionne

**Note** : Windows peut afficher un avertissement "Éditeur inconnu" → c'est normal (pas de signature de code). Cliquez "Plus d'infos" → "Exécuter quand même".

---

## 🐙 CONFIGURATION GITHUB

### Étape 1 : Créer le repository GitHub

**Si vous n'avez pas encore de repo GitHub pour ce projet** :

```bash
# Initialisez Git (si pas déjà fait)
git init

# Ajoutez tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - ListX Desktop v1.0.0"

# Créez un repo sur GitHub (via l'interface web)
# Puis liez-le :
git remote add origin https://github.com/VOTRE_USERNAME/listx.git
git branch -M main
git push -u origin main
```

### Étape 2 : Vérifier les permissions GitHub Actions

1. Allez sur votre repo GitHub
2. `Settings` → `Actions` → `General`
3. Trouvez **"Workflow permissions"**
4. Cochez **"Read and write permissions"**
5. Cliquez **"Save"**

**TRÈS IMPORTANT** : Sans ça, GitHub Actions ne pourra pas publier les releases !

---

## 🎉 PREMIER DÉPLOIEMENT

Vous êtes prêt pour la première release publique !

### Étape 1 : Créer un tag Git

```bash
# Assurez-vous que tout est commité
git add .
git commit -m "Release v1.0.0"

# Créer le tag
git tag v1.0.0

# Pusher le code ET le tag
git push origin main
git push origin v1.0.0
```

### Étape 2 : GitHub Actions build automatiquement

1. Allez sur GitHub → onglet **"Actions"**
2. Vous verrez un workflow **"Build and Release"** en cours
3. Attendez ~5-10 minutes

**Ce qui se passe** :
- GitHub Actions clone votre code
- Installe les dépendances
- Build l'application
- Crée une Release automatiquement
- Upload l'installateur

### Étape 3 : Vérifier la Release

1. Allez sur GitHub → onglet **"Releases"**
2. Vous devriez voir **"v1.0.0"**
3. Vérifiez que les fichiers sont présents :
   - `ListX-Setup-1.0.0.exe`
   - `latest.yml`

### Étape 4 : Distribuer aux utilisateurs

**Méthode 1** : Lien direct
```
https://github.com/VOTRE_USERNAME/listx/releases/latest/download/ListX-Setup-1.0.0.exe
```

**Méthode 2** : Page des releases
```
https://github.com/VOTRE_USERNAME/listx/releases
```

Les utilisateurs téléchargent et installent → **C'EST FAIT !** 🎉

---

## 🔄 WORKFLOW QUOTIDIEN (MISES À JOUR)

Maintenant, à chaque fois que vous voulez publier une nouvelle version :

### 1. Développez vos modifications

```bash
# Travaillez normalement
npm run dev

# Ou en mode Electron
npm run electron:dev
```

### 2. Changez le numéro de version

Ouvrez [package.json](package.json:4) et modifiez la ligne 4 :

```json
"version": "1.0.1",  // ← Incrémentez
```

**Règles de versioning** :
- `1.0.0` → `1.0.1` : Petit fix/amélioration
- `1.0.1` → `1.1.0` : Nouvelle fonctionnalité
- `1.1.0` → `2.0.0` : Changement majeur

### 3. Commitez et créez un tag

```bash
git add .
git commit -m "v1.0.1 - Amélioration de l'export Excel"

git tag v1.0.1
git push origin main
git push origin v1.0.1
```

### 4. GitHub Actions fait le reste

GitHub build et publie automatiquement la nouvelle version.

### 5. Les utilisateurs sont notifiés

**Au prochain lancement de l'app**, ils verront :

```
┌─────────────────────────────────────┐
│ 🔄 Mise à jour disponible          │
├─────────────────────────────────────┤
│ Une nouvelle version v1.0.1 est    │
│ disponible.                         │
│                                     │
│ Nouveautés :                        │
│ - Amélioration de l'export Excel   │
│                                     │
│ [Télécharger]  [Plus tard]         │
└─────────────────────────────────────┘
```

**Processus utilisateur** :
1. Clic sur "Télécharger"
2. Barre de progression
3. "Redémarrer et installer"
4. L'app redémarre → v1.0.1 installée ✅

---

## 🛠️ DÉPANNAGE

### ❌ "pngToIco is not a function"

**Pas grave !** L'icône a quand même été générée en PNG. Electron-builder la convertira automatiquement.

Si vous voulez vraiment un .ico personnalisé :
1. Allez sur https://cloudconvert.com/svg-to-ico
2. Uploadez `build/icon.svg`
3. Téléchargez `icon.ico` et placez-le dans `build/`

### ❌ Le build échoue avec "Cannot find module"

```bash
# Réinstallez les dépendances proprement
rm -rf node_modules
npm install
npm run electron:build:win
```

### ❌ GitHub Actions échoue "Permission denied"

Vérifiez les permissions :
1. Repo GitHub → `Settings` → `Actions` → `General`
2. **"Workflow permissions"** → **"Read and write permissions"**
3. Sauvegardez

### ❌ L'auto-update ne marche pas

**Checklist** :
- ✅ Le repo GitHub est public (ou privé avec token configuré)
- ✅ `package.json` a le bon `owner` et `repo`
- ✅ Le fichier `latest.yml` est présent dans la release
- ✅ L'utilisateur a installé depuis une release GitHub (pas le build local)

**Note** : L'auto-update ne fonctionne PAS en mode développement (`npm run electron:dev`). C'est normal.

### ❌ Windows dit "Éditeur inconnu"

**Normal** : L'application n'est pas signée numériquement.

**Solutions** :
1. **Court terme** : Les utilisateurs doivent cliquer "Plus d'infos" → "Exécuter quand même"
2. **Long terme** : Acheter un certificat de signature de code (~200€/an)

### ❌ L'icône n'apparaît pas

Vérifiez :
```bash
# Régénérer l'icône
node scripts/generate-icon.js

# Rebuild
npm run electron:build:win
```

---

## 📊 RÉCAPITULATIF DU WORKFLOW

### Développement → Production

```
┌─────────────────┐
│  Développement  │
│  npm run dev    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Test local     │
│  electron:dev   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Changez        │
│  version        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  git tag vX.X.X │
│  git push       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│  Build auto     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Release créée  │
│  sur GitHub     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Utilisateurs   │
│  notifiés       │
└─────────────────┘
```

---

## 🎓 SCRIPTS DISPONIBLES

| Commande | Description |
|----------|-------------|
| `npm run dev` | Vite dev server (web uniquement) |
| `npm run build` | Build React pour production |
| `npm run electron:dev` | Lancer l'app Electron en mode dev |
| `npm run electron:build` | Builder l'app complète (Windows + autres OS) |
| `npm run electron:build:win` | Builder uniquement pour Windows |

---

## 💡 ASTUCES

### Tester l'auto-update localement

1. Créez une première release (v1.0.0)
2. Installez l'app depuis cette release
3. Créez une v1.0.1
4. Lancez l'app v1.0.0 → Elle détectera la v1.0.1

### Voir les logs Electron

En mode dev : Les DevTools sont ouvertes automatiquement

En production : Les logs sont dans :
```
C:\Users\USERNAME\AppData\Roaming\ListX\logs\main.log
```

### Annuler une release ratée

```bash
# Supprimer le tag local
git tag -d v1.0.1

# Supprimer le tag distant
git push origin :refs/tags/v1.0.1

# Supprimer la release sur GitHub (via l'interface web)
```

---

## 📞 SUPPORT

En cas de problème, vérifiez :
1. Les logs GitHub Actions (onglet "Actions" sur GitHub)
2. La console DevTools (en mode dev)
3. Les logs de l'app (voir ci-dessus)

---

**Félicitations !** Votre application est maintenant en production avec un système de mise à jour automatique professionnel ! 🎉

Prochaine étape : `git tag v1.0.0 && git push --tags`
