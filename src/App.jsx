import { useApp } from './context/AppContext'
import UpdateNotification from './components/UpdateNotification'
import ClientsPage from './pages/ClientsPage'
import ProjectsPage from './pages/ProjectsPage'
import ListingsPage from './pages/ListingsPage'
import EditorWrapper from './pages/EditorWrapper'

function App() {
  const { currentView } = useApp()

  return (
    <>
      <UpdateNotification />
      {currentView === 'clients' && <ClientsPage />}
      {currentView === 'projects' && <ProjectsPage />}
      {currentView === 'listings' && <ListingsPage />}
      {currentView === 'editor' && <EditorWrapper />}
    </>
  )
}

export default App
