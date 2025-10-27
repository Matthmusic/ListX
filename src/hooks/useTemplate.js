import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer l'état d'un template
 * Utilise l'API Electron pour charger/sauvegarder les templates
 */
export function useTemplate(templateId = null) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger un template par son ID
  const loadTemplate = async (id) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.templates.load(id);
      setTemplate(data);
      console.log('[useTemplate] Template chargé:', data.nom);
    } catch (err) {
      console.error('[useTemplate] Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder le template actuel
  const saveTemplate = async (templateData = null) => {
    const dataToSave = templateData || template;
    if (!dataToSave) {
      throw new Error('Aucun template à sauvegarder');
    }

    setLoading(true);
    setError(null);

    try {
      await window.electronAPI.templates.save(dataToSave);
      setTemplate(dataToSave);
      console.log('[useTemplate] Template sauvegardé:', dataToSave.nom);
      return true;
    } catch (err) {
      console.error('[useTemplate] Erreur sauvegarde:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau template
  const createTemplate = (templateData) => {
    setTemplate(templateData);
    console.log('[useTemplate] Nouveau template créé:', templateData.nom);
  };

  // Mettre à jour le template actuel
  const updateTemplate = (updates) => {
    if (!template) return;

    const updated = {
      ...template,
      ...updates,
      dateModification: new Date().toISOString()
    };

    setTemplate(updated);
  };

  // Réinitialiser le template
  const resetTemplate = () => {
    setTemplate(null);
    setError(null);
  };

  // Charger automatiquement si templateId fourni
  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  return {
    template,
    loading,
    error,
    loadTemplate,
    saveTemplate,
    createTemplate,
    updateTemplate,
    resetTemplate
  };
}

/**
 * Hook pour lister tous les templates disponibles
 */
export function useTemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTemplates = async () => {
    // Vérifier que l'API Electron est disponible
    if (!window.electronAPI || !window.electronAPI.templates) {
      console.error('[useTemplateList] electronAPI non disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.templates.list();
      setTemplates(data);
      console.log('[useTemplateList] Templates chargés:', data.length);
    } catch (err) {
      console.error('[useTemplateList] Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId) => {
    setLoading(true);
    setError(null);

    try {
      await window.electronAPI.templates.delete(templateId);
      // Recharger la liste après suppression
      await loadTemplates();
      console.log('[useTemplateList] Template supprimé:', templateId);
      return true;
    } catch (err) {
      console.error('[useTemplateList] Erreur suppression:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importTemplate = async () => {
    setLoading(true);
    setError(null);

    try {
      const imported = await window.electronAPI.templates.import();
      if (imported) {
        await loadTemplates();
        console.log('[useTemplateList] Template importé:', imported.nom);
        return imported;
      }
      return null;
    } catch (err) {
      console.error('[useTemplateList] Erreur import:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportTemplate = async (templateId) => {
    setLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.templates.export(templateId);
      console.log('[useTemplateList] Template exporté:', filePath);
      return filePath;
    } catch (err) {
      console.error('[useTemplateList] Erreur export:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Charger automatiquement au montage (avec délai pour attendre l'API)
  useEffect(() => {
    // Attendre que l'API soit disponible
    const checkAndLoad = () => {
      if (window.electronAPI && window.electronAPI.templates) {
        loadTemplates();
      } else {
        // Réessayer après 100ms
        setTimeout(checkAndLoad, 100);
      }
    };
    checkAndLoad();
  }, []);

  return {
    templates,
    loading,
    error,
    loadTemplates,
    deleteTemplate,
    importTemplate,
    exportTemplate
  };
}
