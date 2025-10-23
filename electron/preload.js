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
  }
});

console.log('Preload script loaded - electronAPI exposed');
