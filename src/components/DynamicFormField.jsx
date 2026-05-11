import { Plus } from 'lucide-react';
import { useState, memo } from 'react';

/**
 * Composant de champ de formulaire dynamique
 * Génère le bon type de champ selon le nom du champ
 * Mémorisé pour éviter les re-renders inutiles
 */
const DynamicFormFieldComponent = ({
  fieldName,
  label,
  value,
  onChange,
  onKeyPress,
  error,
  // Props pour le champ Affaire
  affairesList,
  filteredAffaires,
  showAutocomplete,
  onAffaireFocus,
  onAffaireBlur,
  onAffaireSelect,
  affaireExiste,
  onAddAffaire,
  // Props pour les champs personnalisés
  customFieldType,
  // Props pour l'historique des champs
  fieldHistory = [],
  currentAffaire,
  // Options dynamiques pour la nature
  naturesOptions,
}) => {
  const fieldNameLower = fieldName.toLowerCase();

  // État local pour afficher l'autocomplete de l'historique
  const [showFieldAutocomplete, setShowFieldAutocomplete] = useState(false);
  const [filteredHistory, setFilteredHistory] = useState([]);

  // Détecter si c'est un champ personnalisé
  const isCustomField = fieldName.startsWith('CUSTOM_');

  // Configuration des champs spéciaux
  const fieldConfigs = {
    affaire: {
      type: 'text-with-autocomplete',
      placeholder: 'AFFAIRE',
      minWidth: '120px',
      required: false, // Champ optionnel car on travaille dans un listing spécifique
    },
    phase: {
      type: 'select',
      options: ['DIAG', 'APS', 'APD', 'AVP', 'PRO', 'DCE', 'ACT', 'EXE'],
      minWidth: '70px',
      required: true,
    },
    lot: {
      type: 'text',
      placeholder: 'LOT1',
      maxLength: 10,
      minWidth: '70px',
    },
    emetteur: {
      type: 'text',
      placeholder: 'CEAI',
      minWidth: '70px',
    },
    nature: {
      type: 'select',
      options: naturesOptions ?? [
        { value: 'NOT', label: 'NOT - Notice' },
        { value: 'NDC', label: 'NDC - Note de Calcul' },
        { value: 'PLN', label: 'PLN - Plan' },
        { value: 'SYN', label: 'SYN - Synoptique' },
        { value: 'SCH', label: 'SCH - Schéma' },
        { value: 'LST', label: 'LST - Listing' },
      ],
      minWidth: '160px',
      required: true,
    },
    etat: {
      type: 'select',
      options: [
        { value: '', label: '-' },
        { value: 'ACTUEL', label: 'ACTUEL' },
        { value: 'PROJET', label: 'PROJET' },
      ],
      minWidth: '110px',
    },
    numero: {
      type: 'readonly',
      minWidth: '50px',
    },
    zone: {
      type: 'text',
      placeholder: 'ZONE1',
      maxLength: 5,
      minWidth: '70px',
    },
    niveau: {
      type: 'text',
      placeholder: 'R+1',
      maxLength: 5,
      minWidth: '70px',
    },
    niveaucoupe: {
      type: 'text',
      placeholder: 'R+1',
      maxLength: 5,
      minWidth: '70px',
    },
    format: {
      type: 'select',
      options: [
        { value: '', label: '-' },
        'A0+',
        'A0',
        'A1',
        'A2',
        'A3',
        'A4',
      ],
      minWidth: '60px',
      required: true,
    },
    indice: {
      type: 'text',
      placeholder: 'A',
      maxLength: 1,
      minWidth: '40px',
      centered: true,
      required: true,
    },
  };

  // Configuration pour ce champ
  let config = fieldConfigs[fieldNameLower];

  // Si pas de config (champ personnalisé ou inconnu), utiliser une config par défaut
  if (!config) {
    config = {
      type: customFieldType || 'text',
      minWidth: '120px',
      placeholder: isCustomField ? label : '',
    };
  }

  // Champ Affaire avec autocomplete
  if (fieldNameLower === 'affaire') {
    return (
      <div className="relative" style={{ minWidth: config.minWidth }}>
        <label className="block text-xs font-medium text-white mb-1">
          {label} {config.required && '*'}
        </label>
        <div className="flex gap-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            onFocus={onAffaireFocus}
            onBlur={onAffaireBlur}
            onKeyPress={onKeyPress}
            className={`w-full px-2 py-1.5 border rounded text-xs uppercase ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={config.placeholder}
          />
          {value && !affaireExiste && (
            <button
              onClick={onAddAffaire}
              className="bg-green-600 text-white px-1.5 py-1.5 rounded hover:bg-green-700 flex items-center justify-center shrink-0"
              title="Ajouter cette nouvelle affaire"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
        {showAutocomplete && filteredAffaires.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredAffaires.map((aff) => (
              <button
                key={aff}
                onClick={() => onAffaireSelect(aff)}
                className="w-full text-left px-2 py-1.5 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-xs"
              >
                {aff}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Champ Select
  if (config.type === 'select') {
    return (
      <div style={{ minWidth: config.minWidth }}>
        <label className="block text-xs font-medium text-white mb-1">
          {label} {config.required && '*'}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-1 py-1.5 border rounded text-xs ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {config.options.map((opt) => {
            if (typeof opt === 'string') {
              return (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              );
            } else {
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            }
          })}
        </select>
      </div>
    );
  }

  // Champ readonly (pour NUMERO)
  if (config.type === 'readonly') {
    return (
      <div style={{ minWidth: config.minWidth }}>
        <label className="block text-xs font-medium text-white mb-1">{label}</label>
        <input
          type="text"
          value={value}
          readOnly
          className="w-full px-2 py-1.5 border border-gray-200 bg-gray-50 rounded text-xs text-center"
        />
      </div>
    );
  }

  // Handlers pour l'autocomplete de l'historique
  const handleFieldFocus = () => {
    if (currentAffaire && fieldHistory && fieldHistory.length > 0) {
      setFilteredHistory(fieldHistory);
      setShowFieldAutocomplete(true);
    }
  };

  const handleFieldChange = (newValue) => {
    // Transformer en majuscules
    const upperValue = newValue.toUpperCase();
    onChange(upperValue);

    // Filtrer l'historique en fonction de la saisie
    if (currentAffaire && fieldHistory && fieldHistory.length > 0) {
      const filtered = fieldHistory.filter(item =>
        item.toUpperCase().includes(upperValue)
      );
      setFilteredHistory(filtered);
      setShowFieldAutocomplete(filtered.length > 0 && upperValue.length > 0);
    }
  };

  const handleFieldBlur = () => {
    // Délai pour permettre le clic sur une suggestion
    setTimeout(() => setShowFieldAutocomplete(false), 200);
  };

  const handleHistorySelect = (historyValue) => {
    onChange(historyValue);
    setShowFieldAutocomplete(false);
  };

  // Champ Text standard (avec autocomplete si historique disponible)
  const hasHistory = currentAffaire && fieldHistory && fieldHistory.length > 0;

  return (
    <div className="relative" style={{ minWidth: config.minWidth }}>
      <label className="block text-xs font-medium text-white mb-1">
        {label} {config.required && '*'}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleFieldChange(e.target.value)}
        onFocus={handleFieldFocus}
        onBlur={handleFieldBlur}
        onKeyPress={onKeyPress}
        maxLength={config.maxLength}
        className={`w-full px-2 py-1.5 border rounded text-xs uppercase ${
          config.centered ? 'text-center' : ''
        } ${error ? 'border-red-500' : 'border-gray-300'}`}
        placeholder={config.placeholder}
      />
      {showFieldAutocomplete && filteredHistory.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
          {filteredHistory.map((item) => (
            <button
              key={item}
              onClick={() => handleHistorySelect(item)}
              className="w-full text-left px-2 py-1.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-xs"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Export avec React.memo pour éviter les re-renders inutiles
export const DynamicFormField = memo(DynamicFormFieldComponent);
