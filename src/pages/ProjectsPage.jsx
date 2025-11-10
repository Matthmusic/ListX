import { useState, useEffect } from 'react';
import { Plus, FolderOpen, Edit, Trash2, ChevronLeft, Download, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getClientProjects, createProject, renameProject, deleteProject, exportProject, importProject } from '../services/storageService';
import AppLayout from '../components/AppLayout';
import InputDialog from '../components/InputDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import listXLogo from '../assets/listX.svg';

export default function ProjectsPage() {
  const { selectedClient, navigateToClients, navigateToListings } = useApp();
  const [projects, setProjects] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (selectedClient) {
      loadProjects();
    }
  }, [selectedClient]);

  const loadProjects = () => {
    const loadedProjects = getClientProjects(selectedClient.id);
    setProjects(loadedProjects);
  };

  const handleCreateProject = (name) => {
    createProject(selectedClient.id, name);
    loadProjects();
  };

  const handleEditProject = (name) => {
    if (selectedProject) {
      renameProject(selectedClient.id, selectedProject.id, name);
      loadProjects();
      setSelectedProject(null);
    }
  };

  const handleDeleteProject = () => {
    if (selectedProject) {
      deleteProject(selectedClient.id, selectedProject.id);
      loadProjects();
      setSelectedProject(null);
    }
  };

  const handleExportProject = (project) => {
    const exportData = exportProject(selectedClient.id, project.id);
    if (!exportData) {
      alert('Erreur lors de l\'export du projet');
      return;
    }

    // Formater la date au format AAMMJJ
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ListX_Project_${project.name.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const result = importProject(selectedClient.id, data);

          if (result.success) {
            loadProjects();
            alert(`Projet "${result.name}" importé avec succès !\n${result.listingCount} listing(s) inclus.`);
          }
        } catch (error) {
          alert('Erreur lors de l\'import : ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!selectedClient) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header avec logo centré */}
        <div className="flex items-center justify-center mb-6">
          <img src={listXLogo} alt="ListX" className="h-20" />
        </div>

        {/* Titre avec boutons retour et création */}
        <div className="relative text-center mb-12">
          <button
            onClick={navigateToClients}
            className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour aux clients
          </button>
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              onClick={handleImportProject}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              title="Importer un projet"
            >
              <Download className="w-4 h-4" />
              Importer
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nouveau projet
            </button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">{selectedClient.name}</h1>
          <p className="text-blue-200">Sélectionnez ou créez un projet</p>
        </div>

        {projects.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center max-w-md">
              <FolderOpen className="w-20 h-20 text-white/60 mb-6 mx-auto" />
              <h2 className="text-2xl font-semibold text-white mb-3">Aucun projet</h2>
              <p className="text-blue-200 mb-8">Créez votre premier projet ou importez-en un existant</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleImportProject}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Importer un projet
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Créer mon premier projet
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Card container
          <div className="space-y-6">
            {/* Grid de projets */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => navigateToListings(selectedClient, project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{project.name}</h3>
                        <p className="text-sm text-blue-200">
                          {project.listingCount} listing{project.listingCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportProject(project);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors"
                      title="Exporter ce projet"
                    >
                      <Upload className="w-4 h-4" />
                      Exporter
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowEditDialog(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Renommer
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setShowDeleteDialog(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <InputDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={handleCreateProject}
        title="Nouveau projet"
        label="Nom du projet (affaire)"
        placeholder="Ex: Usine Nord - Phase 1"
        confirmText="Créer"
      />

      <InputDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedProject(null);
        }}
        onConfirm={handleEditProject}
        title="Renommer le projet"
        label="Nouveau nom"
        placeholder="Ex: Usine Nord - Phase 1"
        initialValue={selectedProject?.name || ''}
        confirmText="Renommer"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDeleteProject}
        title="Supprimer le projet"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedProject?.name}" ? Tous les listings associés seront également supprimés.`}
        confirmText="Supprimer"
        isDestructive
      />
    </AppLayout>
  );
}
