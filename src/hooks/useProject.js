import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer l'état d'un projet
 * Utilise l'API Electron pour charger/sauvegarder les projets
 */
export function useProject(projectId = null) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger un projet par son ID
  const loadProject = async (id) => {
    if (!id) return;

    // Vérifier que l'API Electron est disponible
    if (!window.electronAPI || !window.electronAPI.projects) {
      console.error('[useProject] electronAPI non disponible');
      setError('API Electron non disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.projects.load(id);
      setProject(data);
      console.log('[useProject] Projet chargé:', data.nom);
    } catch (err) {
      console.error('[useProject] Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder le projet actuel
  const saveProject = async (projectData = null) => {
    const dataToSave = projectData || project;
    if (!dataToSave) {
      throw new Error('Aucun projet à sauvegarder');
    }

    setLoading(true);
    setError(null);

    try {
      await window.electronAPI.projects.save(dataToSave);
      setProject(dataToSave);
      console.log('[useProject] Projet sauvegardé:', dataToSave.nom);
      return true;
    } catch (err) {
      console.error('[useProject] Erreur sauvegarde:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau projet
  const createProject = (projectData) => {
    setProject(projectData);
    console.log('[useProject] Nouveau projet créé:', projectData.nom);
  };

  // Mettre à jour le projet actuel
  const updateProject = (updates) => {
    if (!project) return;

    const updated = {
      ...project,
      ...updates,
      dateModification: new Date().toISOString()
    };

    setProject(updated);
  };

  // Ajouter un document au projet
  const addDocument = (document) => {
    if (!project) return;

    const updated = {
      ...project,
      documents: [...project.documents, document],
      dateModification: new Date().toISOString()
    };

    setProject(updated);
  };

  // Mettre à jour un document
  const updateDocument = (documentId, updates) => {
    if (!project) return;

    const updated = {
      ...project,
      documents: project.documents.map(doc =>
        doc.id === documentId ? { ...doc, ...updates } : doc
      ),
      dateModification: new Date().toISOString()
    };

    setProject(updated);
  };

  // Supprimer un document
  const removeDocument = (documentId) => {
    if (!project) return;

    const updated = {
      ...project,
      documents: project.documents.filter(doc => doc.id !== documentId),
      dateModification: new Date().toISOString()
    };

    setProject(updated);
  };

  // Vider tous les documents
  const clearDocuments = () => {
    if (!project) return;

    const updated = {
      ...project,
      documents: [],
      dateModification: new Date().toISOString()
    };

    setProject(updated);
  };

  // Récupérer le template du projet
  const getTemplate = () => {
    if (!project || !project.templateSnapshot) {
      return null;
    }
    return project.templateSnapshot;
  };

  // Réinitialiser le projet
  const resetProject = () => {
    setProject(null);
    setError(null);
  };

  // Charger automatiquement si projectId fourni
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  return {
    project,
    loading,
    error,
    loadProject,
    saveProject,
    createProject,
    updateProject,
    addDocument,
    updateDocument,
    removeDocument,
    clearDocuments,
    getTemplate,
    resetProject
  };
}

/**
 * Hook pour lister tous les projets disponibles
 */
export function useProjectList() {
  const [projects, setProjects] = useState([]);
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    // Vérifier que l'API Electron est disponible
    if (!window.electronAPI || !window.electronAPI.projects) {
      console.error('[useProjectList] electronAPI non disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.projects.list();
      setProjects(data);
      console.log('[useProjectList] Projets chargés:', data.length);
    } catch (err) {
      console.error('[useProjectList] Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRecents = async () => {
    // Vérifier que l'API Electron est disponible
    if (!window.electronAPI || !window.electronAPI.projects) {
      console.error('[useProjectList] electronAPI non disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.projects.recents();
      setRecents(data);
      console.log('[useProjectList] Projets récents chargés:', data.length);
    } catch (err) {
      console.error('[useProjectList] Erreur chargement récents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    setLoading(true);
    setError(null);

    try {
      await window.electronAPI.projects.delete(projectId);
      // Recharger la liste après suppression
      await loadProjects();
      await loadRecents();
      console.log('[useProjectList] Projet supprimé:', projectId);
      return true;
    } catch (err) {
      console.error('[useProjectList] Erreur suppression:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const importProject = async () => {
    setLoading(true);
    setError(null);

    try {
      const imported = await window.electronAPI.projects.import();
      if (imported) {
        await loadProjects();
        await loadRecents();
        console.log('[useProjectList] Projet importé:', imported.nom);
        return imported;
      }
      return null;
    } catch (err) {
      console.error('[useProjectList] Erreur import:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportProject = async (projectId) => {
    setLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.projects.export(projectId);
      console.log('[useProjectList] Projet exporté:', filePath);
      return filePath;
    } catch (err) {
      console.error('[useProjectList] Erreur export:', err);
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
      if (window.electronAPI && window.electronAPI.projects) {
        loadProjects();
        loadRecents();
      } else {
        // Réessayer après 100ms
        setTimeout(checkAndLoad, 100);
      }
    };
    checkAndLoad();
  }, []);

  return {
    projects,
    recents,
    loading,
    error,
    loadProjects,
    loadRecents,
    deleteProject,
    importProject,
    exportProject
  };
}
