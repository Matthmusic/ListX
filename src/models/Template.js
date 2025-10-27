import { generateUUID } from '../utils/uuid.js';
import { validateTemplate } from '../utils/validation.js';
import { Field } from './Field.js';

/**
 * Classe représentant un template de projet ListX
 */
export class Template {
  constructor({
    id = null,
    nom = '',
    description = '',
    version = '1.1.0',
    dateCreation = null,
    dateModification = null,
    champs = [],
    exportConfig = {}
  } = {}) {
    this.id = id || generateUUID();
    this.nom = nom;
    this.description = description;
    this.version = version;
    this.dateCreation = dateCreation || new Date().toISOString();
    this.dateModification = dateModification || new Date().toISOString();
    this.champs = champs.map(c => c instanceof Field ? c : Field.fromJSON(c));
    this.exportConfig = {
      afficherCategories: false,
      ...exportConfig
    };
  }

  /**
   * Valide le template
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validate() {
    return validateTemplate(this.toJSON());
  }

  /**
   * Ajoute un champ au template
   * @param {Field} field - Le champ à ajouter
   * @returns {boolean} true si ajouté avec succès
   */
  addField(field) {
    if (this.champs.length >= 12) {
      throw new Error('Le template ne peut pas contenir plus de 12 champs');
    }

    // Vérifier les doublons de noms
    const existingNames = this.champs.map(f => f.nom.trim().toUpperCase());
    const newName = field.nom.trim().toUpperCase();
    if (existingNames.includes(newName)) {
      throw new Error(`Un champ nommé "${field.nom}" existe déjà`);
    }

    this.champs.push(field);
    this.updateModificationDate();
    return true;
  }

  /**
   * Supprime un champ du template
   * @param {string} fieldId - ID du champ à supprimer
   * @returns {boolean} true si supprimé avec succès
   */
  removeField(fieldId) {
    const index = this.champs.findIndex(f => f.id === fieldId);
    if (index === -1) return false;

    this.champs.splice(index, 1);
    this.updateModificationDate();
    return true;
  }

  /**
   * Met à jour un champ du template
   * @param {string} fieldId - ID du champ à mettre à jour
   * @param {Object} updates - Propriétés à mettre à jour
   * @returns {boolean} true si mis à jour avec succès
   */
  updateField(fieldId, updates) {
    const field = this.champs.find(f => f.id === fieldId);
    if (!field) return false;

    // Vérifier les doublons de noms si le nom change
    if (updates.nom && updates.nom !== field.nom) {
      const existingNames = this.champs
        .filter(f => f.id !== fieldId)
        .map(f => f.nom.trim().toUpperCase());
      const newName = updates.nom.trim().toUpperCase();
      if (existingNames.includes(newName)) {
        throw new Error(`Un champ nommé "${updates.nom}" existe déjà`);
      }
    }

    field.update(updates);
    this.updateModificationDate();
    return true;
  }

  /**
   * Réorganise les champs (change l'ordre)
   * @param {Array<string>} fieldIds - IDs des champs dans le nouvel ordre
   */
  reorderFields(fieldIds) {
    const reordered = [];
    fieldIds.forEach((id, index) => {
      const field = this.champs.find(f => f.id === id);
      if (field) {
        field.ordre = index + 1;
        reordered.push(field);
      }
    });

    this.champs = reordered;
    this.updateModificationDate();
  }

  /**
   * Récupère le champ utilisé comme clé de catégorie
   * @returns {Field|null}
   */
  getCategoryField() {
    // Chercher le champ marqué comme clé de catégorie
    let categoryField = this.champs.find(f => f.cleDeCatégorie);

    if (!categoryField) {
      // Fallback : chercher un champ nommé "Nature"
      categoryField = this.champs.find(f => f.nom.toUpperCase() === 'NATURE');
    }

    if (!categoryField) {
      // Fallback : premier champ de type select
      categoryField = this.champs.find(f => f.type === 'select');
    }

    return categoryField || null;
  }

  /**
   * Récupère les champs à inclure dans le nom de fichier
   * @returns {Array<Field>}
   */
  getFileNameFields() {
    return this.champs
      .filter(f => f.inclureDansNom)
      .sort((a, b) => a.ordre - b.ordre);
  }

  /**
   * Récupère les champs visibles pour l'export
   * @returns {Array<Field>}
   */
  getVisibleFields() {
    return this.champs
      .filter(f => f.visible)
      .sort((a, b) => a.ordre - b.ordre);
  }

  /**
   * Met à jour la date de modification
   */
  updateModificationDate() {
    this.dateModification = new Date().toISOString();
  }

  /**
   * Clone le template avec un nouvel ID
   * @param {string} newName - Nouveau nom du template
   * @returns {Template}
   */
  clone(newName = null) {
    const data = this.toJSON();
    data.id = generateUUID();
    data.nom = newName || `${this.nom} (copie)`;
    data.dateCreation = new Date().toISOString();
    data.dateModification = new Date().toISOString();
    data.champs = data.champs.map(f => {
      const fieldCopy = { ...f };
      fieldCopy.id = generateUUID();
      return fieldCopy;
    });
    return new Template(data);
  }

  /**
   * Crée un template à partir de données JSON
   * @param {Object} data - Données du template
   * @returns {Template}
   */
  static fromJSON(data) {
    return new Template(data);
  }

  /**
   * Convertit le template en objet JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nom: this.nom,
      description: this.description,
      version: this.version,
      dateCreation: this.dateCreation,
      dateModification: this.dateModification,
      champs: this.champs.map(f => f.toJSON()),
      exportConfig: this.exportConfig
    };
  }

  /**
   * Exporte le template au format d'échange
   * @returns {Object}
   */
  toExportFormat() {
    return {
      type: 'listx-template',
      version: '1.1.0',
      exportDate: new Date().toISOString(),
      data: this.toJSON()
    };
  }

  /**
   * Importe un template depuis le format d'échange
   * @param {Object} exportData - Données d'export
   * @returns {Template}
   */
  static fromExportFormat(exportData) {
    if (exportData.type !== 'listx-template') {
      throw new Error('Format de fichier invalide');
    }

    return new Template(exportData.data);
  }
}
