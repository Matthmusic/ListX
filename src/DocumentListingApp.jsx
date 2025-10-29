import { useState, useEffect, useContext } from 'react';
import { Plus, Download, Trash2, FolderTree, GripVertical, X, CheckCircle, AlertCircle, Info, FileText, ListOrdered, FileDown, Edit, Settings, Upload } from 'lucide-react';
import { TemplateContext } from './context/TemplateContext';
import { generateFilename, getExportHeaders, getDocumentValues, mergeFormFieldsOrder } from './utils/filename';
import { FieldSettingsModal } from './components/FieldSettingsModal';
import { DynamicFormField } from './components/DynamicFormField';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
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

// Composant SortableDocument pour le drag and drop avec dnd-kit
function SortableDocument({ doc, categoryColor, templateHasEtatField, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 transition-all duration-200 ${
        isDragging
          ? 'bg-blue-50 scale-95 shadow-xl z-50'
          : 'bg-white'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-move touch-none">
        <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
      </div>
      <span className={`${categoryColor.tailwindBg} ${categoryColor.tailwindText} px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
        {doc.nature}
      </span>
      <span className="font-mono text-gray-600 flex-shrink-0 font-semibold">{doc.numero}</span>
      {templateHasEtatField && doc.etat && doc.etat.trim() !== '' && (
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
          {doc.etat}
        </span>
      )}
      <span className="bg-gray-100 px-2 py-1 rounded text-xs flex-shrink-0">{doc.indice}</span>
      <span className="flex-grow">{doc.nom}</span>
      <span className="text-xs text-gray-400 font-mono hidden md:block">{doc.nomComplet}</span>
      <button
        onClick={() => onEdit(doc.id)}
        className="text-blue-600 hover:text-blue-800 flex-shrink-0"
        title="Modifier"
      >
        <Edit size={16} />
      </button>
      <button
        onClick={() => onDelete(doc.id)}
        className="text-red-600 hover:text-red-800 flex-shrink-0"
        title="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

// Composant SortableCategory pour le drag and drop des catégories avec dnd-kit
function SortableCategory({ natureCode, label, categoryColor, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: `category-${natureCode}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <h3
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`font-semibold text-lg mb-2 ${categoryColor.tailwindText} ${categoryColor.tailwindBg} px-3 py-2 rounded cursor-move hover:opacity-90 transition-all flex items-center gap-2`}
    >
      <GripVertical size={20} className="text-gray-400" />
      {natureCode} - {label}
    </h3>
  );
}

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

const ARBO_SECTION_DEFINITIONS = [
  { nature: 'NOT', root: 'A - PIECES ECRITES', sectionCode: 'A1', label: 'NOTICE' },
  { nature: 'LST', root: 'B - PIECES GRAPHIQUES', sectionCode: 'B1', label: 'LISTING' },
  { nature: 'BPU', root: 'B - PIECES GRAPHIQUES', sectionCode: 'B2', label: 'BPU' },
  { nature: 'NDC', root: 'B - PIECES GRAPHIQUES', sectionCode: 'B3', label: 'NDC' },
  { nature: 'SYN', root: 'B - PIECES GRAPHIQUES', sectionCode: 'B4', label: 'SYNO' },
  { nature: 'SCH', root: 'B - PIECES GRAPHIQUES', sectionCode: 'B5', label: 'SCH' },
  { nature: 'PLN', root: 'B - PIECES GRAPHIQUES', sectionCode: 'B6', label: 'PLAN' },
];

const ARBO_ROOTS_ORDER = ['A - PIECES ECRITES', 'B - PIECES GRAPHIQUES'];

const sanitizeForFilesystem = (value = '') => value.replace(/[\\/:*?"<>|]/g, '-').trim();

const getSectionLayout = (docs = []) => {
  const layout = [...ARBO_SECTION_DEFINITIONS];
  const handledNatures = new Set(layout.map(def => def.nature));
  const extraNatures = [];

  docs.forEach(doc => {
    const nature = doc?.nature;
    if (nature && !handledNatures.has(nature)) {
      handledNatures.add(nature);
      extraNatures.push(nature);
    }
  });

  if (extraNatures.length === 0) {
    return layout;
  }

  const baseBIndices = layout
    .filter(def => def.root === 'B - PIECES GRAPHIQUES')
    .map(def => {
      const match = def.sectionCode.match(/^B(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(Boolean);

  let nextIndex = baseBIndices.length > 0 ? Math.max(...baseBIndices) + 1 : 1;

  extraNatures.sort().forEach((nature) => {
    layout.push({
      nature,
      root: 'B - PIECES GRAPHIQUES',
      sectionCode: `B${String(nextIndex)}`,
      label: nature,
    });
    nextIndex += 1;
  });

  return layout;
};

export default function DocumentListingApp() {
  // Import du contexte des templates
  const { currentTemplate } = useContext(TemplateContext);
  const formFieldsOrder = currentTemplate ? mergeFormFieldsOrder(currentTemplate) : [];
  const templateHasEtatField = !currentTemplate || formFieldsOrder.includes('ETAT');

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

  // État pour les champs personnalisés (dynamiques)
  const [customFieldsValues, setCustomFieldsValues] = useState({});

  // État pour les historiques de champs par affaire
  const [fieldsHistory, setFieldsHistory] = useState({});

  // Mapping dynamique des valeurs et setters pour les champs du formulaire
  const fieldValues = {
    affaire,
    phase,
    lot,
    emetteur,
    nature,
    etat,
    numero: '(auto)',
    zone,
    niveau: niveauCoupe,
    niveaucoupe: niveauCoupe,
    format,
    indice,
    // Ajouter les valeurs des champs personnalisés
    ...Object.keys(customFieldsValues).reduce((acc, key) => {
      acc[key.toLowerCase()] = customFieldsValues[key];
      return acc;
    }, {})
  };

  // Créer un setter générique pour les champs personnalisés
  const createCustomFieldSetter = (fieldId) => (val) => {
    setCustomFieldsValues(prev => ({ ...prev, [fieldId]: val.toUpperCase() }));
  };

  const fieldSetters = {
    affaire: (val) => {
      handleAffaireChange(val);
    },
    phase: (val) => {
      setPhase(val);
      if (fieldErrors.phase) setFieldErrors(prev => ({ ...prev, phase: false }));
    },
    lot: (val) => setLot(val.toUpperCase()),
    emetteur: (val) => setEmetteur(val.toUpperCase()),
    nature: (val) => {
      setNature(val);
      if (fieldErrors.nature) setFieldErrors(prev => ({ ...prev, nature: false }));
    },
    etat: (val) => setEtat(val),
    numero: () => {}, // Readonly
    zone: (val) => setZone(val.toUpperCase()),
    niveau: (val) => setNiveauCoupe(val.toUpperCase()),
    niveaucoupe: (val) => setNiveauCoupe(val.toUpperCase()),
    format: (val) => {
      setFormat(val);
      if (fieldErrors.format) setFieldErrors(prev => ({ ...prev, format: false }));
    },
    indice: (val) => {
      setIndice(val.toUpperCase());
      if (fieldErrors.indice) setFieldErrors(prev => ({ ...prev, indice: false }));
    },
    // Ajouter les setters des champs personnalisés dynamiquement
    ...Object.keys(customFieldsValues).reduce((acc, key) => {
      acc[key.toLowerCase()] = createCustomFieldSetter(key);
      return acc;
    }, {})
  };
  const [editingDocId, setEditingDocId] = useState(null); // ID du document en cours de modification
  const [affairesList, setAffairesList] = useState([]);
  const [filteredAffaires, setFilteredAffaires] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({}); // Pour tracker les champs obligatoires vides

  // État pour les notifications
  const [notification, setNotification] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // État pour la popup de confirmation de vidage
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // États pour le drag and drop avec dnd-kit
  const [activeDocId, setActiveDocId] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // État pour l'ordre des catégories (pour la persistance)
  const [categoriesOrder, setCategoriesOrder] = useState(['NOT', 'NDC', 'PLN', 'SYN', 'SCH', 'LST']);

  // Sensors pour dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // État pour la popup d'export unifiée
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [exportNomProjet, setExportNomProjet] = useState('');
  const [exportNomListe, setExportNomListe] = useState('');
  const [exportDateListe, setExportDateListe] = useState('');
  const [exportIndiceListe, setExportIndiceListe] = useState('');
  const [exportLogoClient, setExportLogoClient] = useState(null);
  const [exportLogoBE, setExportLogoBE] = useState(null);
  const [exportAfficherCategories, setExportAfficherCategories] = useState(false);

  // État pour le mode de numérotation actif ('categorie' ou 'generale')
  const [modeNumerotation, setModeNumerotation] = useState('categorie');

  // État pour la version de l'app
  const [appVersion, setAppVersion] = useState('');

  // État pour la modale des paramètres de champs
  const [showFieldSettings, setShowFieldSettings] = useState(false);

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
    if (modeNumerotation === 'categorie') {
      // Numérotation par catégorie avec centaines : 1XX, 2XX, 3XX...
      // Obtenir les catégories uniques dans l'ordre d'apparition
      const categoriesPresentes = [];
      documents.forEach(doc => {
        if (!categoriesPresentes.includes(doc.nature)) {
          categoriesPresentes.push(doc.nature);
        }
      });

      // Si la nouvelle catégorie n'existe pas encore, l'ajouter à la fin
      if (!categoriesPresentes.includes(natureCode)) {
        categoriesPresentes.push(natureCode);
      }

      const categoryIndex = categoriesPresentes.indexOf(natureCode);
      const categoryBase = (categoryIndex + 1) * 100; // 100, 200, 300...
      const docsOfType = documents.filter(d => d.nature === natureCode);
      return (categoryBase + docsOfType.length + 1).toString().padStart(3, '0'); // 101, 102, 103...
    } else {
      // Numérotation générale : numérotation continue sur tous les documents
      // Calculer le prochain numéro global en tenant compte de l'ordre des catégories
      const categoriesPresentes = [];
      documents.forEach(doc => {
        if (!categoriesPresentes.includes(doc.nature)) {
          categoriesPresentes.push(doc.nature);
        }
      });

      // Si la nouvelle catégorie n'existe pas encore, l'ajouter à la fin
      if (!categoriesPresentes.includes(natureCode)) {
        categoriesPresentes.push(natureCode);
      }

      // Compter tous les documents avant cette catégorie + documents dans cette catégorie
      let numeroGlobal = 1;
      for (const cat of categoriesPresentes) {
        const docsOfCat = documents.filter(d => d.nature === cat);
        if (cat === natureCode) {
          // On est dans la catégorie du nouveau document
          numeroGlobal += docsOfCat.length;
          break;
        }
        numeroGlobal += docsOfCat.length;
      }

      return numeroGlobal.toString().padStart(3, '0');
    }
  };

  const genererNomComplet = (doc, numero) => {
    // Utiliser le template pour générer le nom
    if (currentTemplate) {
      // Créer un document temporaire avec le numéro au lieu du champ NUMERO
      const docWithNumero = { ...doc, numero };
      return generateFilename(docWithNumero, currentTemplate);
    }

    // Fallback vers l'ancien système si pas de template
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

    // Numérotation par catégorie avec centaines : 1XX, 2XX, 3XX...
    categoriesPresentes.forEach((natureCode, categoryIndex) => {
      if (grouped[natureCode]) {
        const categoryBase = (categoryIndex + 1) * 100; // 100, 200, 300...
        grouped[natureCode].forEach((doc, docIndex) => {
          const newNumero = (categoryBase + docIndex + 1).toString().padStart(3, '0'); // 101, 102, 103...
          renumbered.push({
            ...doc,
            numero: newNumero,
            nomComplet: genererNomComplet(doc, newNumero)
          });
        });
      }
    });
    return renumbered;
  };

  const ajouterDocument = () => {
    // Validation des champs obligatoires
    const errors = {};
    if (!affaire) errors.affaire = true;
    if (!phase) errors.phase = true;
    if (!nature) errors.nature = true;
    if (!format) errors.format = true;
    if (!indice) errors.indice = true;
    if (!nom) errors.nom = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showNotification('Veuillez renseigner tous les champs obligatoires (Affaire, Phase, Nature, Format, Indice, Nom)', 'error');
      return;
    }

    // Réinitialiser les erreurs si tout est OK
    setFieldErrors({});

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
            etat: templateHasEtatField ? (etat || '').toUpperCase() : '',
            niveauCoupe: niveauCoupe.toUpperCase(),
            zone: zone.toUpperCase(),
            format,
            indice: indice.toUpperCase(),
            nom: nom.toUpperCase(),
            // Ajouter les champs personnalisés (convertir les clés en minuscules)
            ...Object.keys(customFieldsValues).reduce((acc, key) => {
              acc[key.toLowerCase()] = customFieldsValues[key];
              return acc;
            }, {})
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
        etat: templateHasEtatField ? (etat || '').toUpperCase() : '',
        numero,
        niveauCoupe: niveauCoupe.toUpperCase(),
        zone: zone.toUpperCase(),
        format,
        indice: indice.toUpperCase(),
        nom: nom.toUpperCase(),
        nomComplet: '', // Sera généré par genererNomComplet
        // Ajouter les champs personnalisés (convertir les clés en minuscules)
        ...Object.keys(customFieldsValues).reduce((acc, key) => {
          acc[key.toLowerCase()] = customFieldsValues[key];
          return acc;
        }, {})
      };

      // Générer le nom complet
      newDoc.nomComplet = genererNomComplet(newDoc, numero);

      setDocuments([...documents, newDoc]);

      // Notification de succès
      showNotification(`Document "${newDoc.nomComplet}" ajouté avec succès !`, 'success');

      // Enregistrer les valeurs dans l'historique pour cette affaire
      if (affaire) {
        ajouterValeurHistorique(affaire, 'EMETTEUR', emetteur);
        ajouterValeurHistorique(affaire, 'LOT', lot);
        ajouterValeurHistorique(affaire, 'ZONE', zone);
        ajouterValeurHistorique(affaire, 'NIVEAU', niveauCoupe);

        // Enregistrer aussi les champs personnalisés
        if (currentTemplate && currentTemplate.customFields) {
          currentTemplate.customFields.forEach(field => {
            const value = customFieldsValues[field.id];
            if (value && value.trim() !== '') {
              ajouterValeurHistorique(affaire, field.id, value);
            }
          });
        }
      }
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
      setAffaire(docToEdit.affaire || '');
      setPhase(docToEdit.phase || '');
      setLot(docToEdit.lot || '');
      setEmetteur(docToEdit.emetteur || '');
      setNature(docToEdit.nature || '');
      setEtat(docToEdit.etat || '');
      setNiveauCoupe(docToEdit.niveauCoupe || '');
      setZone(docToEdit.zone || '');
      setFormat(docToEdit.format || '');
      setIndice(docToEdit.indice || '');
      setNom(docToEdit.nom || '');

      // Charger les champs personnalisés
      if (currentTemplate && currentTemplate.customFields) {
        const customValues = {};
        currentTemplate.customFields.forEach(field => {
          customValues[field.id] = docToEdit[field.id] || '';
        });
        setCustomFieldsValues(customValues);
      }

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

  // Handlers pour le drag and drop des documents avec dnd-kit
  const handleDocumentDragStart = (event) => {
    setActiveDocId(event.active.id);
  };

  const handleDocumentDragEnd = (event) => {
    const { active, over } = event;
    setActiveDocId(null);

    if (!over || active.id === over.id) return;

    const activeDoc = documents.find(d => d.id === active.id);
    const overDoc = documents.find(d => d.id === over.id);

    if (!activeDoc || !overDoc) return;

    // Vérifier que les documents sont de même nature
    if (activeDoc.nature !== overDoc.nature) {
      showNotification('Vous ne pouvez réorganiser que des documents de même nature !', 'warning');
      return;
    }

    const oldIndex = documents.findIndex(d => d.id === active.id);
    const newIndex = documents.findIndex(d => d.id === over.id);

    const reorderedDocs = arrayMove(documents, oldIndex, newIndex);
    setDocuments(renumeroteDocuments(reorderedDocs));
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
      // Renuméroter les documents pour garantir l'ordre correct selon le mode actif
      let documentsToExport;
      if (modeNumerotation === 'categorie') {
        documentsToExport = renumeroteDocuments(documents);
      } else {
        // Numérotation générale pour l'export
        const categoriesPresentes = [];
        documents.forEach(doc => {
          if (!categoriesPresentes.includes(doc.nature)) {
            categoriesPresentes.push(doc.nature);
          }
        });

        let numeroGlobal = 1;
        const renumbered = [];
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
        documentsToExport = renumbered;
      }

      // Utiliser le template pour obtenir les en-têtes et déterminer les champs utilisés
      const exportHeaders = getExportHeaders(currentTemplate);

      // Créer le tableau des en-têtes (libellés uniquement)
      // Les champs système (DESCRIPTION, NOM_FICHIER) sont déjà inclus dans exportHeaders
      const headers = exportHeaders.map(h => h.label);

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

      // Zone Logo BE : utiliser les 2 dernières colonnes fusionnées
      const logoBEStartCol = headers.length - 1 + COL_OFFSET; // Avant-dernière colonne
      const logoBEEndCol = headers.length + COL_OFFSET; // Dernière colonne

      // Bordure épaisse pour les zones de logos
      const thickBorder = {
        style: 'medium',
        color: { argb: 'FF000000' }
      };
      const grayColor = { argb: 'FF4A4A4A' }; // Gris foncé pour le cadre

      let currentRow = 1 + ROW_OFFSET;

      // Zone Logo Client : Fusionner les 2 premières colonnes (C3:D3 après offset)
      if (exportLogoClient) {
        const logoClientStartCol = 1 + COL_OFFSET;
        const logoClientEndCol = 2 + COL_OFFSET;
        if (logoClientEndCol > logoClientStartCol) {
          worksheet.mergeCells(1 + ROW_OFFSET, logoClientStartCol, 1 + ROW_OFFSET, logoClientEndCol);
        }
        const logoClientCell = worksheet.getCell(1 + ROW_OFFSET, logoClientStartCol);
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
        const logoClientStartCol = 1 + COL_OFFSET;
        const logoClientEndCol = 2 + COL_OFFSET;
        if (logoClientEndCol > logoClientStartCol) {
          worksheet.mergeCells(1 + ROW_OFFSET, logoClientStartCol, 1 + ROW_OFFSET, logoClientEndCol);
        }
        const logoClientCell = worksheet.getCell(1 + ROW_OFFSET, logoClientStartCol);
        logoClientCell.border = {
          top: thickBorder,
          left: thickBorder,
          bottom: thickBorder,
          right: thickBorder
        };
      }

      // Zone Titre : Fusionner les colonnes du milieu (jusqu'à la colonne avant le logo BE)
      const titleStartCol = 3 + COL_OFFSET;
      const titleEndCol = logoBEStartCol - 1; // S'arrête juste avant la zone du logo BE

      // Vérifier que la fusion est valide avant de l'effectuer
      if (titleEndCol > titleStartCol) {
        worksheet.mergeCells(1 + ROW_OFFSET, titleStartCol, 1 + ROW_OFFSET, titleEndCol);
      }
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

      // Zone Logo BE : Fusionner les 2 dernières colonnes (100px x 100px)
      if (exportLogoBE) {
        // Fusionner les 2 dernières colonnes pour le logo BE
        if (logoBEEndCol > logoBEStartCol) {
          worksheet.mergeCells(1 + ROW_OFFSET, logoBEStartCol, 1 + ROW_OFFSET, logoBEEndCol);
        }
        const logoBECell = worksheet.getCell(1 + ROW_OFFSET, logoBEStartCol);
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
              tl: { col: logoBEStartCol - 1 + 0.5, row: ROW_OFFSET + 0.2 }, // Centré dans la zone fusionnée
              ext: { width, height },
              editAs: 'oneCell'
            });

            URL.revokeObjectURL(imgUrl);
            resolve();
          };
          img.src = imgUrl;
        });
      } else {
        // Même sans logo, créer la zone avec bordure (fusionner les 2 dernières colonnes)
        if (logoBEEndCol > logoBEStartCol) {
          worksheet.mergeCells(1 + ROW_OFFSET, logoBEStartCol, 1 + ROW_OFFSET, logoBEEndCol);
        }
        const logoBECell = worksheet.getCell(1 + ROW_OFFSET, logoBEStartCol);
        logoBECell.border = {
          top: thickBorder,
          left: thickBorder,
          bottom: thickBorder,
          right: thickBorder
        };
      }

      currentRow = 2 + ROW_OFFSET;

      // Ajouter le nom de la liste avec date et indice
      // Date dans la première colonne
      const dateCell = worksheet.getCell(currentRow, 1 + COL_OFFSET);
      if (exportDateListe) {
        const dateFormatted = new Date(exportDateListe).toLocaleDateString('fr-FR');
        dateCell.value = dateFormatted;
      } else {
        dateCell.value = '';
      }
      dateCell.font = {
        name: 'Cooper Black',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      dateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6495ED' }
      };
      dateCell.alignment = {
        vertical: 'middle',
        horizontal: 'left'
      };
      dateCell.border = {
        top: thickBorder,
        left: thickBorder,
        bottom: thickBorder,
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };

      // Nom de la liste au centre (fusionner les colonnes du milieu, s'arrêter avant les 2 dernières pour l'indice)
      const mergeStartCol = 2 + COL_OFFSET;
      const mergeEndCol = headers.length - 2 + COL_OFFSET; // S'arrête avant les 2 dernières colonnes (indice)

      if (mergeEndCol > mergeStartCol) {
        // Fusionner seulement si on a au moins 2 colonnes à fusionner
        worksheet.mergeCells(currentRow, mergeStartCol, currentRow, mergeEndCol);
      }

      const subtitleCell = worksheet.getCell(currentRow, mergeStartCol);
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
        bottom: thickBorder,
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };

      // Appliquer le même style aux cellules intermédiaires fusionnées
      if (mergeEndCol > mergeStartCol) {
        for (let col = mergeStartCol + 1; col <= mergeEndCol; col++) {
          const cell = worksheet.getCell(currentRow, col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6495ED' }
          };
          cell.border = {
            top: thickBorder,
            bottom: thickBorder,
            left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
          };
        }
      }

      // Indice dans les 2 dernières colonnes fusionnées
      const indiceStartCol = headers.length - 1 + COL_OFFSET; // Avant-dernière colonne
      const indiceEndCol = headers.length + COL_OFFSET; // Dernière colonne

      // Fusionner les 2 dernières colonnes pour l'indice
      if (indiceEndCol > indiceStartCol) {
        worksheet.mergeCells(currentRow, indiceStartCol, currentRow, indiceEndCol);
      }

      const indiceCell = worksheet.getCell(currentRow, indiceStartCol);
      if (exportIndiceListe) {
        indiceCell.value = `Indice : ${exportIndiceListe}`;
      } else {
        indiceCell.value = '';
      }
      indiceCell.font = {
        name: 'Cooper Black',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      indiceCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6495ED' }
      };
      indiceCell.alignment = {
        vertical: 'middle',
        horizontal: 'right'
      };
      indiceCell.border = {
        top: thickBorder,
        right: thickBorder,
        bottom: thickBorder,
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } }
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
            // Utiliser le template pour obtenir les valeurs dans l'ordre
            // Les champs système sont déjà gérés dans exportHeaders
            const rowData = exportHeaders.map(header => doc[header.field] || '');
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
          // Utiliser le template pour obtenir les valeurs dans l'ordre
          // Les champs système sont déjà gérés dans exportHeaders
          const rowData = exportHeaders.map(header => doc[header.field] || '');

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
        } else if (headerName === 'DESCRIPTION' || headerName === 'DESCRIPTION DU DOC' || headerName === 'DESCRIPTION DU DOCUMENT') {
          // DESCRIPTION DU DOCUMENT : largeur moyenne
          let maxLength = headerName.length;
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 20), 45);
        } else if (headerName === 'NOM FICHIER' || headerName === 'NOM DU FICHIER') {
          // NOM FICHIER : largeur large
          let maxLength = headerName.length;
          column.eachCell({ includeEmpty: false }, (cell) => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            if (cellLength > maxLength) {
              maxLength = cellLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 25), 60);
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
      // Forcer la renumérotation des documents avant export selon le mode actif
      let documentsToExport;
      if (modeNumerotation === 'categorie') {
        documentsToExport = renumeroteDocuments(documents);
      } else {
        // Numérotation générale pour l'export
        const categoriesPresentes = [];
        documents.forEach(doc => {
          if (!categoriesPresentes.includes(doc.nature)) {
            categoriesPresentes.push(doc.nature);
          }
        });

        let numeroGlobal = 1;
        const renumbered = [];
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
        documentsToExport = renumbered;
      }

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
        try {
          const logoClientData = await imageToBase64(exportLogoClient);
          if (logoClientData && logoClientData.startsWith('data:image')) {
            const img = new Image();
            img.src = logoClientData;
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  const maxWidth = 40;
                  const maxHeight = 25;
                  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                  const width = img.width * ratio;
                  const height = img.height * ratio;
                  const format = exportLogoClient.type.includes('jpeg') || exportLogoClient.type.includes('jpg') ? 'JPEG' : 'PNG';
                  doc.addImage(logoClientData, format, 10, 5, width, height);
                  resolve();
                } catch (error) {
                  console.error('Erreur lors de l\'ajout du logo client:', error);
                  resolve(); // Continue même en cas d'erreur
                }
              };
              img.onerror = () => {
                console.error('Erreur lors du chargement du logo client');
                resolve(); // Continue même en cas d'erreur
              };
            });
          }
        } catch (error) {
          console.error('Erreur lors de la conversion du logo client:', error);
          // Continue l'export même si le logo échoue
        }
      }

      if (exportLogoBE) {
        try {
          const logoBEData = await imageToBase64(exportLogoBE);
          if (logoBEData && logoBEData.startsWith('data:image')) {
            const img = new Image();
            img.src = logoBEData;
            await new Promise((resolve, reject) => {
              img.onload = () => {
                try {
                  const maxWidth = 40;
                  const maxHeight = 25;
                  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                  const width = img.width * ratio;
                  const height = img.height * ratio;
                  const format = exportLogoBE.type.includes('jpeg') || exportLogoBE.type.includes('jpg') ? 'JPEG' : 'PNG';
                  doc.addImage(logoBEData, format, pageWidth - 10 - width, 5, width, height);
                  resolve();
                } catch (error) {
                  console.error('Erreur lors de l\'ajout du logo BE:', error);
                  resolve(); // Continue même en cas d'erreur
                }
              };
              img.onerror = () => {
                console.error('Erreur lors du chargement du logo BE');
                resolve(); // Continue même en cas d'erreur
              };
            });
          }
        } catch (error) {
          console.error('Erreur lors de la conversion du logo BE:', error);
          // Continue l'export même si le logo échoue
        }
      }

      // Titre principal (nom du projet)
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 78, 121); // Bleu foncé
      doc.text(exportNomProjet, pageWidth / 2, 20, { align: 'center' });

      // Sous-titre (nom de la liste avec date et indice)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(100, 149, 237); // Bleu clair
      doc.rect(10, 32, pageWidth - 20, 8, 'F');

      // Nom de la liste au centre
      doc.text(exportNomListe, pageWidth / 2, 37, { align: 'center' });

      // Date à gauche (si renseignée)
      if (exportDateListe) {
        doc.setFontSize(10);
        const dateFormatted = new Date(exportDateListe).toLocaleDateString('fr-FR');
        doc.text(dateFormatted, 15, 37, { align: 'left' });
      }

      // Indice à droite (si renseigné)
      if (exportIndiceListe) {
        doc.setFontSize(10);
        doc.text(`Indice : ${exportIndiceListe}`, pageWidth - 15, 37, { align: 'right' });
      }

      // Restaurer la taille de police
      doc.setFontSize(12);

      // Utiliser le template pour obtenir les en-têtes
      const exportHeaders = getExportHeaders(currentTemplate);

      // Construire les en-têtes de colonnes dynamiquement
      // Les champs système (DESCRIPTION, NOM_FICHIER) sont déjà inclus dans exportHeaders
      const headers = exportHeaders.map(h => h.label);

      // Définir les styles de colonnes
      const columnStyles = {};
      let colIndex = 0;

      // Appliquer des largeurs de colonnes dynamiques basées sur les champs du template
      exportHeaders.forEach((header) => {
        const defaultWidths = {
          'affaire': 25,
          'phase': 17,
          'lot': 13.5,
          'emetteur': 25,
          'nature': 20,
          'numero': 15,
          'etat': 15,
          'zone': 15,
          'niveaucoupe': 15,
          'format': 15,
          'indice': 13,
          'nom': 'auto',          // Champ système (DESCRIPTION)
          'nomComplet': 'auto'    // Champ système (NOM_FICHIER)
        };
        const width = defaultWidths[header.field] || 15;
        columnStyles[colIndex] = { cellWidth: width, halign: 'center' };
        colIndex++;
      });

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
            // Utiliser le template pour obtenir les valeurs dans l'ordre
            // Les champs système sont déjà gérés dans exportHeaders
            const rowData = exportHeaders.map(header => doc[header.field] || '');

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
          // Utiliser le template pour obtenir les valeurs dans l'ordre
          // Les champs système sont déjà gérés dans exportHeaders
          const rowData = exportHeaders.map(header => doc[header.field] || '');

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
          fontSize: 6,
          cellPadding: 1.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          textColor: [0, 0, 0]
        },
        headStyles: {
          fillColor: [100, 149, 237],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 7
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
              data.cell.styles.fontSize = 7;
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

  // Handlers pour le drag and drop des catégories avec dnd-kit
  const handleCategoryDragStart = (event) => {
    const categoryCode = event.active.id.replace('category-', '');
    setActiveCategoryId(categoryCode);
  };

  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    setActiveCategoryId(null);

    if (!over || active.id === over.id) return;

    const draggedCategory = active.id.replace('category-', '');
    const targetCategory = over.id.replace('category-', '');

    // Obtenir les catégories uniques dans l'ordre d'apparition actuel
    const categoriesPresentes = [];
    documents.forEach(doc => {
      if (!categoriesPresentes.includes(doc.nature)) {
        categoriesPresentes.push(doc.nature);
      }
    });

    const oldIndex = categoriesPresentes.indexOf(draggedCategory);
    const newIndex = categoriesPresentes.indexOf(targetCategory);

    if (oldIndex === -1 || newIndex === -1) return;

    // Réorganiser l'ordre des catégories
    const reorderedCategories = arrayMove(categoriesPresentes, oldIndex, newIndex);

    // Réorganiser les documents selon le nouvel ordre des catégories
    const newDocuments = [];
    reorderedCategories.forEach(natureCode => {
      const docsOfType = documents.filter(d => d.nature === natureCode);
      newDocuments.push(...docsOfType);
    });

    // Renuméroter avec le nouvel ordre
    setDocuments(renumeroteDocuments(newDocuments));
    showNotification('Ordre des catégories modifié et documents renumérotés', 'success');
  };

  const forcerRenumerationParCategorie = () => {
    setModeNumerotation('categorie');
    if (documents.length > 0) {
      setDocuments(renumeroteDocuments(documents));
      showNotification('Mode numérotation par catégorie activé', 'success');
    } else {
      showNotification('Mode numérotation par catégorie activé', 'success');
    }
  };

  const forcerRenumerationGenerale = () => {
    setModeNumerotation('generale');
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
      showNotification('Mode numérotation générale activé', 'success');
    } else {
      showNotification('Mode numérotation générale activé', 'success');
    }
  };

  const genererArborescence = () => {
    const sectionLayout = getSectionLayout(documents);
    const docsByNature = documents.reduce((acc, doc) => {
      if (!doc?.nature) return acc;
      if (!acc[doc.nature]) acc[doc.nature] = [];
      acc[doc.nature].push(doc);
      return acc;
    }, {});

    const lines = [];

    ARBO_ROOTS_ORDER.forEach((root) => {
      const sectionsForRoot = sectionLayout.filter(section => section.root === root);
      if (sectionsForRoot.length === 0) {
        return;
      }

      if (lines.length > 0) {
        lines.push('');
      }
      lines.push(root);

      sectionsForRoot.forEach((section) => {
        lines.push(`|-- ${section.sectionCode} - ${section.label}`);

        const docsForSection = docsByNature[section.nature];
        if (!docsForSection || docsForSection.length === 0) {
          return;
        }

        const sortedDocs = [...docsForSection].sort((a, b) => {
          const numeroA = (a.numero || '').toString();
          const numeroB = (b.numero || '').toString();
          return numeroA.localeCompare(numeroB, 'fr', { numeric: true, sensitivity: 'base' });
        });

        sortedDocs.forEach((doc, index) => {
          const docIndex = `${section.sectionCode}.${String(index + 1).padStart(2, '0')}`;
          const parts = [docIndex];
          const numero = (doc.numero || '').toString().trim();
          if (numero) {
            parts.push(numero);
          }
          const docLabel = (doc.nom && doc.nom.trim() !== '') ? doc.nom : (doc.nomComplet || 'SANS NOM');
          parts.push(docLabel);
          lines.push(`|   |-- ${parts.join(' - ')}`);
        });
      });
    });

    const arbo = lines.join('\n') || 'Aucune donnée disponible';

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
     const sectionLayout = getSectionLayout(documents);

      const rootHandles = new Map();
      for (const root of ARBO_ROOTS_ORDER) {
        const hasSection = sectionLayout.some(section => section.root === root);
        if (!hasSection) continue;
        const rootHandle = await directoryHandle.getDirectoryHandle(root, { create: true });
        rootHandles.set(root, rootHandle);
      }

      const sectionHandles = new Map();
      for (const section of sectionLayout) {
        const rootHandle = rootHandles.get(section.root);
        if (!rootHandle) continue;
        const sectionDirName = `${section.sectionCode} - ${section.label}`;
        const sectionHandle = await rootHandle.getDirectoryHandle(sectionDirName, { create: true });
        sectionHandles.set(section.nature, sectionHandle);
      }

      const docsByNature = documents.reduce((acc, doc) => {
        if (!doc?.nature) return acc;
        if (!acc[doc.nature]) acc[doc.nature] = [];
        acc[doc.nature].push(doc);
        return acc;
      }, {});

      for (const section of sectionLayout) {
        const sectionHandle = sectionHandles.get(section.nature);
        if (!sectionHandle) continue;

        const docsForSection = docsByNature[section.nature];
        if (!docsForSection || docsForSection.length === 0) {
          continue;
        }

        const sortedDocs = [...docsForSection].sort((a, b) => {
          const numeroA = (a.numero || '').toString();
          const numeroB = (b.numero || '').toString();
          return numeroA.localeCompare(numeroB, 'fr', { numeric: true, sensitivity: 'base' });
        });

        for (let index = 0; index < sortedDocs.length; index++) {
          const doc = sortedDocs[index];
          const docIndex = `${section.sectionCode}.${String(index + 1).padStart(2, '0')}`;
          const numero = sanitizeForFilesystem((doc.numero || '').toString());
          const rawName = (doc.nom && doc.nom.trim() !== '') ? doc.nom : (doc.nomComplet || 'SANS NOM');
          const sanitizedName = sanitizeForFilesystem(rawName) || 'SANS NOM';
          const folderParts = [docIndex];
          if (numero) {
            folderParts.push(numero);
          }
          folderParts.push(sanitizedName);
          const folderName = folderParts.join(' - ');

          const docDir = await sectionHandle.getDirectoryHandle(folderName, { create: true });

          const safeNameBase = (doc.nomComplet && doc.nomComplet.trim() !== '') ? doc.nomComplet : folderName;
          const safeFileName = `${sanitizeForFilesystem(safeNameBase) || 'document'}.txt`;
          const displayName = safeNameBase;

          try {
            await docDir.getFileHandle(safeFileName, { create: false });
            showNotification(`Fichier déjà présent pour ${displayName} (aucune écriture)`, 'warning');
          } catch (fileError) {
            if (fileError.name === 'NotFoundError') {
              try {
                const fileHandle = await docDir.getFileHandle(safeFileName, { create: true });
                const writable = await fileHandle.createWritable();
                const contentLines = [
                  `DOSSIER : ${folderName}`,
                  `NOM COMPLET : ${doc.nomComplet || 'Non renseigné'}`,
                  `NATURE : ${doc.nature || 'Non renseigné'}`,
                  `INDICE : ${doc.indice || 'Non renseigné'}`,
                  `FORMAT : ${doc.format || 'Non renseigné'}`,
                  `PHASE : ${doc.phase || 'Non renseignée'}`,
                  `AFFAIRE : ${doc.affaire || 'Non renseignée'}`
                ];
                await writable.write(contentLines.join('\n'));
                await writable.close();
              } catch (writeError) {
                showNotification(`Impossible d'écrire le fichier pour ${displayName} : ${writeError.message}`, 'error');
              }
            } else {
              showNotification(`Impossible de vérifier le fichier pour ${displayName} : ${fileError.message}`, 'error');
            }
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
    // Réinitialiser l'erreur pour ce champ
    if (fieldErrors.affaire) {
      setFieldErrors(prev => ({ ...prev, affaire: false }));
    }

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

  // Exporter le listing complet (documents + données annexes)
  const exporterListingComplet = () => {
    try {
      const listingData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        documents: documents,
        affaire: affaire,
        categoriesOrder: categoriesOrder,
        affairesList: affairesList,
        fieldsHistory: fieldsHistory,
        settings: {
          modeNumerotation: modeNumerotation
        }
      };

      const dataStr = JSON.stringify(listingData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listing_${affaire || 'export'}_${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      showNotification('Listing exporté avec succès !', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'export du listing:', error);
      showNotification('Erreur lors de l\'export du listing', 'error');
    }
  };

  // Importer un listing complet
  const importerListingComplet = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const listingData = JSON.parse(text);

        // Vérifier la version et la structure
        if (!listingData.documents || !Array.isArray(listingData.documents)) {
          throw new Error('Format de listing invalide');
        }

        // Demander à l'utilisateur : fusion ou remplacement
        const action = confirm(
          `Voulez-vous FUSIONNER ce listing avec vos documents actuels ?\n\n` +
          `- OUI : Ajouter les ${listingData.documents.length} documents à la liste actuelle (${documents.length} documents)\n` +
          `- NON : Remplacer complètement la liste actuelle\n\n` +
          `Affaire importée : ${listingData.affaire || 'Non spécifiée'}`
        );

        if (action) {
          // FUSION : Ajouter les documents importés aux documents existants
          const fusionDocs = [...documents, ...listingData.documents];
          setDocuments(fusionDocs);

          // Fusionner les affaires
          if (listingData.affairesList && Array.isArray(listingData.affairesList)) {
            const fusionAffaires = [...new Set([...affairesList, ...listingData.affairesList])];
            fusionAffaires.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
            setAffairesList(fusionAffaires);
            setFilteredAffaires(fusionAffaires);
            localStorage.setItem('affairesCSV', fusionAffaires.join('\n'));
          }

          // Fusionner l'historique des champs
          if (listingData.fieldsHistory) {
            const fusionHistory = { ...fieldsHistory };
            Object.keys(listingData.fieldsHistory).forEach(affaireName => {
              if (!fusionHistory[affaireName]) {
                fusionHistory[affaireName] = {};
              }
              Object.keys(listingData.fieldsHistory[affaireName]).forEach(fieldName => {
                if (!fusionHistory[affaireName][fieldName]) {
                  fusionHistory[affaireName][fieldName] = [];
                }
                // Fusionner les valeurs sans doublons
                const existingValues = fusionHistory[affaireName][fieldName];
                const newValues = listingData.fieldsHistory[affaireName][fieldName];
                fusionHistory[affaireName][fieldName] = [...new Set([...existingValues, ...newValues])];
              });
            });
            sauvegarderFieldsHistory(fusionHistory);
          }

          showNotification(`${listingData.documents.length} documents ajoutés avec succès ! (Total : ${fusionDocs.length})`, 'success');
        } else {
          // REMPLACEMENT : Remplacer complètement
          setDocuments(listingData.documents);

          if (listingData.affaire) {
            setAffaire(listingData.affaire);
          }

          if (listingData.categoriesOrder && Array.isArray(listingData.categoriesOrder)) {
            setCategoriesOrder(listingData.categoriesOrder);
          }

          if (listingData.affairesList && Array.isArray(listingData.affairesList)) {
            const affaires = listingData.affairesList;
            affaires.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
            setAffairesList(affaires);
            setFilteredAffaires(affaires);
            localStorage.setItem('affairesCSV', affaires.join('\n'));
          }

          if (listingData.settings) {
            if (listingData.settings.modeNumerotation !== undefined) {
              setModeNumerotation(listingData.settings.modeNumerotation);
            } else if (listingData.settings.useRanges !== undefined) {
              // Rétro-compatibilité avec l'ancien système useRanges
              setModeNumerotation('categorie');
            }
          }

          // Charger l'historique des champs
          if (listingData.fieldsHistory) {
            sauvegarderFieldsHistory(listingData.fieldsHistory);
          }

          showNotification(`Listing importé avec succès ! (${listingData.documents.length} documents)`, 'success');
        }
      } catch (error) {
        console.error('Erreur lors de l\'import du listing:', error);
        showNotification('Erreur lors de l\'import : fichier invalide', 'error');
      }
    };
    input.click();
  };

  // Charger l'historique des champs depuis localStorage
  const chargerFieldsHistory = () => {
    try {
      const saved = localStorage.getItem('listx-fields-history');
      if (saved) {
        setFieldsHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  // Sauvegarder l'historique des champs dans localStorage
  const sauvegarderFieldsHistory = (history) => {
    try {
      localStorage.setItem('listx-fields-history', JSON.stringify(history));
      setFieldsHistory(history);
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    }
  };

  // Ajouter une valeur à l'historique d'un champ pour une affaire donnée
  const ajouterValeurHistorique = (affaireName, fieldName, value) => {
    if (!affaireName || !fieldName || !value || value.trim() === '') return;

    const history = { ...fieldsHistory };

    // Créer la structure si elle n'existe pas
    if (!history[affaireName]) {
      history[affaireName] = {};
    }
    if (!history[affaireName][fieldName]) {
      history[affaireName][fieldName] = [];
    }

    // Ajouter la valeur si elle n'existe pas déjà
    const upperValue = value.toUpperCase();
    if (!history[affaireName][fieldName].includes(upperValue)) {
      history[affaireName][fieldName].push(upperValue);
      // Limiter à 20 valeurs max par champ
      if (history[affaireName][fieldName].length > 20) {
        history[affaireName][fieldName].shift();
      }
      sauvegarderFieldsHistory(history);
    }
  };

  // Obtenir les suggestions pour un champ et une affaire
  const getSuggestionsForField = (affaireName, fieldName) => {
    if (!affaireName || !fieldName || !fieldsHistory[affaireName]) {
      return [];
    }
    return fieldsHistory[affaireName][fieldName] || [];
  };

  useEffect(() => {
    if (!templateHasEtatField && etat) {
      setEtat('');
    }
  }, [templateHasEtatField, etat]);

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
        if (data.settings.modeNumerotation !== undefined) {
          setModeNumerotation(data.settings.modeNumerotation);
        } else if (data.settings.useRanges !== undefined) {
          // Rétro-compatibilité avec l'ancien système useRanges
          setModeNumerotation('categorie');
        }
        if (data.settings.categoriesOrder) {
          setCategoriesOrder(data.settings.categoriesOrder);
        }
      }

      // Charger l'historique des champs
      chargerFieldsHistory();
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

  // useEffect pour initialiser les champs personnalisés quand le template change
  useEffect(() => {
    if (currentTemplate && currentTemplate.customFields) {
      const initialCustomValues = {};
      currentTemplate.customFields.forEach(field => {
        if (!customFieldsValues[field.id]) {
          initialCustomValues[field.id] = '';
        }
      });
      if (Object.keys(initialCustomValues).length > 0) {
        setCustomFieldsValues(prev => ({ ...prev, ...initialCustomValues }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTemplate]);

  // useEffect pour mettre à jour les noms de documents quand le template change
  useEffect(() => {
    if (currentTemplate && documents.length > 0) {
      const updatedDocs = documents.map(doc => ({
        ...doc,
        nomComplet: genererNomComplet(doc, doc.numero)
      }));
      // Vérifier si les noms ont vraiment changé avant de mettre à jour
      const hasChanged = updatedDocs.some((doc, index) => doc.nomComplet !== documents[index].nomComplet);
      if (hasChanged) {
        setDocuments(updatedDocs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTemplate]);

  // useEffect pour sauvegarder automatiquement les documents
  useEffect(() => {
    if (affaire && documents.length > 0) {
      const data = JSON.parse(localStorage.getItem('affairesData') || '{}');

      if (!data.affaires) data.affaires = {};
      data.affaires[affaire] = documents;
      data.lastAffaire = affaire;
      data.settings = { modeNumerotation, categoriesOrder };

      localStorage.setItem('affairesData', JSON.stringify(data));
      localStorage.setItem('lastAffaire', affaire);

      // Ajouter l'affaire au CSV si elle n'existe pas
      ajouterAffaireCSV(affaire);
    }
  }, [documents]);

  // useEffect pour sauvegarder les paramètres
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('affairesData') || '{}');
    data.settings = { modeNumerotation, categoriesOrder };
    localStorage.setItem('affairesData', JSON.stringify(data));
  }, [modeNumerotation, categoriesOrder]);

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

              {/* Date et Indice */}
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={exportDateListe}
                    onChange={(e) => setExportDateListe(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Indice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indice
                  </label>
                  <input
                    type="text"
                    value={exportIndiceListe}
                    onChange={(e) => setExportIndiceListe(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Ex: A"
                    maxLength="3"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Ajouter un document</h2>
              {currentTemplate && (
                <p className="text-xs text-gray-500 mt-1">
                  Template actif : <span className="font-medium text-blue-600">{currentTemplate.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => setShowFieldSettings(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Paramètres des champs"
            >
              <Settings size={18} />
              <span>Paramètres</span>
            </button>
          </div>

          <div className="space-y-3">
            {/* Formulaire dynamique basé sur le template - utilise la fusion des zones 2 et 3 */}
            {currentTemplate && (
              <>
                <div className="flex gap-2 items-end flex-wrap">
                  {formFieldsOrder.filter(f => {
                    // Exclure NOM et les champs système (DESCRIPTION, NOM_FICHIER)
                    if (f === 'NOM' || f === 'DESCRIPTION' || f === 'NOM_FICHIER') return false;

                    // Tous les champs retournés par mergeFormFieldsOrder doivent être affichés
                    // (cette fonction retourne déjà la fusion des zones 2 et 3, sans les champs système)
                    return true;
                  }).map((fieldName) => {
                    const fieldNameLower = fieldName.toLowerCase();

                    // Chercher le label dans fieldsLabels, sinon dans customFields
                    let label = currentTemplate.fieldsLabels[fieldName];
                    if (!label && currentTemplate.customFields) {
                      const customField = currentTemplate.customFields.find(cf => cf.id === fieldName);
                      if (customField) {
                        label = customField.label;
                      }
                    }
                    label = label || fieldName;

                    // Utiliser le setter existant ou créer un setter générique pour les champs custom
                    const setter = fieldSetters[fieldNameLower] || createCustomFieldSetter(fieldName);

                    return (
                      <DynamicFormField
                        key={fieldName}
                        fieldName={fieldName}
                        label={label}
                        value={fieldValues[fieldNameLower] || ''}
                        onChange={setter}
                        onKeyPress={(e) => e.key === 'Enter' && ajouterDocument()}
                        error={fieldErrors[fieldNameLower]}
                        // Props spécifiques pour Affaire
                        affairesList={affairesList}
                        filteredAffaires={filteredAffaires}
                        showAutocomplete={showAutocomplete}
                        onAffaireFocus={() => {
                          if (affaire.length > 0) {
                            setShowAutocomplete(true);
                          }
                        }}
                        onAffaireBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                        onAffaireSelect={chargerAffaire}
                        affaireExiste={affaireExiste()}
                        onAddAffaire={ajouterNouvelleAffaire}
                        // Props pour l'historique des champs
                        fieldHistory={getSuggestionsForField(affaire, fieldName)}
                        currentAffaire={affaire}
                      />
                    );
                  })}
                </div>

                {/* Description du document (toujours affiché) */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description du document *</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => {
                      setNom(e.target.value.toUpperCase());
                      if (fieldErrors.nom) setFieldErrors(prev => ({ ...prev, nom: false }));
                    }}
                    className={`w-full px-2 py-1.5 border rounded text-sm ${fieldErrors.nom ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="ex: BILAN DE PUISSANCE"
                    onKeyPress={(e) => e.key === 'Enter' && ajouterDocument()}
                  />
                </div>
              </>
            )}
          </div>

          {/* Aperçu du nom de fichier selon le template */}
          {(affaire || phase || nom) && currentTemplate && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-1">Aperçu du nom de fichier :</p>
              <p className="text-sm font-mono text-blue-900 break-all">
                {(() => {
                  const previewDoc = {
                    affaire: affaire || '',
                    phase: phase || '',
                    lot: lot || '',
                    emetteur: emetteur || '',
                    nature: nature || '',
                    etat: etat || '',
                    numero: '00',
                    zone: zone || '',
                    niveaucoupe: niveauCoupe || '',
                    format: format || '',
                    indice: indice || '',
                    nom: nom || '',
                    // Ajouter les champs personnalisés
                    ...Object.keys(customFieldsValues).reduce((acc, key) => {
                      acc[key.toLowerCase()] = customFieldsValues[key];
                      return acc;
                    }, {})
                  };
                  return generateFilename(previewDoc, currentTemplate) || '(incomplet)';
                })()}
              </p>
            </div>
          )}

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

              return (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleCategoryDragStart}
                  onDragEnd={handleCategoryDragEnd}
                >
                  <SortableContext
                    items={categoriesPresentes.map(code => `category-${code}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categoriesPresentes.map(natureCode => {
                      const categoryColor = getCategoryColor(natureCode, categoriesPresentes);
                      const categoryDocs = documentsGroupes[natureCode];

                      return (
                        <div key={natureCode} className="mb-6">
                          <SortableCategory
                            natureCode={natureCode}
                            label={natures.find(n => n.code === natureCode)?.label}
                            categoryColor={categoryColor}
                            isDragging={activeCategoryId === natureCode}
                          />

                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis]}
                            onDragStart={handleDocumentDragStart}
                            onDragEnd={handleDocumentDragEnd}
                          >
                            <SortableContext
                              items={categoryDocs.map(doc => doc.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-1">
                                {categoryDocs.map(doc => (
                                  <SortableDocument
                                    key={doc.id}
                                    doc={doc}
                                    categoryColor={categoryColor}
                                    templateHasEtatField={templateHasEtatField}
                                    onEdit={modifierDocument}
                                    onDelete={supprimerDocument}
                                  />
                                ))}
                              </div>
                            </SortableContext>
                            <DragOverlay>
                              {activeDocId ? (
                                <div className="flex items-center gap-3 p-3 border rounded-md bg-white shadow-2xl opacity-90">
                                  <GripVertical size={20} className="text-gray-400 flex-shrink-0" />
                                  <span className={`${categoryColor.tailwindBg} ${categoryColor.tailwindText} px-2 py-1 rounded text-xs font-medium flex-shrink-0`}>
                                    {documents.find(d => d.id === activeDocId)?.nature}
                                  </span>
                                  <span className="font-mono text-gray-600 flex-shrink-0 font-semibold">
                                    {documents.find(d => d.id === activeDocId)?.numero}
                                  </span>
                                  <span className="flex-grow">
                                    {documents.find(d => d.id === activeDocId)?.nom}
                                  </span>
                                </div>
                              ) : null}
                            </DragOverlay>
                          </DndContext>
                        </div>
                      );
                    })}
                  </SortableContext>
                  <DragOverlay>
                    {activeCategoryId ? (
                      <div className="font-semibold text-lg mb-2 px-3 py-2 rounded bg-blue-100 text-blue-800 opacity-90 shadow-2xl flex items-center gap-2">
                        <GripVertical size={20} className="text-gray-400" />
                        {activeCategoryId} - {natures.find(n => n.code === activeCategoryId)?.label}
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              );
            })()}
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
                    className={`group relative ${modeNumerotation === 'categorie' ? 'bg-gradient-to-br from-blue-700 to-blue-800 ring-4 ring-blue-300' : 'bg-gradient-to-br from-blue-600 to-blue-700'} text-white flex-1 aspect-square rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden`}
                    title="Numérotation par catégorie"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    {modeNumerotation === 'categorie' && <CheckCircle size={16} className="absolute top-1 right-1 text-green-300 z-20" />}
                    <img src={numCatIcon} alt="" className="w-10 h-10 brightness-0 invert drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Catégorie</span>
                  </button>
                  <button
                    onClick={forcerRenumerationGenerale}
                    className={`group relative ${modeNumerotation === 'generale' ? 'bg-gradient-to-br from-purple-700 to-purple-800 ring-4 ring-purple-300' : 'bg-gradient-to-br from-purple-600 to-purple-700'} text-white flex-1 aspect-square rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden`}
                    title="Numérotation générale"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    {modeNumerotation === 'generale' && <CheckCircle size={16} className="absolute top-1 right-1 text-green-300 z-20" />}
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

              {/* Encart Listing (Import/Export complet) */}
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-lg shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <ListOrdered size={24} className="text-purple-700" />
                  <span className="font-semibold text-sm text-purple-700">Listing</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exporterListingComplet}
                    className="group relative bg-gradient-to-br from-purple-600 to-purple-700 text-white flex-1 rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden p-2"
                    title="Exporter le listing complet"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <Download size={20} className="drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Export</span>
                  </button>
                  <button
                    onClick={importerListingComplet}
                    className="group relative bg-gradient-to-br from-purple-600 to-purple-700 text-white flex-1 rounded-lg hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col items-center justify-center gap-1 overflow-hidden p-2"
                    title="Importer un listing"
                  >
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black/30 to-transparent"></div>
                    <Upload size={20} className="drop-shadow-lg relative z-10" />
                    <span className="font-medium text-xs relative z-10">Import</span>
                  </button>
                </div>
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

      {/* Modale des paramètres de champs */}
      {showFieldSettings && (
        <FieldSettingsModal onClose={() => setShowFieldSettings(false)} />
      )}
    </div>
  );
}
