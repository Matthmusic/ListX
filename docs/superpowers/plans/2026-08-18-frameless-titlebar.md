# Fenêtre frameless + titlebar custom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le menu Electron par défaut et la barre de titre Windows native de ListX par une titlebar React unique, custom, cohérente avec le thème clair actuel, avec titre dynamique selon la navigation.

**Architecture:** `electron/main.js` bascule la fenêtre en `frame: false` et supprime le menu applicatif, expose 4 nouveaux canaux IPC (minimize/maximize-toggle/close/is-maximized) plus le forwarding des événements `maximize`/`unmaximize`. `electron/preload.js` expose ces canaux sous `electronAPI.windowControls`. Un nouveau composant `src/components/TitleBar.jsx`, monté en permanence tout en haut de `src/App.jsx`, consomme `AppContext` pour le titre dynamique et pilote la fenêtre via `electronAPI.windowControls`.

**Tech Stack:** Electron 38 (main process), React 19 (renderer), lucide-react (icônes), Tailwind (styles utilitaires + `-webkit-app-region` en style inline).

**Spec:** [docs/superpowers/specs/2026-08-18-frameless-titlebar-design.md](../specs/2026-08-18-frameless-titlebar-design.md)

## Global Constraints

- Pas de suite de tests automatisée dans ce projet (pas de vitest/jest, aucun script `test` dans `package.json`) → chaque tâche se vérifie manuellement via `npm run electron:dev` (et ponctuellement `npm run dev` / `npm run electron:build:win`), comme le prévoit la section « Vérification » de la spec.
- Cible Windows uniquement (`electron-builder` ne configure que `win`/`nsis`) → pas besoin de garder `frame: false` derrière un `if (process.platform === 'win32')`.
- Le champ de nom sur les objets client/projet/listing est `.name`, pas `.nom` — vérifié dans `src/services/storageService.js` (la première version de la spec avait une erreur sur ce point, corrigée avant d'écrire ce plan).
- `electron/main.js` contient des commentaires existants mal encodés (mojibake UTF-8/Latin-1, ex. `d├®marr├®`). Ne pas toucher aux commentaires existants (hors périmètre) ; écrire tout nouveau commentaire sans accents pour ne pas aggraver le problème.
- Respecter les conventions déjà en place : handlers IPC regroupés par section commentée dans `main.js`, toutes les méthodes exposées au renderer vivent dans le même objet `electronAPI` de `preload.js`, et les composants qui dépendent d'Electron gardent le pattern `if (!window.electronAPI) ...` déjà utilisé par `UpdateNotification.jsx`.

---

### Task 1: Supprimer le menu Electron par défaut

**Files:**
- Modify: `electron/main.js:1` (import), `electron/main.js:139` (activation)

**Interfaces:**
- Consumes: rien de nouveau
- Produces: rien de consommé par les tâches suivantes (changement autonome)

- [ ] **Step 1: Ajouter `Menu` à l'import Electron**

Dans `electron/main.js`, ligne 1 :

```js
// Avant
const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');

// Après
const { app, BrowserWindow, ipcMain, dialog, nativeTheme, Menu } = require('electron');
```

- [ ] **Step 2: Désactiver le menu applicatif avant la création de la fenêtre**

Toujours dans `electron/main.js`, la ligne (isolée, une seule occurrence dans le fichier) :

```js
app.whenReady().then(createWindow);
```

devient :

```js
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
});
```

- [ ] **Step 3: Vérification manuelle**

Lancer :

```bash
npm run electron:dev
```

Vérifier :
- Aucune barre de menu File/Edit/View/Window/Help visible en haut de la fenêtre.
- La touche `Alt` ne fait apparaître aucun menu.
- La barre de titre Windows native (icône + titre + minimiser/agrandir/fermer) est toujours là — c'est attendu, elle sera retirée en Task 4.
- L'app démarre normalement (sélecteur de dossier de stockage ou vue clients selon la config locale).

- [ ] **Step 4: Commit**

```bash
git add electron/main.js
git commit -m "feat: supprimer le menu Electron par défaut"
```

---

### Task 2: Canaux IPC de contrôle de fenêtre (main + preload)

**Files:**
- Modify: `electron/main.js` (nouveaux handlers IPC + forwarding d'événements dans `createWindow`)
- Modify: `electron/preload.js` (exposition `electronAPI.windowControls`)

**Interfaces:**
- Consumes: la variable module-scope `mainWindow` déjà définie dans `main.js:18`
- Produces (utilisé par Task 3) :
  - `window.electronAPI.windowControls.minimize(): void`
  - `window.electronAPI.windowControls.toggleMaximize(): void`
  - `window.electronAPI.windowControls.close(): void`
  - `window.electronAPI.windowControls.isMaximized(): Promise<boolean>`
  - `window.electronAPI.windowControls.onMaximizedChange(callback: (isMaximized: boolean) => void): void`

- [ ] **Step 1: Ajouter les handlers IPC dans `electron/main.js`**

Repérer ce bloc (juste avant la section « GESTION DE LA CONFIGURATION ») :

```js
// Obtenir la version actuelle
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ==============================
// GESTION DE LA CONFIGURATION
// ==============================
```

Le remplacer par :

```js
// Obtenir la version actuelle
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// ==============================
// CONTROLE DE LA FENETRE (titlebar custom)
// ==============================

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize-toggle', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

// ==============================
// GESTION DE LA CONFIGURATION
// ==============================
```

- [ ] **Step 2: Forwarder les événements maximize/unmaximize vers le renderer**

Toujours dans `electron/main.js`, dans `createWindow()`, repérer :

```js
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
```

Le remplacer par :

```js
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-change', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}
```

- [ ] **Step 3: Exposer les contrôles dans `electron/preload.js`**

Repérer la fin de l'objet exposé :

```js
  writeSharedData: (data) => ipcRenderer.invoke('write-shared-data', data)
});
```

Le remplacer par :

```js
  writeSharedData: (data) => ipcRenderer.invoke('write-shared-data', data),

  // Controles de la fenetre (titlebar custom)
  windowControls: {
    minimize: () => ipcRenderer.send('window-minimize'),
    toggleMaximize: () => ipcRenderer.send('window-maximize-toggle'),
    close: () => ipcRenderer.send('window-close'),
    isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
    onMaximizedChange: (callback) => {
      ipcRenderer.on('window-maximized-change', (event, isMax) => callback(isMax));
    }
  }
});
```

- [ ] **Step 4: Vérification manuelle via la console DevTools**

```bash
npm run electron:dev
```

La fenêtre DevTools s'ouvre automatiquement en dev. Dans l'onglet Console, exécuter successivement :

```js
await window.electronAPI.windowControls.isMaximized()
// attendu : false (ou true si la fenêtre est déjà maximisée) — pas d'exception

window.electronAPI.windowControls.minimize()
// attendu : la fenêtre se réduit dans la barre des tâches

window.electronAPI.windowControls.toggleMaximize()
// attendu : la fenêtre se maximise

window.electronAPI.windowControls.toggleMaximize()
// attendu : la fenêtre revient à sa taille précédente

window.electronAPI.windowControls.onMaximizedChange((v) => console.log('maximized:', v))
// puis cliquer sur le bouton "agrandir" natif de la barre de titre Windows
// attendu : la console affiche "maximized: true", puis "maximized: false" si on re-clique
```

Ne pas exécuter `close()` avant d'avoir fini ces vérifications (ça fermerait la fenêtre).

- [ ] **Step 5: Commit**

```bash
git add electron/main.js electron/preload.js
git commit -m "feat: ajouter les canaux IPC de controle de fenetre"
```

---

### Task 3: Composant `TitleBar` + intégration dans `App.jsx`

**Files:**
- Create: `src/components/TitleBar.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes:
  - `window.electronAPI.windowControls.*` (produit par Task 2)
  - `useApp()` de `src/context/AppContext.jsx` — champs `currentView`, `selectedClient`, `selectedProject`, `selectedListing`, chacun (sauf `currentView`) soit `null` soit un objet avec un champ `.name`
- Produces: composant `TitleBar` (export default), monté par `App.jsx`

- [ ] **Step 1: Créer `src/components/TitleBar.jsx`**

```jsx
import { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import listXLogo from '../assets/listX.svg';

export default function TitleBar() {
  const { currentView, selectedClient, selectedProject, selectedListing } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.windowControls) return;

    window.electronAPI.windowControls.isMaximized().then(setIsMaximized);
    window.electronAPI.windowControls.onMaximizedChange(setIsMaximized);

    return () => {
      window.electronAPI.removeAllListeners('window-maximized-change');
    };
  }, []);

  if (!window.electronAPI?.windowControls) {
    return null;
  }

  const getTitle = () => {
    if (currentView === 'projects' && selectedClient) {
      return `ListX — ${selectedClient.name}`;
    }
    if (currentView === 'listings' && selectedClient && selectedProject) {
      return `ListX — ${selectedClient.name} / ${selectedProject.name}`;
    }
    if (currentView === 'editor') {
      return `ListX — ${selectedListing?.name ?? 'Nouvelle liste'}`;
    }
    return 'ListX';
  };

  return (
    <div
      className="flex items-center justify-between h-9 bg-gray-50 border-b border-gray-200 select-none"
      style={{ WebkitAppRegion: 'drag' }}
      onDoubleClick={() => window.electronAPI.windowControls.toggleMaximize()}
    >
      <div className="flex items-center gap-2 px-3 min-w-0">
        <img src={listXLogo} alt="" className="w-4 h-4 shrink-0" />
        <span className="text-xs font-medium text-gray-700 truncate">{getTitle()}</span>
      </div>

      <div className="flex items-stretch h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          type="button"
          onClick={() => window.electronAPI.windowControls.minimize()}
          className="w-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Réduire"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI.windowControls.toggleMaximize()}
          className="w-11 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label={isMaximized ? 'Restaurer' : 'Agrandir'}
        >
          {isMaximized ? <Copy size={13} /> : <Square size={12} />}
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI.windowControls.close()}
          className="w-11 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
```

Note : `Copy` (deux rectangles superposés) sert d'icône « restaurer », faute d'icône dédiée dans lucide-react — c'est la même convention que d'autres titlebars custom basées sur cette librairie.

- [ ] **Step 2: Monter `TitleBar` en premier dans `src/App.jsx`**

Remplacer tout le contenu de `src/App.jsx` par :

```jsx
import { useEffect, useState } from 'react'
import { useApp } from './context/AppContext'
import TitleBar from './components/TitleBar'
import UpdateNotification from './components/UpdateNotification'
import StorageFolderSelector from './components/StorageFolderSelector'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ListingsPage from './pages/ListingsPage'
import EditorWrapper from './pages/EditorWrapper'
import { isStorageConfigured } from './services/storageService'

function App() {
  const { currentView } = useApp()
  const [storageConfigured, setStorageConfigured] = useState(null)

  // Vérifier si le stockage est configuré au démarrage
  useEffect(() => {
    const checkStorage = async () => {
      const configured = await isStorageConfigured();
      setStorageConfigured(configured);
    };
    checkStorage();
  }, []);

  // Callback quand l'utilisateur sélectionne un dossier
  const handleFolderSelected = (path) => {
    console.log('Dossier de stockage configuré:', path);
    setStorageConfigured(true);
  };

  return (
    <>
      <TitleBar />

      {storageConfigured === null && (
        // Afficher un loader pendant la vérification
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg">Chargement de ListX...</p>
          </div>
        </div>
      )}

      {storageConfigured === false && (
        // Si le stockage n'est pas configuré, afficher le sélecteur
        <StorageFolderSelector onFolderSelected={handleFolderSelected} />
      )}

      {storageConfigured === true && (
        // Application normale
        <>
          <UpdateNotification />
          {currentView === 'clients' && <ClientsPage />}
          {currentView === 'projects' && <ProjectsPage />}
          {currentView === 'listings' && <ListingsPage />}
          {currentView === 'editor' && <EditorWrapper />}
        </>
      )}
    </>
  )
}

export default App
```

- [ ] **Step 3: Vérification manuelle**

```bash
npm run electron:dev
```

Vérifier :
- Une barre claire apparaît en haut du contenu, sous la barre de titre Windows native (redondance temporaire attendue — réglé en Task 4).
- Les 3 boutons custom (minimiser / agrandir-restaurer / fermer) fonctionnent comme en Task 2, mais depuis l'UI cette fois.
- L'icône du bouton central bascule bien entre `Square` (agrandir) et `Copy` (restaurer) selon l'état.
- Naviguer clients → sélectionner un client → projects → sélectionner un projet → listings → ouvrir/créer une liste → editor : le texte à droite du logo LX se met à jour à chaque étape selon le tableau de la spec (« ListX », puis « ListX — {client} », etc.).

Puis, dans un terminal séparé :

```bash
npm run dev
```

Ouvrir `http://localhost:5173` dans un navigateur. Vérifier : pas de crash, aucune barre custom ne s'affiche (normal, `window.electronAPI` est `undefined` hors Electron), le reste de l'app fonctionne comme avant.

- [ ] **Step 4: Commit**

```bash
git add src/components/TitleBar.jsx src/App.jsx
git commit -m "feat: ajouter la titlebar custom avec titre dynamique"
```

---

### Task 4: Basculer la fenêtre en frameless + vérification finale

**Files:**
- Modify: `electron/main.js` (options `BrowserWindow`)

**Interfaces:**
- Consumes: rien de nouveau
- Produces: rien (dernière tâche du chantier)

- [ ] **Step 1: Ajouter `frame: false`**

Dans `electron/main.js`, dans `createWindow()`, repérer :

```js
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ListX - Gestion de documents',
    icon: getIconPath(),
    backgroundColor: '#0f172a',
    show: false,
```

Le remplacer par :

```js
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    title: 'ListX - Gestion de documents',
    icon: getIconPath(),
    backgroundColor: '#0f172a',
    show: false,
```

- [ ] **Step 2: Vérification manuelle complète (checklist de la spec)**

```bash
npm run electron:dev
```

1. Plus de menu File/Edit/…, plus de barre de titre Windows native — seule la `TitleBar` custom reste visible en haut.
2. Cliquer-glisser sur une zone vide de la `TitleBar` déplace la fenêtre (zone `drag`).
3. Double-clic sur une zone vide de la `TitleBar` bascule maximiser/restaurer.
4. Les 3 boutons custom fonctionnent toujours, l'icône bascule toujours correctement.
5. Redimensionnement par les bords de la fenêtre (coins et côtés) toujours possible.
6. Le titre change bien en naviguant clients → projet → liste → éditeur.
7. `npm run dev` (navigateur seul) : toujours pas de crash, pas de barre fantôme.

Puis, build de production :

```bash
npm run electron:build:win
```

8. Installer/lancer le build généré dans `release/` : même comportement qu'en dev (pas de menu, pas de barre native, titlebar custom fonctionnelle, redimensionnement et déplacement OK).

- [ ] **Step 3: Commit**

```bash
git add electron/main.js
git commit -m "feat: passer la fenetre ListX en frameless"
```

---

## Self-Review (fait pendant l'écriture de ce plan)

- **Couverture de la spec** : section 1 (main process) → Task 1 + Task 2 + Task 4. Section 2 (preload) → Task 2. Section 3 (composant React) → Task 3. Section 4 (titre dynamique) → Task 3. Edge cases → couverts par les vérifications manuelles de Task 3/4 (fenêtre non-Electron, fermeture, redimensionnement, Snap Layouts noté comme compromis accepté donc non testé). Vérification → reprise telle quelle dans Task 4 Step 2.
- **Pas de placeholder** : chaque step contient du code réel, pas de "TODO"/"gérer les cas d'erreur" vague.
- **Cohérence des types/noms** : `windowControls.{minimize,toggleMaximize,close,isMaximized,onMaximizedChange}` utilisés à l'identique dans Task 2 (main+preload) et Task 3 (composant). `selectedClient.name`/`selectedProject.name`/`selectedListing.name` cohérents avec `storageService.js` et utilisés à l'identique dans la spec corrigée et dans le composant.
