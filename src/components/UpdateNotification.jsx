import { useState, useEffect } from 'react';
import { Download, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Vérifier si on est dans Electron
    if (!window.electronAPI) {
      return;
    }

    // Écouter les événements de mise à jour
    window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setShow(true);
      setError(null);
    });

    window.electronAPI.onUpdateNotAvailable(() => {
      console.log('Application à jour');
    });

    window.electronAPI.onUpdateError((message) => {
      setError(message);
      setShow(true);
    });

    window.electronAPI.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
    });

    window.electronAPI.onUpdateDownloaded((info) => {
      setIsReady(true);
      setIsDownloading(false);
      setDownloadProgress(null);
    });

    // Cleanup
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('update-available');
        window.electronAPI.removeAllListeners('update-not-available');
        window.electronAPI.removeAllListeners('update-error');
        window.electronAPI.removeAllListeners('download-progress');
        window.electronAPI.removeAllListeners('update-downloaded');
      }
    };
  }, []);

  const handleDownload = () => {
    setIsDownloading(true);
    window.electronAPI.downloadUpdate();
  };

  const handleInstall = () => {
    window.electronAPI.installUpdate();
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-blue-900 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            {error ? (
              <AlertCircle className="w-5 h-5" />
            ) : isReady ? (
              <RefreshCw className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <h3 className="font-semibold">
              {error
                ? 'Erreur de mise à jour'
                : isReady
                ? 'Mise à jour prête'
                : 'Mise à jour disponible'}
            </h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {error ? (
            <div className="text-red-600 text-sm">
              <p>Une erreur s'est produite lors de la vérification des mises à jour :</p>
              <p className="mt-2 font-mono text-xs bg-red-50 p-2 rounded">{error}</p>
            </div>
          ) : isReady ? (
            <div>
              <p className="text-gray-700 mb-4">
                La mise à jour <span className="font-semibold">v{updateInfo?.version}</span> a été
                téléchargée et est prête à être installée.
              </p>
              <button
                onClick={handleInstall}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Redémarrer et installer
              </button>
            </div>
          ) : isDownloading ? (
            <div>
              <p className="text-gray-700 mb-3">
                Téléchargement de la mise à jour...
              </p>
              {downloadProgress && (
                <div>
                  <div className="bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                    <div
                      className="bg-blue-900 h-full transition-all duration-300 ease-out"
                      style={{ width: `${downloadProgress.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{Math.round(downloadProgress.percent)}%</span>
                    <span>
                      {(downloadProgress.transferred / 1024 / 1024).toFixed(1)} MB /{' '}
                      {(downloadProgress.total / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  {downloadProgress.bytesPerSecond && (
                    <div className="text-xs text-gray-500 mt-1 text-center">
                      {(downloadProgress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-700 mb-4">
                Une nouvelle version <span className="font-semibold">v{updateInfo?.version}</span>{' '}
                est disponible.
              </p>
              {updateInfo?.releaseNotes && (
                <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-700 max-h-32 overflow-y-auto">
                  <p className="font-semibold mb-1">Nouveautés :</p>
                  <div className="text-xs">{updateInfo.releaseNotes}</div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Télécharger
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
