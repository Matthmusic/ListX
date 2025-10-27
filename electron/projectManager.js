const { app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * Gestionnaire de projets ListX
 * Gère la lecture/écriture des fichiers projets dans AppData
 */
class ProjectManager {
  constructor() {
    this.projectsDir = path.join(app.getPath('userData'), 'projets');
    this.recentsPath = path.join(app.getPath('userData'), 'recents.json');
    this.initialized = false;
    this.maxRecents = 5;
  }

  /**
   * Initialise le répertoire des projets
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
      this.initialized = true;
      console.log('[ProjectManager] Répertoire initialisé:', this.projectsDir);
    } catch (error) {
      console.error('[ProjectManager] Erreur initialisation:', error);
      throw error;
    }
  }

  /**
   * Liste tous les projets disponibles
   * @returns {Promise<Array>} Liste des projets
   */
  async listProjects() {
    await this.initialize();

    try {
      const files = await fs.readdir(this.projectsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const projects = [];
      for (const file of jsonFiles) {
        try {
          const project = await this.loadProject(path.basename(file, '.json'));
          projects.push({
            id: project.id,
            nom: project.nom,
            dateModification: project.dateModification,
            documentsCount: project.documents?.length || 0,
            templateNom: project.templateSnapshot?.nom || 'Template inconnu'
          });
        } catch (error) {
          console.error(`[ProjectManager] Erreur lecture ${file}:`, error);
        }
      }

      // Trier par date de modification (plus récent en premier)
      projects.sort((a, b) => new Date(b.dateModification) - new Date(a.dateModification));

      return projects;
    } catch (error) {
      console.error('[ProjectManager] Erreur listage:', error);
      return [];
    }
  }

  /**
   * Charge un projet par son ID
   * @param {string} projectId - ID du projet
   * @returns {Promise<Object>} Projet chargé
   */
  async loadProject(projectId) {
    await this.initialize();

    const filePath = path.join(this.projectsDir, `${projectId}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const project = JSON.parse(data);
      console.log('[ProjectManager] Projet chargé:', project.nom);

      // Ajouter aux projets récents
      await this.addToRecents(project);

      return project;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Projet non trouvé : ${projectId}`);
      }
      console.error('[ProjectManager] Erreur chargement:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un projet
   * @param {Object} project - Projet à sauvegarder
   * @returns {Promise<boolean>} Succès de la sauvegarde
   */
  async saveProject(project) {
    await this.initialize();

    if (!project.id) {
      throw new Error('Le projet doit avoir un ID');
    }

    const filePath = path.join(this.projectsDir, `${project.id}.json`);

    try {
      const data = JSON.stringify(project, null, 2);
      await fs.writeFile(filePath, data, 'utf8');
      console.log('[ProjectManager] Projet sauvegardé:', project.nom);

      // Mettre à jour les projets récents
      await this.addToRecents(project);

      return true;
    } catch (error) {
      console.error('[ProjectManager] Erreur sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Supprime un projet
   * @param {string} projectId - ID du projet à supprimer
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteProject(projectId) {
    await this.initialize();

    const filePath = path.join(this.projectsDir, `${projectId}.json`);

    try {
      await fs.unlink(filePath);
      console.log('[ProjectManager] Projet supprimé:', projectId);

      // Retirer des projets récents
      await this.removeFromRecents(projectId);

      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Projet non trouvé : ${projectId}`);
      }
      console.error('[ProjectManager] Erreur suppression:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un projet existe
   * @param {string} projectId - ID du projet
   * @returns {Promise<boolean>}
   */
  async projectExists(projectId) {
    await this.initialize();

    const filePath = path.join(this.projectsDir, `${projectId}.json`);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Importe un projet depuis un fichier externe
   * @param {string} sourcePath - Chemin du fichier à importer
   * @returns {Promise<Object>} Projet importé
   */
  async importProject(sourcePath) {
    try {
      const data = await fs.readFile(sourcePath, 'utf8');
      const exportData = JSON.parse(data);

      if (exportData.type !== 'listx-project') {
        throw new Error('Format de fichier invalide');
      }

      const project = exportData.project;

      // Générer un nouvel ID pour éviter les conflits
      const { randomUUID } = require('crypto');
      project.id = randomUUID ? randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      project.nom = `${project.nom} (importé)`;
      project.dateCreation = new Date().toISOString();
      project.dateModification = new Date().toISOString();

      await this.saveProject(project);
      console.log('[ProjectManager] Projet importé:', project.nom);

      return project;
    } catch (error) {
      console.error('[ProjectManager] Erreur import:', error);
      throw error;
    }
  }

  /**
   * Exporte un projet vers un fichier externe (avec logos en base64)
   * @param {string} projectId - ID du projet à exporter
   * @param {string} destinationPath - Chemin de destination
   * @returns {Promise<boolean>}
   */
  async exportProject(projectId, destinationPath) {
    try {
      const project = await this.loadProject(projectId);

      const exportData = {
        type: 'listx-project',
        version: '1.1.0',
        exportDate: new Date().toISOString(),
        template: project.templateSnapshot,
        project: project
      };

      const data = JSON.stringify(exportData, null, 2);
      await fs.writeFile(destinationPath, data, 'utf8');

      console.log('[ProjectManager] Projet exporté vers:', destinationPath);
      return true;
    } catch (error) {
      console.error('[ProjectManager] Erreur export:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des projets récents
   * @returns {Promise<Array>}
   */
  async getRecents() {
    try {
      const data = await fs.readFile(this.recentsPath, 'utf8');
      const recents = JSON.parse(data);
      return recents.slice(0, this.maxRecents);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      console.error('[ProjectManager] Erreur lecture recents:', error);
      return [];
    }
  }

  /**
   * Ajoute un projet à la liste des récents
   * @param {Object} project - Projet à ajouter
   * @returns {Promise<void>}
   */
  async addToRecents(project) {
    try {
      let recents = await this.getRecents();

      // Retirer le projet s'il existe déjà
      recents = recents.filter(r => r.id !== project.id);

      // Ajouter en tête de liste
      recents.unshift({
        id: project.id,
        nom: project.nom,
        dateAcces: new Date().toISOString()
      });

      // Limiter à maxRecents
      recents = recents.slice(0, this.maxRecents);

      await fs.writeFile(this.recentsPath, JSON.stringify(recents, null, 2), 'utf8');
    } catch (error) {
      console.error('[ProjectManager] Erreur ajout recents:', error);
    }
  }

  /**
   * Retire un projet de la liste des récents
   * @param {string} projectId - ID du projet
   * @returns {Promise<void>}
   */
  async removeFromRecents(projectId) {
    try {
      let recents = await this.getRecents();
      recents = recents.filter(r => r.id !== projectId);
      await fs.writeFile(this.recentsPath, JSON.stringify(recents, null, 2), 'utf8');
    } catch (error) {
      console.error('[ProjectManager] Erreur suppression recents:', error);
    }
  }

  /**
   * Crée un backup d'un projet avant modification
   * @param {string} projectId - ID du projet
   * @returns {Promise<string>} Chemin du backup
   */
  async createBackup(projectId) {
    await this.initialize();

    const backupDir = path.join(this.projectsDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${projectId}_${timestamp}.json`);

    try {
      const project = await this.loadProject(projectId);
      const data = JSON.stringify(project, null, 2);
      await fs.writeFile(backupPath, data, 'utf8');

      console.log('[ProjectManager] Backup créé:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('[ProjectManager] Erreur backup:', error);
      throw error;
    }
  }
}

module.exports = new ProjectManager();
