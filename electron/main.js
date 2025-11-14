const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

// Forcer le thème sombre global
nativeTheme.themeSource = 'dark';

// Configuration de l'auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let updateAvailable = false;

// Chemin du fichier de configuration (dans userData)
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

// Variable pour stocker le chemin du dossier de stockage
let SHARED_STORAGE_PATH = null;
let SHARED_DATA_FILE = null;

// Fonction pour obtenir le chemin de l'icône selon l'environnement
function getIconPath() {
  const iconPath = isDev
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(process.resourcesPath, 'build', 'icon.ico');

  console.log('Chemin icône:', iconPath);
  console.log('Icône existe:', fs.existsSync(iconPath));

  return iconPath;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ListX - Gestion de documents',
    icon: getIconPath(),
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

// ==============================
// GESTION DE LA CONFIGURATION
// ==============================

/**
 * Charge la configuration (chemin du dossier de stockage)
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.storagePath) {
        SHARED_STORAGE_PATH = config.storagePath;
        SHARED_DATA_FILE = path.join(SHARED_STORAGE_PATH, 'data.json');
        console.log('Configuration chargée:', SHARED_STORAGE_PATH);
        return true;
      }
    }
  } catch (error) {
    console.error('Erreur chargement configuration:', error);
  }
  return false;
}

/**
 * Sauvegarde la configuration
 */
function saveConfig(storagePath) {
  try {
    const config = { storagePath };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    SHARED_STORAGE_PATH = storagePath;
    SHARED_DATA_FILE = path.join(SHARED_STORAGE_PATH, 'data.json');
    console.log('Configuration sauvegardée:', SHARED_STORAGE_PATH);
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde configuration:', error);
    return false;
  }
}

// ==============================
// STOCKAGE PARTAGÉ
// ==============================

// Charger la configuration au démarrage
app.on('ready', () => {
  loadConfig();
});

// Vérifier si le stockage est configuré
ipcMain.handle('is-storage-configured', async () => {
  return { configured: SHARED_STORAGE_PATH !== null };
});

// Obtenir le chemin de stockage actuel
ipcMain.handle('get-storage-path', async () => {
  return { path: SHARED_STORAGE_PATH };
});

// Ouvrir un dialogue pour sélectionner le dossier de stockage
ipcMain.handle('select-storage-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Sélectionner le dossier de stockage ListX',
      buttonLabel: 'Sélectionner',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = result.filePaths[0];

    // Vérifier les permissions en essayant d'écrire un fichier de test
    const testFile = path.join(selectedPath, '.listx-test');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      return {
        success: false,
        error: 'Impossible d\'écrire dans ce dossier. Vérifiez les permissions.'
      };
    }

    // Sauvegarder la configuration
    if (saveConfig(selectedPath)) {
      return { success: true, path: selectedPath };
    } else {
      return { success: false, error: 'Erreur lors de la sauvegarde de la configuration' };
    }
  } catch (error) {
    console.error('Erreur sélection dossier:', error);
    return { success: false, error: error.message };
  }
});

// Vérifier si le stockage partagé est accessible
ipcMain.handle('check-shared-storage', async () => {
  try {
    if (!SHARED_STORAGE_PATH) {
      return { accessible: false, error: 'Aucun dossier de stockage configuré' };
    }

    // Vérifier si le dossier existe
    if (!fs.existsSync(SHARED_STORAGE_PATH)) {
      // Essayer de créer le dossier
      fs.mkdirSync(SHARED_STORAGE_PATH, { recursive: true });
    }

    // Vérifier les permissions en essayant d'écrire un fichier de test
    const testFile = path.join(SHARED_STORAGE_PATH, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return { accessible: true, path: SHARED_STORAGE_PATH };
  } catch (error) {
    console.error('Stockage partagé non accessible:', error);
    return { accessible: false, error: error.message };
  }
});

// Lire les données du stockage partagé
ipcMain.handle('read-shared-data', async () => {
  try {
    if (!SHARED_STORAGE_PATH || !SHARED_DATA_FILE) {
      return { success: false, error: 'Aucun dossier de stockage configuré' };
    }

    if (!fs.existsSync(SHARED_DATA_FILE)) {
      // Si le fichier n'existe pas, retourner une structure vide
      return { success: true, data: { clients: {}, templates: [] } };
    }

    const fileContent = fs.readFileSync(SHARED_DATA_FILE, 'utf8');
    const data = JSON.parse(fileContent);

    return { success: true, data };
  } catch (error) {
    console.error('Erreur lecture données partagées:', error);
    return { success: false, error: error.message };
  }
});

// Écrire les données dans le stockage partagé
ipcMain.handle('write-shared-data', async (event, data) => {
  try {
    if (!SHARED_STORAGE_PATH || !SHARED_DATA_FILE) {
      return { success: false, error: 'Aucun dossier de stockage configuré' };
    }

    // Vérifier que le dossier existe
    if (!fs.existsSync(SHARED_STORAGE_PATH)) {
      fs.mkdirSync(SHARED_STORAGE_PATH, { recursive: true });
    }

    // Créer une sauvegarde avant d'écrire
    if (fs.existsSync(SHARED_DATA_FILE)) {
      const backupFile = path.join(SHARED_STORAGE_PATH, `data.backup.${Date.now()}.json`);
      fs.copyFileSync(SHARED_DATA_FILE, backupFile);

      // Garder seulement les 5 dernières sauvegardes
      const backups = fs.readdirSync(SHARED_STORAGE_PATH)
        .filter(f => f.startsWith('data.backup.'))
        .sort()
        .reverse();

      backups.slice(5).forEach(backup => {
        fs.unlinkSync(path.join(SHARED_STORAGE_PATH, backup));
      });
    }

    // Écrire les nouvelles données
    fs.writeFileSync(SHARED_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

    return { success: true };
  } catch (error) {
    console.error('Erreur écriture données partagées:', error);
    return { success: false, error: error.message };
  }
});

console.log(`ListX v${app.getVersion()} démarré`);
console.log(`Mode: ${isDev ? 'Développement' : 'Production'}`);
