import { useEffect, useRef, useState } from 'react'
import { useApp } from './context/AppContext'
import TitleBar from './components/TitleBar'
import UpdateNotification from './components/UpdateNotification'
import StorageFolderSelector from './components/StorageFolderSelector'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ListingsPage from './pages/ListingsPage'
import EditorWrapper from './pages/EditorWrapper'
import { isStorageConfigured } from './services/storageService'

function App() {
  const { currentView } = useApp()
  const [storageConfigured, setStorageConfigured] = useState(null)
  const scrollContainerRef = useRef(null)

  // Vérifier si le stockage est configuré au démarrage
  useEffect(() => {
    const checkStorage = async () => {
      const configured = await isStorageConfigured();
      setStorageConfigured(configured);
    };
    checkStorage();
  }, []);

  // Remonter en haut à chaque changement de vue : ce conteneur est partagé
  // par toutes les pages (elles ne remontent pas, seul leur contenu change),
  // donc sans ça la position de scroll d'une page reste appliquée à la
  // suivante — un raccourci de navigation direct (ex: card "Derniers
  // listings ouverts" plus bas dans une page déjà scrollée) peut alors
  // laisser l'éditeur affiché avec son bouton "Retour" caché au-dessus
  // de la zone visible, sans aucune erreur.
  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
  }, [currentView]);

  // Callback quand l'utilisateur sélectionne un dossier
  const handleFolderSelected = (path) => {
    console.log('Dossier de stockage configuré:', path);
    setStorageConfigured(true);
  };

  return (
    <>
      <TitleBar />

      <div ref={scrollContainerRef} className="h-[calc(100vh-2.25rem)] overflow-auto">
        {storageConfigured === null && (
          // Afficher un loader pendant la vérification
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300 text-lg">Chargement de ListX...</p>
            </div>
          </div>
        )}

        {storageConfigured === false && (
          // Si le stockage n'est pas configuré, afficher le sélecteur
          <StorageFolderSelector onFolderSelected={handleFolderSelected} />
        )}

        {storageConfigured === true && (
          // Application normale
          <>
            <UpdateNotification />
            {currentView === 'clients' && <ClientsPage />}
            {currentView === 'projects' && <ProjectsPage />}
            {currentView === 'listings' && <ListingsPage />}
            {currentView === 'editor' && <EditorWrapper />}
          </>
        )}
      </div>
    </>
  )
}

export default App
