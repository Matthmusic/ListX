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
  const [isSaving, setIsSaving] = useState(false);

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

    // ÉVITER LES SOUMISSIONS EN DOUBLE (clic répété pendant l'await ci-dessous)
    if (isSaving) return;
    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-950 border border-white/20 rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Gestion des natures de document</h2>
            <p className="text-sm text-blue-200 mt-1">Ajoutez, renommez ou supprimez des natures</p>
          </div>
          <button
            onClick={handleCancel}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Fermer"
            title="Fermer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {working.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {working.map((nature, index) => {
                const isUsed = usedCodes.has(nature.code);
                const isOriginal = originalCodes.has(nature.code);
                const errorKey = nature.code || `__${index}`;
                return (
                  <div
                    key={nature.code || index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={nature.code}
                        onChange={(e) => handleChange(index, 'code', e.target.value)}
                        maxLength={5}
                        readOnly={isOriginal}
                        title={isOriginal ? 'Le code ne peut pas être modifié après création' : undefined}
                        className={`w-20 flex-shrink-0 px-2 py-1.5 border rounded-lg text-xs font-mono font-semibold uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          isOriginal ? 'bg-white/50 text-gray-500 cursor-default' : 'bg-white/90'
                        } ${errors[errorKey] ? 'border-red-400' : 'border-white/30'}`}
                        placeholder="CODE"
                      />
                      <input
                        type="text"
                        value={nature.label}
                        onChange={(e) => handleChange(index, 'label', e.target.value)}
                        className={`flex-1 min-w-0 px-2 py-1.5 bg-white/90 border rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                          errors[errorKey] ? 'border-red-400' : 'border-white/30'
                        }`}
                        placeholder="Libellé"
                      />
                      <button
                        onClick={() => handleDelete(index)}
                        disabled={isUsed}
                        title={isUsed ? 'Nature utilisée dans des documents — supprimez ces documents d\'abord' : 'Supprimer'}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-colors ${
                          isUsed
                            ? 'text-white/20 cursor-not-allowed'
                            : 'text-red-300 hover:text-red-200 hover:bg-red-500/20'
                        }`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {errors[errorKey] && (
                      <p className="text-xs text-red-300 mt-1.5 pl-1">{errors[errorKey]}</p>
                    )}
                    {isUsed && (
                      <p className="text-xs text-amber-300 flex items-center gap-1 mt-1.5 pl-1">
                        <AlertTriangle size={11} /> Utilisée dans {documents.filter(d => d.nature === nature.code).length} document(s)
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ajouter une nature */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-3">Ajouter une nature</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCode}
                onChange={(e) => { setNewCode(e.target.value); setNewError(''); }}
                maxLength={5}
                className={`w-24 flex-shrink-0 px-3 py-2 bg-white/90 border rounded-lg text-sm font-mono font-semibold uppercase text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  newError ? 'border-red-400' : 'border-white/30'
                }`}
                placeholder="CODE"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => { setNewLabel(e.target.value); setNewError(''); }}
                className={`flex-1 px-3 py-2 bg-white/90 border rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  newError ? 'border-red-400' : 'border-white/30'
                }`}
                placeholder="Libellé de la nature"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-colors shadow-md flex-shrink-0"
              >
                <Plus size={16} />
                Ajouter
              </button>
            </div>
            {newError && <p className="text-xs text-red-300 mt-2">{newError}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-white/20">
          <div className="flex-1">
            {saveError && (
              <p className="text-xs text-red-300 flex items-center gap-1">
                <AlertTriangle size={12} /> {saveError}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-blue-200 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={hasErrors || isSaving}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasErrors || isSaving
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Sauvegarde…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
