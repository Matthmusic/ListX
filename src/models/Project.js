import { generateUUID } from '../utils/uuid.js';
import { Template } from './Template.js';

/**
 * Classe représentant un projet ListX
 */
export class Project {
  constructor({
    id = null,
    nom = '',
    templateId = null,
    templateSnapshot = null,
    dateCreation = null,
    dateModification = null,
    documents = [],
    exportConfig = {}
  } = {}) {
    this.id = id || generateUUID();
    this.nom = nom;
    this.templateId = templateId;
    this.templateSnapshot = templateSnapshot;
    this.dateCreation = dateCreation || new Date().toISOString();
    this.dateModification = dateModification || new Date().toISOString();
    this.documents = documents;
    this.exportConfig = {
      nomProjet: '',
      nomListe: '',
      logoClient: null,
      logoBE: null,
      date: '',
      indice: 'A',
      ...exportConfig
    };
  }

  /**
   * Crée un projet à partir d'un template
   * @param {string} nom - Nom du projet
   * @param {Template} template - Template à utiliser
   * @returns {Project}
   */
  static fromTemplate(nom, template) {
    return new Project({
      nom,
      templateId: template.id,
      templateSnapshot: template.toJSON(),
      exportConfig: {
        nomProjet: nom,
        nomListe: '',
        logoClient: null,
        logoBE: null,
        date: new Date().toISOString().split('T')[0],
        indice: 'A'
      }
    });
  }

  /**
   * Récupère le template du projet (depuis le snapshot)
   * @returns {Template}
   */
  getTemplate() {
    if (!this.templateSnapshot) {
      throw new Error('Aucun template associé à ce projet');
    }
    return Template.fromJSON(this.templateSnapshot);
  }

  /**
   * Ajoute un document au projet
   * @param {Object} document - Document à ajouter
   */
  addDocument(document) {
    this.documents.push({
      id: document.id || Date.now(),
      valeurs: document.valeurs || {},
      nomComplet: document.nomComplet || '',
      numero: document.numero || ''
    });
    this.updateModificationDate();
  }

  /**
   * Met à jour un document du projet
   * @param {number} documentId - ID du document
   * @param {Object} updates - Propriétés à mettre à jour
   * @returns {boolean}
   */
  updateDocument(documentId, updates) {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return false;

    Object.assign(doc, updates);
    this.updateModificationDate();
    return true;
  }

  /**
   * Supprime un document du projet
   * @param {number} documentId - ID du document
   * @returns {boolean}
   */
  removeDocument(documentId) {
    const index = this.documents.findIndex(d => d.id === documentId);
    if (index === -1) return false;

    this.documents.splice(index, 1);
    this.updateModificationDate();
    return true;
  }

  /**
   * Vide tous les documents du projet
   */
  clearDocuments() {
    this.documents = [];
    this.updateModificationDate();
  }

  /**
   * Génère le nom complet d'un document
   * @param {Object} valeurs - Valeurs des champs du document
   * @returns {string}
   */
  generateDocumentName(valeurs) {
    const template = this.getTemplate();
    const nameFields = template.getFileNameFields();

    // Récupérer les valeurs des champs à inclure dans le nom
    const parts = nameFields
      .map(field => valeurs[field.id])
      .filter(val => val && val.trim().length > 0)
      .map(val => val.trim().toUpperCase());

    return parts.join('_');
  }

  /**
   * Catégorise les documents
   * @returns {Object} Documents groupés par catégorie
   */
  categorizeDocuments() {
    const template = this.getTemplate();
    const categoryField = template.getCategoryField();

    if (!categoryField) {
      // Pas de catégorisation possible
      return { 'TOUS': this.documents };
    }

    const categories = {};

    this.documents.forEach(doc => {
      const categoryValue = doc.valeurs[categoryField.id] || 'NON CATÉGORISÉ';
      if (!categories[categoryValue]) {
        categories[categoryValue] = [];
      }
      categories[categoryValue].push(doc);
    });

    return categories;
  }

  /**
   * Met à jour la date de modification
   */
  updateModificationDate() {
    this.dateModification = new Date().toISOString();
  }

  /**
   * Crée un projet à partir de données JSON
   * @param {Object} data - Données du projet
   * @returns {Project}
   */
  static fromJSON(data) {
    return new Project(data);
  }

  /**
   * Convertit le projet en objet JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nom: this.nom,
      templateId: this.templateId,
      templateSnapshot: this.templateSnapshot,
      dateCreation: this.dateCreation,
      dateModification: this.dateModification,
      documents: this.documents,
      exportConfig: this.exportConfig
    };
  }

  /**
   * Exporte le projet au format d'échange (avec logos en base64)
   * @returns {Object}
   */
  toExportFormat() {
    return {
      type: 'listx-project',
      version: '1.1.0',
      exportDate: new Date().toISOString(),
      template: this.templateSnapshot,
      project: this.toJSON()
    };
  }

  /**
   * Importe un projet depuis le format d'échange
   * @param {Object} exportData - Données d'export
   * @returns {Project}
   */
  static fromExportFormat(exportData) {
    if (exportData.type !== 'listx-project') {
      throw new Error('Format de fichier invalide');
    }

    // Générer un nouvel ID pour éviter les conflits
    const projectData = exportData.project;
    projectData.id = generateUUID();
    projectData.dateCreation = new Date().toISOString();

    return new Project(projectData);
  }
}
