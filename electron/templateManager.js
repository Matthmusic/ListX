const { app } = require('electron');
const fs = require('fs').promises;
const path = require('path');

/**
 * Gestionnaire de templates ListX
 * Gère la lecture/écriture des fichiers templates dans AppData
 */
class TemplateManager {
  constructor() {
    this.templatesDir = path.join(app.getPath('userData'), 'templates');
    this.initialized = false;
  }

  /**
   * Initialise le répertoire des templates
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
      this.initialized = true;
      console.log('[TemplateManager] Répertoire initialisé:', this.templatesDir);
    } catch (error) {
      console.error('[TemplateManager] Erreur initialisation:', error);
      throw error;
    }
  }

  /**
   * Liste tous les templates disponibles
   * @returns {Promise<Array>} Liste des templates
   */
  async listTemplates() {
    await this.initialize();

    try {
      const files = await fs.readdir(this.templatesDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const templates = [];
      for (const file of jsonFiles) {
        try {
          const template = await this.loadTemplate(path.basename(file, '.json'));
          templates.push({
            id: template.id,
            nom: template.nom,
            description: template.description,
            dateModification: template.dateModification,
            champsCount: template.champs?.length || 0
          });
        } catch (error) {
          console.error(`[TemplateManager] Erreur lecture ${file}:`, error);
        }
      }

      // Trier par date de modification (plus récent en premier)
      templates.sort((a, b) => new Date(b.dateModification) - new Date(a.dateModification));

      return templates;
    } catch (error) {
      console.error('[TemplateManager] Erreur listage:', error);
      return [];
    }
  }

  /**
   * Charge un template par son ID
   * @param {string} templateId - ID du template
   * @returns {Promise<Object>} Template chargé
   */
  async loadTemplate(templateId) {
    await this.initialize();

    const filePath = path.join(this.templatesDir, `${templateId}.json`);

    try {
      const data = await fs.readFile(filePath, 'utf8');
      const template = JSON.parse(data);
      console.log('[TemplateManager] Template chargé:', template.nom);
      return template;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template non trouvé : ${templateId}`);
      }
      console.error('[TemplateManager] Erreur chargement:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un template
   * @param {Object} template - Template à sauvegarder
   * @returns {Promise<boolean>} Succès de la sauvegarde
   */
  async saveTemplate(template) {
    await this.initialize();

    if (!template.id) {
      throw new Error('Le template doit avoir un ID');
    }

    const filePath = path.join(this.templatesDir, `${template.id}.json`);

    try {
      const data = JSON.stringify(template, null, 2);
      await fs.writeFile(filePath, data, 'utf8');
      console.log('[TemplateManager] Template sauvegardé:', template.nom);
      return true;
    } catch (error) {
      console.error('[TemplateManager] Erreur sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Supprime un template
   * @param {string} templateId - ID du template à supprimer
   * @returns {Promise<boolean>} Succès de la suppression
   */
  async deleteTemplate(templateId) {
    await this.initialize();

    const filePath = path.join(this.templatesDir, `${templateId}.json`);

    try {
      await fs.unlink(filePath);
      console.log('[TemplateManager] Template supprimé:', templateId);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Template non trouvé : ${templateId}`);
      }
      console.error('[TemplateManager] Erreur suppression:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un template existe
   * @param {string} templateId - ID du template
   * @returns {Promise<boolean>}
   */
  async templateExists(templateId) {
    await this.initialize();

    const filePath = path.join(this.templatesDir, `${templateId}.json`);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Importe un template depuis un fichier externe
   * @param {string} sourcePath - Chemin du fichier à importer
   * @returns {Promise<Object>} Template importé
   */
  async importTemplate(sourcePath) {
    try {
      const data = await fs.readFile(sourcePath, 'utf8');
      const exportData = JSON.parse(data);

      if (exportData.type !== 'listx-template') {
        throw new Error('Format de fichier invalide');
      }

      const template = exportData.data;

      // Vérifier si un template avec cet ID existe déjà
      const exists = await this.templateExists(template.id);
      if (exists) {
        // Générer un nouvel ID pour éviter les conflits
        const { v4: uuidv4 } = require('crypto').randomUUID || (() => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        });
        template.id = uuidv4();
        template.nom = `${template.nom} (importé)`;
      }

      template.dateCreation = new Date().toISOString();
      template.dateModification = new Date().toISOString();

      await this.saveTemplate(template);
      console.log('[TemplateManager] Template importé:', template.nom);

      return template;
    } catch (error) {
      console.error('[TemplateManager] Erreur import:', error);
      throw error;
    }
  }

  /**
   * Exporte un template vers un fichier externe
   * @param {string} templateId - ID du template à exporter
   * @param {string} destinationPath - Chemin de destination
   * @returns {Promise<boolean>}
   */
  async exportTemplate(templateId, destinationPath) {
    try {
      const template = await this.loadTemplate(templateId);

      const exportData = {
        type: 'listx-template',
        version: '1.1.0',
        exportDate: new Date().toISOString(),
        data: template
      };

      const data = JSON.stringify(exportData, null, 2);
      await fs.writeFile(destinationPath, data, 'utf8');

      console.log('[TemplateManager] Template exporté vers:', destinationPath);
      return true;
    } catch (error) {
      console.error('[TemplateManager] Erreur export:', error);
      throw error;
    }
  }

  /**
   * Crée un backup d'un template avant modification
   * @param {string} templateId - ID du template
   * @returns {Promise<string>} Chemin du backup
   */
  async createBackup(templateId) {
    await this.initialize();

    const backupDir = path.join(this.templatesDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${templateId}_${timestamp}.json`);

    try {
      const template = await this.loadTemplate(templateId);
      const data = JSON.stringify(template, null, 2);
      await fs.writeFile(backupPath, data, 'utf8');

      console.log('[TemplateManager] Backup créé:', backupPath);
      return backupPath;
    } catch (error) {
      console.error('[TemplateManager] Erreur backup:', error);
      throw error;
    }
  }
}

module.exports = new TemplateManager();
