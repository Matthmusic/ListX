const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs de manière sécurisée à React
contextBridge.exposeInMainWorld('electronAPI', {
  // Informations sur l'app
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Mises à jour
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  installUpdate: () => ipcRenderer.send('install-update'),

  // Listeners pour les événements de mise à jour
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', () => callback());
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, message) => callback(message));
  },
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },

  // Nettoyer les listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Stockage partagé
  isStorageConfigured: () => ipcRenderer.invoke('is-storage-configured'),
  getStoragePath: () => ipcRenderer.invoke('get-storage-path'),
  selectStorageFolder: () => ipcRenderer.invoke('select-storage-folder'),
  checkSharedStorage: () => ipcRenderer.invoke('check-shared-storage'),
  readSharedData: () => ipcRenderer.invoke('read-shared-data'),
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

console.log('Preload script loaded - electronAPI exposed');
