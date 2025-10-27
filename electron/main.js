const { app, BrowserWindow, ipcMain, dialog, nativeTheme } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

// Gestionnaires de données
const templateManager = require('./templateManager');
const projectManager = require('./projectManager');
const { loadDefaultTemplates } = require('./loadDefaultTemplates');

// Forcer le thème sombre global
nativeTheme.themeSource = 'dark';

// Configuration de l'auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let updateAvailable = false;

// Fonction pour obtenir le chemin de l'icône selon l'environnement
function getIconPath() {
  if (isDev) {
    // En développement, utiliser le chemin relatif
    return path.join(__dirname, '../build/icon.ico');
  } else {
    // En production, l'icône est dans le dossier app ou à la racine de l'exe
    // electron-builder gère automatiquement l'icône depuis build/icon.ico
    return path.join(__dirname, '../build/icon.ico');
  }
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

  app.whenReady().then(async () => {
    // Charger les templates par défaut au premier lancement
    try {
      await loadDefaultTemplates(templateManager);
    } catch (error) {
      console.error('[App] Erreur chargement templates par défaut:', error);
    }

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
// TEMPLATE MANAGEMENT IPC HANDLERS
// ==============================

// Lister tous les templates
ipcMain.handle('templates:list', async () => {
  try {
    return await templateManager.listTemplates();
  } catch (error) {
    console.error('[IPC] Erreur templates:list:', error);
    throw error;
  }
});

// Charger un template
ipcMain.handle('templates:load', async (event, templateId) => {
  try {
    return await templateManager.loadTemplate(templateId);
  } catch (error) {
    console.error('[IPC] Erreur templates:load:', error);
    throw error;
  }
});

// Sauvegarder un template
ipcMain.handle('templates:save', async (event, template) => {
  try {
    // Créer un backup avant sauvegarde si le template existe
    const exists = await templateManager.templateExists(template.id);
    if (exists) {
      await templateManager.createBackup(template.id);
    }
    return await templateManager.saveTemplate(template);
  } catch (error) {
    console.error('[IPC] Erreur templates:save:', error);
    throw error;
  }
});

// Supprimer un template
ipcMain.handle('templates:delete', async (event, templateId) => {
  try {
    // Créer un backup avant suppression
    await templateManager.createBackup(templateId);
    return await templateManager.deleteTemplate(templateId);
  } catch (error) {
    console.error('[IPC] Erreur templates:delete:', error);
    throw error;
  }
});

// Importer un template
ipcMain.handle('templates:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Importer un template',
      filters: [
        { name: 'Templates ListX', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return await templateManager.importTemplate(result.filePaths[0]);
  } catch (error) {
    console.error('[IPC] Erreur templates:import:', error);
    throw error;
  }
});

// Exporter un template
ipcMain.handle('templates:export', async (event, templateId) => {
  try {
    const template = await templateManager.loadTemplate(templateId);
    const defaultName = `template_${template.nom.replace(/\s+/g, '_')}_v${template.version}.json`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exporter le template',
      defaultPath: defaultName,
      filters: [
        { name: 'Templates ListX', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await templateManager.exportTemplate(templateId, result.filePath);
    return result.filePath;
  } catch (error) {
    console.error('[IPC] Erreur templates:export:', error);
    throw error;
  }
});

// ==============================
// PROJECT MANAGEMENT IPC HANDLERS
// ==============================

// Lister tous les projets
ipcMain.handle('projects:list', async () => {
  try {
    return await projectManager.listProjects();
  } catch (error) {
    console.error('[IPC] Erreur projects:list:', error);
    throw error;
  }
});

// Charger un projet
ipcMain.handle('projects:load', async (event, projectId) => {
  try {
    return await projectManager.loadProject(projectId);
  } catch (error) {
    console.error('[IPC] Erreur projects:load:', error);
    throw error;
  }
});

// Sauvegarder un projet
ipcMain.handle('projects:save', async (event, project) => {
  try {
    // Créer un backup avant sauvegarde si le projet existe
    const exists = await projectManager.projectExists(project.id);
    if (exists) {
      await projectManager.createBackup(project.id);
    }
    return await projectManager.saveProject(project);
  } catch (error) {
    console.error('[IPC] Erreur projects:save:', error);
    throw error;
  }
});

// Supprimer un projet
ipcMain.handle('projects:delete', async (event, projectId) => {
  try {
    // Créer un backup avant suppression
    await projectManager.createBackup(projectId);
    return await projectManager.deleteProject(projectId);
  } catch (error) {
    console.error('[IPC] Erreur projects:delete:', error);
    throw error;
  }
});

// Obtenir les projets récents
ipcMain.handle('projects:recents', async () => {
  try {
    return await projectManager.getRecents();
  } catch (error) {
    console.error('[IPC] Erreur projects:recents:', error);
    throw error;
  }
});

// Importer un projet
ipcMain.handle('projects:import', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Importer un projet',
      filters: [
        { name: 'Projets ListX', extensions: ['listx', 'json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return await projectManager.importProject(result.filePaths[0]);
  } catch (error) {
    console.error('[IPC] Erreur projects:import:', error);
    throw error;
  }
});

// Exporter un projet
ipcMain.handle('projects:export', async (event, projectId) => {
  try {
    const project = await projectManager.loadProject(projectId);
    const dateStr = new Date().toISOString().split('T')[0];
    const defaultName = `projet_${project.nom.replace(/\s+/g, '_')}_${dateStr}.listx`;

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exporter le projet',
      defaultPath: defaultName,
      filters: [
        { name: 'Projets ListX', extensions: ['listx'] },
        { name: 'JSON', extensions: ['json'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await projectManager.exportProject(projectId, result.filePath);
    return result.filePath;
  } catch (error) {
    console.error('[IPC] Erreur projects:export:', error);
    throw error;
  }
});

console.log(`ListX v${app.getVersion()} démarré`);
console.log(`Mode: ${isDev ? 'Développement' : 'Production'}`);
