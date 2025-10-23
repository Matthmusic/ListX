# 🚀 Déploiement ListX - Configuration pour Matthmusic

## ✅ Configuration GitHub : TERMINÉE !

Votre `package.json` est maintenant configuré pour :
- **GitHub username** : `Matthmusic`
- **Repository** : `ListX`
- **URL complète** : https://github.com/Matthmusic/ListX

---

## 🎯 ÉTAPES SUIVANTES (10 minutes)

### 1️⃣ Tester l'application (2 min)

```bash
cd listx
npm run electron:dev
```

✅ Vérifiez que tout fonctionne correctement

### 2️⃣ Créer le repository GitHub (2 min)

**Option A : Via l'interface GitHub**
1. Allez sur https://github.com/new
2. Nom du repo : `ListX`
3. Description : `Application de gestion et génération de listings de documents techniques`
4. Public ou Private (au choix)
5. **NE COCHEZ PAS** "Initialize with README" (vous en avez déjà un)
6. Cliquez "Create repository"

**Option B : Via la ligne de commande**
```bash
cd listx

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Premier commit
git commit -m "Initial commit - ListX Desktop v1.0.0"

# Lier au repo GitHub (UTILISEZ CETTE COMMANDE EXACTE)
git remote add origin https://github.com/Matthmusic/ListX.git

# Renommer la branche en main
git branch -M main

# Pousser le code
git push -u origin main
```

### 3️⃣ Activer les permissions GitHub Actions (1 min)

Sur GitHub, allez sur votre repo :
1. Cliquez sur **Settings** (en haut à droite)
2. Dans le menu de gauche : **Actions** → **General**
3. Descendez jusqu'à **"Workflow permissions"**
4. Cochez **"Read and write permissions"**
5. Cliquez **"Save"**

⚠️ **TRÈS IMPORTANT** : Sans ça, GitHub Actions ne pourra pas publier les releases !

### 4️⃣ Publier la première version (2 min)

```bash
cd listx

# Créer le tag v1.0.0
git tag v1.0.0

# Pousser le tag (déclenche le build automatique)
git push origin v1.0.0
```

### 5️⃣ Attendre le build (5 min)

1. Allez sur https://github.com/Matthmusic/ListX/actions
2. Vous verrez un workflow **"Build and Release"** en cours
3. Attendez qu'il devienne vert ✅ (~5-10 minutes)

### 6️⃣ Récupérer l'installateur

1. Allez sur https://github.com/Matthmusic/ListX/releases
2. Vous verrez la release **"v1.0.0"**
3. Téléchargez `ListX-Setup-1.0.0.exe`

**C'EST FAIT ! 🎉**

---

## 🔄 Pour les mises à jour suivantes (30 secondes)

Quand vous voudrez publier une nouvelle version :

```bash
cd listx

# 1. Développez vos modifications normalement
npm run electron:dev

# 2. Quand c'est prêt, changez la version dans package.json
# Ouvrez package.json ligne 4 : "version": "1.0.1"

# 3. Commitez, taguez et poussez
git add .
git commit -m "v1.0.1 - Description des changements"
git tag v1.0.1
git push origin main --tags
```

**GitHub Actions fait le reste automatiquement !**

Les utilisateurs qui ont déjà installé l'app recevront une notification au prochain lancement.

---

## 📊 URLs importantes

| Lien | URL |
|------|-----|
| **Repository** | https://github.com/Matthmusic/ListX |
| **Actions (builds)** | https://github.com/Matthmusic/ListX/actions |
| **Releases** | https://github.com/Matthmusic/ListX/releases |
| **Dernier .exe** | https://github.com/Matthmusic/ListX/releases/latest |

---

## 🎁 Distribuer aux utilisateurs

**Lien direct vers le dernier installateur :**
```
https://github.com/Matthmusic/ListX/releases/latest/download/ListX-Setup-1.0.0.exe
```

Ou envoyez-leur simplement le lien vers la page des releases :
```
https://github.com/Matthmusic/ListX/releases
```

---

## 🛠️ Commandes utiles

| Commande | Usage |
|----------|-------|
| `npm run electron:dev` | Tester en mode développement |
| `npm run electron:build:win` | Build local (sans publier) |
| `git tag` | Voir les versions existantes |
| `git tag -d v1.0.0` | Supprimer un tag local |
| `git push origin :refs/tags/v1.0.0` | Supprimer un tag distant |

---

## ⚠️ Points d'attention

### Warning "Éditeur inconnu"
Quand les utilisateurs installent l'app, Windows peut afficher :
> "Cette application provient d'un éditeur inconnu"

**C'est normal** : L'app n'est pas signée numériquement.

**Solution pour l'utilisateur** :
1. Cliquer sur "Plus d'infos"
2. Cliquer sur "Exécuter quand même"

**Solution long terme** : Acheter un certificat de signature de code (~200€/an)

### Le build échoue sur GitHub Actions

Vérifiez :
1. ✅ Les permissions sont activées (étape 3)
2. ✅ Le `package.json` a le bon owner/repo
3. ✅ Vous avez bien poussé le tag avec `git push origin v1.0.0`

---

## 📞 Besoin d'aide ?

- **Guide complet** : [DEPLOIEMENT.md](DEPLOIEMENT.md)
- **Détails techniques** : [ELECTRON_SETUP_COMPLETE.md](ELECTRON_SETUP_COMPLETE.md)
- **Dépannage** : Voir la section "Dépannage" dans [DEPLOIEMENT.md](DEPLOIEMENT.md)

---

## 🎉 Récapitulatif

Vous êtes prêt à déployer ! Voici ce qui va se passer :

1. ✅ Configuration GitHub : **FAIT** (Matthmusic/ListX)
2. ⏳ Test local : `npm run electron:dev`
3. ⏳ Créer le repo sur GitHub
4. ⏳ Activer GitHub Actions
5. ⏳ Pousser le tag v1.0.0
6. ⏳ Attendre le build
7. ⏳ Télécharger l'installateur
8. ⏳ Distribuer aux utilisateurs

**Prochaine commande :**
```bash
cd listx
npm run electron:dev
```

**Bon déploiement ! 🚀**
