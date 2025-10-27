/**
 * Utilitaires de validation pour les templates et projets ListX
 */

/**
 * Valide une chaîne de texte (longueur, format)
 * @param {string} value - La valeur à valider
 * @param {number} maxLength - Longueur maximale (défaut: 100)
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateText(value, maxLength = 100) {
  if (typeof value !== 'string') {
    return { valid: false, error: 'La valeur doit être une chaîne de caractères' };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Le champ ne peut pas être vide' };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Le champ ne peut pas dépasser ${maxLength} caractères` };
  }

  return { valid: true, error: null };
}

/**
 * Valide un champ de type select (options)
 * @param {Array} options - Les options disponibles
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateSelectOptions(options) {
  if (!Array.isArray(options)) {
    return { valid: false, error: 'Les options doivent être un tableau' };
  }

  if (options.length < 2) {
    return { valid: false, error: 'Un champ select doit avoir au moins 2 options' };
  }

  if (options.length > 20) {
    return { valid: false, error: 'Un champ select ne peut pas avoir plus de 20 options' };
  }

  // Vérifier que toutes les options sont des chaînes non vides
  for (const option of options) {
    if (typeof option !== 'string' || option.trim().length === 0) {
      return { valid: false, error: 'Toutes les options doivent être des chaînes non vides' };
    }
  }

  // Vérifier les doublons
  const uniqueOptions = new Set(options.map(opt => opt.trim().toUpperCase()));
  if (uniqueOptions.size !== options.length) {
    return { valid: false, error: 'Les options ne peuvent pas contenir de doublons' };
  }

  return { valid: true, error: null };
}

/**
 * Normalise un texte (uppercase + trim)
 * @param {string} value - La valeur à normaliser
 * @returns {string} Valeur normalisée
 */
export function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toUpperCase();
}

/**
 * Vérifie si deux noms de champs sont similaires
 * @param {string} name1 - Premier nom
 * @param {string} name2 - Deuxième nom
 * @returns {boolean} true si les noms sont similaires
 */
export function areFieldNamesSimilar(name1, name2) {
  const normalized1 = name1.trim().toLowerCase();
  const normalized2 = name2.trim().toLowerCase();

  // Identiques après normalisation
  if (normalized1 === normalized2) return true;

  // Différence de 1-2 caractères seulement
  const levenshteinDistance = calculateLevenshteinDistance(normalized1, normalized2);
  return levenshteinDistance <= 2;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param {string} str1 - Première chaîne
 * @param {string} str2 - Deuxième chaîne
 * @returns {number} Distance de Levenshtein
 */
function calculateLevenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialisation de la matrice
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcul de la distance
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Suppression
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Valide un objet template complet
 * @param {Object} template - Le template à valider
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export function validateTemplate(template) {
  const errors = [];

  // Vérifications de base
  if (!template || typeof template !== 'object') {
    return { valid: false, errors: ['Le template doit être un objet valide'] };
  }

  // Nom du template
  const nameValidation = validateText(template.nom, 50);
  if (!nameValidation.valid) {
    errors.push(`Nom du template : ${nameValidation.error}`);
  }

  // Champs
  if (!Array.isArray(template.champs)) {
    errors.push('Le template doit contenir un tableau de champs');
  } else {
    if (template.champs.length === 0) {
      errors.push('Le template doit contenir au moins 1 champ');
    }

    if (template.champs.length > 12) {
      errors.push('Le template ne peut pas contenir plus de 12 champs');
    }

    // Vérifier chaque champ
    const fieldNames = [];
    template.champs.forEach((field, index) => {
      const fieldErrors = validateField(field);
      if (!fieldErrors.valid) {
        errors.push(`Champ ${index + 1} (${field.nom || 'sans nom'}) : ${fieldErrors.errors.join(', ')}`);
      }

      // Vérifier les doublons de noms
      if (field.nom) {
        const normalizedName = field.nom.trim().toUpperCase();
        if (fieldNames.includes(normalizedName)) {
          errors.push(`Le nom de champ "${field.nom}" est utilisé plusieurs fois`);
        }
        fieldNames.push(normalizedName);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide un champ individuel
 * @param {Object} field - Le champ à valider
 * @returns {{valid: boolean, errors: Array<string>}}
 */
export function validateField(field) {
  const errors = [];

  if (!field || typeof field !== 'object') {
    return { valid: false, errors: ['Le champ doit être un objet valide'] };
  }

  // Nom
  const nameValidation = validateText(field.nom, 30);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error);
  }

  // Type
  const validTypes = ['text', 'select', 'number', 'date'];
  if (!validTypes.includes(field.type)) {
    errors.push(`Type invalide : "${field.type}". Types autorisés : ${validTypes.join(', ')}`);
  }

  // Options pour select
  if (field.type === 'select') {
    if (!field.options || !Array.isArray(field.options)) {
      errors.push('Un champ de type select doit avoir des options');
    } else {
      const optionsValidation = validateSelectOptions(field.options);
      if (!optionsValidation.valid) {
        errors.push(optionsValidation.error);
      }
    }
  }

  // Ordre
  if (typeof field.ordre !== 'number' || field.ordre < 1) {
    errors.push("L'ordre doit être un nombre positif");
  }

  // Largeur de colonne
  if (typeof field.largeurColonne !== 'number' || field.largeurColonne < 5 || field.largeurColonne > 100) {
    errors.push('La largeur de colonne doit être entre 5 et 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
