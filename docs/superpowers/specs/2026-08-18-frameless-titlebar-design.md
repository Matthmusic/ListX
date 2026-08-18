# Fenêtre frameless + titlebar custom — Design

Date : 2026-08-18
Statut : Approuvé, prêt pour le plan d'implémentation

## Contexte

ListX affiche aujourd'hui deux barres superposées, aucune des deux personnalisée :
- le menu Electron par défaut (File/Edit/View/Window/Help), jamais configuré via `Menu.setApplicationMenu` — inutile pour un utilisateur final ;
- la barre de titre Windows native (icône + titre statique « ListX - Gestion de documents » + minimiser/agrandir/fermer natifs).

Objectif du chantier (issu du fichier `A FAIRE` et de la comparaison avec l'app voisine RendExpress, qui a déjà résolu ce point) : supprimer les deux et les remplacer par une titlebar unique, custom, cohérente avec le thème clair actuel de l'app, avec un titre dynamique reflétant la navigation en cours.

Ce document ne couvre que ce chantier. Les autres points remontés pendant la session (numérotation par dizaine avec chiffre des centaines, propagation rétroactive du nom d'affaire aux titres, bug de perte de focus sur les champs texte, simplification de l'arborescence générée) sont **hors périmètre** — ce sont des sous-projets indépendants à brainstormer séparément.

## Décisions actées

- **Portée** : on retire à la fois le menu Electron par défaut et la barre de titre Windows native (pas seulement l'un des deux).
- **Approche fenêtre** : frameless complet (`frame: false`) avec titlebar React maison et contrôles IPC dédiés — plutôt que l'alternative plus légère « Window Controls Overlay » (`titleBarStyle: 'hidden'` + `titleBarOverlay`, boutons natifs recolorés, zéro IPC). L'overlay natif a été présenté comme recommandé (il conserve gratuitement les Snap Layouts de Windows 11 au survol du bouton agrandir) mais explicitement refusé au profit du contrôle visuel total du frameless complet. **Compromis accepté** : perte du flyout Snap Layouts natif ; non réimplémenté dans ce chantier.
- **Style visuel** : cohérent avec le thème clair actuel de l'app (fond type `bg-gray-50`, pas de reskin sombre à la RendExpress). Une éventuelle refonte visuelle globale est un chantier séparé, hors périmètre.
- **Titre** : dynamique, dérivé de l'état de navigation déjà global dans `AppContext` (`currentView`, `selectedClient`, `selectedProject`, `selectedListing`) — pas de nouvelle plomberie de remontée d'état nécessaire.

## Architecture

### 1. Process principal — `electron/main.js`

- `BrowserWindow` : ajout de `frame: false`. `resizable: true`, `minWidth`/`minHeight` restent inchangés — le redimensionnement par les bords continue de fonctionner nativement en frameless sous Windows, aucune logique custom requise.
- `Menu.setApplicationMenu(null)` appelé avant la création de la fenêtre (import de `Menu` à ajouter à la déstructuration `require('electron')` en tête de fichier) — supprime définitivement la barre File/Edit/View/Window/Help, y compris son accès clavier (Alt).
- Nouveaux handlers IPC, ajoutés à côté des handlers existants (stockage, updates) — pas de fichier séparé, le fichier reste d'une taille raisonnable :
  - `ipcMain.on('window-minimize', () => mainWindow?.minimize())`
  - `ipcMain.on('window-maximize-toggle', () => { mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize() })`
  - `ipcMain.on('window-close', () => mainWindow?.close())`
  - `ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false)` — pour l'état initial au montage du composant React
- Forward de l'état de maximisation vers le renderer, pour rester synchronisé même quand le changement ne vient pas d'un clic sur le bouton custom (double-clic sur la titlebar, raccourci Windows+Flèche haut) :
  - `mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized-change', true))`
  - `mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximized-change', false))`

### 2. Preload — `electron/preload.js`

Ajout d'un sous-objet `windowControls` dans l'objet `electronAPI` déjà exposé via `contextBridge`, suivant le style existant (mêmes conventions que les listeners de mise à jour) :

```js
windowControls: {
  minimize: () => ipcRenderer.send('window-minimize'),
  toggleMaximize: () => ipcRenderer.send('window-maximize-toggle'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedChange: (callback) => {
    ipcRenderer.on('window-maximized-change', (event, isMax) => callback(isMax));
  }
}
```

Cohérence avec l'existant : nettoyage des listeners via `electronAPI.removeAllListeners('window-maximized-change')`, comme le fait déjà le pattern de mise à jour — pas de fonction de désinscription dédiée à inventer.

### 3. Composant React — `src/components/TitleBar.jsx`

- Monté une seule fois, tout en haut de `src/App.jsx`, avant toute vue conditionnelle (`currentView === ...`) et avant l'écran de chargement / `StorageFolderSelector` — donc toujours visible, y compris pendant le splash de démarrage.
- Garde `if (!window.electronAPI) return null;` (même pattern que `UpdateNotification`) pour ne pas casser `npm run dev` en navigateur pur (sans Electron).
- Structure :
  - Gauche : icône LX (`src/assets/`) + titre dynamique (section 4)
  - Droite : 3 boutons `Minus` / `Square` (bascule en icône « restaurer » selon l'état) / `X`, tous depuis `lucide-react` — cohérent avec le reste de l'app
- Style : fond `bg-gray-50` (ou équivalent blanc cassé), hauteur ~36px, `border-b` discret. Aucun nouveau token de couleur.
- Drag region : toute la barre en `-webkit-app-region: drag`, sauf la zone des 3 boutons en `-webkit-app-region: no-drag` (sinon les clics sont interceptés par le drag). Double-clic sur la zone draggable déclenche `toggleMaximize()` (comportement standard Windows).
- Icône du bouton central synchronisée sur l'état reçu via `onMaximizedChange`, initialisée au montage via `isMaximized()`.

### 4. Titre dynamique

`TitleBar` consomme `useApp()` (contexte déjà global, `src/context/AppContext.jsx`) et calcule le titre selon `currentView` :

| `currentView` | Titre affiché |
|---|---|
| `clients` | « ListX » |
| `projects` | « ListX — {selectedClient.nom} » |
| `listings` | « ListX — {selectedClient.nom} / {selectedProject.nom} » |
| `editor` | « ListX — {selectedListing?.nom ?? 'Nouvelle liste'} » |

## Edge cases

- **Fenêtre non-Electron** (`npm run dev` en navigateur) : `TitleBar` ne rend rien, comportement actuel inchangé.
- **Désync icône maximiser/restaurer** : le redimensionnement par les bords ne déclenche pas `maximize`/`unmaximize`, donc pas de risque de désynchronisation de l'icône dans ce cas.
- **Fermeture** : `Alt+F4` et le bouton custom passent tous deux par `mainWindow.close()` — comportement identique.
- **Contraste au démarrage** : le splash/loader de `App.jsx` (fond `slate-900`) apparaîtra brièvement (~1s) sous une titlebar `bg-gray-50` — contraste léger accepté, non traité spécifiquement.
- **Snap Layouts Windows 11** : perdu au survol du bouton agrandir (voir « Décisions actées » ci-dessus), compromis accepté explicitement.

## Vérification (manuelle — pas de suite de tests dans le projet)

1. `npm run electron:dev` : plus de menu File/Edit/…, titlebar custom visible, drag fonctionnel, les 3 boutons opérationnels, icône centrale bascule correctement.
2. Double-clic sur la zone de titre → bascule maximiser/restaurer.
3. Redimensionnement par les bords toujours possible.
4. Le titre change bien en naviguant clients → projet → liste → éditeur.
5. `npm run dev` (navigateur seul) : pas de crash, pas de titlebar fantôme.
6. Build Windows (`npm run electron:build:win`) : comportement identique en production.

## Hors périmètre (backlog séparé, non traité ici)

- Numérotation des documents par dizaine avec choix du chiffre des centaines.
- Propagation rétroactive du nom d'affaire aux titres déjà saisis.
- Bug de perte de focus sur les champs texte (nécessite une session de debug dédiée).
- Simplification de l'arborescence générée (suppression du dernier niveau de dossier).
- Reste de la liste `A FAIRE` (export PDF/Excel, pré-remplissage, bouton modifier, filtrage arborescence avant `@`, animation du drag & drop).
