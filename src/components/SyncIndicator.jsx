import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useDataSync } from '../hooks/useDataSync';
import { getStorageMode } from '../services/storageService';

export default function SyncIndicator() {
  const { syncStatus, lastSync } = useDataSync();
  const [storageMode, setStorageMode] = useState(getStorageMode());
  const [showToast, setShowToast] = useState(false);

  // Écouter les événements de mise à jour
  useEffect(() => {
    const handleDataUpdated = () => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    window.addEventListener('data-updated', handleDataUpdated);
    return () => window.removeEventListener('data-updated', handleDataUpdated);
  }, []);

  // Ne rien afficher si on n'utilise pas le stockage partagé
  if (storageMode.current === 'local' || !storageMode.available) {
    return null;
  }

  // Déterminer l'icône et la couleur selon l'état
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin" />,
          color: 'bg-yellow-500',
          text: 'Synchronisation...'
        };
      case 'synced':
        return {
          icon: <Check className="w-4 h-4" />,
          color: 'bg-green-500',
          text: 'Synchronisé'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: 'bg-red-500',
          text: 'Erreur de synchronisation'
        };
      default:
        return {
          icon: <Cloud className="w-4 h-4" />,
          color: 'bg-blue-500',
          text: 'Stockage partagé actif'
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <>
      {/* Indicateur permanent en bas à droite */}
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-2 ${status.color} text-white rounded-lg shadow-lg backdrop-blur-sm`}
          title={lastSync ? `Dernière synchro: ${lastSync.toLocaleTimeString()}` : status.text}
        >
          {status.icon}
          <span className="text-sm font-medium">{status.text}</span>
        </div>
      </div>

      {/* Toast de notification quand les données sont mises à jour */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg">
            <RefreshCw className="w-5 h-5" />
            <div>
              <p className="font-semibold">Données mises à jour</p>
              <p className="text-sm opacity-90">Un autre utilisateur a modifié les données</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
