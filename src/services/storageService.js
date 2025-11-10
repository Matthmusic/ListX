/**
 * Service de gestion du stockage des clients, projets et listings
 * Structure : clients/[clientName]/[projectName]/listings/[listingId].json
 */

const STORAGE_KEY = 'listx_data';

/**
 * Charge toutes les données depuis localStorage
 */
function loadData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { clients: {} };
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    return { clients: {} };
  }
}

/**
 * Sauvegarde toutes les données dans localStorage
 */
function saveData(data) {
  try {
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
export function getAllClients() {
  const data = loadData();
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
export function createClient(name) {
  const data = loadData();
  const id = Date.now().toString();

  data.clients[id] = {
    name,
    createdAt: new Date().toISOString(),
    projects: {},
  };

  saveData(data);

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
export function renameClient(clientId, newName) {
  const data = loadData();

  if (!data.clients[clientId]) {
    return false;
  }

  data.clients[clientId].name = newName;
  return saveData(data);
}

/**
 * Supprime un client et tous ses projets
 * @param {string} clientId - ID du client
 * @returns {boolean} Succès de l'opération
 */
export function deleteClient(clientId) {
  const data = loadData();

  if (!data.clients[clientId]) {
    return false;
  }

  delete data.clients[clientId];
  return saveData(data);
}

// ============= PROJETS =============

/**
 * Récupère tous les projets d'un client
 * @param {string} clientId - ID du client
 * @returns {Array} Liste des projets avec leurs métadonnées
 */
export function getClientProjects(clientId) {
  const data = loadData();
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
export function createProject(clientId, name) {
  const data = loadData();
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

  saveData(data);

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
export function renameProject(clientId, projectId, newName) {
  const data = loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project) {
    return false;
  }

  project.name = newName;
  return saveData(data);
}

/**
 * Supprime un projet et tous ses listings
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @returns {boolean} Succès de l'opération
 */
export function deleteProject(clientId, projectId) {
  const data = loadData();
  const client = data.clients[clientId];

  if (!client || !client.projects[projectId]) {
    return false;
  }

  delete client.projects[projectId];
  return saveData(data);
}

// ============= LISTINGS =============

/**
 * Récupère tous les listings d'un projet
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @returns {Array} Liste des listings avec leurs métadonnées
 */
export function getProjectListings(clientId, projectId) {
  const data = loadData();
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
export function createListing(clientId, projectId, name) {
  const data = loadData();
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

  saveData(data);

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
export function loadListing(clientId, projectId, listingId) {
  const data = loadData();
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
export function saveListing(clientId, projectId, listingId, listingData) {
  const data = loadData();
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

  const result = saveData(data);
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
export function renameListing(clientId, projectId, listingId, newName) {
  const data = loadData();
  const listing = data.clients[clientId]?.projects[projectId]?.listings[listingId];

  if (!listing) {
    return false;
  }

  listing.name = newName;
  listing.updatedAt = new Date().toISOString();
  return saveData(data);
}

/**
 * Duplique un listing
 * @param {string} clientId - ID du client
 * @param {string} projectId - ID du projet
 * @param {string} listingId - ID du listing à dupliquer
 * @returns {Object} Le nouveau listing créé
 */
export function duplicateListing(clientId, projectId, listingId) {
  const data = loadData();
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

  saveData(data);

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
export function deleteListing(clientId, projectId, listingId) {
  const data = loadData();
  const project = data.clients[clientId]?.projects[projectId];

  if (!project || !project.listings[listingId]) {
    return false;
  }

  delete project.listings[listingId];
  return saveData(data);
}
