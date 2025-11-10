import { useState, useEffect, useCallback } from 'react';

const SYNC_INTERVAL = 5000; // 5 secondes

/**
 * Hook personnalisé pour la synchronisation automatique des données
 * Vérifie toutes les 5 secondes si le fichier partagé a changé
 */
export function useDataSync() {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, synced, error
  const [lastSync, setLastSync] = useState(null);
  const [lastMtime, setLastMtime] = useState(null);

  // Fonction pour vérifier si les données ont changé
  const checkForUpdates = useCallback(async () => {
    if (!window.electronAPI) return;

    try {
      const result = await window.electronAPI.getFileMtime();

      if (result.success && result.mtime) {
        if (lastMtime && result.mtime > lastMtime) {
          // Le fichier a été modifié par quelqu'un d'autre
          setSyncStatus('syncing');
          // Déclencher un événement personnalisé pour informer les composants
          window.dispatchEvent(new CustomEvent('data-updated'));
          setLastMtime(result.mtime);
          setSyncStatus('synced');
          setLastSync(new Date());
        } else if (!lastMtime) {
          // Première vérification
          setLastMtime(result.mtime);
        }
      }
    } catch (error) {
      console.error('Erreur vérification mises à jour:', error);
      setSyncStatus('error');
    }
  }, [lastMtime]);

  // Configurer l'intervalle de synchronisation
  useEffect(() => {
    const interval = setInterval(checkForUpdates, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForUpdates]);

  // Vérification initiale
  useEffect(() => {
    checkForUpdates();
  }, []);

  // Fonction pour forcer une synchronisation
  const forceSync = useCallback(async () => {
    await checkForUpdates();
  }, [checkForUpdates]);

  return {
    syncStatus,
    lastSync,
    forceSync
  };
}
