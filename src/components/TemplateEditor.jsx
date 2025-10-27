import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Eye } from 'lucide-react';
import { FieldEditor } from './FieldEditor';
import { generateUUID } from '../utils/uuid';

/**
 * Éditeur de template
 * Permet de créer ou éditer un template
 */
export function TemplateEditor({ template = null, onSave, onBack }) {
  const [templateData, setTemplateData] = useState(
    template || {
      id: generateUUID(),
      nom: '',
      description: '',
      version: '1.1.0',
      dateCreation: new Date().toISOString(),
      dateModification: new Date().toISOString(),
      champs: [],
      exportConfig: {
        afficherCategories: true
      }
    }
  );

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateChange = (property, value) => {
    // Appliquer uppercase pour le nom du template
    if (property === 'nom' && typeof value === 'string') {
      value = value.toUpperCase();
    }
    setTemplateData(prev => ({
      ...prev,
      [property]: value,
      dateModification: new Date().toISOString()
    }));
  };

  const handleAddField = () => {
    if (templateData.champs.length >= 12) {
      alert('Limite de 12 champs atteinte');
      return;
    }

    const newField = {
      id: generateUUID(),
      nom: `CHAMP ${templateData.champs.length + 1}`,
      type: 'text',
      obligatoire: false,
      ordre: templateData.champs.length + 1,
      visible: true,
      inclureDansNom: true,
      cleDeCatégorie: false,
      largeurColonne: 15,
      placeholder: '',
      options: null
    };

    setTemplateData(prev => ({
      ...prev,
      champs: [...prev.champs, newField],
      dateModification: new Date().toISOString()
    }));
  };

  const handleUpdateField = (index, updatedField) => {
    setTemplateData(prev => ({
      ...prev,
      champs: prev.champs.map((field, i) => i === index ? updatedField : field),
      dateModification: new Date().toISOString()
    }));
  };

  const handleDeleteField = (index) => {
    if (confirm('Supprimer ce champ ?')) {
      setTemplateData(prev => ({
        ...prev,
        champs: prev.champs.filter((_, i) => i !== index).map((field, i) => ({
          ...field,
          ordre: i + 1
        })),
        dateModification: new Date().toISOString()
      }));
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newChamps = [...templateData.champs];
    const draggedField = newChamps[draggedIndex];
    newChamps.splice(draggedIndex, 1);
    newChamps.splice(index, 0, draggedField);

    // Réorganiser les ordres
    const reordered = newChamps.map((field, i) => ({
      ...field,
      ordre: i + 1
    }));

    setTemplateData(prev => ({
      ...prev,
      champs: reordered,
      dateModification: new Date().toISOString()
    }));

    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = async () => {
    // Validation
    if (!templateData.nom.trim()) {
      alert('Le nom du template est obligatoire');
      return;
    }

    if (templateData.champs.length === 0) {
      alert('Ajoutez au moins un champ au template');
      return;
    }

    // Vérifier les doublons de noms
    const names = templateData.champs.map(f => f.nom.trim().toUpperCase());
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      alert(`Noms de champs en double détectés : ${duplicates.join(', ')}`);
      return;
    }

    // Vérifier les champs select ont des options
    const selectsWithoutOptions = templateData.champs.filter(
      f => f.type === 'select' && (!f.options || f.options.length < 2)
    );
    if (selectsWithoutOptions.length > 0) {
      alert(`Les champs de type "Liste déroulante" doivent avoir au moins 2 options : ${selectsWithoutOptions.map(f => f.nom).join(', ')}`);
      return;
    }

    try {
      await onSave(templateData);
    } catch (error) {
      alert('Erreur lors de la sauvegarde : ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-purple-100 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {template ? 'Éditer le template' : 'Nouveau template'}
          </h1>
          <p className="text-purple-100 mt-2">
            {templateData.champs.length}/12 champs configurés
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Informations du template */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du template <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateData.nom}
                onChange={(e) => handleTemplateChange('nom', e.target.value)}
                placeholder="EX: TEMPLATE BET FLUIDES"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg uppercase font-semibold"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={templateData.description}
                onChange={(e) => handleTemplateChange('description', e.target.value)}
                placeholder="Description du template (optionnel)"
                rows="2"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Liste des champs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Champs du template
              </h2>
              <button
                onClick={handleAddField}
                disabled={templateData.champs.length >= 12}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Ajouter un champ
              </button>
            </div>

            {templateData.champs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg mb-4">Aucun champ configuré</p>
                <button
                  onClick={handleAddField}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Ajouter le premier champ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {templateData.champs.map((field, index) => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    <FieldEditor
                      field={field}
                      onUpdate={(updated) => handleUpdateField(index, updated)}
                      onDelete={() => handleDeleteField(index)}
                      isDragging={draggedIndex === index}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prévisualisation */}
          {showPreview && templateData.champs.length > 0 && (
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Prévisualisation du formulaire
              </h3>
              <div className="bg-white rounded-lg p-4 space-y-3">
                {templateData.champs.map((field, index) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {field.nom}
                      {field.obligatoire && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    )}
                    {field.type === 'select' && (
                      <select disabled className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                        <option>{field.placeholder || 'Sélectionnez...'}</option>
                        {field.options?.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    )}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Masquer' : 'Prévisualiser'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
