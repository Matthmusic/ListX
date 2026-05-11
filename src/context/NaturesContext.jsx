import { createContext, useContext, useEffect, useState } from 'react';
import { loadNatures, saveNatures } from '../services/storageService';

export const DEFAULT_NATURES = [
  { code: 'NOT', label: 'Notice' },
  { code: 'NDC', label: 'Note de Calcul' },
  { code: 'PLN', label: 'Plan' },
  { code: 'SYN', label: 'Synoptique' },
  { code: 'SCH', label: 'Schéma' },
  { code: 'LST', label: 'Listing' },
];

const NaturesContext = createContext();

export function NaturesProvider({ children }) {
  const [natures, setNatures] = useState(DEFAULT_NATURES);

  useEffect(() => {
    loadNatures().then(setNatures).catch(() => setNatures(DEFAULT_NATURES));
  }, []);

  const naturesMap = Object.fromEntries(natures.map(n => [n.code, n.label]));

  const updateNatures = async (newNatures) => {
    const previous = natures;
    setNatures(newNatures);
    try {
      await saveNatures(newNatures);
    } catch (err) {
      setNatures(previous);
      throw err;
    }
  };

  return (
    <NaturesContext.Provider value={{ natures, naturesMap, updateNatures }}>
      {children}
    </NaturesContext.Provider>
  );
}

export function useNatures() {
  const ctx = useContext(NaturesContext);
  if (!ctx) throw new Error('useNatures must be used within NaturesProvider');
  return ctx;
}
