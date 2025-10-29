/**
 * Fusionne intelligemment les champs des zones 2 et 3 pour obtenir l'ordre du formulaire
 * Algorithme : Commence par Zone 3, puis insère les champs de Zone 2 à leur meilleure position
 * @param {Object} template - Le template contenant fieldsOrderDisplay et fieldsOrderFilename
 * @returns {Array} - Liste ordonnée des champs pour le formulaire
 */
export function mergeFormFieldsOrder(template) {
  if (!template) return [];

  // Définir les champs système à exclure du formulaire
  const SYSTEM_FIELDS = ['DESCRIPTION', 'NOM_FICHIER'];

  // Champs obligatoires du formulaire (toujours présents même s'ils ne sont pas dans les zones)
  const MANDATORY_FORM_FIELDS = ['NATURE'];

  const zone2 = (template.fieldsOrderDisplay || template.fieldsOrder || [])
    .filter(f => !SYSTEM_FIELDS.includes(f));
  const zone3 = (template.fieldsOrderFilename || template.fieldsOrder || [])
    .filter(f => !SYSTEM_FIELDS.includes(f));

  // Si l'une des zones est vide, retourner l'autre
  if (zone2.length === 0) return ensureMandatoryFields([...zone3], MANDATORY_FORM_FIELDS);
  if (zone3.length === 0) return ensureMandatoryFields([...zone2], MANDATORY_FORM_FIELDS);

  // Commencer avec Zone 3 comme base (ordre du nom de fichier)
  const result = [...zone3];

  // Identifier les champs de Zone 2 qui ne sont pas dans Zone 3
  const zone2Only = zone2.filter(field => !zone3.includes(field));

  // Pour chaque champ unique à Zone 2, trouver la meilleure position d'insertion
  zone2Only.forEach(field => {
    const indexInZone2 = zone2.indexOf(field);

    // Chercher les champs voisins dans Zone 2
    let beforeField = null;
    let afterField = null;

    // Chercher le champ précédent dans Zone 2 qui existe aussi dans result
    for (let i = indexInZone2 - 1; i >= 0; i--) {
      if (result.includes(zone2[i])) {
        beforeField = zone2[i];
        break;
      }
    }

    // Chercher le champ suivant dans Zone 2 qui existe aussi dans result
    for (let i = indexInZone2 + 1; i < zone2.length; i++) {
      if (result.includes(zone2[i])) {
        afterField = zone2[i];
        break;
      }
    }

    // Déterminer la position d'insertion
    let insertIndex;

    if (beforeField && afterField) {
      // Insérer entre les deux voisins
      const beforeIndex = result.indexOf(beforeField);
      insertIndex = beforeIndex + 1;
    } else if (beforeField) {
      // Insérer après le voisin précédent
      const beforeIndex = result.indexOf(beforeField);
      insertIndex = beforeIndex + 1;
    } else if (afterField) {
      // Insérer avant le voisin suivant
      insertIndex = result.indexOf(afterField);
    } else {
      // Aucun voisin trouvé, ajouter à la fin
      insertIndex = result.length;
    }

    result.splice(insertIndex, 0, field);
  });

  return ensureMandatoryFields(result, MANDATORY_FORM_FIELDS);
}

/**
 * S'assure que les champs obligatoires sont présents dans la liste
 * @param {Array} fields - Liste de champs
 * @param {Array} mandatoryFields - Champs obligatoires
 * @returns {Array} - Liste avec les champs obligatoires ajoutés si nécessaire
 */
function ensureMandatoryFields(fields, mandatoryFields) {
  const result = [...fields];

  mandatoryFields.forEach(mandatoryField => {
    if (!result.includes(mandatoryField)) {
      // Ajouter le champ obligatoire à la fin
      result.push(mandatoryField);
    }
  });

  return result;
}

/**
 * Génère le nom de fichier pour un document en utilisant le template actif
 * @param {Object} document - Le document contenant les valeurs des champs
 * @param {Object} template - Le template définissant l'ordre et les libellés des champs
 * @returns {string} - Le nom de fichier généré
 */
export function generateFilename(document, template) {
  if (!template || !document) {
    return '';
  }

  // UTILISER fieldsOrderFilename POUR LE NOM DE FICHIER (avec fallback sur fieldsOrder)
  const filenameOrder = template.fieldsOrderFilename || template.fieldsOrder || [];

  // Champs système à exclure du nom de fichier (NOM_FICHIER uniquement)
  // DESCRIPTION peut être ajouté par l'utilisateur en Zone 3 s'il le souhaite
  const EXCLUDED_SYSTEM_FIELDS = ['NOM_FICHIER'];

  let hasDescription = false;

  // Récupérer les champs dans l'ordre du template FILENAME
  // Ne PAS filtrer par activeFields car fieldsOrderFilename définit déjà ce qu'on veut afficher
  // Exclure uniquement NOM_FICHIER (DESCRIPTION est autorisé si ajouté en Zone 3)
  const parts = filenameOrder
    .filter(field => !EXCLUDED_SYSTEM_FIELDS.includes(field)) // Exclure NOM_FICHIER uniquement
    .map(field => {
      if (field === 'DESCRIPTION') {
        hasDescription = true;
        return null;
      }

      const value = document[field.toLowerCase()];

      // Ne pas inclure les champs vides
      if (!value || value === '') {
        return null;
      }

      // Retourner uniquement la valeur (pas le label)
      return value;
    })
    .filter(Boolean); // Supprimer les valeurs null/undefined

  const separator = ' - ';
  const prefix = parts.join(separator);
  const descriptionValue = hasDescription ? (document.nom || '') : '';

  if (descriptionValue) {
    return prefix ? `${prefix}${separator}${descriptionValue}` : descriptionValue;
  }

  if (prefix) {
    return prefix;
  }

  // Fallback : utiliser le nom du document (comportement historique)
  return document.nom || '';
}

/**
 * Génère le numéro de document formaté
 * @param {Object} document - Le document contenant les valeurs des champs
 * @param {Object} template - Le template définissant l'ordre et les libellés des champs
 * @returns {string} - Le numéro de document formaté
 */
export function generateDocNumber(document, template) {
  if (!template || !document) {
    return '';
  }

  // UTILISER fieldsOrderFilename POUR LE N° DE DOCUMENT (avec fallback sur fieldsOrder)
  const filenameOrder = template.fieldsOrderFilename || template.fieldsOrder || [];

  // Pour le numéro de document, on utilise tous les champs actifs sauf NOM
  const parts = filenameOrder
    .filter(field => field !== 'NOM' && template.activeFields.includes(field))
    .map(field => {
      const value = document[field.toLowerCase()];
      return value || '';
    })
    .filter(Boolean);

  return parts.join('_');
}

/**
 * Obtient les en-têtes de colonnes pour l'export en fonction du template
 * @param {Object} template - Le template définissant les libellés des champs
 * @returns {Array} - Les en-têtes de colonnes avec leurs libellés personnalisés
 */
export function getExportHeaders(template) {
  if (!template) {
    return [];
  }

  // DÉFINIR LES CHAMPS SYSTÈME
  const SYSTEM_FIELDS = ['DESCRIPTION', 'NOM_FICHIER'];

  // UTILISER fieldsOrderDisplay POUR LES EXPORTS (avec fallback sur fieldsOrder)
  const displayOrder = template.fieldsOrderDisplay || template.fieldsOrder || [];

  // Retourner les champs actifs avec leurs libellés personnalisés
  const headers = displayOrder
    .filter(field => template.activeFields.includes(field) || SYSTEM_FIELDS.includes(field))
    .map(field => {
      // GÉRER LES CHAMPS SYSTÈME
      if (field === 'DESCRIPTION') {
        return {
          field: 'nom',  // La description correspond au champ 'nom' du document
          label: 'DESCRIPTION DU DOCUMENT',
          isSystem: true
        };
      }
      if (field === 'NOM_FICHIER') {
        return {
          field: 'nomComplet',  // Le nom du fichier correspond au champ 'nomComplet' du document
          label: 'NOM FICHIER',
          isSystem: true
        };
      }

      // Chercher d'abord dans fieldsLabels, sinon dans customFields
      let label = template.fieldsLabels[field];

      if (!label && template.customFields) {
        const customField = template.customFields.find(f => f.id === field);
        if (customField) {
          label = customField.label;
        }
      }

      return {
        field: field.toLowerCase(),
        label: label || field,
      };
    });

  // Ne PAS ajouter "Nom du document" ici car il sera ajouté dans le code d'export

  return headers;
}

/**
 * Obtient les valeurs d'un document dans l'ordre du template
 * @param {Object} document - Le document
 * @param {Object} template - Le template
 * @returns {Array} - Les valeurs dans l'ordre des champs actifs
 */
export function getDocumentValues(document, template) {
  if (!template || !document) {
    return [];
  }

  // UTILISER fieldsOrderDisplay POUR L'AFFICHAGE DES VALEURS (avec fallback sur fieldsOrder)
  const displayOrder = template.fieldsOrderDisplay || template.fieldsOrder || [];

  const values = displayOrder
    .filter(field => template.activeFields.includes(field))
    .map(field => document[field.toLowerCase()] || '');

  // Ajouter le nom du document à la fin
  values.push(document.nom || '');

  return values;
}
