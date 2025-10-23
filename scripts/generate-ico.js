const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

async function generateIco() {
  try {
    console.log('Génération du fichier .ico à partir du PNG...');

    const pngPath = path.join(__dirname, '../build/icon.png');
    const icoPath = path.join(__dirname, '../build/icon.ico');

    // Lire le PNG
    const pngBuffer = fs.readFileSync(pngPath);

    // Convertir en ICO (Windows attend plusieurs tailles)
    const icoBuffer = await toIco([pngBuffer], {
      sizes: [16, 24, 32, 48, 64, 128, 256],
      resize: true
    });

    // Écrire le fichier .ico
    fs.writeFileSync(icoPath, icoBuffer);

    console.log('✓ Fichier icon.ico généré avec succès !');
    console.log(`  Chemin : ${icoPath}`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération du .ico :', error.message);
    console.log('\n⚠️  L\'application utilisera l\'icône par défaut d\'Electron.');
    console.log('Pour générer l\'icône manuellement :');
    console.log('1. Allez sur https://cloudconvert.com/png-to-ico');
    console.log('2. Uploadez build/icon.png');
    console.log('3. Téléchargez et placez icon.ico dans build/');
  }
}

generateIco();
