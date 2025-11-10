import { useState, useEffect } from 'react';

export default function VersionBadge() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    // Récupérer la version depuis l'API Electron
    const getVersion = async () => {
      if (window.electronAPI?.getAppVersion) {
        const appVersion = await window.electronAPI.getAppVersion();
        setVersion(appVersion);
      } else {
        // Fallback pour le mode développement web
        setVersion('1.2.0');
      }
    };

    getVersion();
  }, []);

  if (!version) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/60 rounded-lg text-xs font-medium">
        v{version}
      </div>
    </div>
  );
}
