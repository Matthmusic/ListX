/**
 * Service de gestion du stockage des clients, projets et listings
 * Structure : clients/[clientName]/[projectName]/listings/[listingId].json
 */

const STORAGE_KEY = 'listx_data';
const USE_SHARED_STORAGE_KEY = 'listx_use_shared_storage';

// Variable pour stocker l'état du stockage partagé
let sharedStorageAvailable = false;
let useSharedStorage = false;

// Vérifier si on est dans Electron
const isElectron = typeof window !== 'undefined' && window.electronAPI;

/**
 * Initialise le stockage partagé
 */
export async function initializeStorage() {
  if (!isElectron) {
    return { mode: 'local', accessible: false };
  }

  try {
    // Vérifier si le stockage partagé est accessible
    const result = await window.electronAPI.checkSharedStorage();
    sharedStorageAvailable = result.accessible;

    // Vérifier la préférence de l'utilisateur
    const userPreference = localStorage.getItem(USE_SHARED_STORAGE_KEY);

    if (userPreference === null && sharedStorageAvailable) {
      // Première fois : proposer d'utiliser le stockage partagé
      useSharedStorage = true;
      localStorage.setItem(USE_SHARED_STORAGE_KEY, 'true');

      // Migrer les données locales vers le stockage partagé
      await migrateToSharedStorage();
    } else {
      useSharedStorage = userPreference === 'true' && sharedStorageAvailable;
    }

    return {
      mode: useSharedStorage ? 'shared' : 'local',
      accessible: sharedStorageAvailable,
      path: result.path
    };
  } catch (error) {
    console.error('Erreur initialisation stockage:', error);
    useSharedStorage = false;
    return { mode: 'local', accessible: false, error: error.message };
  }
}

/**
 * Migre les données de localStorage vers le stockage partagé
 */
async function migrateToSharedStorage() {
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData && isElectron) {
      const data = JSON.parse(localData);
      await window.electronAPI.writeSharedData(data);
      console.log('Migration vers stockage partagé réussie');
    }
  } catch (error) {
    console.error('Erreur migration données:', error);
  }
}

/**
 * Change le mode de stockage
 */
export async function setStorageMode(useShared) {
  if (!isElectron || !sharedStorageAvailable) {
    return false;
  }

  useSharedStorage = useShared;
  localStorage.setItem(USE_SHARED_STORAGE_KEY, useShared.toString());

  if (useShared) {
    await migrateToSharedStorage();
  }

  return true;
}

/**
 * Obtient le mode de stockage actuel
 */
export function getStorageMode() {
  return {
    current: useSharedStorage ? 'shared' : 'local',
    available: sharedStorageAvailable
  };
}

/**
 * Charge toutes les données (depuis localStorage ou stockage partagé)
 */
async function loadData() {
  try {
    if (useSharedStorage && isElectron) {
      const result = await window.electronAPI.readSharedData();
      if (result.success) {
        return result.data || { clients: {} };
      } else {
        console.error('Erreur lecture stockage partagé, fallback sur local');
        useSharedStorage = false;
      }
    }

    // Fallback sur localStorage
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { clients: {} };
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return { clients: {} };
  }
}

/**
 * Sauvegarde toutes les données (dans localStorage ou stockage partagé)
 */
async function saveData(data) {
  try {
    if (useSharedStorage && isElectron) {
      const result = await window.electronAPI.writeSharedData(data);
      if (result.success) {
        // Aussi sauvegarder localement pour cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
      } else {
        console.error('Erreur écriture stockage partagé, fallback sur local');
        useSharedStorage = false;
      }
    }

    // Fallback sur localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données:', error);
    return false;
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
  const id = Date.now().toString();

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

  const id = Date.now().toString();

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

  const id = Date.now().toString();

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
    console.error('Impossible de sauvegarder le listing:', { clientId, projectId, listingId });
    return false;
  }

  console.log('=== SAUVEGARDE STORAGE SERVICE ===');
  console.log('Client ID:', clientId);
  console.log('Project ID:', projectId);
  console.log('Listing ID:', listingId);
  console.log('Documents:', listingData.documents?.length || 0);

  project.listings[listingId] = {
    ...listingData,
    updatedAt: new Date().toISOString(),
  };

  const result = await saveData(data);
  console.log('Résultat sauvegarde:', result);

  return result;
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

  const newId = Date.now().toString();
  const project = data.clients[clientId].projects[projectId];

  project.listings[newId] = {
    ...JSON.parse(JSON.stringify(listing)), // Deep clone
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
  const newId = Date.now().toString();

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

  const newId = Date.now().toString();

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

  const newId = Date.now().toString();

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
