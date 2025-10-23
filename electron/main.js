const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Forcer le thème sombre global
nativeTheme.themeSource = 'dark';

// Configuration de l'auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let updateAvailable = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ListX - Gestion de documents',
    icon: path.join(__dirname, '../src/assets/L.ico'),
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Forcer le thème sombre de la barre de titre Windows (Windows 10/11)
  if (process.platform === 'win32') {
    // Utiliser l'API native Windows pour forcer le dark mode de la barre de titre
    // DWMWA_USE_IMMERSIVE_DARK_MODE = 20
    mainWindow.setBackgroundColor('#0f172a');
  }

  // Charger l'app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    // Désactiver les DevTools en production
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Bloquer F12 et Ctrl+Shift+I
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        event.preventDefault();
      }
    });

    // Désactiver le menu contextuel (clic droit) en production
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Vérifier les mises à jour au démarrage (seulement en prod)
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdates();
      }, 3000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Empêcher plusieurs instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ==============================
// GESTION DES MISES À JOUR
// ==============================

// Mise à jour disponible
autoUpdater.on('update-available', (info) => {
  updateAvailable = true;
  console.log('Mise à jour disponible:', info.version);

  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  }
});

// Pas de mise à jour
autoUpdater.on('update-not-available', (info) => {
  console.log('Application à jour');
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available');
  }
});

// Erreur de vérification
autoUpdater.on('error', (err) => {
  console.error('Erreur de mise à jour:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

// Progression du téléchargement
autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', {
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  }
});

// Mise à jour téléchargée
autoUpdater.on('update-downloaded', (info) => {
  console.log('Mise à jour téléchargée');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
});

// ==============================
// IPC HANDLERS (Communication avec React)
// ==============================

// L'utilisateur veut télécharger la mise à jour
ipcMain.on('download-update', () => {
  if (updateAvailable) {
    autoUpdater.downloadUpdate();
  }
});

// L'utilisateur veut installer la mise à jour maintenant
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

// Vérifier manuellement les mises à jour
ipcMain.on('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdates();
  }
});

// Obtenir la version actuelle
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

console.log(`ListX v${app.getVersion()} démarré`);
console.log(`Mode: ${isDev ? 'Développement' : 'Production'}`);
