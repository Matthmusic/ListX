const fs = require('fs').promises;
const path = require('path');

/**
 * Charge les templates par défaut dans le répertoire templates
 * À exécuter au premier lancement ou manuellement
 */
async function loadDefaultTemplates(templateManager) {
  console.log('[DefaultTemplates] Chargement des templates par défaut...');

  const defaultTemplatesDir = path.join(__dirname, '../src/templates/defaults');

  try {
    // Lire tous les fichiers JSON dans le dossier defaults
    const files = await fs.readdir(defaultTemplatesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    console.log(`[DefaultTemplates] ${jsonFiles.length} template(s) trouvé(s)`);

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(defaultTemplatesDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const exportData = JSON.parse(data);

        if (exportData.type !== 'listx-template') {
          console.warn(`[DefaultTemplates] ${file} n'est pas un template valide`);
          continue;
        }

        const template = exportData.data;

        // Vérifier si le template existe déjà
        const exists = await templateManager.templateExists(template.id);

        if (!exists) {
          await templateManager.saveTemplate(template);
          console.log(`[DefaultTemplates] ✓ Template "${template.nom}" chargé`);
        } else {
          console.log(`[DefaultTemplates] ⊘ Template "${template.nom}" déjà existant (ignoré)`);
        }
      } catch (err) {
        console.error(`[DefaultTemplates] Erreur lors du chargement de ${file}:`, err);
      }
    }

    console.log('[DefaultTemplates] Chargement terminé');
  } catch (err) {
    console.error('[DefaultTemplates] Erreur:', err);
  }
}

module.exports = { loadDefaultTemplates };
