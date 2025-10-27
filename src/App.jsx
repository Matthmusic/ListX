import { useState, useEffect } from 'react'
import DocumentListingApp from './DocumentListingApp'
import UpdateNotification from './components/UpdateNotification'
import { ProjectSelector } from './components/ProjectSelector'
import { TemplateSelector } from './components/TemplateSelector'
import { TemplateEditor } from './components/TemplateEditor'
import { useProject } from './hooks/useProject'
import { useTemplate } from './hooks/useTemplate'

function App() {
  const [currentStep, setCurrentStep] = useState('project-selector') // 'project-selector', 'template-selector', 'template-editor', 'app'
  const { project, loadProject, createProject, saveProject } = useProject()
  const { saveTemplate } = useTemplate()
  const [isReady, setIsReady] = useState(false)
  const [pendingProjectName, setPendingProjectName] = useState('')

  // Vérifier si un projet est déjà chargé (relance de l'app)
  useEffect(() => {
    // TODO: Implémenter la persistance du dernier projet ouvert
    // Pour l'instant, toujours afficher la sélection au démarrage
    setCurrentStep('project-selector')
  }, [])

  const handleSelectProject = async (projectId) => {
    try {
      await loadProject(projectId)
      setCurrentStep('app')
      setIsReady(true)
    } catch (error) {
      console.error('Erreur chargement projet:', error)
      alert('Impossible de charger le projet')
    }
  }

  const handleCreateNewProject = () => {
    setCurrentStep('template-selector')
  }

  const handleSelectTemplate = async (template, projectName) => {
    try {
      // Créer un projet à partir du template (sans importer les classes)
      // Générer un ID unique
      const projectId = crypto.randomUUID ? crypto.randomUUID() : `project-${Date.now()}`

      const newProject = {
        id: projectId,
        nom: projectName,
        templateId: template.id,
        templateSnapshot: template,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString(),
        documents: [],
        exportConfig: {
          nomProjet: projectName,
          nomListe: '',
          logoClient: null,
          logoBE: null,
          date: new Date().toISOString().split('T')[0],
          indice: 'A'
        }
      }

      // Sauvegarder le projet
      await saveProject(newProject)

      // Charger le projet
      createProject(newProject)

      setCurrentStep('app')
      setIsReady(true)
    } catch (error) {
      console.error('Erreur création projet:', error)
      alert('Impossible de créer le projet: ' + error.message)
    }
  }

  const handleCreateTemplate = (projectName) => {
    setPendingProjectName(projectName)
    setCurrentStep('template-editor')
  }

  const handleSaveTemplate = async (templateData) => {
    try {
      // Sauvegarder le template
      await saveTemplate(templateData)

      // Créer un projet avec ce template
      if (pendingProjectName) {
        await handleSelectTemplate(templateData, pendingProjectName)
      } else {
        // Retour au sélecteur de template
        setCurrentStep('template-selector')
      }
    } catch (error) {
      console.error('Erreur sauvegarde template:', error)
      throw error
    }
  }

  const handleBackToProjectSelector = () => {
    setCurrentStep('project-selector')
    setPendingProjectName('')
  }

  const handleBackToTemplateSelector = () => {
    setCurrentStep('template-selector')
  }

  return (
    <>
      <UpdateNotification />

      {/* Modal de sélection de projet */}
      {currentStep === 'project-selector' && (
        <ProjectSelector
          onSelectProject={handleSelectProject}
          onCreateNew={handleCreateNewProject}
        />
      )}

      {/* Modal de sélection de template */}
      {currentStep === 'template-selector' && (
        <TemplateSelector
          onSelectTemplate={handleSelectTemplate}
          onCreateTemplate={handleCreateTemplate}
          onBack={handleBackToProjectSelector}
        />
      )}

      {/* Éditeur de template */}
      {currentStep === 'template-editor' && (
        <TemplateEditor
          onSave={handleSaveTemplate}
          onBack={handleBackToTemplateSelector}
        />
      )}

      {/* Application principale */}
      {currentStep === 'app' && isReady && project && (
        <DocumentListingApp
          project={project}
          onSaveProject={saveProject}
        />
      )}
    </>
  )
}

export default App
