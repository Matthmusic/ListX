# 🔒 Sécurité et Protections - ListX Desktop

## ✅ Protections implémentées

### 1. DevTools désactivées en production

En mode production, les DevTools (outils de développement) sont complètement désactivées pour les utilisateurs finaux.

**Ce qui est bloqué :**
- ❌ Touche **F12** → Désactivée
- ❌ Raccourci **Ctrl+Shift+I** → Désactivé
- ❌ Clic droit → "Inspecter" → Désactivé (menu contextuel bloqué)

**En mode développement (`npm run electron:dev`) :**
- ✅ DevTools ouvertes automatiquement
- ✅ Hot reload activé
- ✅ Tous les raccourcis fonctionnent

### 2. Context Isolation activée

```javascript
webPreferences: {
  nodeIntegration: false,      // Pas d'accès Node.js depuis le renderer
  contextIsolation: true,      // Isolation du contexte
  preload: path.join(__dirname, 'preload.js')  // API sécurisée uniquement
}
```

**Avantages :**
- Le code React ne peut pas accéder directement à Node.js
- Communication sécurisée via le preload script uniquement
- Protection contre les injections de code

### 3. Protection contre les instances multiples

L'application ne peut être lancée qu'une seule fois. Si l'utilisateur essaie de lancer une deuxième instance :
- La fenêtre existante est restaurée et mise au premier plan
- La nouvelle instance se ferme automatiquement

### 4. Auto-update sécurisé

Les mises à jour sont :
- Téléchargées uniquement depuis GitHub Releases (source officielle)
- Vérifiées via le fichier `latest.yml`
- Installées après confirmation de l'utilisateur
- Ne s'exécutent **jamais** en mode développement

---

## 🛡️ Bonnes pratiques implémentées

### Code Electron

✅ **Pas de `nodeIntegration`** : Le renderer process n'a pas accès à Node.js
✅ **Context Isolation** : Séparation stricte entre Node.js et le code web
✅ **Preload script** : API exposée de manière contrôlée et sécurisée
✅ **DevTools bloquées** : Pas d'accès aux outils de debug en production

### Communication IPC

✅ **Handlers spécifiques** : Chaque action a son propre handler
✅ **Pas de `eval()` ou exécution de code arbitraire**
✅ **Validation des données** : Les événements sont bien définis

---

## 🔓 Débloquer les DevTools (si besoin)

Si vous avez besoin d'activer temporairement les DevTools en production (pour debug) :

### Option 1 : Variable d'environnement

```bash
set NODE_ENV=development
ListX.exe
```

### Option 2 : Modifier temporairement main.js

Commentez les lignes 38-48 dans `electron/main.js` :

```javascript
// Désactiver temporairement
// mainWindow.webContents.on('before-input-event', (event, input) => {
//   if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
//     event.preventDefault();
//   }
// });
```

Puis rebuild : `npm run electron:build:win`

---

## 🚨 Ce qui N'EST PAS fait (mais pourrait être ajouté)

### Signature de code

❌ L'application n'est **pas signée numériquement**

**Conséquence :**
- Windows affiche "Éditeur inconnu"
- Les utilisateurs doivent cliquer "Plus d'infos" → "Exécuter quand même"

**Pour ajouter :**
- Acheter un certificat de signature (~200€/an)
- Configurer electron-builder avec le certificat
- Les avertissements Windows disparaîtront

### Obfuscation du code

❌ Le code JavaScript n'est **pas obfusqué**

**Conséquence :**
- Le code source est lisible dans les fichiers de l'app

**Pour ajouter :**
- Utiliser un outil d'obfuscation (ex: `javascript-obfuscator`)
- Intégrer dans le processus de build

### CSP (Content Security Policy)

❌ Pas de CSP configurée

**Pour ajouter :**
- Définir une politique de sécurité stricte
- Limiter les sources de chargement des ressources

---

## 📊 Résumé

| Protection | Status | Impact |
|------------|--------|--------|
| DevTools bloquées | ✅ Actif | Utilisateurs ne peuvent pas inspecter le code |
| Context Isolation | ✅ Actif | Code web isolé de Node.js |
| Node Integration | ✅ Désactivé | Pas d'accès Node.js depuis React |
| Instance unique | ✅ Actif | Une seule fenêtre à la fois |
| Menu contextuel | ✅ Bloqué | Pas de clic droit → Inspecter |
| Auto-update sécurisé | ✅ Actif | Mises à jour depuis GitHub uniquement |
| Signature de code | ❌ Non | Avertissement Windows |
| Obfuscation | ❌ Non | Code lisible |
| CSP | ❌ Non | Pas de restriction de chargement |

---

## 💡 Recommandations

### Pour un usage interne (bureau d'études)
✅ **La configuration actuelle est suffisante**
- Les protections de base sont en place
- Pas besoin de signature de code
- Pas besoin d'obfuscation

### Pour une distribution publique
📝 **Considérez d'ajouter :**
- Signature de code (pour éliminer les warnings Windows)
- Obfuscation du code (si propriété intellectuelle sensible)
- CSP stricte

---

## 🔧 Fichiers concernés

- **[electron/main.js](electron/main.js)** : Protections DevTools et context isolation
- **[electron/preload.js](electron/preload.js)** : API sécurisée exposée à React

---

**Votre application est sécurisée pour un usage professionnel ! 🔒**
