const { app, BrowserWindow, ipcMain, dialog, nativeTheme, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';
if (process.platform === 'win32') {
  app.setAppUserModelId('com.bet.listx');
}


// Forcer le th├¿me sombre global
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

// Resolve icon path for dev/prod (mirrors To-DoX strategy: packaged assets in resources/assets)
function getIconPath() {
  // En production, on force le chemin vers l'icone dans les ressources
  if (app.isPackaged) {
    // Note: electron-builder copies build/icon.ico to resources/build/icon.ico if listed in files
    // But we also have it in resources/assets/LX.ico via extraResources
    // Let's try to use the standard build/icon.ico location if possible, or fallback
    const iconPath = path.join(process.resourcesPath, 'build', 'icon.ico');
    // If we want to stick to the one we just copied:
    // const iconPath = path.join(process.resourcesPath, 'assets', 'LX.ico');

    // Let's use the one we know is correct now (src/assets/LX.ico copied to build/icon.ico)
    // In packaged app, files in 'build' are usually not copied unless specified in "files".
    // package.json has "build/icon.ico" in "files".
    // So it should be at resources/app.asar.unpacked/build/icon.ico OR resources/build/icon.ico depending on config.
    // Actually, "files" puts it inside app.asar usually.
    // "extraResources" puts it outside.

    // Let's rely on the extraResources one which is definitely accessible as a file
    const safeIconPath = path.join(process.resourcesPath, 'assets', 'LX.ico');
    console.log('Production icon path:', safeIconPath);
    return safeIconPath;
  }

  // En dev
  const devCandidates = [
    path.join(__dirname, '../src/assets/LX.ico'),
    path.join(__dirname, '../src/assets/LX.png'),
    path.join(__dirname, '../build/icon.ico')
  ];

  const iconPath = devCandidates.find((p) => fs.existsSync(p)) || devCandidates[0];
  console.log('Dev icon path:', iconPath);
  return iconPath;
}

function createWindow() {
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
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Forcer le th├¿me sombre de la barre de titre Windows (Windows 10/11)
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

    // D├®sactiver les DevTools en production
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Bloquer F12 et Ctrl+Shift+I
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        event.preventDefault();
      }
    });

    // D├®sactiver le menu contextuel (clic droit) en production
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  // Afficher la fen├¬tre quand elle est pr├¬te
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // V├®rifier les mises ├á jour au d├®marrage (seulement en prod)
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdates();
      }, 3000);
    }
  });

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

// Emp├¬cher plusieurs instances
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

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    createWindow();
  });
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
// GESTION DES MISES ├Ç JOUR
// ==============================

// Mise ├á jour disponible
autoUpdater.on('update-available', (info) => {
  updateAvailable = true;
  console.log('Mise ├á jour disponible:', info.version);

  if (mainWindow) {
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });
  }
});

// Pas de mise ├á jour
autoUpdater.on('update-not-available', (info) => {
  console.log('Application ├á jour');
  if (mainWindow) {
    mainWindow.webContents.send('update-not-available');
  }
});

// Erreur de v├®rification
autoUpdater.on('error', (err) => {
  console.error('Erreur de mise ├á jour:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message);
  }
});

// Progression du t├®l├®chargement
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

// Mise ├á jour t├®l├®charg├®e
autoUpdater.on('update-downloaded', (info) => {
  console.log('Mise ├á jour t├®l├®charg├®e');
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });
  }
});

// ==============================
// IPC HANDLERS (Communication avec React)
// ==============================

// L'utilisateur veut t├®l├®charger la mise ├á jour
ipcMain.on('download-update', () => {
  if (updateAvailable) {
    autoUpdater.downloadUpdate();
  }
});

// L'utilisateur veut installer la mise ├á jour maintenant
ipcMain.on('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});

// V├®rifier manuellement les mises ├á jour
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
        console.log('Configuration charg├®e:', SHARED_STORAGE_PATH);
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
    console.log('Configuration sauvegard├®e:', SHARED_STORAGE_PATH);
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde configuration:', error);
    return false;
  }
}

// ==============================
// STOCKAGE PARTAG├ë
// ==============================

// Charger la configuration au d├®marrage
app.on('ready', () => {
  loadConfig();
});

// V├®rifier si le stockage est configur├®
ipcMain.handle('is-storage-configured', async () => {
  return { configured: SHARED_STORAGE_PATH !== null };
});

// Obtenir le chemin de stockage actuel
ipcMain.handle('get-storage-path', async () => {
  return { path: SHARED_STORAGE_PATH };
});

// Ouvrir un dialogue pour s├®lectionner le dossier de stockage
ipcMain.handle('select-storage-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'S├®lectionner le dossier de stockage ListX',
      buttonLabel: 'S├®lectionner',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = result.filePaths[0];

    // V├®rifier les permissions en essayant d'├®crire un fichier de test
    const testFile = path.join(selectedPath, '.listx-test');
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      return {
        success: false,
        error: 'Impossible d\'├®crire dans ce dossier. V├®rifiez les permissions.'
      };
    }

    // Sauvegarder la configuration
    if (saveConfig(selectedPath)) {
      return { success: true, path: selectedPath };
    } else {
      return { success: false, error: 'Erreur lors de la sauvegarde de la configuration' };
    }
  } catch (error) {
    console.error('Erreur s├®lection dossier:', error);
    return { success: false, error: error.message };
  }
});

// V├®rifier si le stockage partag├® est accessible
ipcMain.handle('check-shared-storage', async () => {
  try {
    if (!SHARED_STORAGE_PATH) {
      return { accessible: false, error: 'Aucun dossier de stockage configur├®' };
    }

    // V├®rifier si le dossier existe
    if (!fs.existsSync(SHARED_STORAGE_PATH)) {
      // Essayer de cr├®er le dossier
      fs.mkdirSync(SHARED_STORAGE_PATH, { recursive: true });
    }

    // V├®rifier les permissions en essayant d'├®crire un fichier de test
    const testFile = path.join(SHARED_STORAGE_PATH, '.test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);

    return { accessible: true, path: SHARED_STORAGE_PATH };
  } catch (error) {
    console.error('Stockage partag├® non accessible:', error);
    return { accessible: false, error: error.message };
  }
});

// Lire les donn├®es du stockage partag├®
ipcMain.handle('read-shared-data', async () => {
  try {
    if (!SHARED_STORAGE_PATH || !SHARED_DATA_FILE) {
      return { success: false, error: 'Aucun dossier de stockage configur├®' };
    }

    if (!fs.existsSync(SHARED_DATA_FILE)) {
      // Si le fichier n'existe pas, retourner une structure vide
      return { success: true, data: { clients: {}, templates: [] } };
    }

    const fileContent = fs.readFileSync(SHARED_DATA_FILE, 'utf8');
    const data = JSON.parse(fileContent);

    return { success: true, data };
  } catch (error) {
    console.error('Erreur lecture donn├®es partag├®es:', error);
    return { success: false, error: error.message };
  }
});

// ├ëcrire les donn├®es dans le stockage partag├®
ipcMain.handle('write-shared-data', async (event, data) => {
  try {
    if (!SHARED_STORAGE_PATH || !SHARED_DATA_FILE) {
      return { success: false, error: 'Aucun dossier de stockage configur├®' };
    }

    // V├®rifier que le dossier existe
    if (!fs.existsSync(SHARED_STORAGE_PATH)) {
      fs.mkdirSync(SHARED_STORAGE_PATH, { recursive: true });
    }

    // Cr├®er une sauvegarde avant d'├®crire
    if (fs.existsSync(SHARED_DATA_FILE)) {
      const backupFile = path.join(SHARED_STORAGE_PATH, `data.backup.${Date.now()}.json`);
      fs.copyFileSync(SHARED_DATA_FILE, backupFile);

      // Garder seulement les 5 derni├¿res sauvegardes
      const backups = fs.readdirSync(SHARED_STORAGE_PATH)
        .filter(f => f.startsWith('data.backup.'))
        .sort()
        .reverse();

      backups.slice(5).forEach(backup => {
        fs.unlinkSync(path.join(SHARED_STORAGE_PATH, backup));
      });
    }

    // ├ëcrire les nouvelles donn├®es
    fs.writeFileSync(SHARED_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

    return { success: true };
  } catch (error) {
    console.error('Erreur ├®criture donn├®es partag├®es:', error);
    return { success: false, error: error.message };
  }
});

console.log(`ListX v${app.getVersion()} d├®marr├®`);
console.log(`Mode: ${isDev ? 'D├®veloppement' : 'Production'}`);
