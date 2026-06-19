import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import UpdateNotification from './components/UpdateNotification'
import StorageFolderSelector from './components/StorageFolderSelector'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ListingsPage from './pages/ListingsPage'
import EditorWrapper from './pages/EditorWrapper'
import { isStorageConfigured } from './services/storageService'

function App() {
  const [storageConfigured, setStorageConfigured] = useState(null)

  useEffect(() => {
    isStorageConfigured().then(setStorageConfigured);
  }, []);

  if (storageConfigured === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300 text-lg">Chargement de ListX...</p>
        </div>
      </div>
    );
  }

  if (!storageConfigured) {
    return <StorageFolderSelector onFolderSelected={() => setStorageConfigured(true)} />;
  }

  return (
    <>
      <UpdateNotification />
      <Routes>
        <Route path="/" element={<ClientsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/editor" element={<EditorWrapper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
