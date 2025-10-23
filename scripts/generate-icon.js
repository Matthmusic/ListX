const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcon() {
  try {
    console.log('Génération des icônes à partir du SVG...');

    const svgPath = path.join(__dirname, '../build/icon.svg');
    const pngPath256 = path.join(__dirname, '../build/icon.png');
    const pngPath512 = path.join(__dirname, '../build/icon@2x.png');

    // Générer PNG 256x256 (electron-builder le convertira en .ico)
    await sharp(svgPath)
      .resize(256, 256)
      .png()
      .toFile(pngPath256);

    console.log('✓ PNG généré : icon.png (256x256)');

    // Générer PNG 512x512 pour une meilleure qualité
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(pngPath512);

    console.log('✓ PNG généré : icon@2x.png (512x512)');
    console.log('✓ Icônes générées avec succès !');
    console.log('\n→ electron-builder convertira automatiquement ces PNGs en .ico lors du build');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes :', error.message);
    console.log('\nL\'application fonctionnera quand même, mais avec l\'icône par défaut d\'Electron.');
    console.log('Pour ajouter une icône personnalisée plus tard :');
    console.log('1. Allez sur https://cloudconvert.com/svg-to-ico');
    console.log('2. Uploadez build/icon.svg');
    console.log('3. Téléchargez et placez icon.ico dans build/');
  }
}

generateIcon();
