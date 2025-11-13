import { useState } from 'react';
import { FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';

export default function StorageFolderSelector({ onFolderSelected }) {
  const [selectedPath, setSelectedPath] = useState(null);
  const [error, setError] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelectFolder = async () => {
    setIsSelecting(true);
    setError(null);

    try {
      const result = await window.electronAPI.selectStorageFolder();

      if (result.canceled) {
        setIsSelecting(false);
        return;
      }

      if (result.success) {
        setSelectedPath(result.path);
        // Appeler le callback après un court délai pour montrer le succès
        setTimeout(() => {
          onFolderSelected(result.path);
        }, 1000);
      } else {
        setError(result.error || 'Erreur lors de la sélection du dossier');
        setIsSelecting(false);
      }
    } catch (err) {
      setError('Une erreur est survenue: ' + err.message);
      setIsSelecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-2xl mb-4">
            <FolderOpen className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Bienvenue sur ListX</h1>
          <p className="text-slate-300 text-lg">
            Première utilisation - Configuration du stockage
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-3">
              Sélectionner le dossier de stockage
            </h2>
            <p className="text-slate-300 mb-4 leading-relaxed">
              ListX a besoin d'un dossier pour stocker toutes vos données (clients, projets, listings).
              Ce dossier peut être sur un lecteur réseau partagé pour un usage en équipe,
              ou sur votre disque local pour un usage personnel.
            </p>
            <ul className="text-slate-400 text-sm space-y-2 mb-6">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Toutes les données seront sauvegardées dans ce dossier</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Vous pourrez changer ce dossier plus tard dans les paramètres</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>Des sauvegardes automatiques seront créées régulièrement</span>
              </li>
            </ul>

            {/* Selected path display */}
            {selectedPath && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-400 font-medium mb-1">Dossier sélectionné</p>
                  <p className="text-slate-300 text-sm break-all">{selectedPath}</p>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium mb-1">Erreur</p>
                  <p className="text-slate-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleSelectFolder}
              disabled={isSelecting || selectedPath}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                flex items-center justify-center gap-2
                ${
                  selectedPath
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : isSelecting
                    ? 'bg-blue-500/50 text-white cursor-wait'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40'
                }
              `}
            >
              {selectedPath ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Configuration terminée
                </>
              ) : isSelecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sélection en cours...
                </>
              ) : (
                <>
                  <FolderOpen className="w-5 h-5" />
                  Choisir le dossier de stockage
                </>
              )}
            </button>
          </div>

          {/* Info footer */}
          <div className="text-center text-slate-400 text-sm">
            <p>Cette configuration ne se fait qu'une seule fois</p>
          </div>
        </div>
      </div>
    </div>
  );
}
