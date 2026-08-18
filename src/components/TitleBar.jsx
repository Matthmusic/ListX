import { useEffect, useState } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import listXLogo from '../assets/LX.svg';

export default function TitleBar() {
  const { currentView, selectedClient, selectedProject, selectedListing } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.windowControls) return;

    window.electronAPI.windowControls.isMaximized().then(setIsMaximized);
    window.electronAPI.windowControls.onMaximizedChange(setIsMaximized);

    return () => {
      window.electronAPI.removeAllListeners('window-maximized-change');
    };
  }, []);

  if (!window.electronAPI?.windowControls) {
    return null;
  }

  const getTitle = () => {
    if (currentView === 'projects' && selectedClient) {
      return `ListX — ${selectedClient.name}`;
    }
    if (currentView === 'listings' && selectedClient && selectedProject) {
      return `ListX — ${selectedClient.name} / ${selectedProject.name}`;
    }
    if (currentView === 'editor') {
      return `ListX — ${selectedListing?.name ?? 'Nouvelle liste'}`;
    }
    return 'ListX';
  };

  return (
    <div
      className="relative z-[60] flex items-center justify-between h-9 border-b border-white/10 select-none"
      style={{ WebkitAppRegion: 'drag', backgroundColor: '#1e3a8a' }}
      onDoubleClick={() => window.electronAPI.windowControls.toggleMaximize()}
    >
      <div className="flex items-center gap-2 px-3 min-w-0">
        <img src={listXLogo} alt="" className="w-4 h-4 shrink-0 brightness-0 invert" />
        <span className="text-xs font-medium text-blue-50 truncate">{getTitle()}</span>
      </div>

      <div className="flex items-stretch h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          type="button"
          onClick={() => window.electronAPI.windowControls.minimize()}
          className="w-11 flex items-center justify-center text-blue-100 hover:bg-white/10 transition-colors"
          aria-label="Réduire"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI.windowControls.toggleMaximize()}
          className="w-11 flex items-center justify-center text-blue-100 hover:bg-white/10 transition-colors"
          aria-label={isMaximized ? 'Restaurer' : 'Agrandir'}
        >
          {isMaximized ? <Copy size={13} /> : <Square size={12} />}
        </button>
        <button
          type="button"
          onClick={() => window.electronAPI.windowControls.close()}
          className="w-11 flex items-center justify-center text-blue-100 hover:bg-red-500 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
