import { useState, useEffect } from 'react';
import { Plus, Download, Trash2, FolderTree, GripVertical, X, CheckCircle, AlertCircle, Info, FileText, ListOrdered, FileDown, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import listXLogo from './assets/listX.svg';
import systemeIcon from './assets/systeme.png';
import pdfIcon from './assets/pdf.png';
import xlsIcon from './assets/xls.png';
import arborescenceIcon from './assets/arborescence-des-fichiers.png';
import exportIcon from './assets/exporter-le-fichier.png';
import copierIcon from './assets/coller-le-presse-papiers (1).png';
import creerIcon from './assets/nouveau-dossier.png';
import numGenIcon from './assets/num-gen.svg';
import numCatIcon from './assets/num-cat.svg';

// Palette de couleurs arc-en-ciel pour les catégories (6 couleurs)
const COLOR_PALETTE = [
  {
    bg: 'FFCCE5FF', // Bleu pâle
    bgRGB: [204, 229, 255],
    tailwindBg: 'bg-blue-100',
    tailwindText: 'text-blue-800'
  },
  {
    bg: 'FFCCFFFF', // Cyan pâle
    bgRGB: [204, 255, 255],
    tailwindBg: 'bg-cyan-100',
    tailwindText: 'text-cyan-800'
  },
  {
    bg: 'FFCCFFCC', // Vert pâle
    bgRGB: [204, 255, 204],
    tailwindBg: 'bg-green-100',
    tailwindText: 'text-green-800'
  },
  {
    bg: 'FFFFFFCC', // Jaune pâle
    bgRGB: [255, 255, 204],
    tailwindBg: 'bg-yellow-100',
    tailwindText: 'text-yellow-800'
  },
  {
    bg: 'FFFFE6CC', // Orange pâle
    bgRGB: [255, 230, 204],
    tailwindBg: 'bg-orange-100',
    tailwindText: 'text-orange-800'
  },
  {
    bg: 'FFE5CCFF', // Violet pâle
    bgRGB: [229, 204, 255],
    tailwindBg: 'bg-purple-100',
    tailwindText: 'text-purple-800'
  }
];

export default function DocumentListingApp() {
  const [affaire, setAffaire] = useState('');
  const [phase, setPhase] = useState('PRO');
  const [lot, setLot] = useState('');
  const [emetteur, setEmetteur] = useState('');
  const [nature, setNature] = useState('NDC');
  const [etat, setEtat] = useState(''); // ACTUEL, PROJET ou vide
  const [niveauCoupe, setNiveauCoupe] = useState('');
  const [zone, setZone] = useState('');
  const [format, setFormat] = useState('');
  const [indice, setIndice] = useState('A');
  const [nom, setNom] = useState('');
  const [documents, setDocuments] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null); // Item survolé pendant le drag
  const [editingDocId, setEditingDocId] = useState(null); // ID du document en cours de modification
  const [useRanges, setUseRanges] = useState(true);
  const [affairesList, setAffairesList] = useState([]);
  const [filteredAffaires, setFilteredAffaires] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // État pour les notifications
  const [notification, setNotification] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // État pour la popup de confirmation de vidage
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // État pour l'ordre des catégories
  const [categoriesOrder, setCategoriesOrder] = useState(['NOT', 'NDC', 'PLN', 'SYN', 'SCH', 'LST']);
  const [draggedCategory, setDraggedCategory] = useState(null);

  // État pour la popup d'export unifiée
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [exportNomProjet, setExportNomProjet] = useState('');
  const [exportNomListe, setExportNomListe] = useState('');
  const [exportLogoClient, setExportLogoClient] = useState(null);
  const [exportLogoBE, setExportLogoBE] = useState(null);
  const [exportAfficherCategories, setExportAfficherCategories] = useState(false);

  // État pour la version de l'app
  const [appVersion, setAppVersion] = useState('');

  const phases = ['DIAG', 'APS', 'APD', 'AVP', 'PRO', 'DCE', 'ACT', 'EXE'];

  // Fonction pour afficher une notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setIsClosing(false);
    setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setNotification(null);
        setIsClosing(false);
      }, 400); // Durée de l'animation de sortie
    }, 5000);
  };

  const natures = [
    { code: 'NOT', label: 'Notice' },
    { code: 'NDC', label: 'Note de Calcul' },
    { code: 'PLN', label: 'Plan' },
    { code: 'SYN', label: 'Synoptique' },
    { code: 'SCH', label: 'Schéma' },
    { code: 'LST', label: 'Listing' }
  ];

  const formats = ['A0+', 'A0', 'A1', 'A2', 'A3', 'A4'];

  // Fonction pour obtenir la couleur d'une catégorie selon son ordre d'apparition
  const getCategoryColor = (natureCode, categoriesPresentes) => {
    const index = categoriesPresentes.indexOf(natureCode);
    if (index === -1) return COLOR_PALETTE[0]; // Par défaut bleu
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  const getNextNumber = (natureCode) => {
    if (useRanges) {
      // Obtenir les catégories uniques dans l'ordre d'apparition
      const categoriesPresentes = [];
      documents.forEach(doc => {
        if (!categoriesPresentes.includes(doc.nature)) {
          categoriesPresentes.push(doc.nature);
        }
      });

      // Si la nouvelle catégorie n'existe pas encore, l'ajouter
      if (!categoriesPresentes.includes(natureCode)) {
        categoriesPresentes.push(natureCode);
      }

      // Trouver la position de la catégorie dans l'ordre d'apparition
      const categoryPosition = categoriesPresentes.indexOf(natureCode) + 1;

      // Compter combien de docs existent déjà dans cette catégorie
      const docsOfType = documents.filter(d => d.nature === natureCode);
      const docPosition = docsOfType.length + 1;

      // Format: 1er chiffre = catégorie, 2-3 chiffres = position doc
      return `${categoryPosition}${String(docPosition).padStart(2, '0')}`;
    } else {
      const docsOfType = documents.filter(d => d.nature === natureCode);
      return (docsOfType.length + 1).toString().padStart(2, '0');
    }
  };

  const genererNomComplet = (doc, numero) => {
    const parts = [
      doc.affaire,
      doc.phase,
      doc.lot,
      doc.emetteur,
      doc.nature,
      numero,
      doc.zone,
      doc.niveauCoupe,
      doc.format,
      doc.indice
    ].filter(part => part && part.trim() !== ''); // Filtrer les parties vides

    const nomBase = parts.join('_');

    // Ajouter le nom avec " - " au lieu de "_"
    if (doc.nom && doc.nom.trim() !== '') {
      return `${nomBase} - ${doc.nom}`;
    }

    return nomBase;
  };

  const renumeroteDocuments = (docs) => {
    if (useRanges) {
      const grouped = docs.reduce((acc, doc) => {
        if (!acc[doc.nature]) acc[doc.nature] = [];
        acc[doc.nature].push(doc);
        return acc;
      }, {});

      // Obtenir les catégories uniques dans l'ordre d'apparition
      const categoriesPresentes = [];
      docs.forEach(doc => {
        if (!categoriesPresentes.includes(doc.nature)) {
          categoriesPresentes.push(doc.nature);
        }
      });

      const renumbered = [];

      // Parcourir dans l'ordre d'apparition des catégories
      categoriesPresentes.forEach((natureCode, categoryIndex) => {
        if (grouped[natureCode]) {
          grouped[natureCode].forEach((doc, docIndex) => {
            // 1er chiffre = position catégorie, 2-3 chiffres = position doc
            const categoryPosition = categoryIndex + 1;
            const docPosition = docIndex + 1;
            const newNumero = `${categoryPosition}${String(docPosition).padStart(2, '0')}`;
            renumbered.push({
              ...doc,
              numero: newNumero,
              nomComplet: genererNomComplet(doc, newNumero)
            });
          });
        }
      });
      return renumbered;
    } else {
      const grouped = docs.reduce((acc, doc) => {
        if (!acc[doc.nature]) acc[doc.nature] = [];
        acc[doc.nature].push(doc);
        return acc;
      }, {});

      const renumbered = [];
      Object.keys(grouped).forEach(natureCode => {
        grouped[natureCode].forEach((doc, index) => {
          const newNumero = (index + 1).toString().padStart(2, '0');
          renumbered.push({
            ...doc,
            numero: newNumero,
            nomComplet: genererNomComplet(doc, newNumero)
          });
        });
      });
      return renumbered;
    }
  };

  const ajouterDocument = () => {
    // Validation des champs obligatoires
    if (!affaire || !phase || !nature || !format || !indice || !nom) {
      showNotification('Veuillez renseigner tous les champs obligatoires (Affaire, Phase, Nature, Format, Indice, Nom)', 'error');
      return;
    }

    if (editingDocId) {
      // Mode modification
      const updatedDocs = documents.map(doc => {
        if (doc.id === editingDocId) {
          const updatedDoc = {
            ...doc,
            affaire: affaire.toUpperCase(),
            phase: phase.toUpperCase(),
            lot: lot.toUpperCase(),
            emetteur: emetteur.toUpperCase(),
            nature: nature.toUpperCase(),
            etat: etat.toUpperCase(),
            niveauCoupe: niveauCoupe.toUpperCase(),
            zone: zone.toUpperCase(),
            format,
            indice: indice.toUpperCase(),
            nom: nom.toUpperCase()
          };
          updatedDoc.nomComplet = genererNomComplet(updatedDoc, doc.numero);
          return updatedDoc;
        }
        return doc;
      });

      setDocuments(renumeroteDocuments(updatedDocs));
      showNotification('Document modifié avec succès !', 'success');
      setEditingDocId(null);
    } else {
      // Mode ajout
      const numero = getNextNumber(nature);

      const newDoc = {
        id: Date.now(),
        affaire: affaire.toUpperCase(),
        phase: phase.toUpperCase(),
        lot: lot.toUpperCase(),
        emetteur: emetteur.toUpperCase(),
        nature: nature.toUpperCase(),
        etat: etat.toUpperCase(), // ACTUEL, PROJET ou vide
        numero,
        niveauCoupe: niveauCoupe.toUpperCase(),
        zone: zone.toUpperCase(),
        format,
        indice: indice.toUpperCase(),
        nom: nom.toUpperCase(),
        nomComplet: '' // Sera généré par genererNomComplet
      };

      // Générer le nom complet
      newDoc.nomComplet = genererNomComplet(newDoc, numero);

      setDocuments([...documents, newDoc]);

      // Notification de succès
      showNotification(`Document "${newDoc.nomComplet}" ajouté avec succès !`, 'success');
    }

    // Ne plus reset les champs - garder les infos du dernier document
    // setNom('');
    // setLot('');
    // setEmetteur('');
    // setNiveauCoupe('');
    // setZone('');
  };

  const modifierDocument = (id) => {
    const docToEdit = documents.find(d => d.id === id);
    if (docToEdit) {
      // Charger les données du document dans le formulaire
      setAffaire(docToEdit.affaire);
      setPhase(docToEdit.phase);
      setLot(docToEdit.lot);
      setEmetteur(docToEdit.emetteur);
      setNature(docToEdit.nature);
      setEtat(docToEdit.etat);
      setNiveauCoupe(docToEdit.niveauCoupe);
      setZone(docToEdit.zone);
      setFormat(docToEdit.format);
      setIndice(docToEdit.indice);
      setNom(docToEdit.nom);
      setEditingDocId(id);

      // Faire défiler vers le formulaire
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showNotification('Document chargé pour modification', 'info');
    }
  };

  const supprimerDocument = (id) => {
    const filtered = documents.filter(d => d.id !== id);
    setDocuments(renumeroteDocuments(filtered));
  };

  const handleDragStart = (e, doc) => {
    setDraggedItem(doc);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetDoc) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (targetDoc && draggedItem && targetDoc.id !== draggedItem.id) {
      setDragOverItem(targetDoc);
    }
  };

  const handleDragLeave = (e) => {
    setDragOverItem(null);
  };

  const handleDrop = (e, targetDoc) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem || draggedItem.id === targetDoc.id) return;

    if (draggedItem.nature !== targetDoc.nature) {
      showNotification('Vous ne pouvez réorganiser que des documents de même nature !', 'warning');
      return;
    }

    const newDocs = [...documents];
    const draggedIndex = newDocs.findIndex(d => d.id === draggedItem.id);
    const targetIndex = newDocs.findIndex(d => d.id === targetDoc.id);

    const [removed] = newDocs.splice(draggedIndex, 1);
    newDocs.splice(targetIndex, 0, removed);

    setDocuments(renumeroteDocuments(newDocs));
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const exporterCSV = () => {
    const headers = ['Affaire', 'Phase', 'Lot', 'Émetteur', 'Nature', 'N° Document', 'Niveau Coupe', 'Zone', 'Format', 'Indice', 'Nom', 'Nom Complet Fichier'];
    const rows = documents.map(d => [
      d.affaire,
      d.phase,
      d.lot || '',
      d.emetteur || '',
      d.nature,
      d.numero,
      d.niveauCoupe || '',
      d.zone || '',
      d.format,
      d.indice,
      d.nom,
      d.nomComplet
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `listing_${affaire}_${phase}_${Date.now()}.csv`;
    link.click();
  };

  const exporterExcel = async () => {
    // Validation
    if (!exportNomProjet || !exportNomListe) {
      showNotification('Veuillez renseigner le nom du projet et le nom de la liste', 'error');
      return;
    }

    try {
      // Renuméroter les documents pour garantir l'ordre correct
      const documentsToExport = renumeroteDocuments(documents);

      // Déterminer quels champs sont utilisés (même logique que le PDF)
      const fieldsUsed = {
        affaire: documentsToExport.some(d => d.affaire && d.affaire.trim() !== ''),
        phase: documentsToExport.some(d => d.phase && d.phase.trim() !== ''),
        lot: documentsToExport.some(d => d.lot && d.lot.trim() !== ''),
        emetteur: documentsToExport.some(d => d.emetteur && d.emetteur.trim() !== ''),
        nature: documentsToExport.some(d => d.nature && d.nature.trim() !== ''),
        etat: documentsToExport.some(d => d.etat && d.etat.trim() !== ''),
        zone: documentsToExport.some(d => d.zone && d.zone.trim() !== ''),
        niveauCoupe: documentsToExport.some(d => d.niveauCoupe && d.niveauCoupe.trim() !== '')
      };

      // Construire les en-têtes dynamiquement
      const headers = [];
      if (fieldsUsed.affaire) headers.push('AFFAIRE');
      if (fieldsUsed.phase) headers.push('PHASE');
      if (fieldsUsed.lot) headers.push('LOT');
      if (fieldsUsed.emetteur) headers.push('ÉMETTEUR');
      if (fieldsUsed.nature) headers.push('NATURE');
      headers.push('N° DOC');
      if (fieldsUsed.etat) headers.push('ETAT');
      if (fieldsUsed.zone) headers.push('ZONE');
      if (fieldsUsed.niveauCoupe) headers.push('NIVEAU');
      headers.push('FORMAT', 'INDICE', 'DESCRIPTION DU DOC', 'NOM DU FICHIER');

      // Obtenir les catégories présentes dans l'ordre d'apparition pour les couleurs
      const categoriesPresentes = [];
      documentsToExport.forEach(doc => {
        if (!categoriesPresentes.includes(doc.nature)) {
          categoriesPresentes.push(doc.nature);
        }
      });

      // Créer un mapping des couleurs par catégorie basé sur l'ordre
      const categoryColors = {};
      categoriesPresentes.forEach((cat, index) => {
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
        categoryColors[cat] = color.bg;
      });

      // Créer le workbook avec ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Listing Documents');

      // Fonction pour charger et dimensionner une image
      const loadImage = (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              const maxWidth = 150;
              const maxHeight = 80;
              const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
              resolve({
                width: img.width * ratio,
                height: img.height * ratio
              });
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        });
      };

      // Offset pour le cadre gris (2 lignes et 2 colonnes insérées au début)
      const ROW_OFFSET = 2;
      const COL_OFFSET = 2;

      // Mise en page avec logos et titre sur la même ligne
      const nbCols = headers.length;
      const logoRowHeight = 75; // Hauteur en points (≈100px car 1 point ≈ 1.33px)
      worksheet.getRow(1 + ROW_OFFSET).height = logoRowHeight;

      // Trouver l'index de la dernière colonne (NOM DU FICHIER) pour y placer le logo BE
      const logoColIndex = headers.indexOf('NOM DU FICHIER') + 1 + COL_OFFSET;

      // Bordure épaisse pour les zones de logos
      const thickBorder = {
        style: 'medium',
        color: { argb: 'FF000000' }
      };
      const grayColor = { argb: 'FF4A4A4A' }; // Gris foncé pour le cadre

      let currentRow = 1 + ROW_OFFSET;

      // Zone Logo Client : Fusionner les 2 premières colonnes (C3:D3 après offset)
      if (exportLogoClient) {
        worksheet.mergeCells(1 + ROW_OFFSET, 1 + COL_OFFSET, 1 + ROW_OFFSET, 2 + COL_OFFSET);
        const logoClientCell = worksheet.getCell(1 + ROW_OFFSET, 1 + COL_OFFSET);
        logoClientCell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        logoClientCell.border = {
          top: thickBorder,
          left: thickBorder,
          bottom: thickBorder,
          right: thickBorder
        };

        const dimensions = await loadImage(exportLogoClient);
        const logoClientBuffer = await exportLogoClient.arrayBuffer();
        const logoClientId = workbook.addImage({
          buffer: logoClientBuffer,
          extension: exportLogoClient.name.split('.').pop()
        });
        worksheet.addImage(logoClientId, {
          tl: { col: COL_OFFSET + 0.5, row: ROW_OFFSET + 0.2 }, // Centré dans la zone fusionnée
          ext: { width: dimensions.width, height: dimensions.height },
          editAs: 'oneCell'
        });
      } else {
        // Même sans logo, créer la zone avec bordure
        worksheet.mergeCells(1 + ROW_OFFSET, 1 + COL_OFFSET, 1 + ROW_OFFSET, 2 + COL_OFFSET);
        const logoClientCell = worksheet.getCell(1 + ROW_OFFSET, 1 + COL_OFFSET);
        logoClientCell.border = {
          top: thickBorder,
          left: thickBorder,
          bottom: thickBorder,
          right: thickBorder
        };
      }

      // Zone Titre : Fusionner les colonnes du milieu (jusqu'à la colonne avant le logo BE)
      const titleStartCol = 3 + COL_OFFSET;
      const titleEndCol = logoColIndex - 1; // S'arrête juste avant la colonne du logo BE
      worksheet.mergeCells(1 + ROW_OFFSET, titleStartCol, 1 + ROW_OFFSET, titleEndCol);
      const titleCell = worksheet.getCell(1 + ROW_OFFSET, titleStartCol);
      titleCell.value = exportNomProjet.toUpperCase();
      titleCell.font = {
        name: 'Cooper Black',
        size: 16,
        bold: true,
        color: { argb: 'FF1F4E79' }
      };
      titleCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      titleCell.border = {
        top: thickBorder,
        left: thickBorder,
        bottom: thickBorder,
        right: thickBorder
      };

      // Zone Logo BE : Cellule unique dans la dernière colonne (NOM DU FICHIER) (100px x 100px)
      if (exportLogoBE) {
        const logoBECell = worksheet.getCell(1 + ROW_OFFSET, logoColIndex);
        logoBECell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        logoBECell.border = {
          top: thickBorder,
          left: thickBorder,
          bottom: thickBorder,
          right: thickBorder
        };

        // Charger l'image avec dimensions carrées (100x100)
        const logoBEBuffer = await exportLogoBE.arrayBuffer();
        const logoBEId = workbook.addImage({
          buffer: logoBEBuffer,
          extension: exportLogoBE.name.split('.').pop()
        });

        // Calculer les dimensions pour un format carré de 100x100
        const img = new Image();
        const imageData = await exportLogoBE.arrayBuffer();
        const blob = new Blob([imageData]);
        const imgUrl = URL.createObjectURL(blob);

        await new Promise((resolve) => {
          img.onload = () => {
            const size = 95; // 95px pour laisser un peu de marge
            let width = size;
            let height = size;

            // Préserver le ratio dans le carré
            if (img.width > img.height) {
              height = (img.height / img.width) * size;
            } else {
              width = (img.width / img.height) * size;
            }

            worksheet.addImage(logoBEId, {
              tl: { col: logoColIndex - 1 + 0.05, row: ROW_OFFSET + 0.05 },
              ext: { width, height },
              editAs: 'oneCell'
            });

            URL.revokeObjectURL(imgUrl);
            resolve();
          };
          img.src = imgUrl;
        });
      } else {
        // Même sans logo, créer la zone avec bordure
        const logoBECell = worksheet.getCell(1 + ROW_OFFSET, logoColIndex);
        logoBECell.border = {
          top: thickBorder,
          left: thickBorder,
          bottom: thickBorder,
          right: thickBorder
        };
      }

      currentRow = 2 + ROW_OFFSET;

      // Ajouter le nom de la liste
      worksheet.mergeCells(currentRow, 1 + COL_OFFSET, currentRow, headers.length + COL_OFFSET);
      const subtitleCell = worksheet.getCell(currentRow, 1 + COL_OFFSET);
      subtitleCell.value = exportNomListe.toUpperCase();
      subtitleCell.font = {
        name: 'Cooper Black',
        size: 12,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      subtitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6495ED' }
      };
      subtitleCell.alignment = {
        vertical: 'middle',
        horizontal: 'center'
      };
      subtitleCell.border = {
        top: thickBorder,
        left: thickBorder,
        bottom: thickBorder,
        right: thickBorder
      };
      worksheet.getRow(currentRow).height = 20;
      currentRow++;

      // Sauvegarder la ligne de début du tableau (en-têtes)
      const tableStartRow = currentRow;

      // Ajouter les en-têtes du tableau à partir de la colonne C (COL_OFFSET)
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1 + COL_OFFSET);
        cell.value = header;
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF6495ED' } // Cornflower blue
        };
        cell.font = {
          bold: true,
          color: { argb: 'FFFFFFFF' },
          size: 11
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center'
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
      currentRow++;

      // Ajouter les données
      if (exportAfficherCategories) {
        // Grouper les documents par catégorie
        const categoriesPresentes = [];
        documentsToExport.forEach(doc => {
          if (!categoriesPresentes.includes(doc.nature)) {
            categoriesPresentes.push(doc.nature);
          }
        });

        // Définition des labels de catégories
        const categoryLabels = {
          'NOT': 'Notice',
          'NDC': 'Note de Calcul',
          'PLN': 'Plan',
          'SYN': 'Synoptique',
          'SCH': 'Schéma',
          'LST': 'Listing'
        };

        // Compteur de ligne pour toute la liste
        let numeroLigne = 1;

        // Pour chaque catégorie présente
        categoriesPresentes.forEach(category => {
          // Ajouter la ligne de catégorie
          const categoryLabel = `${category} - ${categoryLabels[category] || category}`;
          const categoryCell = worksheet.getCell(currentRow, 1 + COL_OFFSET);

          // Fusionner les cellules de la ligne de catégorie sur toute la largeur du tableau
          worksheet.mergeCells(currentRow, 1 + COL_OFFSET, currentRow, headers.length + COL_OFFSET);

          categoryCell.value = categoryLabel;
          // Utiliser la même couleur que les documents de cette catégorie
          const categoryCellColor = categoryColors[category] || 'FFFFFFFF';
          categoryCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: categoryCellColor }
          };
          categoryCell.font = {
            size: 11,
            bold: true,
            color: { argb: 'FF000000' }
          };
          categoryCell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            indent: 1
          };
          categoryCell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };

          currentRow++;

          // Ajouter tous les documents de cette catégorie
          const docsOfCategory = documentsToExport.filter(doc => doc.nature === category);
          docsOfCategory.forEach((doc) => {
            const rowData = [];
            if (fieldsUsed.affaire) rowData.push(doc.affaire || '');
            if (fieldsUsed.phase) rowData.push(doc.phase || '');
            if (fieldsUsed.lot) rowData.push(doc.lot || '');
            if (fieldsUsed.emetteur) rowData.push(doc.emetteur || '');
            if (fieldsUsed.nature) rowData.push(doc.nature || '');
            rowData.push(doc.numero);
            if (fieldsUsed.etat) rowData.push(doc.etat || '');
            if (fieldsUsed.zone) rowData.push(doc.zone || '');
            if (fieldsUsed.niveauCoupe) rowData.push(doc.niveauCoupe || '');
            rowData.push(doc.format || '', doc.indice || '', doc.nom || '', doc.nomComplet || '');
            numeroLigne++;

            // Couleur de fond selon la catégorie
            const bgColor = categoryColors[doc.nature] || 'FFFFFFFF';

            // Ajouter chaque cellule de données à partir de la colonne C (COL_OFFSET)
            rowData.forEach((value, index) => {
              const cell = worksheet.getCell(currentRow, index + 1 + COL_OFFSET);
              cell.value = value;
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: bgColor }
              };
              cell.font = {
                size: 10
              };
              cell.alignment = {
                vertical: 'middle',
                horizontal: 'center'
              };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            });

            currentRow++;
          });

          // Ajouter une double bordure en bas de la dernière ligne du groupe pour séparer les catégories
          const lastRowOfCategory = currentRow - 1;
          for (let col = 1 + COL_OFFSET; col <= headers.length + COL_OFFSET; col++) {
            const cell = worksheet.getCell(lastRowOfCategory, col);
            cell.border = {
              ...cell.border,
              bottom: { style: 'double', color: { argb: 'FF000000' } }
            };
          }
        });
      } else {
        // Sans catégories, afficher tous les documents directement
        documentsToExport.forEach((doc) => {
          const rowData = [];
          if (fieldsUsed.affaire) rowData.push(doc.affaire || '');
          if (fieldsUsed.phase) rowData.push(doc.phase || '');
          if (fieldsUsed.lot) rowData.push(doc.lot || '');
          if (fieldsUsed.emetteur) rowData.push(doc.emetteur || '');
          if (fieldsUsed.nature) rowData.push(doc.nature || '');
          rowData.push(doc.numero);
          if (fieldsUsed.etat) rowData.push(doc.etat || '');
          if (fieldsUsed.zone) rowData.push(doc.zone || '');
          if (fieldsUsed.niveauCoupe) rowData.push(doc.niveauCoupe || '');
          rowData.push(doc.format || '', doc.indice || '', doc.nom || '', doc.nomComplet || '');

          // Couleur de fond selon la catégorie
          const bgColor = categoryColors[doc.nature] || 'FFFFFFFF';

          // Ajouter chaque cellule de données à partir de la colonne C (COL_OFFSET)
          rowData.forEach((value, index) => {
            const cell = worksheet.getCell(currentRow, index + 1 + COL_OFFSET);
            cell.value = value;
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: bgColor }
            };
            cell.font = {
              size: 10
            };
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center'
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FF000000' } },
              left: { style: 'thin', color: { argb: 'FF000000' } },
              bottom: { style: 'thin', color: { argb: 'FF000000' } },
              right: { style: 'thin', color: { argb: 'FF000000' } }
            };
          });

          currentRow++;
        });
      }

      // Calculer la ligne de fin du tableau (dernière ligne ajoutée - 1 car currentRow a déjà été incrémenté)
      const tableEndRow = currentRow - 1;
      const tableStartCol = 1 + COL_OFFSET;
      const tableEndCol = nbCols + COL_OFFSET;

      // Bordure épaisse sur le contour extérieur du tableau
      // On applique UNIQUEMENT sur les cellules du bord pour ne pas écraser les bordures internes
      for (let row = tableStartRow; row <= tableEndRow; row++) {
        // Bordure de gauche (première colonne)
        const leftCell = worksheet.getCell(row, tableStartCol);
        leftCell.border = {
          ...leftCell.border,
          left: thickBorder
        };

        // Bordure de droite (dernière colonne)
        const rightCell = worksheet.getCell(row, tableEndCol);
        rightCell.border = {
          ...rightCell.border,
          right: thickBorder
        };
      }

      for (let col = tableStartCol; col <= tableEndCol; col++) {
        // Bordure du haut (première ligne)
        const topCell = worksheet.getCell(tableStartRow, col);
        topCell.border = {
          ...topCell.border,
          top: thickBorder
        };

        // Bordure du bas (dernière ligne)
        const bottomCell = worksheet.getCell(tableEndRow, col);
        bottomCell.border = {
          ...bottomCell.border,
          bottom: thickBorder
        };
      }

      // Ajuster les largeurs de colonnes (en sautant les 2 premières colonnes du cadre)
      worksheet.columns.forEach((column, index) => {
        // Sauter les colonnes A et B (cadre gris)
        if (index < COL_OFFSET) {
          return; // Ces colonnes sont déjà configurées pour le cadre
        }

        const headerIndex = index - COL_OFFSET;
        if (headerIndex >= headers.length) {
          return; // Colonne au-delà des en-têtes (cadre droit)
        }

        const headerName = headers[headerIndex];

        // Largeurs spécifiques pour certaines colonnes
        if (['PHASE', 'NATURE', 'N° DOC', 'FORMAT', 'INDICE', 'LOT', 'ETAT', 'ZONE', 'NIVEAU'].includes(headerName)) {
          // Colonnes uniformes et réduites
          column.width = 10;
        } else if (headerName === 'NOM DU FICHIER') {
          // NOM DU FICHIER : auto-adaptatif basé sur le contenu
          let maxLength = headerName.length;
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 25), 60); // Min 25, max 60
        } else if (headerName === 'DESCRIPTION DU DOC') {
          // DESCRIPTION : largeur moyenne
          let maxLength = headerName.length;
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 20), 45);
        } else {
          // Largeur auto pour les autres colonnes (AFFAIRE, LOT, ÉMETTEUR, ETAT, ZONE, NIVEAU)
          let maxLength = headerName.length;
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 12), 20);
        }
      });

      // CADRE GRIS PROFESSIONNEL : Créer directement les cellules du cadre
      // Le contenu a déjà été créé avec les offsets, on ajoute juste le cadre maintenant

      // Configurer la ligne 1 (espacement)
      worksheet.getRow(1).height = 5;

      // Configurer la colonne A (espacement)
      worksheet.getColumn(1).width = 1;

      // Configurer la ligne 2 (bande grise du haut)
      worksheet.getRow(2).height = 5;

      // Configurer la colonne B (bande grise gauche)
      worksheet.getColumn(2).width = 1;

      // Maintenant le contenu commence à la ligne 3, colonne C
      // Calculer où se termine le contenu (tableEndRow inclut déjà l'offset via tableStartRow)
      const finalTableEndRow = tableEndRow; // Déjà décalé
      const finalTableEndCol = nbCols + COL_OFFSET; // Déjà décalé

      // Créer la bande grise du haut (ligne 2, de la colonne B à la dernière colonne +1)
      for (let col = COL_OFFSET; col <= finalTableEndCol + 1; col++) {
        const cell = worksheet.getCell(2, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: grayColor
        };
        cell.border = {
          top: thickBorder,
          left: col === COL_OFFSET ? thickBorder : undefined,
          right: col === finalTableEndCol + 1 ? thickBorder : undefined,
          bottom: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }

      // Créer la bande grise gauche (colonne B, de la ligne 2 à la dernière ligne +1)
      for (let row = ROW_OFFSET; row <= finalTableEndRow + 1; row++) {
        const cell = worksheet.getCell(row, COL_OFFSET);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: grayColor
        };
        cell.border = {
          ...cell.border,
          left: thickBorder,
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }

      // Créer la bande grise droite (dernière colonne +1)
      const rightGrayCol = finalTableEndCol + 1;
      worksheet.getColumn(rightGrayCol).width = 1;
      for (let row = ROW_OFFSET; row <= finalTableEndRow + 1; row++) {
        const cell = worksheet.getCell(row, rightGrayCol);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: grayColor
        };
        cell.border = {
          ...cell.border,
          right: thickBorder,
          left: { style: 'thin', color: { argb: 'FF000000' } }
        };
      }

      // Créer la bande grise du bas (dernière ligne +1)
      const bottomGrayRow = finalTableEndRow + 1;
      worksheet.getRow(bottomGrayRow).height = 5;
      for (let col = COL_OFFSET; col <= finalTableEndCol + 1; col++) {
        const cell = worksheet.getCell(bottomGrayRow, col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: grayColor
        };
        cell.border = {
          ...cell.border,
          bottom: thickBorder,
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: col === COL_OFFSET ? thickBorder : undefined,
          right: col === finalTableEndCol + 1 ? thickBorder : undefined
        };
      }

      // Générer et télécharger le fichier
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${exportNomProjet.replace(/\s/g, '_')}_${phase}_Liste.xlsx`;
      link.click();

      setShowExportPopup(false);
      showNotification('Export Excel réussi', 'success');
    } catch (error) {
      console.error('Erreur lors de la génération de l\'Excel:', error);
      showNotification('Erreur lors de la génération de l\'Excel', 'error');
    }
  };

  const viderListe = () => {
    setDocuments([]);
    setShowClearConfirm(false);
    showNotification('Liste vidée avec succès', 'success');
  };

  // Fonction pour convertir une image en base64
  const imageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Fonction pour générer le PDF
  const genererPDF = async () => {
    if (!exportNomProjet || !exportNomListe) {
      showNotification('Veuillez renseigner le nom du projet et le nom de la liste', 'error');
      return;
    }

    try {
      // Forcer la renumérotation des documents avant export pour garantir l'ordre correct
      const documentsToExport = renumeroteDocuments(documents);

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Obtenir les catégories présentes dans l'ordre d'apparition pour les couleurs
      const categoriesPresentes = [];
      documentsToExport.forEach(d => {
        if (!categoriesPresentes.includes(d.nature)) {
          categoriesPresentes.push(d.nature);
        }
      });

      // Créer un mapping des couleurs par catégorie basé sur l'ordre
      const categoryColors = {};
      categoriesPresentes.forEach((cat, index) => {
        const color = COLOR_PALETTE[index % COLOR_PALETTE.length];
        categoryColors[cat] = color.bgRGB;
      });

      // Ajouter les logos si disponibles (sans étirement)
      if (exportLogoClient) {
        const logoClientData = await imageToBase64(exportLogoClient);
        const img = new Image();
        img.src = logoClientData;
        await new Promise((resolve) => {
          img.onload = () => {
            const maxWidth = 40;
            const maxHeight = 25;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;
            doc.addImage(logoClientData, 'PNG', 10, 5, width, height);
            resolve();
          };
        });
      }

      if (exportLogoBE) {
        const logoBEData = await imageToBase64(exportLogoBE);
        const img = new Image();
        img.src = logoBEData;
        await new Promise((resolve) => {
          img.onload = () => {
            const maxWidth = 40;
            const maxHeight = 25;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const width = img.width * ratio;
            const height = img.height * ratio;
            doc.addImage(logoBEData, 'PNG', pageWidth - 10 - width, 5, width, height);
            resolve();
          };
        });
      }

      // Titre principal (nom du projet)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 78, 121); // Bleu foncé
      doc.text(exportNomProjet, pageWidth / 2, 20, { align: 'center' });

      // Sous-titre (nom de la liste)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(100, 149, 237); // Bleu clair
      doc.rect(10, 32, pageWidth - 20, 8, 'F');
      doc.text(exportNomListe, pageWidth / 2, 37, { align: 'center' });

      // Déterminer quels champs sont utilisés dans au moins un document
      const fieldsUsed = {
        affaire: documentsToExport.some(d => d.affaire && d.affaire.trim() !== ''),
        phase: documentsToExport.some(d => d.phase && d.phase.trim() !== ''),
        lot: documentsToExport.some(d => d.lot && d.lot.trim() !== ''),
        emetteur: documentsToExport.some(d => d.emetteur && d.emetteur.trim() !== ''),
        nature: documentsToExport.some(d => d.nature && d.nature.trim() !== ''),
        etat: documentsToExport.some(d => d.etat && d.etat.trim() !== ''),
        zone: documentsToExport.some(d => d.zone && d.zone.trim() !== ''),
        niveauCoupe: documentsToExport.some(d => d.niveauCoupe && d.niveauCoupe.trim() !== '')
      };

      // Construire les en-têtes de colonnes dynamiquement
      const headers = [];
      const columnStyles = {};
      let colIndex = 0;

      if (fieldsUsed.affaire) {
        headers.push('AFFAIRE');
        columnStyles[colIndex] = { cellWidth: 25, halign: 'center' };
        colIndex++;
      }
      if (fieldsUsed.phase) {
        headers.push('PHASE');
        columnStyles[colIndex] = { cellWidth: 20, halign: 'center' };
        colIndex++;
      }
      if (fieldsUsed.lot) {
        headers.push('LOT');
        columnStyles[colIndex] = { cellWidth: 15, halign: 'center' };
        colIndex++;
      }
      if (fieldsUsed.emetteur) {
        headers.push('ÉMETTEUR');
        columnStyles[colIndex] = { cellWidth: 25, halign: 'center' };
        colIndex++;
      }
      if (fieldsUsed.nature) {
        headers.push('NATURE');
        columnStyles[colIndex] = { cellWidth: 20, halign: 'center' };
        colIndex++;
      }

      headers.push('N° DOC');
      columnStyles[colIndex] = { cellWidth: 30, halign: 'center' };
      colIndex++;

      if (fieldsUsed.etat) {
        headers.push('ETAT');
        columnStyles[colIndex] = { cellWidth: 15, halign: 'center' };
        colIndex++;
      }
      if (fieldsUsed.zone) {
        headers.push('ZONE');
        columnStyles[colIndex] = { cellWidth: 15, halign: 'center' };
        colIndex++;
      }
      if (fieldsUsed.niveauCoupe) {
        headers.push('NIVEAU');
        columnStyles[colIndex] = { cellWidth: 15, halign: 'center' };
        colIndex++;
      }

      headers.push('FORMAT', 'INDICE', 'DESCRIPTION DU DOC', 'NOM DU FICHIER');
      columnStyles[colIndex] = { cellWidth: 20, halign: 'center' };
      columnStyles[colIndex + 1] = { cellWidth: 15, halign: 'center' };
      columnStyles[colIndex + 2] = { cellWidth: 'auto' };
      columnStyles[colIndex + 3] = { cellWidth: 'auto' };

      // Préparer les données du tableau
      let tableData = [];

      if (exportAfficherCategories) {
        // Grouper par catégorie
        const categoriesPresentes = [];
        documentsToExport.forEach(doc => {
          if (!categoriesPresentes.includes(doc.nature)) {
            categoriesPresentes.push(doc.nature);
          }
        });

        const categoryLabels = {
          'NOT': 'Notice',
          'NDC': 'Note de Calcul',
          'PLN': 'Plan',
          'SYN': 'Synoptique',
          'SCH': 'Schéma',
          'LST': 'Listing'
        };

        categoriesPresentes.forEach(category => {
          // Ajouter la ligne de catégorie
          const categoryLabel = `${category} - ${categoryLabels[category] || category}`;
          const categoryRow = [categoryLabel];
          // Remplir avec des chaînes vides pour les autres colonnes
          for (let i = 1; i < headers.length; i++) {
            categoryRow.push('');
          }
          tableData.push({ rowData: categoryRow, nature: category, isCategory: true });

          // Ajouter les documents de cette catégorie
          const docsOfCategory = documentsToExport.filter(doc => doc.nature === category);
          docsOfCategory.forEach((doc, index) => {
            const rowData = [];

            if (fieldsUsed.affaire) rowData.push(doc.affaire || '');
            if (fieldsUsed.phase) rowData.push(doc.phase || '');
            if (fieldsUsed.lot) rowData.push(doc.lot || '');
            if (fieldsUsed.emetteur) rowData.push(doc.emetteur || '');
            if (fieldsUsed.nature) rowData.push(doc.nature || '');

            rowData.push(doc.numero);

            if (fieldsUsed.etat) rowData.push(doc.etat || '');
            if (fieldsUsed.zone) rowData.push(doc.zone || '');
            if (fieldsUsed.niveauCoupe) rowData.push(doc.niveauCoupe || '');

            rowData.push(doc.format || '', doc.indice || 'A', doc.nom, doc.nomComplet);

            tableData.push({
              rowData,
              nature: doc.nature,
              isCategory: false,
              isLastOfCategory: index === docsOfCategory.length - 1
            });
          });
        });
      } else {
        // Sans catégories
        tableData = documentsToExport.map((doc, index) => {
          const rowData = [];

          if (fieldsUsed.affaire) rowData.push(doc.affaire || '');
          if (fieldsUsed.phase) rowData.push(doc.phase || '');
          if (fieldsUsed.lot) rowData.push(doc.lot || '');
          if (fieldsUsed.emetteur) rowData.push(doc.emetteur || '');
          if (fieldsUsed.nature) rowData.push(doc.nature || '');

          rowData.push(doc.numero);

          if (fieldsUsed.etat) rowData.push(doc.etat || '');
          if (fieldsUsed.zone) rowData.push(doc.zone || '');
          if (fieldsUsed.niveauCoupe) rowData.push(doc.niveauCoupe || '');

          rowData.push(doc.format || '', doc.indice || 'A', doc.nom, doc.nomComplet);

          return { rowData, nature: doc.nature, isCategory: false };
        });
      }

      // Générer le tableau
      autoTable(doc, {
        startY: 45,
        margin: { left: 10, right: 10 },
        head: [headers],
        body: tableData.map(d => d.rowData),
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [100, 149, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8
        },
        columnStyles: columnStyles,
        didParseCell: function(data) {
          if (data.section === 'body') {
            const rowData = tableData[data.row.index];

            if (rowData.isCategory) {
              // Fusionner toutes les cellules de la ligne de catégorie
              if (data.column.index === 0) {
                data.cell.colSpan = headers.length;
              }
              // Style pour les lignes de catégorie
              const color = categoryColors[rowData.nature] || [211, 211, 211];
              data.cell.styles.fillColor = color;
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fontSize = 8;
              data.cell.styles.halign = 'left';
            } else {
              // Style normal pour les documents
              const color = categoryColors[rowData.nature] || [255, 255, 255];
              data.cell.styles.fillColor = color;
            }
          }
        },
        didDrawCell: function(data) {
          // Ajouter une bordure double en bas de chaque groupe de catégorie
          if (data.section === 'body' && exportAfficherCategories) {
            const rowData = tableData[data.row.index];
            if (rowData && rowData.isLastOfCategory) {
              // Dessiner une double ligne en bas
              const { x, y, width, height } = data.cell;
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.5);
              doc.line(x, y + height, x + width, y + height);
              doc.setLineWidth(0.1);
              doc.line(x, y + height + 0.5, x + width, y + height + 0.5);
            }
          }
        }
      });

      // Sauvegarder le PDF
      const fileName = `${exportNomProjet.replace(/\s/g, '_')}_${phase}_Liste.pdf`;
      doc.save(fileName);

      setShowExportPopup(false);
      showNotification('PDF généré avec succès !', 'success');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      showNotification('Erreur lors de la génération du PDF : ' + error.message, 'error');
    }
  };

  // Gestion du drag & drop des catégories
  const handleCategoryDragStart = (e, categoryCode) => {
    setDraggedCategory(categoryCode);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCategoryDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCategoryDrop = (e, targetCategory) => {
    e.preventDefault();

    if (!draggedCategory || draggedCategory === targetCategory) return;

    // Obtenir les catégories uniques dans l'ordre d'apparition actuel
    const categoriesPresentes = [];
    documents.forEach(doc => {
      if (!categoriesPresentes.includes(doc.nature)) {
        categoriesPresentes.push(doc.nature);
      }
    });

    // Trouver les positions
    const draggedIndex = categoriesPresentes.indexOf(draggedCategory);
    const targetIndex = categoriesPresentes.indexOf(targetCategory);

    // Réorganiser l'ordre des catégories
    categoriesPresentes.splice(draggedIndex, 1);
    categoriesPresentes.splice(targetIndex, 0, draggedCategory);

    // Réorganiser les documents selon le nouvel ordre des catégories
    const newDocuments = [];
    categoriesPresentes.forEach(natureCode => {
      const docsOfType = documents.filter(d => d.nature === natureCode);
      newDocuments.push(...docsOfType);
    });

    // Renuméroter avec le nouvel ordre
    setDocuments(renumeroteDocuments(newDocuments));
    setDraggedCategory(null);
    showNotification('Ordre des catégories modifié et documents renumérotés', 'success');
  };

  const handleCategoryDragEnd = () => {
    setDraggedCategory(null);
  };

  const forcerRenumerationParCategorie = () => {
    if (documents.length > 0) {
      setDocuments(renumeroteDocuments(documents));
      showNotification('Numérotation par catégorie mise à jour avec succès', 'success');
    }
  };

  const forcerRenumerationGenerale = () => {
    if (documents.length > 0) {
      let numeroGlobal = 1;
      const renumbered = [];

      // Obtenir les catégories uniques dans l'ordre d'apparition
      const categoriesPresentes = [];
      documents.forEach(doc => {
        if (!categoriesPresentes.includes(doc.nature)) {
          categoriesPresentes.push(doc.nature);
        }
      });

      // Parcourir les documents dans l'ordre d'affichage (par catégorie puis par ordre dans la liste)
      categoriesPresentes.forEach(natureCode => {
        const docsOfType = documents.filter(d => d.nature === natureCode);
        docsOfType.forEach(doc => {
          const newNumero = numeroGlobal.toString().padStart(3, '0');
          renumbered.push({
            ...doc,
            numero: newNumero,
            nomComplet: genererNomComplet(doc, newNumero)
          });
          numeroGlobal++;
        });
      });

      setDocuments(renumbered);
      showNotification('Numérotation générale mise à jour avec succès', 'success');
    }
  };

  const genererArborescence = () => {
    const grouped = documents.reduce((acc, doc) => {
      if (!acc[doc.nature]) acc[doc.nature] = [];
      acc[doc.nature].push(doc);
      return acc;
    }, {});

    let arbo = `B - PIECES GRAPHIQUES\\\n`;

    Object.keys(grouped).sort().forEach(nature => {
      arbo += `├── ${nature}\\\n`;
      grouped[nature].forEach(doc => {
        arbo += `│   └── ${doc.nomComplet}\n`;
      });
    });

    // Copier dans le presse-papier
    navigator.clipboard.writeText(arbo).then(() => {
      showNotification('Arborescence copiée dans le presse-papier !', 'success');
    }).catch(() => {
      showNotification(arbo, 'info');
    });
  };

  const creerArborescenceDossiers = async () => {
    if (documents.length === 0) {
      showNotification('Aucun document à exporter', 'warning');
      return;
    }

    try {
      // Demander à l'utilisateur de sélectionner le dossier de base
      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      showNotification('Création de l\'arborescence en cours...', 'info');

      // Grouper les documents par nature
      const grouped = documents.reduce((acc, doc) => {
        if (!acc[doc.nature]) acc[doc.nature] = [];
        acc[doc.nature].push(doc);
        return acc;
      }, {});

      // Créer la structure de base
      const piecesEcrites = await directoryHandle.getDirectoryHandle('A - PIECES ECRITES', { create: true });
      const noticeDir = await piecesEcrites.getDirectoryHandle('NOTICE', { create: true });

      const piecesGraphiques = await directoryHandle.getDirectoryHandle('B - PIECES GRAPHIQUES', { create: true });
      const listingDir = await piecesGraphiques.getDirectoryHandle('00 - LISTING', { create: true });
      await piecesGraphiques.getDirectoryHandle('01 - BPU', { create: true });
      const ndcDir = await piecesGraphiques.getDirectoryHandle('02 - NDC', { create: true });
      const synoDir = await piecesGraphiques.getDirectoryHandle('03 - SYNO', { create: true });
      const schDir = await piecesGraphiques.getDirectoryHandle('04 - SCH', { create: true });
      const plnDir = await piecesGraphiques.getDirectoryHandle('05 - PLAN', { create: true });

      // Mapping des natures vers les handles de dossiers
      const natureDirs = {
        'NOT': noticeDir,
        'LST': listingDir,
        'NDC': ndcDir,
        'SYN': synoDir,
        'SCH': schDir,
        'PLN': plnDir
      };

      // Créer les dossiers pour chaque document
      for (const natureCode of Object.keys(grouped)) {
        const parentDir = natureDirs[natureCode];
        if (parentDir) {
          for (const doc of grouped[natureCode]) {
            const nomDossier = `${doc.numero} - ${doc.nom}`;
            await parentDir.getDirectoryHandle(nomDossier, { create: true });
          }
        }
      }

      showNotification('Arborescence créée avec succès !', 'success');
    } catch (error) {
      if (error.name === 'AbortError') {
        showNotification('Création annulée', 'info');
      } else {
        showNotification('Erreur lors de la création : ' + error.message, 'error');
      }
    }
  };

  const getPhaseFolder = (p) => {
    const mapping = {
      'DIAG': '03 - DIAG',
      'APS': '04 - APS',
      'APD': '05 - APD',
      'AVP': '06 - AVP',
      'PRO': '07 - PRO',
      'DCE': '08 - DCE',
      'ACT': '09 - ACT'
    };
    return mapping[p] || '07 - PRO';
  };

  const toggleMode = () => {
    const newMode = !useRanges;
    setUseRanges(newMode);
    if (documents.length > 0) {
      setDocuments(renumeroteDocuments(documents));
    }
  };

  // Fonctions de gestion des affaires
  const handleAffaireChange = (value) => {
    const upperValue = value.toUpperCase();
    setAffaire(upperValue);

    if (upperValue.length > 0) {
      const filtered = affairesList.filter(a =>
        a.toUpperCase().startsWith(upperValue)
      );
      setFilteredAffaires(filtered);
      setShowAutocomplete(true);
    } else {
      setFilteredAffaires([]);
      setShowAutocomplete(false);
    }
  };

  // Vérifier si l'affaire existe déjà
  const affaireExiste = () => {
    return affaire && affairesList.some(a => a.toUpperCase() === affaire.toUpperCase());
  };

  // Ajouter la nouvelle affaire
  const ajouterNouvelleAffaire = () => {
    if (affaire && !affaireExiste()) {
      ajouterAffaireCSV(affaire);
      setShowAutocomplete(false);
      showNotification(`Affaire "${affaire}" ajoutée à la base de données !`, 'success');
    }
  };

  const chargerAffaire = (nomAffaire) => {
    const data = JSON.parse(localStorage.getItem('affairesData') || '{}');
    const docs = data.affaires?.[nomAffaire] || [];
    setDocuments(docs);
    setAffaire(nomAffaire);
    localStorage.setItem('lastAffaire', nomAffaire);
    setShowAutocomplete(false);
  };

  const nouvelleAffaire = () => {
    setDocuments([]);
    setAffaire('');
    setShowAutocomplete(false);
  };

  // Sauvegarder les affaires dans le CSV
  const sauvegarderAffairesCSV = async (affaires) => {
    const csv = affaires.join('\n');
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'affaires.csv',
        types: [{
          description: 'CSV Files',
          accept: { 'text/csv': ['.csv'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write('\ufeff' + csv); // BOM UTF-8
      await writable.close();
    } catch (error) {
      // Fallback si l'API File System n'est pas supportée
      console.log('Utilisation du localStorage pour les affaires');
    }
  };

  // Charger les affaires depuis le CSV
  const chargerAffairesCSV = async () => {
    try {
      // Pour l'instant, on utilise le localStorage
      // Plus tard, on pourra implémenter un système de fichier CSV local
      const affairesData = localStorage.getItem('affairesCSV');
      if (affairesData) {
        const affaires = affairesData.split('\n').filter(a => a.trim() !== '');
        // Trier par ordre alphabétique au chargement
        affaires.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
        return affaires;
      }
      return [];
    } catch (error) {
      console.error('Erreur chargement CSV:', error);
      return [];
    }
  };

  // Ajouter une nouvelle affaire au CSV
  const ajouterAffaireCSV = (nouvelleAffaire) => {
    const affairesData = localStorage.getItem('affairesCSV') || '';
    const affaires = affairesData.split('\n').filter(a => a.trim() !== '');

    if (!affaires.includes(nouvelleAffaire)) {
      affaires.push(nouvelleAffaire);
      // Trier par ordre alphabétique
      affaires.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
      localStorage.setItem('affairesCSV', affaires.join('\n'));
      setAffairesList(affaires);
      setFilteredAffaires(affaires);
    }
  };

  // useEffect pour charger les données au démarrage
  useEffect(() => {
    const loadData = async () => {
      // Charger les affaires depuis le CSV
      const affaires = await chargerAffairesCSV();
      setAffairesList(affaires);
      setFilteredAffaires(affaires);

      // Charger les données de l'affaire précédente
      const data = JSON.parse(localStorage.getItem('affairesData') || '{}');
      const lastAffaire = localStorage.getItem('lastAffaire') || '';

      if (lastAffaire && data.affaires?.[lastAffaire]) {
        setAffaire(lastAffaire);
        setDocuments(data.affaires[lastAffaire]);
      }

      if (data.settings) {
        setUseRanges(data.settings.useRanges !== undefined ? data.settings.useRanges : true);
        if (data.settings.categoriesOrder) {
          setCategoriesOrder(data.settings.categoriesOrder);
        }
      }
    };

    loadData();
  }, []);

  // useEffect pour charger la version de l'app
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
      });
    }
  }, []);

  // useEffect pour sauvegarder automatiquement les documents
  useEffect(() => {
    if (affaire && documents.length > 0) {
      const data = JSON.parse(localStorage.getItem('affairesData') || '{}');

      if (!data.affaires) data.affaires = {};
      data.affaires[affaire] = documents;
      data.lastAffaire = affaire;
      data.settings = { useRanges, categoriesOrder };

      localStorage.setItem('affairesData', JSON.stringify(data));
      localStorage.setItem('lastAffaire', affaire);

      // Ajouter l'affaire au CSV si elle n'existe pas
      ajouterAffaireCSV(affaire);
    }
  }, [documents]);

  // useEffect pour sauvegarder les paramètres
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('affairesData') || '{}');
    data.settings = { useRanges, categoriesOrder };
    localStorage.setItem('affairesData', JSON.stringify(data));
  }, [useRanges, categoriesOrder]);

  // Grouper documents par nature pour affichage
  const documentsGroupes = documents.reduce((acc, doc) => {
    if (!acc[doc.nature]) acc[doc.nature] = [];
    acc[doc.nature].push(doc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative overflow-hidden">
      {/* Background animé avec vagues */}
      <div className="wave-background">
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 ${isClosing ? 'animate-slide-out' : 'animate-slide-in'}`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${
            notification.type === 'success'
              ? 'bg-white border-green-500'
              : notification.type === 'error'
              ? 'bg-white border-red-500'
              : notification.type === 'warning'
              ? 'bg-white border-orange-500'
              : 'bg-white border-blue-500'
          }`}>
            {notification.type === 'success' && <CheckCircle className="text-green-500" size={24} />}
            {notification.type === 'error' && <AlertCircle className="text-red-500" size={24} />}
            {notification.type === 'warning' && <AlertCircle className="text-orange-500" size={24} />}
            {notification.type === 'info' && <Info className="text-blue-500" size={24} />}
            <span className="text-gray-800 font-medium">{notification.message}</span>
            <button
              onClick={() => {
                setIsClosing(true);
                setTimeout(() => {
                  setNotification(null);
                  setIsClosing(false);
                }, 400);
              }}
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Popup de confirmation de vidage */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Vider la liste ?
                </h3>
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir vider toute la liste ? Cette action supprimera tous les {documents.length} document{documents.length > 1 ? 's' : ''} et ne peut pas être annulée.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={viderListe}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Vider la liste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup d'export unifiée */}
      {showExportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileDown size={24} />
                Exporter la liste
              </h3>
              <button
                onClick={() => setShowExportPopup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nom du projet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du projet *
                </label>
                <input
                  type="text"
                  value={exportNomProjet}
                  onChange={(e) => setExportNomProjet(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ex: HOTEL 3.14 CANNES"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              {/* Nom de la liste */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la liste *
                </label>
                <input
                  type="text"
                  value={exportNomListe}
                  onChange={(e) => setExportNomListe(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Ex: LISTE DES ANNEXES - PHASE DCE"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              {/* Logos */}
              <div className="grid grid-cols-2 gap-4">
                {/* Logo Client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Client (haut gauche)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setExportLogoClient(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {exportLogoClient && (
                    <p className="text-xs text-green-600 mt-1">✓ {exportLogoClient.name}</p>
                  )}
                </div>

                {/* Logo Bureau d'études */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Bureau d'Études (haut droite)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setExportLogoBE(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  {exportLogoBE && (
                    <p className="text-xs text-green-600 mt-1">✓ {exportLogoBE.name}</p>
                  )}
                </div>
              </div>

              {/* Option affichage catégories */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                <input
                  type="checkbox"
                  id="exportAfficherCategories"
                  checked={exportAfficherCategories}
                  onChange={(e) => setExportAfficherCategories(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="exportAfficherCategories" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Afficher les lignes de catégories (NOT, NDC, PLN, etc.)
                </label>
              </div>

              {/* Info */}
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">
                  <Info className="inline mr-2" size={16} />
                  L'export contiendra {documents.length} document{documents.length > 1 ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExportPopup(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={genererPDF}
                className="px-4 py-2 bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-md hover:from-rose-700 hover:to-rose-800 transition-colors flex items-center gap-2"
              >
                <img src={pdfIcon} alt="" className="w-5 h-5" />
                Générer PDF
              </button>
              <button
                onClick={exporterExcel}
                className="px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-md hover:from-teal-700 hover:to-teal-800 transition-colors flex items-center gap-2"
              >
                <img src={xlsIcon} alt="" className="w-5 h-5" />
                Générer Excel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-6 mb-6">
          <img src={listXLogo} alt="listX Logo" className="h-20 w-auto" />
          <h1 className="text-3xl font-bold text-white">Générateur de Listing Documents</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ajouter un document</h2>

          <div className="space-y-3">
            {/* Ligne 1 : Tous les champs sur une seule ligne */}
            <div className="flex gap-2 items-end">
              {/* Affaire */}
              <div className="relative" style={{minWidth: '120px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Affaire *</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={affaire}
                    onChange={(e) => handleAffaireChange(e.target.value)}
                    onFocus={() => {
                      if (affaire.length > 0) {
                        setShowAutocomplete(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                    placeholder="ASELYS"
                  />
                  {affaire && !affaireExiste() && (
                    <button
                      onClick={ajouterNouvelleAffaire}
                      className="bg-green-600 text-white px-1.5 py-1.5 rounded hover:bg-green-700 flex items-center justify-center shrink-0"
                      title="Ajouter cette nouvelle affaire"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                {showAutocomplete && filteredAffaires.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredAffaires.map((aff, idx) => (
                      <button
                        key={idx}
                        onClick={() => chargerAffaire(aff)}
                        className="w-full text-left px-2 py-1.5 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-xs"
                      >
                        {aff}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phase */}
              <div style={{minWidth: '70px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phase *</label>
                <select
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="w-full px-1 py-1.5 border border-gray-300 rounded text-xs"
                >
                  {phases.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Lot */}
              <div style={{minWidth: '70px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Lot</label>
                <input
                  type="text"
                  value={lot}
                  onChange={(e) => setLot(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="LOT1"
                />
              </div>

              {/* Émetteur */}
              <div style={{minWidth: '70px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Émetteur</label>
                <input
                  type="text"
                  value={emetteur}
                  onChange={(e) => setEmetteur(e.target.value.toUpperCase())}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="BET"
                />
              </div>

              {/* Nature */}
              <div style={{minWidth: '160px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nature du doc. *</label>
                <select
                  value={nature}
                  onChange={(e) => setNature(e.target.value)}
                  className="w-full px-1 py-1.5 border border-gray-300 rounded text-xs"
                >
                  {natures.map(n => (
                    <option key={n} value={n.code}>
                      {n.code} - {n.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* État */}
              <div style={{minWidth: '110px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">État</label>
                <select
                  value={etat}
                  onChange={(e) => setEtat(e.target.value)}
                  className="w-full px-1 py-1.5 border border-gray-300 rounded text-xs"
                >
                  <option value="">-</option>
                  <option value="ACTUEL">ACTUEL</option>
                  <option value="PROJET">PROJET</option>
                </select>
              </div>

              {/* Zone */}
              <div style={{minWidth: '70px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zone</label>
                <input
                  type="text"
                  value={zone}
                  onChange={(e) => setZone(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="ZONE1"
                />
              </div>

              {/* Niveau */}
              <div style={{minWidth: '70px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Niveau</label>
                <input
                  type="text"
                  value={niveauCoupe}
                  onChange={(e) => setNiveauCoupe(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                  placeholder="R+1"
                />
              </div>

              {/* Format */}
              <div style={{minWidth: '60px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Format *</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-1 py-1.5 border border-gray-300 rounded text-xs"
                >
                  <option value="">-</option>
                  {formats.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Indice */}
              <div style={{minWidth: '40px'}}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Indice *</label>
                <input
                  type="text"
                  value={indice}
                  onChange={(e) => setIndice(e.target.value.toUpperCase())}
                  maxLength="1"
                  className="w-full px-1 py-1.5 border border-gray-300 rounded text-center text-xs"
                  placeholder="A"
                />
              </div>
            </div>

            {/* Ligne 2 : Nom du document en pleine largeur */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom du document *</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                placeholder="ex: Bilan de Puissance"
                onKeyPress={(e) => e.key === 'Enter' && ajouterDocument()}
              />
            </div>
          </div>

          <button
            onClick={ajouterDocument}
            className="w-full text-white py-2 rounded-md flex items-center justify-center gap-2 mt-4"
            style={{ backgroundColor: editingDocId ? '#059669' : '#1e3a8a' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = editingDocId ? '#047857' : '#1e40af'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = editingDocId ? '#059669' : '#1e3a8a'}
          >
            {editingDocId ? <Edit size={20} /> : <Plus size={20} />}
            {editingDocId ? 'Modifier le document' : 'Ajouter le document'}
          </button>
          {editingDocId && (
            <button
              onClick={() => {
                setEditingDocId(null);
                showNotification('Modification annulée', 'info');
              }}
              className="w-full text-gray-700 bg-gray-200 hover:bg-gray-300 py-2 rounded-md flex items-center justify-center gap-2 mt-2"
            >
              <X size={20} />
              Annuler la modification
            </button>
          )}
        </div>

        {documents.length > 0 && (
          <div className="flex gap-4">
            {/* Barre d'actions verticale à droite */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Documents listés ({documents.length})</h2>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="group relative bg-gradient-to-br from-red-600 to-red-700 text-white p-2 rounded-lg hover:from-red-700 hover:to-red-800 shadow-md hover:shadow-lg transition-all duration-200"
                  title="Vider la liste"
                >
                  <Trash2 size={20} />
                </button>
              </div>

            <div className="flex items-center mb-4 bg-blue-50 p-3 rounded">
              <p className="text-sm text-gray-600">
                💡 <strong>Astuce:</strong> Glissez-déposez les documents ou les catégories pour les réorganiser. Les numéros se mettront à jour automatiquement !
              </p>
            </div>

            {(() => {
              // Obtenir les catégories uniques dans l'ordre d'apparition
              const categoriesPresentes = [];
              documents.forEach(doc => {
                if (!categoriesPresentes.includes(doc.nature)) {
                  categoriesPresentes.push(doc.nature);
                }
              });
              return categoriesPresentes;
            })().map(natureCode => {
              // Calculer les catégories pour obtenir la couleur
              const categoriesPresentes = [];
              documents.forEach(doc => {
                if (!categoriesPresentes.includes(doc.nature)) {
                  categoriesPresentes.push(doc.nature);
                }
              });
              const categoryColor = getCategoryColor(natureCode, categoriesPresentes);

              return (
              <div key={natureCode} className="mb-6">
                <h3
                  draggable
                  onDragStart={(e) => handleCategoryDragStart(e, natureCode)}
                  onDragOver={handleCategoryDragOver}
                  onDrop={(e) => handleCategoryDrop(e, natureCode)}
                  onDragEnd={handleCategoryDragEnd}
                  className={`font-semibold text-lg mb-2 ${categoryColor.tailwindText} ${categoryColor.tailwindBg} px-3 py-2 rounded cursor-move hover:opacity-90 transition-all flex items-center gap-2 ${
                    draggedCategory === natureCode ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400" />
                  {natureCode} - {natures.find(n => n.code === natureCode)?.label}
                </h3>
                <div className="space-y-1">
                  {documentsGroupes[natureCode].map(doc => (
                    <div
                      key={doc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, doc)}
                      onDragOver={(e) => handleDragOver(e, doc)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, doc)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 border rounded-md cursor-move hover:bg-gray-50 transition-all duration-200 ${
                        draggedItem?.id === doc.id
                          ? 'opacity-30 bg-blue-50 scale-95'
                          : dragOverItem?.id === doc.id
                            ? 'border-blue-500 border-2 bg-blue-50 scale-105 shadow-lg'
                            : 'bg-white'
                      }`}
                    >
                      <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
                      <span className={`${(() => {
                        const cats = [];
                        documents.forEach(d => { if (!cats.includes(d.nature)) cats.push(d.nature); });
                        return getCategoryColor(doc.nature, cats).tailwindBg;
                      })()} ${(() => {
                        const cats = [];
                        documents.forEach(d => { if (!cats.includes(d.nature)) cats.push(d.nature); });
                        return getCategoryColor(doc.nature, cats).tailwindText;
                      })()} px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
                        {doc.nature}
                      </span>
                      <span className="font-mono text-gray-600 flex-shrink-0 font-semibold">{doc.numero}</span>
                      {doc.etat && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                          {doc.etat}
                        </span>
                      )}
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs flex-shrink-0">{doc.indice}</span>
                      <span className="flex-grow">{doc.nom}</span>
                      <span className="text-xs text-gray-400 font-mono hidden md:block">{doc.nomComplet}</span>
                      <button
                        onClick={() => modifierDocument(doc.id)}
                        className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => supprimerDocument(doc.id)}
                        className="text-red-600 hover:text-red-800 flex-shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
            </div>

            {/* Barre d'actions verticale */}
            <div className="flex flex-col gap-3 w-48">
              {/* Encart Numérotation */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <ListOrdered size={24} className="text-gray-700" />
                  <span className="font-semibold text-sm text-gray-700">Numérotation</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={forcerRenumerationParCategorie}
                    className="group relative bg-gradient-to-br from-blue-600 to-blue-700 text-white flex-1 aspect-square rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden"
                    title="Renuméroter par catégorie"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <img src={numCatIcon} alt="" className="w-10 h-10 brightness-0 invert drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Catégorie</span>
                  </button>
                  <button
                    onClick={forcerRenumerationGenerale}
                    className="group relative bg-gradient-to-br from-purple-600 to-purple-700 text-white flex-1 aspect-square rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden"
                    title="Renumérotation générale"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <img src={numGenIcon} alt="" className="w-10 h-10 brightness-0 invert drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Générale</span>
                  </button>
                </div>
              </div>

              {/* Encart Arborescence */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <FolderTree size={24} className="text-gray-700" />
                  <span className="font-semibold text-sm text-gray-700">Arborescence</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={genererArborescence}
                    className="group relative bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex-1 aspect-square rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden"
                    title="Copier arborescence"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <img src={copierIcon} alt="" className="w-10 h-10 drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Copier</span>
                  </button>
                  <button
                    onClick={creerArborescenceDossiers}
                    className="group relative bg-gradient-to-br from-purple-600 to-purple-700 text-white flex-1 aspect-square rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden"
                    title="Créer arborescence"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <img src={creerIcon} alt="" className="w-10 h-10 drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Créer</span>
                  </button>
                </div>
              </div>

              {/* Encart Export */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <FileDown size={24} className="text-gray-700" />
                  <span className="font-semibold text-sm text-gray-700">Export</span>
                </div>
                <button
                  onClick={() => setShowExportPopup(true)}
                  className="group relative bg-gradient-to-br from-indigo-600 to-indigo-700 text-white w-full rounded-lg hover:from-indigo-700 hover:to-indigo-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-row items-center justify-center gap-2 overflow-hidden p-3"
                  title="Exporter"
                >
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                  <FileDown size={24} className="drop-shadow-lg relative z-10" />
                  <span className="font-medium text-sm relative z-10">Exporter</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Version de l'application */}
      {appVersion && (
        <div className="absolute bottom-2 right-4 text-xs text-gray-500 select-none">
          v{appVersion}
        </div>
      )}
    </div>
  );
}
