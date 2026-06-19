const isElectron = typeof window !== 'undefined' && window.electronAPI;

let cache = null;

export function clearStorageCache() {
  cache = null;
}

export async function isStorageConfigured() {
  if (!isElectron) {
    return false;
  }

  try {
    const result = await window.electronAPI.isStorageConfigured();
    return result.configured;
  } catch (error) {
    console.error('Erreur vérification configuration:', error);
    return false;
  }
}

/**
 * Obtient le chemin du dossier de stockage
 */
export async function getStoragePath() {
  if (!isElectron) {
    return null;
  }

  try {
    const result = await window.electronAPI.getStoragePath();
    return result.path;
  } catch (error) {
    console.error('Erreur récupération chemin stockage:', error);
    return null;
  }
}

async function loadData() {
  if (!isElectron) throw new Error('Electron API non disponible');
  if (cache) return cache;
  try {
    const result = await window.electronAPI.readSharedData();
    if (result.success) {
      cache = result.data || { clients: {}, templates: [] };
      return cache;
    }
    throw new Error(result.error || 'Erreur lecture données');
  } catch (error) {
    console.error('Erreur chargement données:', error);
    throw error;
  }
}

async function saveData(data) {
  if (!isElectron) throw new Error('Electron API non disponible');
  try {
    const result = await window.electronAPI.writeSharedData(data);
    if (result.success) {
      cache = data;
      return true;
    }
    throw new Error(result.error || 'Erreur écriture données');
  } catch (error) {
    console.error('Erreur sauvegarde données:', error);
    throw error;
  }
}

// ============= CLIENTS =============

/**
 * Récupère tous les clients
 * @returns {Array} Liste des clients avec leurs métadonnées
 */
export async function getAllClients() {
  const data = await loadData();
  return Object.entries(data.clients || {}).map(([id, client]) => ({
    id,
    name: client.name,
    createdAt: client.createdAt,
    projectCount: Object.keys(client.projects || {}).length,
  }));
}

/**
 * Crée un nouveau client
 * @param {string} name - Nom du client
 * @returns {Object} Le client créé
 */
export async function createClient(name) {
  const data = await loadData();
  const id = crypto.randomUUID();

  data.clients[id] = {
    name,
    createdAt: new Date().toISOString(),
    projects: {},
  };

  await saveData(data);

  return {
    id,
    name,
    createdAt: data.clients[id].createdAt,
    projectCount: 0,
  };
}

/**
 * Renomme un client
 * @param {string} clientId - ID du client
 * @param {string} newName - Nouveau nom
 * @returns {boolean} Succès de l'opération
 */
export async function renameClient(clientId, newName) {
  const data = await loadData();

  if (!data.clients[clientId]) {
    return false;
  }

  data.clients[clientId].name = newName;
  return await saveData(data);
}

/**
 * Supprime un client et tous ses projets
 * @param {string} clientId - ID du client
 * @returns {boolean} Succès de l'opération
 */
export async function deleteClient(clientId) {
  const data = await loadData();

  if (!data.clients[clientId]) {
    return false;
  }

  delete data.clients[clientId];
  return await saveData(data);
}

// ============= PROJETS =============

/**
 * Récupère tous les projets d'un client
 * @param {string} clientId - ID du client
 * @returns {Array} Liste des projets avec leurs métadonnées
 */
export async function getClientProjects(clientId) {
  const data = await loadData();
  const client = data.clients[clientId];

  if (!client) {
    return [];
  }

  return Object.entries(client.projects || {}).map(([id, project]) => ({
    id,
    name: project.name,
    createdAt: project.createdAt,
    listingCount: Object.keys(project.listings || {}).length,
  }));
}

/**
 * Crée un nouveau projet dans un client
 * @param {string} clientId - ID du client
 * @param {string} name - Nom du projet
 * @returns {Object} Le projet créé
 */
export async function createProject(clientId, name) {
  const data = await loadData();
  const client = data.clients[clientId];

  if (!client) {
    return null;
  }

  const id = crypto.randomUUID();

  if (!client.projects) {
    client.projects = {};
  }

  client.projects[id] = {
    name,
    createdAt: new Date().toISOString(),
    listings: {},
  };

  await saveData(data);

  return {
    id,
    name,
    createdAt: client.projects[id].createdAt,
    listingCount: 0,
  };
}

/**
 * Renomme un projet
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} newName - Nouveau nom
 * @returns {boolean} Succès de l'opération
 */
export async function renameProject(clientId, projectId, newName) {
  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project) {
    return false;
  }

  project.name = newName;
  return await saveData(data);
}

/**
 * Supprime un projet et tous ses listings
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @returns {boolean} Succès de l'opération
 */
export async function deleteProject(clientId, projectId) {
  const data = await loadData();
  const client = data.clients[clientId];

  if (!client || !client.projects[projectId]) {
    return false;
  }

  delete client.projects[projectId];
  return await saveData(data);
}

// ============= LISTINGS =============

/**
 * Récupère tous les listings d'un projet
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @returns {Array} Liste des listings avec leurs métadonnées
 */
export async function getProjectListings(clientId, projectId) {
  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project) {
    return [];
  }

  return Object.entries(project.listings || {}).map(([id, listing]) => ({
    id,
    name: listing.name,
    createdAt: listing.createdAt,
    updatedAt: listing.updatedAt,
    documentCount: listing.documents?.length || 0,
  }));
}

/**
 * Crée un nouveau listing
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} name - Nom du listing
 * @returns {Object} Le listing créé
 */
export async function createListing(clientId, projectId, name) {
  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project) {
    return null;
  }

  const id = crypto.randomUUID();

  if (!project.listings) {
    project.listings = {};
  }

  project.listings[id] = {
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    documents: [],
  };

  await saveData(data);

  return {
    id,
    name,
    createdAt: project.listings[id].createdAt,
    updatedAt: project.listings[id].updatedAt,
    documentCount: 0,
  };
}

/**
 * Charge un listing complet
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing
 * @returns {Object} Le listing complet
 */
export async function loadListing(clientId, projectId, listingId) {
  const data = await loadData();
  return data.clients[clientId]?.projects[projectId]?.listings[listingId] || null;
}

/**
 * Sauvegarde un listing complet
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing
 * @param {Object} listingData - Données du listing
 * @returns {boolean} Succès de l'opération
 */
export async function saveListing(clientId, projectId, listingId, listingData) {
  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project || !project.listings[listingId]) {
    return false;
  }

  const now = Date.now();
  project.listings[listingId] = {
    ...listingData,
    updatedAt: new Date().toISOString(),
    metadata: {
      ...listingData.metadata,
      lastModified: now
    }
  };

  return await saveData(data);
}

/**
 * Renomme un listing
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing
 * @param {string} newName - Nouveau nom
 * @returns {boolean} Succès de l'opération
 */
export async function renameListing(clientId, projectId, listingId, newName) {
  const data = await loadData();
  const listing = data.clients[clientId]?.projects[projectId]?.listings[listingId];

  if (!listing) {
    return false;
  }

  listing.name = newName;
  listing.updatedAt = new Date().toISOString();
  return await saveData(data);
}

/**
 * Duplique un listing
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing à dupliquer
 * @returns {Object} Le nouveau listing créé
 */
export async function duplicateListing(clientId, projectId, listingId) {
  const data = await loadData();
  const listing = data.clients[clientId]?.projects[projectId]?.listings[listingId];

  if (!listing) {
    return null;
  }

  const newId = crypto.randomUUID();
  const project = data.clients[clientId].projects[projectId];

  project.listings[newId] = {
    ...structuredClone(listing),
    name: `${listing.name} (copie)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveData(data);

  return {
    id: newId,
    name: project.listings[newId].name,
    createdAt: project.listings[newId].createdAt,
    updatedAt: project.listings[newId].updatedAt,
    documentCount: project.listings[newId].documents?.length || 0,
  };
}

/**
 * Supprime un listing
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing
 * @returns {boolean} Succès de l'opération
 */
export async function deleteListing(clientId, projectId, listingId) {
  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project || !project.listings[listingId]) {
    return false;
  }

  delete project.listings[listingId];
  return await saveData(data);
}

// ============= NATURES =============

const DEFAULT_NATURES = [
  { code: 'NOT', label: 'Notice' },
  { code: 'NDC', label: 'Note de Calcul' },
  { code: 'PLN', label: 'Plan' },
  { code: 'SYN', label: 'Synoptique' },
  { code: 'SCH', label: 'Schéma' },
  { code: 'LST', label: 'Listing' },
];

export async function loadNatures() {
  const data = await loadData();
  return data.settings?.natures || DEFAULT_NATURES;
}

export async function saveNatures(natures) {
  const data = await loadData();
  if (!data.settings) data.settings = {};
  data.settings.natures = natures;
  return await saveData(data);
}

// ============= TEMPLATES =============

/**
 * Récupère tous les templates
 * @returns {Array} Liste des templates
 */
export async function getAllTemplates() {
  const data = await loadData();
  return data.templates || [];
}

/**
 * Sauvegarde tous les templates
 * @param {Array} templates - Liste des templates
 * @returns {boolean} Succès de l'opération
 */
export async function saveTemplates(templates) {
  const data = await loadData();
  data.templates = templates;
  return await saveData(data);
}

// ============= EXPORT / IMPORT =============

/**
 * Exporte un client complet avec tous ses projets et listings
 * @param {string} clientId - ID du client
 * @returns {Object|null} Données du client ou null si inexistant
 */
export async function exportClient(clientId) {
  const data = await loadData();
  const client = data.clients[clientId];

  if (!client) {
    return null;
  }

  return {
    type: 'client',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      name: client.name,
      createdAt: client.createdAt,
      projects: client.projects || {},
    },
  };
}

/**
 * Importe un client complet
 * @param {Object} clientData - Données du client exporté
 * @returns {Object} Résultat de l'import avec le nouvel ID
 */
export async function importClient(clientData) {
  if (!clientData || clientData.type !== 'client') {
    throw new Error('Format de données invalide');
  }

  const data = await loadData();
  const newId = crypto.randomUUID();

  // Créer le client avec un nouveau ID
  data.clients[newId] = {
    name: clientData.data.name,
    createdAt: new Date().toISOString(),
    projects: clientData.data.projects || {},
  };

  await saveData(data);

  return {
    success: true,
    clientId: newId,
    name: clientData.data.name,
    projectCount: Object.keys(clientData.data.projects || {}).length,
  };
}

/**
 * Exporte un projet complet avec tous ses listings
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @returns {Object|null} Données du projet ou null si inexistant
 */
export async function exportProject(clientId, projectId) {
  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project) {
    return null;
  }

  return {
    type: 'project',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      name: project.name,
      createdAt: project.createdAt,
      listings: project.listings || {},
    },
  };
}

/**
 * Importe un projet dans un client
 * @param {string} clientId - ID du client cible
 * @param {Object} projectData - Données du projet exporté
 * @returns {Object} Résultat de l'import avec le nouvel ID
 */
export async function importProject(clientId, projectData) {
  if (!projectData || projectData.type !== 'project') {
    throw new Error('Format de données invalide');
  }

  const data = await loadData();
  const client = data.clients[clientId];

  if (!client) {
    throw new Error('Client introuvable');
  }

  const newId = crypto.randomUUID();

  if (!client.projects) {
    client.projects = {};
  }

  client.projects[newId] = {
    name: projectData.data.name,
    createdAt: new Date().toISOString(),
    listings: projectData.data.listings || {},
  };

  await saveData(data);

  return {
    success: true,
    projectId: newId,
    name: projectData.data.name,
    listingCount: Object.keys(projectData.data.listings || {}).length,
  };
}

/**
 * Exporte un listing complet avec tous ses documents
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing
 * @returns {Object|null} Données du listing ou null si inexistant
 */
export async function exportListing(clientId, projectId, listingId) {
  const data = await loadData();
  const listing = data.clients[clientId]?.projects[projectId]?.listings[listingId];

  if (!listing) {
    return null;
  }

  return {
    type: 'listing',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      name: listing.name,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      documents: listing.documents || [],
      settings: listing.settings || {},
    },
  };
}

/**
 * Importe un listing dans un projet
 * @param {string} clientId - ID du client cible
 * @param {string} projectId - ID du projet cible
 * @param {Object} listingData - Données du listing exporté
 * @returns {Object} Résultat de l'import avec le nouvel ID
 */
export async function importListing(clientId, projectId, listingData) {
  if (!listingData || listingData.type !== 'listing') {
    throw new Error('Format de données invalide');
  }

  const data = await loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project) {
    throw new Error('Projet introuvable');
  }

  const newId = crypto.randomUUID();

  if (!project.listings) {
    project.listings = {};
  }

  project.listings[newId] = {
    name: listingData.data.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    documents: listingData.data.documents || [],
    settings: listingData.data.settings || {},
  };

  await saveData(data);

  return {
    success: true,
    listingId: newId,
    name: listingData.data.name,
    documentCount: (listingData.data.documents || []).length,
  };
}
