/**
 * Script manuel pour charger les templates par défaut
 * À exécuter si les templates ne se chargent pas automatiquement
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Déterminer le chemin AppData
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'ListX');
const templatesDir = path.join(appDataPath, 'templates');
const defaultsDir = path.join(__dirname, 'src', 'templates', 'defaults');

console.log('=================================');
console.log('Chargement manuel des templates');
console.log('=================================\n');

// Créer les répertoires si nécessaire
if (!fs.existsSync(appDataPath)) {
  fs.mkdirSync(appDataPath, { recursive: true });
  console.log('✓ Répertoire AppData créé:', appDataPath);
}

if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
  console.log('✓ Répertoire templates créé:', templatesDir);
}

// Lire les templates par défaut
console.log('\nLecture des templates par défaut depuis:', defaultsDir);
const files = fs.readdirSync(defaultsDir).filter(f => f.endsWith('.json'));

console.log(`\nTemplates trouvés: ${files.length}\n`);

files.forEach(file => {
  try {
    const sourcePath = path.join(defaultsDir, file);
    const data = fs.readFileSync(sourcePath, 'utf8');
    const exportData = JSON.parse(data);

    if (exportData.type !== 'listx-template') {
      console.log(`⚠ ${file} n'est pas un template valide`);
      return;
    }

    const template = exportData.data;
    const destPath = path.join(templatesDir, `${template.id}.json`);

    // Vérifier si existe déjà
    if (fs.existsSync(destPath)) {
      console.log(`⊘ Template "${template.nom}" existe déjà (${template.id}.json)`);
      return;
    }

    // Sauvegarder le template
    fs.writeFileSync(destPath, JSON.stringify(template, null, 2), 'utf8');
    console.log(`✓ Template "${template.nom}" chargé → ${template.id}.json`);
  } catch (err) {
    console.error(`✗ Erreur lors du chargement de ${file}:`, err.message);
  }
});

console.log('\n=================================');
console.log('Chargement terminé !');
console.log('=================================');
console.log('\nEmplacement:', templatesDir);
console.log('\nRelancez l\'application pour voir les templates.');
