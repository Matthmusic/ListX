# ⚡ QUICKSTART - Déploiement en 5 minutes

## 🎯 Checklist avant de déployer

### 1. Configuration GitHub (2 min)

```bash
# Dans package.json, ligne 83, changez :
"owner": "VOTRE_USERNAME_GITHUB"
"repo": "nom-du-repo"
```

### 2. Créer le repo GitHub (1 min)

```bash
git init
git add .
git commit -m "Initial commit - ListX Desktop v1.0.0"
git remote add origin https://github.com/VOTRE_USERNAME/listx.git
git push -u origin main
```

### 3. Activer les permissions GitHub Actions (30 sec)

Sur GitHub : `Settings` → `Actions` → `General` → **"Read and write permissions"** → Save

### 4. Publier la première version (1 min)

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 5. Attendre le build (5 min)

GitHub → onglet **"Actions"** → Attendez que ça finisse

### 6. Récupérer l'installateur

GitHub → onglet **"Releases"** → Téléchargez `ListX-Setup-1.0.0.exe`

---

## 🔄 Pour les MAJ suivantes (30 secondes)

```bash
# 1. Changez version dans package.json : "1.0.1"
# 2. Puis :
git add .
git commit -m "v1.0.1 - Description des changements"
git tag v1.0.1
git push origin main --tags
```

**C'est tout !** GitHub build et publie automatiquement.

---

## 🧪 Test local avant de déployer

```bash
npm run electron:dev    # Mode développement
npm run electron:build  # Créer l'installateur local
```

---

**Pour plus de détails** : Voir [DEPLOIEMENT.md](DEPLOIEMENT.md)
