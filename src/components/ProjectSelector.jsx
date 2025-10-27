import React, { useState } from 'react';
import { useProjectList } from '../hooks/useProject.js';
import { FolderOpen, Plus, Upload, Clock, Trash2, FileText } from 'lucide-react';

/**
 * Modal de sélection/création de projet
 * Affichée au démarrage de l'application
 */
export function ProjectSelector({ onSelectProject, onCreateNew }) {
  const { projects, recents, loading, error, deleteProject, importProject } = useProjectList();
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  const handleSelectProject = async (projectId) => {
    onSelectProject(projectId);
  };

  const handleCreateNew = () => {
    onCreateNew();
  };

  const handleImport = async () => {
    try {
      const imported = await importProject();
      if (imported) {
        onSelectProject(imported.id);
      }
    } catch (err) {
      console.error('Erreur import:', err);
    }
  };

  const handleDelete = async (projectId, projectName) => {
    if (showConfirmDelete === projectId) {
      try {
        await deleteProject(projectId);
        setShowConfirmDelete(null);
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    } else {
      setShowConfirmDelete(projectId);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FolderOpen className="w-8 h-8" />
            Sélectionner un projet
          </h1>
          <p className="text-blue-100 mt-2">Choisissez un projet existant ou créez-en un nouveau</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          {/* Actions principales */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleCreateNew}
              className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-6 h-6" />
              <span className="text-lg font-semibold">Nouveau projet</span>
            </button>

            <button
              onClick={handleImport}
              disabled={loading}
              className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-6 h-6" />
              <span className="text-lg font-semibold">Importer un projet</span>
            </button>
          </div>

          {/* Projets récents */}
          {recents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Projets récents
              </h2>
              <div className="grid gap-3">
                {recents.map((recent) => {
                  const fullProject = projects.find(p => p.id === recent.id);
                  if (!fullProject) return null;

                  return (
                    <div
                      key={recent.id}
                      className="group flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer"
                      onClick={() => handleSelectProject(recent.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-blue-600 text-white rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 text-lg">{recent.nom}</h3>
                          <p className="text-sm text-gray-600">
                            {fullProject.documentsCount} document(s) • {formatDate(recent.dateAcces)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(recent.id, recent.nom);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          showConfirmDelete === recent.id
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                        }`}
                        title={showConfirmDelete === recent.id ? 'Confirmer la suppression' : 'Supprimer'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tous les projets */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-gray-600" />
                Tous les projets ({projects.length})
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex flex-col p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-400 rounded-xl transition-all cursor-pointer relative"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{project.nom}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project.id, project.nom);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          showConfirmDelete === project.id
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                        }`}
                        title={showConfirmDelete === project.id ? 'Confirmer' : 'Supprimer'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{project.templateNom}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{project.documentsCount} docs</span>
                      <span>{formatDate(project.dateModification)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {!loading && projects.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">Aucun projet trouvé</p>
              <p className="text-gray-400 text-sm">Créez votre premier projet ou importez-en un existant</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-500 mt-4">Chargement des projets...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Astuce :</strong> Les projets sont sauvegardés automatiquement dans votre dossier AppData
          </p>
        </div>
      </div>
    </div>
  );
}
