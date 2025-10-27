import { generateUUID } from '../utils/uuid.js';
import { validateField, validateText, validateSelectOptions } from '../utils/validation.js';

/**
 * Classe représentant un champ de template
 */
export class Field {
  constructor({
    id = null,
    nom = '',
    type = 'text',
    obligatoire = false,
    ordre = 1,
    visible = true,
    inclureDansNom = true,
    cleDeCatégorie = false,
    largeurColonne = 15,
    placeholder = '',
    options = null
  } = {}) {
    this.id = id || generateUUID();
    this.nom = nom;
    this.type = type;
    this.obligatoire = obligatoire;
    this.ordre = ordre;
    this.visible = visible;
    this.inclureDansNom = inclureDansNom;
    this.cleDeCatégorie = cleDeCatégorie;
    this.largeurColonne = largeurColonne;
    this.placeholder = placeholder;
    this.options = options;
  }

  /**
   * Valide le champ
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validate() {
    return validateField(this.toJSON());
  }

  /**
   * Crée un champ à partir de données brutes
   * @param {Object} data - Données du champ
   * @returns {Field}
   */
  static fromJSON(data) {
    return new Field(data);
  }

  /**
   * Convertit le champ en objet JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      nom: this.nom,
      type: this.type,
      obligatoire: this.obligatoire,
      ordre: this.ordre,
      visible: this.visible,
      inclureDansNom: this.inclureDansNom,
      cleDeCatégorie: this.cleDeCatégorie,
      largeurColonne: this.largeurColonne,
      placeholder: this.placeholder,
      options: this.options
    };
  }

  /**
   * Clone le champ avec un nouvel ID
   * @returns {Field}
   */
  clone() {
    const data = this.toJSON();
    data.id = generateUUID();
    return new Field(data);
  }

  /**
   * Met à jour les propriétés du champ
   * @param {Object} updates - Propriétés à mettre à jour
   */
  update(updates) {
    Object.assign(this, updates);
  }
}

/**
 * Types de champs supportés
 */
export const FIELD_TYPES = {
  TEXT: 'text',
  SELECT: 'select',
  NUMBER: 'number',
  DATE: 'date'
};

/**
 * Crée un champ par défaut pour un type donné
 * @param {string} type - Type de champ
 * @param {number} ordre - Ordre du champ
 * @returns {Field}
 */
export function createDefaultField(type = FIELD_TYPES.TEXT, ordre = 1) {
  const defaults = {
    [FIELD_TYPES.TEXT]: {
      nom: 'Nouveau champ',
      placeholder: 'Entrez une valeur',
      largeurColonne: 15
    },
    [FIELD_TYPES.SELECT]: {
      nom: 'Nouveau select',
      placeholder: 'Sélectionnez une option',
      options: ['Option 1', 'Option 2', 'Option 3'],
      largeurColonne: 15
    },
    [FIELD_TYPES.NUMBER]: {
      nom: 'Nouveau nombre',
      placeholder: '0',
      largeurColonne: 10
    },
    [FIELD_TYPES.DATE]: {
      nom: 'Nouvelle date',
      placeholder: 'JJ/MM/AAAA',
      largeurColonne: 12
    }
  };

  return new Field({
    ...defaults[type],
    type,
    ordre
  });
}
