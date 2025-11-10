import { useEffect } from 'react'
import { useApp } from './context/AppContext'
import UpdateNotification from './components/UpdateNotification'
import SyncIndicator from './components/SyncIndicator'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ListingsPage from './pages/ListingsPage'
import EditorWrapper from './pages/EditorWrapper'
import { initializeStorage } from './services/storageService'

function App() {
  const { currentView } = useApp()

  // Initialiser le stockage au démarrage
  useEffect(() => {
    const init = async () => {
      const result = await initializeStorage();
      console.log('Stockage initialisé:', result);
    };
    init();
  }, []);

  return (
    <>
      <UpdateNotification />
      <SyncIndicator />
      {currentView === 'clients' && <ClientsPage />}
      {currentView === 'projects' && <ProjectsPage />}
      {currentView === 'listings' && <ListingsPage />}
      {currentView === 'editor' && <EditorWrapper />}
    </>
  )
}

export default App
