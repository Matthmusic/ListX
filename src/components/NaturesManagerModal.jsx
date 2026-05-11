import { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useNatures } from '../context/NaturesContext';

const CODE_REGEX = /^[A-Z0-9]{1,5}$/;

export default function NaturesManagerModal({ isOpen, onClose, documents = [] }) {
  const { natures, updateNatures } = useNatures();
  const [localNatures, setLocalNatures] = useState(null);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newError, setNewError] = useState('');

  const working = localNatures ?? natures;

  if (!isOpen) return null;

  const usedCodes = new Set(documents.map(d => d.nature));
  // Les codes d'origine ne peuvent pas être renommés (préserve l'arborescence)
  const originalCodes = new Set(natures.map(n => n.code));

  const validate = (list) => {
    const errs = {};
    list.forEach((n) => {
      const key = n.code || `__${Math.random()}`;
      if (!n.code.trim()) errs[key] = 'Le code est obligatoire';
      else if (!CODE_REGEX.test(n.code)) errs[key] = 'Code : 1-5 caractères majuscules ou chiffres';
      else if (list.filter(m => m.code === n.code).length > 1) errs[key] = 'Code déjà utilisé';
      if (!errs[key] && !n.label.trim()) errs[key] = 'Le libellé est obligatoire';
    });
    return errs;
  };

  const handleChange = (index, field, value) => {
    const isOriginal = originalCodes.has(working[index].code);
    if (field === 'code' && isOriginal) return;
    const updated = working.map((n, i) =>
      i === index ? { ...n, [field]: field === 'code' ? value.toUpperCase() : value } : n
    );
    setLocalNatures(updated);
    setErrors(validate(updated));
  };

  const handleDelete = (index) => {
    const updated = working.filter((_, i) => i !== index);
    setLocalNatures(updated);
    setErrors(validate(updated));
  };

  const handleAdd = () => {
    const code = newCode.toUpperCase().trim();
    const label = newLabel.trim();
    if (!code) { setNewError('Le code est obligatoire'); return; }
    if (!CODE_REGEX.test(code)) { setNewError('Code : 1-5 caractères majuscules ou chiffres'); return; }
    if (working.some(n => n.code === code)) { setNewError('Ce code existe déjà'); return; }
    if (!label) { setNewError('Le libellé est obligatoire'); return; }
    setNewError('');
    const updated = [...working, { code, label }];
    setLocalNatures(updated);
    setErrors(validate(updated));
    setNewCode('');
    setNewLabel('');
  };

  const handleSave = async () => {
    const errs = validate(working);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaveError('');
    try {
      await updateNatures(working);
      setLocalNatures(null);
      setErrors({});
      setNewCode('');
      setNewLabel('');
      setNewError('');
      onClose();
    } catch {
      setSaveError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    }
  };

  const handleCancel = () => {
    setLocalNatures(null);
    setErrors({});
    setSaveError('');
    setNewCode('');
    setNewLabel('');
    setNewError('');
    onClose();
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Gestion des natures de document</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ajoutez, renommez ou supprimez des natures</p>
          </div>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {/* En-têtes colonnes */}
          <div className="grid grid-cols-[80px_1fr_32px] gap-2 px-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Libellé</span>
          </div>

          {working.map((nature, index) => {
            const isUsed = usedCodes.has(nature.code);
            const isOriginal = originalCodes.has(nature.code);
            const errorKey = nature.code || `__${index}`;
            return (
              <div key={nature.code || index} className="space-y-1">
                <div className="grid grid-cols-[80px_1fr_32px] gap-2 items-center">
                  <input
                    type="text"
                    value={nature.code}
                    onChange={(e) => handleChange(index, 'code', e.target.value)}
                    maxLength={5}
                    readOnly={isOriginal}
                    title={isOriginal ? 'Le code ne peut pas être modifié après création' : undefined}
                    className={`px-2 py-1.5 border rounded text-xs font-mono font-semibold uppercase ${
                      isOriginal ? 'bg-gray-50 text-gray-500 cursor-default' : ''
                    } ${errors[errorKey] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="CODE"
                  />
                  <input
                    type="text"
                    value={nature.label}
                    onChange={(e) => handleChange(index, 'label', e.target.value)}
                    className={`px-2 py-1.5 border rounded text-xs ${
                      errors[errorKey] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Libellé"
                  />
                  <button
                    onClick={() => handleDelete(index)}
                    disabled={isUsed}
                    title={isUsed ? 'Nature utilisée dans des documents — supprimez ces documents d\'abord' : 'Supprimer'}
                    className={`flex items-center justify-center w-8 h-8 rounded transition-colors ${
                      isUsed
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {errors[errorKey] && (
                  <p className="text-xs text-red-500 pl-1">{errors[errorKey]}</p>
                )}
                {isUsed && (
                  <p className="text-xs text-amber-500 flex items-center gap-1 pl-1">
                    <AlertTriangle size={11} /> Utilisée dans {documents.filter(d => d.nature === nature.code).length} document(s)
                  </p>
                )}
              </div>
            );
          })}

          {/* Ligne d'ajout */}
          <div className="pt-3 border-t border-gray-100 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter une nature</p>
            <div className="grid grid-cols-[80px_1fr_32px] gap-2 items-center">
              <input
                type="text"
                value={newCode}
                onChange={(e) => { setNewCode(e.target.value); setNewError(''); }}
                maxLength={5}
                className={`px-2 py-1.5 border rounded text-xs font-mono font-semibold uppercase ${
                  newError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="CODE"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => { setNewLabel(e.target.value); setNewError(''); }}
                className={`px-2 py-1.5 border rounded text-xs ${
                  newError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Libellé de la nature"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                className="flex items-center justify-center w-8 h-8 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Ajouter"
              >
                <Plus size={15} />
              </button>
            </div>
            {newError && <p className="text-xs text-red-500 pl-1">{newError}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-200">
          <div className="flex-1">
            {saveError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {saveError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={hasErrors}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasErrors
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
