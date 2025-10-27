import React, { useState } from 'react';
import { useTemplateList } from '../hooks/useTemplate.js';
import { FileText, Plus, Upload, Download, Edit, Trash2, Star, ArrowLeft } from 'lucide-react';

/**
 * Modal de sélection de template
 * Affichée lors de la création d'un nouveau projet
 */
export function TemplateSelector({ onSelectTemplate, onCreateTemplate, onBack }) {
  const { templates, loading, error, deleteTemplate, importTemplate, exportTemplate } = useTemplateList();
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [projectName, setProjectName] = useState('');

  const handleSelectTemplate = (template) => {
    if (!projectName.trim()) {
      alert('Veuillez entrer un nom de projet');
      return;
    }
    onSelectTemplate(template, projectName.trim());
  };

  const handleCreateNew = () => {
    if (!projectName.trim()) {
      alert('Veuillez entrer un nom de projet');
      return;
    }
    onCreateTemplate(projectName.trim());
  };

  const handleImport = async () => {
    try {
      const imported = await importTemplate();
      if (imported && projectName.trim()) {
        onSelectTemplate(imported, projectName.trim());
      }
    } catch (err) {
      console.error('Erreur import:', err);
    }
  };

  const handleExport = async (e, templateId) => {
    e.stopPropagation();
    try {
      await exportTemplate(templateId);
    } catch (err) {
      console.error('Erreur export:', err);
    }
  };

  const handleDelete = async (e, templateId) => {
    e.stopPropagation();
    if (showConfirmDelete === templateId) {
      try {
        await deleteTemplate(templateId);
        setShowConfirmDelete(null);
      } catch (err) {
        console.error('Erreur suppression:', err);
      }
    } else {
      setShowConfirmDelete(templateId);
    }
  };

  // Séparer les templates par défaut des templates utilisateur
  const defaultTemplates = templates.filter(t => t.id.startsWith('default-'));
  const userTemplates = templates.filter(t => !t.id.startsWith('default-'));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-100 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Choisir un template
          </h1>
          <p className="text-indigo-100 mt-2">Sélectionnez un template pour votre nouveau projet</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-280px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <strong>Erreur :</strong> {error}
            </div>
          )}

          {/* Nom du projet */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Hôpital Saint-Jean"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none text-lg"
              autoFocus
            />
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={handleCreateNew}
              disabled={!projectName.trim()}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Créer un template</span>
            </button>

            <button
              onClick={handleImport}
              disabled={loading || !projectName.trim()}
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              <span className="font-semibold">Importer</span>
            </button>

            <button
              disabled
              className="flex items-center justify-center gap-2 p-4 bg-gray-300 text-gray-500 rounded-xl cursor-not-allowed"
            >
              <Star className="w-5 h-5" />
              <span className="font-semibold">Favoris</span>
            </button>
          </div>

          {/* Templates par défaut */}
          {defaultTemplates.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Templates recommandés
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {defaultTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative p-5 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => projectName.trim() && handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-blue-600 text-white rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <button
                        onClick={(e) => handleExport(e, template.id)}
                        className="p-2 bg-white text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        title="Exporter ce template"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">{template.nom}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{template.champsCount} champs</span>
                      <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full font-semibold">
                        DÉFAUT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates utilisateur */}
          {userTemplates.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Mes templates ({userTemplates.length})
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {userTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative p-5 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-400 rounded-xl transition-all cursor-pointer"
                    onClick={() => projectName.trim() && handleSelectTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 bg-gray-600 text-white rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleExport(e, template.id)}
                          className="p-2 bg-white text-gray-600 rounded-lg hover:bg-gray-600 hover:text-white transition-all"
                          title="Exporter"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, template.id)}
                          className={`p-2 rounded-lg transition-all ${
                            showConfirmDelete === template.id
                              ? 'bg-red-600 text-white'
                              : 'bg-white text-gray-600 hover:bg-red-600 hover:text-white'
                          }`}
                          title={showConfirmDelete === template.id ? 'Confirmer' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{template.nom}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description || 'Aucune description'}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{template.champsCount} champs</span>
                      <span>{new Date(template.dateModification).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {!loading && templates.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">Aucun template trouvé</p>
              <p className="text-gray-400 text-sm">Créez votre premier template ou importez-en un existant</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
              <p className="text-gray-500 mt-4">Chargement des templates...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Astuce :</strong> Choisissez "BET Structure" pour un template complet ou "Simple" pour commencer rapidement
          </p>
        </div>
      </div>
    </div>
  );
}
