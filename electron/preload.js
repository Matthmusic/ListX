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

  // ==============================
  // TEMPLATE MANAGEMENT API
  // ==============================
  templates: {
    list: () => ipcRenderer.invoke('templates:list'),
    load: (templateId) => ipcRenderer.invoke('templates:load', templateId),
    save: (template) => ipcRenderer.invoke('templates:save', template),
    delete: (templateId) => ipcRenderer.invoke('templates:delete', templateId),
    import: () => ipcRenderer.invoke('templates:import'),
    export: (templateId) => ipcRenderer.invoke('templates:export', templateId)
  },

  // ==============================
  // PROJECT MANAGEMENT API
  // ==============================
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    load: (projectId) => ipcRenderer.invoke('projects:load', projectId),
    save: (project) => ipcRenderer.invoke('projects:save', project),
    delete: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
    recents: () => ipcRenderer.invoke('projects:recents'),
    import: () => ipcRenderer.invoke('projects:import'),
    export: (projectId) => ipcRenderer.invoke('projects:export', projectId)
  }
});

console.log('Preload script loaded - electronAPI exposed with Templates & Projects API');
