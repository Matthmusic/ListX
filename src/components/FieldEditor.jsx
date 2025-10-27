import React, { useState } from 'react';
import { GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Composant d'édition d'un champ individuel
 */
export function FieldEditor({ field, onUpdate, onDelete, isDragging }) {
  const [expanded, setExpanded] = useState(false);
  const [localField, setLocalField] = useState(field);
  const [optionsText, setOptionsText] = useState(field.options?.join(', ') || '');

  const handleChange = (property, value) => {
    // Appliquer uppercase automatiquement pour le nom du champ
    if (property === 'nom' && typeof value === 'string') {
      value = value.toUpperCase();
    }
    const updated = { ...localField, [property]: value };
    setLocalField(updated);
    onUpdate(updated);
  };

  const handleOptionsTextChange = (text) => {
    // Mettre à jour le texte ET convertir en temps réel
    const upperText = text.toUpperCase();
    setOptionsText(upperText);

    // Convertir en options en temps réel
    const options = upperText.split(',').map(o => o.trim()).filter(o => o.length > 0);
    handleChange('options', options);
  };

  const FIELD_TYPES = [
    { value: 'text', label: 'Texte' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'number', label: 'Nombre' },
    { value: 'date', label: 'Date' }
  ];

  return (
    <div
      className={`bg-white border-2 rounded-lg transition-all ${
        isDragging ? 'border-blue-400 shadow-lg opacity-50' : 'border-gray-200'
      }`}
    >
      {/* En-tête du champ */}
      <div className="flex items-center gap-3 p-4">
        {/* Handle de drag */}
        <div className="cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Nom du champ */}
        <div className="flex-1">
          <input
            type="text"
            value={localField.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            placeholder="NOM DU CHAMP"
            className="w-full font-semibold text-gray-800 border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors uppercase"
          />
        </div>

        {/* Type */}
        <select
          value={localField.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
        >
          {FIELD_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {/* Obligatoire */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={localField.obligatoire}
            onChange={(e) => handleChange('obligatoire', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span>Obligatoire</span>
        </label>

        {/* Bouton expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Bouton supprimer */}
        <button
          onClick={onDelete}
          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Supprimer ce champ"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Paramètres avancés (collapsible) */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            {/* Placeholder */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={localField.placeholder || ''}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                placeholder="Texte d'aide..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Largeur de colonne */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Largeur colonne (export)
              </label>
              <input
                type="number"
                value={localField.largeurColonne}
                onChange={(e) => handleChange('largeurColonne', parseInt(e.target.value) || 15)}
                min="5"
                max="100"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options pour select */}
          {localField.type === 'select' && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Options (séparées par des virgules <strong>,</strong>)
              </label>
              <input
                type="text"
                value={optionsText}
                onChange={(e) => handleOptionsTextChange(e.target.value)}
                placeholder="OPTION 1, OPTION 2, OPTION 3"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                style={{ textTransform: 'uppercase' }}
              />
              {localField.options && localField.options.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {localField.options.map((opt, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checkboxes supplémentaires */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={localField.visible}
                onChange={(e) => handleChange('visible', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>Visible dans exports</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={localField.inclureDansNom}
                onChange={(e) => handleChange('inclureDansNom', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>Inclure dans nom de fichier</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={localField.cleDeCatégorie}
                onChange={(e) => handleChange('cleDeCatégorie', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span>Clé de catégorie</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
