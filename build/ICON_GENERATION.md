# Génération de l'icône .ico

Pour générer un fichier icon.ico à partir du SVG, vous avez plusieurs options :

## Option 1 : Utiliser un service en ligne (RECOMMANDÉ - SIMPLE)

1. Allez sur https://cloudconvert.com/svg-to-ico
2. Uploadez le fichier `icon.svg`
3. Configurez la taille : 256x256 (pour une bonne qualité)
4. Téléchargez le fichier `icon.ico`
5. Placez-le dans ce dossier `build/`

## Option 2 : Utiliser ImageMagick (si installé)

```bash
magick convert -background none -density 256 icon.svg -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
```

## Option 3 : Utiliser Inkscape (si installé)

```bash
inkscape icon.svg --export-type=png --export-width=256 --export-filename=icon-256.png
# Puis convertir le PNG en ICO avec un outil en ligne
```

## Option 4 : Utiliser un package npm

```bash
npm install -g svg2ico
svg2ico icon.svg icon.ico
```

## Note importante

Le build Electron fonctionnera SANS l'icône .ico, mais :
- Windows affichera une icône par défaut (icône Electron)
- Pour une version professionnelle, il est recommandé d'ajouter l'icône

Si vous ne générez pas l'icône maintenant, vous pourrez toujours le faire plus tard et rebuild l'application.
