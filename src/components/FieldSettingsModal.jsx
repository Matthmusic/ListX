import { useState, useContext, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  pointerWithin,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TemplateContext, DEFAULT_FIELDS } from "../context/TemplateContext";
import { X, GripVertical, Save, Trash2, Download, Upload, Plus, Edit2, ArrowDown, ArrowUp, ChevronUp, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { mergeFormFieldsOrder } from "../utils/filename";

// CHAMPS SYSTÈME NON-SUPPRIMABLES EN ZONE 2
const SYSTEM_FIELDS = [
  { id: 'DESCRIPTION', label: 'DESCRIPTION DU DOCUMENT', type: 'system' },
  { id: 'NOM_FICHIER', label: 'NOM FICHIER', type: 'system' }
];

// CHAMPS SYSTÈME QUI NE PEUVENT JAMAIS ÊTRE DANS LE NOM DE FICHIER (ZONE 3)
const SYSTEM_FIELDS_EXCLUDED_FROM_FILENAME = ['NOM_FICHIER'];

// CHAMPS OBLIGATOIRES DU FORMULAIRE (toujours présents dans le formulaire, mais peuvent être absents des exports/filename)
const MANDATORY_FORM_FIELDS = ['NATURE'];

// COMPOSANT POUR LA ZONE 1 (DISPONIBLES) - HORIZONTAL
const AvailableZoneContainer = ({ children }) => {
  const { setNodeRef } = useDroppable({
    id: 'zone-available',
  });

  return (
    <div ref={setNodeRef} className="bg-white/5 rounded-xl p-2.5 border border-white/15 min-h-[80px]">
      {children}
    </div>
  );
};

// COMPOSANT POUR LA ZONE 2 (FORMULAIRE/EXPORTS) - LISTE VERTICALE
const DisplayZoneContainer = ({ children }) => {
  const { setNodeRef } = useDroppable({
    id: 'zone-display',
  });

  return (
    <div ref={setNodeRef} className="bg-indigo-500/10 rounded-xl p-2.5 border border-indigo-400/30 min-h-[80px]">
      {children}
    </div>
  );
};

// COMPOSANT POUR LA ZONE 3 (NOM DE FICHIER) - LISTE VERTICALE
const FilenameZoneContainer = ({ children }) => {
  const { setNodeRef } = useDroppable({
    id: 'zone-filename',
  });

  return (
    <div ref={setNodeRef} className="bg-emerald-500/10 rounded-xl p-2.5 border border-emerald-400/30 min-h-[80px]">
      {children}
    </div>
  );
};

// COMPOSANT POUR UN CHAMP DANS LA ZONE DISPONIBLE
const AvailableFieldItem = ({ field, isCustom, onEdit, onRemove, onAddToZones }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  // UTILISER realId POUR L'AFFICHAGE ET LES CALLBACKS
  const realId = field.realId || field.id;
  const displayLabel = field.displayLabel || field.label || realId;
  const realFieldForCallback = field.realId ? { ...field, id: realId } : field;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`group inline-flex items-center gap-2 p-2 pl-4 m-1 bg-white rounded-lg border-2 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? "border-blue-500 shadow-lg" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${
        isCustom ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-white'
      }`}>
        {displayLabel}
      </span>

      <div className="flex gap-1 overflow-hidden max-w-0 group-hover:max-w-[200px] transition-all duration-200 ease-in-out">
        {/* BOUTON + POUR AJOUTER AUX ZONES */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAddToZones(realId);
          }}
          className="p-1 text-green-600 hover:bg-green-50 rounded flex-shrink-0"
          title="Ajouter aux zones 2 et 3"
        >
          <Plus className="w-3 h-3" />
        </button>

        {isCustom && (
          <>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(realFieldForCallback);
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0"
              title="Modifier le libellé"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(realId);
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
              title="Supprimer ce champ"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// COMPOSANT POUR UN CHAMP DANS LES ZONES ACTIVES (DISPLAY OU FILENAME)
// Liste verticale (une ligne par champ) plutôt qu'un nuage de pastilles qui
// wrap : la cible de drop ne bouge plus de ligne pendant le glisser. Les
// flèches monter/descendre permettent un ajustement d'une position sans
// avoir à viser un drag précis.
const ActiveFieldItem = ({ field, isCustom, isSystem, zoneColor = "blue", onRemove, onMoveUp, onMoveDown, isFirst, isLast, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const colorClasses = {
    blue: "border-indigo-500 shadow-lg",
    green: "border-emerald-500 shadow-lg"
  };

  const hoverClass = zoneColor === "blue" ? "hover:border-indigo-400" : "hover:border-emerald-400";

  const realId = field.realId || field.id;
  const displayLabel = field.displayLabel || field.label || realId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full flex items-center gap-2.5 p-2.5 bg-white rounded-lg border transition-colors ${
        isDragging ? colorClasses[zoneColor] : `border-gray-200 ${hoverClass}`
      }`}
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold flex-shrink-0">
        {index}
      </span>

      <span
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
        title="Glisser pour réorganiser"
      >
        <GripVertical className="w-4 h-4" />
      </span>

      <span
        className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap flex-1 ${
          isSystem ? "bg-orange-100 text-orange-800" :
          isCustom ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
        }`}
      >
        {displayLabel}
      </span>

      <div className="flex gap-0.5 flex-shrink-0">
        <button
          onClick={() => onMoveUp(realId)}
          disabled={isFirst}
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          title="Monter d'une position"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onMoveDown(realId)}
          disabled={isLast}
          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          title="Descendre d'une position"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {onRemove && !isSystem && (
          <button
            onClick={() => onRemove(realId)}
            className="p-1.5 hover:bg-red-50 rounded text-red-500 hover:text-red-600 transition-colors"
            title="Retirer de cette zone"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export const FieldSettingsModal = ({ onClose }) => {
  const { currentTemplate, allTemplates, addTemplate, applyTemplate, deleteTemplate, importTemplates, exportTemplates } =
    useContext(TemplateContext);

  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [templateToCustomize, setTemplateToCustomize] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "Nouveau template",
    fieldsOrderDisplay: [],
    fieldsOrderFilename: [],
    fieldsOrder: [], // COMPATIBILITÃ‰
    fieldsLabels: {},
    activeFields: [],
    customFields: []
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [activeZone, setActiveZone] = useState(null); // 'available', 'display', 'filename'

  // OUVRIR LA SOUS-MODAL DE PERSONNALISATION
  const handleOpenCustomize = (template) => {
    const templateCopy = JSON.parse(JSON.stringify(template));
    // INITIALISER LES NOUVEAUX CHAMPS SI ABSENTS
    if (!templateCopy.customFields) {
      templateCopy.customFields = [];
    }
    if (!templateCopy.fieldsOrderDisplay) {
      templateCopy.fieldsOrderDisplay = templateCopy.fieldsOrder || [];
    }
    if (!templateCopy.fieldsOrderFilename) {
      templateCopy.fieldsOrderFilename = templateCopy.fieldsOrder || [];
    }
    // S'ASSURER QUE LES CHAMPS SYSTÈME SONT EN ZONE 2
    const systemFieldIds = SYSTEM_FIELDS.map(sf => sf.id);
    systemFieldIds.forEach(sfId => {
      if (!templateCopy.fieldsOrderDisplay.includes(sfId)) {
        templateCopy.fieldsOrderDisplay.push(sfId);
      }
    });
    // FORCER LE NOM EN MAJUSCULES
    if (templateCopy.name) {
      templateCopy.name = templateCopy.name.toUpperCase();
    }
    setTemplateToCustomize(templateCopy);
    setNewTemplate(templateCopy);
    setShowCustomizeModal(true);
  };

  // CRÃ‰ER UN Nouveau template
  const handleCreateNewTemplate = () => {
    const emptyTemplate = {
      name: "Nouveau template",
      fieldsOrderDisplay: SYSTEM_FIELDS.map(sf => sf.id), // AJOUTER LES CHAMPS SYSTÈME PAR DÉFAUT
      fieldsOrderFilename: [],
      fieldsOrder: [],
      fieldsLabels: {},
      activeFields: [],
      customFields: []
    };
    setTemplateToCustomize(null);
    setNewTemplate(emptyTemplate);
    setShowCustomizeModal(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // OBTENIR TOUS LES CHAMPS (PAR DÃ‰FAUT + PERSONNALISÃ‰S)
  const getAllFields = () => {
    const defaultFields = DEFAULT_FIELDS.map(f => ({
      ...f,
      isCustom: false,
      isSystem: false
    }));
    const customFields = (newTemplate.customFields || []).map(f => ({
      ...f,
      isCustom: true,
      isSystem: false
    }));
    const descriptionSystemField = SYSTEM_FIELDS.find(field => field.id === 'DESCRIPTION');
    const systemFieldsForAvailability = descriptionSystemField
      ? [{
          ...descriptionSystemField,
          isCustom: false,
          isSystem: true
        }]
      : [];

    const combined = [...defaultFields, ...customFields, ...systemFieldsForAvailability];

    // Eviter les doublons si un champ est present dans plusieurs listes
    return combined.filter((field, index, self) =>
      self.findIndex(candidate => candidate.id === field.id) === index
    );
  };

  // OBTENIR LES CHAMPS DISPONIBLES (NON UTILISÃ‰S DANS DISPLAY OU FILENAME)
  const getAvailableFields = () => {
    const allFields = getAllFields();
    const displaySet = new Set(newTemplate.fieldsOrderDisplay || []);
    const filenameSet = new Set(newTemplate.fieldsOrderFilename || []);
    return allFields.filter((field) => !displaySet.has(field.id) || !filenameSet.has(field.id));
  };

  // OBTENIR LES CHAMPS DE LA ZONE DISPLAY ORDONNÃ‰S (AVEC CHAMPS SYSTÈME)
  const getDisplayFieldsOrdered = () => {
    const allFields = [...getAllFields(), ...SYSTEM_FIELDS];
    return (newTemplate.fieldsOrderDisplay || [])
      .map(fieldId => {
        const field = allFields.find(f => f.id === fieldId);
        if (field) {
          return {
            ...field,
            isSystem: SYSTEM_FIELDS.some(sf => sf.id === fieldId)
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // OBTENIR LES CHAMPS DE LA ZONE FILENAME ORDONNÃ‰S
  const getFilenameFieldsOrdered = () => {
    const allFields = getAllFields();
    return (newTemplate.fieldsOrderFilename || [])
      .map(fieldId => allFields.find(f => f.id === fieldId))
      .filter(Boolean);
  };

  // GÃ‰NÃ‰RER PRÃ‰VISUALISATION DU NOM DE FICHIER
  const getFilenamePreview = () => {
    const filenameFields = getFilenameFieldsOrdered();
    if (filenameFields.length === 0) return "AUCUN_CHAMP.pdf";

    const hasDescription = filenameFields.some(f => f.id === 'DESCRIPTION');
    const separator = ' - ';
    const baseParts = filenameFields
      .filter(f => f.id !== 'DESCRIPTION')
      .map(f => f.id)
      .join(separator);

    let preview = baseParts;

    if (hasDescription) {
      preview = preview ? `${preview}${separator}DESCRIPTION` : 'DESCRIPTION';
    }

    if (!preview) {
      preview = 'AUCUN_CHAMP';
    }

    return `${preview}.pdf`;
  };

  const getFieldDisplayLabel = (fieldId) => {
    if (!fieldId) return "";
    // VÉRIFIER SI C'EST UN CHAMP SYSTÈME
    const systemField = SYSTEM_FIELDS.find(sf => sf.id === fieldId);
    if (systemField) return systemField.label;

    if (newTemplate.fieldsLabels && newTemplate.fieldsLabels[fieldId]) {
      return newTemplate.fieldsLabels[fieldId];
    }
    const fieldInfo = getAllFields().find(f => f.id === fieldId);
    return (fieldInfo?.label || fieldId).toUpperCase();
  };

  // GESTION DU DRAG START
  const handleDragStart = (event) => {
    const { active } = event;
    const draggedId = active.id;

    // EXTRAIRE LE VRAI ID (ENLEVER LE PRÃ‰FIXE DE ZONE)
    let realId = draggedId;
    let zone = 'available';

    if (draggedId.startsWith('display-')) {
      realId = draggedId.replace('display-', '');
      zone = 'display';
    } else if (draggedId.startsWith('filename-')) {
      realId = draggedId.replace('filename-', '');
      zone = 'filename';
    } else if (draggedId.startsWith('available-')) {
      realId = draggedId.replace('available-', '');
      zone = 'available';
    }

    setActiveId(realId);
    setActiveZone(zone);
  };

  // GESTION DU DRAG END
  const handleDragEnd = (event) => {
    const { active, over } = event;

    setActiveId(null);
    const previousZone = activeZone;
    setActiveZone(null);

    if (!over) return;

    const draggedId = active.id;
    const overId = over.id;

    // EXTRAIRE LE VRAI ID (SANS PRÃ‰FIXE)
    let activeId = draggedId;
    if (draggedId.startsWith('display-')) {
      activeId = draggedId.replace('display-', '');
    } else if (draggedId.startsWith('filename-')) {
      activeId = draggedId.replace('filename-', '');
    } else if (draggedId.startsWith('available-')) {
      activeId = draggedId.replace('available-', '');
    }

    // EXTRAIRE LE VRAI ID DU OVER (SANS PRÃ‰FIXE)
    let realOverId = overId;
    if (overId.startsWith('display-')) {
      realOverId = overId.replace('display-', '');
    } else if (overId.startsWith('filename-')) {
      realOverId = overId.replace('filename-', '');
    } else if (overId.startsWith('available-')) {
      realOverId = overId.replace('available-', '');
    }

    // EMPÊCHER LES CHAMPS SYSTÈME DE QUITTER LA ZONE 2
    // Sauf DESCRIPTION qui peut être copié vers Zone 3
    const isSystemField = SYSTEM_FIELDS.some(sf => sf.id === activeId);
    const isDescriptionToFilename = activeId === 'DESCRIPTION' && (overId === 'zone-filename' || overId.startsWith('filename-'));
    const isGoingToAvailable = overId === 'zone-available' || overId.startsWith('available-');

    // Bloquer les champs système qui tentent d'aller vers Zone Disponible OU vers une autre zone (sauf DESCRIPTION vers Zone 3)
    if (isSystemField && previousZone === 'display') {
      if (isGoingToAvailable) {
        // Empêcher tous les champs système d'aller en zone disponible
        return;
      }
      if (!isDescriptionToFilename && overId !== 'zone-display' && !overId.startsWith('display-')) {
        // Empêcher les autres champs système (sauf DESCRIPTION vers Zone 3) de bouger
        return;
      }
    }

    // CAS 1: DROP SUR ZONE DISPONIBLE (RETIRER DE LA ZONE D'ORIGINE SEULEMENT)
    if (overId === 'zone-available') {
      if (previousZone === 'display') {
        // RETIRER SEULEMENT DE LA ZONE DISPLAY (SAUF CHAMPS SYSTÈME)
        if (isSystemField) return; // Empêcher la suppression des champs système
        setNewTemplate(prev => {
          const newDisplayOrder = prev.fieldsOrderDisplay.filter(f => f !== activeId);
          const stillInFilename = prev.fieldsOrderFilename.includes(activeId);

          return {
            ...prev,
            fieldsOrderDisplay: newDisplayOrder,
            // SI LE CHAMP N'EST PLUS DANS AUCUNE ZONE, LE RETIRER DES ActifS
            activeFields: stillInFilename ? prev.activeFields : prev.activeFields.filter(f => f !== activeId)
          };
        });
      } else if (previousZone === 'filename') {
        // RETIRER SEULEMENT DE LA ZONE FILENAME
        setNewTemplate(prev => {
          const newFilenameOrder = prev.fieldsOrderFilename.filter(f => f !== activeId);
          const stillInDisplay = prev.fieldsOrderDisplay.includes(activeId);

          return {
            ...prev,
            fieldsOrderFilename: newFilenameOrder,
            // SI LE CHAMP N'EST PLUS DANS AUCUNE ZONE, LE RETIRER DES ActifS
            activeFields: stillInDisplay ? prev.activeFields : prev.activeFields.filter(f => f !== activeId)
          };
        });
      }
    }
    // CAS 2: DROP SUR ZONE DISPLAY (FORMULAIRE/EXPORTS)
    else if (overId === 'zone-display') {
      if (previousZone === 'available') {
        // AJOUTER Ã€ DISPLAY ET AUTOMATIQUEMENT Ã€ FILENAME AUSSI
        setNewTemplate(prev => {
          const field = getAllFields().find(f => f.id === activeId);
          const newLabels = { ...prev.fieldsLabels };
          if (field && !field.isCustom && !newLabels[activeId]) {
            newLabels[activeId] = field.label;
          }

          const currentDisplay = prev.fieldsOrderDisplay || [];
          const currentFilename = prev.fieldsOrderFilename || [];
          const inDisplay = currentDisplay.includes(activeId);
          const inFilename = currentFilename.includes(activeId);

          const nextState = {
            ...prev,
            activeFields: [...new Set([...(prev.activeFields || []), activeId])],
            fieldsLabels: newLabels
          };

          if (!inDisplay) {
            nextState.fieldsOrderDisplay = [...currentDisplay, activeId];
          }
          if (!inFilename) {
            nextState.fieldsOrderFilename = [...currentFilename, activeId];
          }

          return nextState;
        });
      }
      // EMPÃŠCHER LE DÃ‰PLACEMENT DIRECT DE FILENAME VERS DISPLAY
      // L'utilisateur doit passer par la zone disponible ou utiliser les boutons de copie
    }
    // CAS 3: DROP SUR ZONE FILENAME
    else if (overId === 'zone-filename') {
      if (previousZone === 'available') {
        // AJOUTER Ã€ FILENAME ET AUTOMATIQUEMENT Ã€ DISPLAY AUSSI
        setNewTemplate(prev => {
          const field = getAllFields().find(f => f.id === activeId);
          const newLabels = { ...prev.fieldsLabels };
          if (field && !field.isCustom && !newLabels[activeId]) {
            newLabels[activeId] = field.label;
          }

          const currentDisplay = prev.fieldsOrderDisplay || [];
          const currentFilename = prev.fieldsOrderFilename || [];
          const inDisplay = currentDisplay.includes(activeId);
          const inFilename = currentFilename.includes(activeId);

          const nextState = {
            ...prev,
            activeFields: [...new Set([...(prev.activeFields || []), activeId])],
            fieldsLabels: newLabels
          };

          if (!inDisplay) {
            nextState.fieldsOrderDisplay = [...currentDisplay, activeId];
          }
          if (!inFilename) {
            nextState.fieldsOrderFilename = [...currentFilename, activeId];
          }

          return nextState;
        });
      } else if (previousZone === 'display' && activeId === 'DESCRIPTION') {
        // CAS SPÉCIAL : DESCRIPTION peut être COPIÉ de Zone 2 vers Zone 3
        // (il reste dans Zone 2 mais est ajouté en Zone 3)
        setNewTemplate(prev => {
          const currentFilename = prev.fieldsOrderFilename || [];
          const inFilename = currentFilename.includes(activeId);

          if (!inFilename) {
            return {
              ...prev,
              fieldsOrderFilename: [...currentFilename, activeId]
            };
          }
          return prev;
        });
      }
      // EMPÃŠCHER LE DÃ‰PLACEMENT DIRECT DE DISPLAY VERS FILENAME pour les autres champs
      // L'utilisateur doit passer par la zone disponible ou utiliser les boutons de copie
    }
    // CAS 4: DROP SUR UN CHAMP (RÃ‰ORGANISATION INTERNE)
    else {
      // DÃ‰TERMINER LA ZONE DU OVER EN FONCTION DU PRÃ‰FIXE
      let overZone = null;
      if (overId.startsWith('display-')) {
        overZone = 'display';
      } else if (overId.startsWith('filename-')) {
        overZone = 'filename';
      }

      // DROP SUR UN CHAMP DE LA ZONE DISPLAY
      if (overZone === 'display' && (newTemplate.fieldsOrderDisplay || []).includes(realOverId)) {
        if (previousZone === 'display') {
          // REORGANISER DANS DISPLAY
          const oldIndex = newTemplate.fieldsOrderDisplay.indexOf(activeId);
          const newIndex = newTemplate.fieldsOrderDisplay.indexOf(realOverId);
          if (oldIndex !== newIndex) {
            const reordered = arrayMove(newTemplate.fieldsOrderDisplay, oldIndex, newIndex);
            setNewTemplate({ ...newTemplate, fieldsOrderDisplay: reordered });
          }
        } else if (previousZone === 'available') {
          // AJOUTER A DISPLAY A UNE POSITION SPECIFIQUE ET S'ASSURER QU'IL EXISTE DANS FILENAME
          const currentDisplay = newTemplate.fieldsOrderDisplay || [];
          const currentFilename = newTemplate.fieldsOrderFilename || [];
          const inDisplay = currentDisplay.includes(activeId);
          const inFilename = currentFilename.includes(activeId);

          const targetIndex = currentDisplay.indexOf(realOverId);
          let nextDisplayOrder = currentDisplay;
          if (!inDisplay) {
            if (targetIndex >= 0) {
              nextDisplayOrder = [...currentDisplay];
              nextDisplayOrder.splice(targetIndex, 0, activeId);
            } else {
              nextDisplayOrder = [...currentDisplay, activeId];
            }
          }

          let nextFilenameOrder = currentFilename;
          if (!inFilename) {
            nextFilenameOrder = [...currentFilename, activeId];
          }

          const field = getAllFields().find(f => f.id === activeId);
          const newLabels = { ...newTemplate.fieldsLabels };
          if (field && !field.isCustom && !newLabels[activeId]) {
            newLabels[activeId] = field.label;
          }

          setNewTemplate({
            ...newTemplate,
            fieldsOrderDisplay: nextDisplayOrder,
            fieldsOrderFilename: nextFilenameOrder,
            activeFields: [...new Set([...(newTemplate.activeFields || []), activeId])],
            fieldsLabels: newLabels
          });
        }
      }
      // DROP SUR UN CHAMP DE LA ZONE FILENAME
      else if (overZone === 'filename' && (newTemplate.fieldsOrderFilename || []).includes(realOverId)) {
        if (previousZone === 'filename') {
          // REORGANISER DANS FILENAME
          const oldIndex = newTemplate.fieldsOrderFilename.indexOf(activeId);
          const newIndex = newTemplate.fieldsOrderFilename.indexOf(realOverId);
          if (oldIndex !== newIndex) {
            const reordered = arrayMove(newTemplate.fieldsOrderFilename, oldIndex, newIndex);
            setNewTemplate({ ...newTemplate, fieldsOrderFilename: reordered });
          }
        } else if (previousZone === 'display' && activeId === 'DESCRIPTION') {
          // CAS SPÉCIAL : DESCRIPTION peut être COPIÉ de Zone 2 vers Zone 3 à une position spécifique
          // (il reste dans Zone 2 mais est ajouté en Zone 3)
          const currentFilename = newTemplate.fieldsOrderFilename || [];
          const inFilename = currentFilename.includes(activeId);

          if (!inFilename) {
            const targetIndex = currentFilename.indexOf(realOverId);
            const nextFilenameOrder = [...currentFilename];
            if (targetIndex >= 0) {
              nextFilenameOrder.splice(targetIndex, 0, activeId);
            } else {
              nextFilenameOrder.push(activeId);
            }
            setNewTemplate({
              ...newTemplate,
              fieldsOrderFilename: nextFilenameOrder
            });
          }
        } else if (previousZone === 'available') {
          // AJOUTER A FILENAME A UNE POSITION SPECIFIQUE ET S'ASSURER QU'IL EXISTE DANS DISPLAY
          const currentDisplay = newTemplate.fieldsOrderDisplay || [];
          const currentFilename = newTemplate.fieldsOrderFilename || [];
          const inDisplay = currentDisplay.includes(activeId);
          const inFilename = currentFilename.includes(activeId);

          const targetIndex = currentFilename.indexOf(realOverId);
          let nextFilenameOrder = currentFilename;
          if (!inFilename) {
            if (targetIndex >= 0) {
              nextFilenameOrder = [...currentFilename];
              nextFilenameOrder.splice(targetIndex, 0, activeId);
            } else {
              nextFilenameOrder = [...currentFilename, activeId];
            }
          }

          let nextDisplayOrder = currentDisplay;
          if (!inDisplay) {
            nextDisplayOrder = [...currentDisplay, activeId];
          }

          const field = getAllFields().find(f => f.id === activeId);
          const newLabels = { ...newTemplate.fieldsLabels };
          if (field && !field.isCustom && !newLabels[activeId]) {
            newLabels[activeId] = field.label;
          }

          setNewTemplate({
            ...newTemplate,
            fieldsOrderDisplay: nextDisplayOrder,
            fieldsOrderFilename: nextFilenameOrder,
            activeFields: [...new Set([...(newTemplate.activeFields || []), activeId])],
            fieldsLabels: newLabels
          });
        }
      }
    }
  };

  // COPIER ORDRE DISPLAY â†’ FILENAME
  const handleCopyDisplayToFilename = () => {
    setNewTemplate({
      ...newTemplate,
      fieldsOrderFilename: [...newTemplate.fieldsOrderDisplay]
    });
  };

  // COPIER ORDRE FILENAME â†’ DISPLAY
  const handleCopyFilenameToDisplay = () => {
    setNewTemplate({
      ...newTemplate,
      fieldsOrderDisplay: [...newTemplate.fieldsOrderFilename]
    });
  };

  // RETIRER UN CHAMP DE LA ZONE DISPLAY
  const handleRemoveFromDisplay = (fieldId) => {
    // EMPÊCHER LA SUPPRESSION DES CHAMPS SYSTÈME
    const isSystemField = SYSTEM_FIELDS.some(sf => sf.id === fieldId);
    if (isSystemField) return;

    setNewTemplate(prev => {
      const newDisplayOrder = prev.fieldsOrderDisplay.filter(f => f !== fieldId);
      const stillInFilename = prev.fieldsOrderFilename.includes(fieldId);

      return {
        ...prev,
        fieldsOrderDisplay: newDisplayOrder,
        // SI LE CHAMP N'EST PLUS DANS AUCUNE ZONE, LE RETIRER DES ActifS
        activeFields: stillInFilename ? prev.activeFields : prev.activeFields.filter(f => f !== fieldId)
      };
    });
  };

  // RETIRER UN CHAMP DE LA ZONE FILENAME
  const handleRemoveFromFilename = (fieldId) => {
    setNewTemplate(prev => {
      const newFilenameOrder = prev.fieldsOrderFilename.filter(f => f !== fieldId);
      const stillInDisplay = prev.fieldsOrderDisplay.includes(fieldId);

      return {
        ...prev,
        fieldsOrderFilename: newFilenameOrder,
        // SI LE CHAMP N'EST PLUS DANS AUCUNE ZONE, LE RETIRER DES ActifS
        activeFields: stillInDisplay ? prev.activeFields : prev.activeFields.filter(f => f !== fieldId)
      };
    });
  };

  // MONTER/DESCENDRE UN CHAMP D'UNE POSITION DANS UNE ZONE (alternative rapide
  // au glisser-déposer, pour un ajustement d'une seule position)
  const moveFieldInOrder = (order, fieldId, direction) => {
    const index = order.indexOf(fieldId);
    const targetIndex = index + (direction === 'up' ? -1 : 1);
    if (index === -1 || targetIndex < 0 || targetIndex >= order.length) return order;
    return arrayMove(order, index, targetIndex);
  };

  const handleMoveFieldInDisplay = (fieldId, direction) => {
    setNewTemplate(prev => ({
      ...prev,
      fieldsOrderDisplay: moveFieldInOrder(prev.fieldsOrderDisplay, fieldId, direction)
    }));
  };

  const handleMoveFieldInFilename = (fieldId, direction) => {
    setNewTemplate(prev => ({
      ...prev,
      fieldsOrderFilename: moveFieldInOrder(prev.fieldsOrderFilename, fieldId, direction)
    }));
  };

  // AJOUTER UN CHAMP AUX ZONES 2 ET 3 (DEPUIS LA ZONE 1)
  const handleAddToZones = (fieldId) => {
    setNewTemplate(prev => {
      const field = getAllFields().find(f => f.id === fieldId);
      const newLabels = { ...prev.fieldsLabels };

      // Ajouter le label si c'est un champ par dÃ©faut
      if (field && !field.isCustom && !newLabels[fieldId]) {
        newLabels[fieldId] = field.label;
      }

      const currentDisplay = prev.fieldsOrderDisplay || [];
      const currentFilename = prev.fieldsOrderFilename || [];
      const inDisplay = currentDisplay.includes(fieldId);
      const inFilename = currentFilename.includes(fieldId);

      const updatedDisplay = inDisplay ? currentDisplay : [...currentDisplay, fieldId];
      const updatedFilename = inFilename ? currentFilename : [...currentFilename, fieldId];

      if (inDisplay && inFilename) {
        return prev;
      }

      return {
        ...prev,
        fieldsOrderDisplay: updatedDisplay,
        fieldsOrderFilename: updatedFilename,
        activeFields: [...new Set([...(prev.activeFields || []), fieldId])],
        fieldsLabels: newLabels
      };
    });
  };

  // Ajouter un champ personnalise
  const handleAddCustomField = () => {
    if (!newCustomFieldName.trim()) {
      alert("Veuillez entrer un nom pour le champ");
      return;
    }

    const fieldId = `CUSTOM_${newCustomFieldName.toUpperCase().replace(/\s+/g, '_')}`;

    // VÃ‰RIFIER SI L'ID EXISTE DÃ‰JÃ€
    const allFields = getAllFields();
    if (allFields.find(f => f.id === fieldId)) {
      alert("Un champ avec ce nom existe déjà");
      return;
    }

    const newField = {
      id: fieldId,
      label: newCustomFieldName.trim().toUpperCase(),
      type: "text"
    };

    setNewTemplate({
      ...newTemplate,
      customFields: [...(newTemplate.customFields || []), newField],
      fieldsLabels: {
        ...newTemplate.fieldsLabels,
        [fieldId]: newField.label
      }
    });

    setNewCustomFieldName("");
    setShowAddCustomField(false);
  };

  // Supprimer UN CHAMP PERSONNALISÃ‰
  const handleRemoveCustomField = (fieldId) => {
    setNewTemplate({
      ...newTemplate,
      customFields: newTemplate.customFields.filter(f => f.id !== fieldId),
      activeFields: newTemplate.activeFields.filter(f => f !== fieldId),
      fieldsOrderDisplay: (newTemplate.fieldsOrderDisplay || []).filter(f => f !== fieldId),
      fieldsOrderFilename: (newTemplate.fieldsOrderFilename || []).filter(f => f !== fieldId),
      fieldsOrder: newTemplate.fieldsOrder.filter(f => f !== fieldId),
      fieldsLabels: Object.fromEntries(
        Object.entries(newTemplate.fieldsLabels).filter(([key]) => key !== fieldId)
      )
    });
  };

  // ÉDITER LE LIBELLÉ D'UN CHAMP PERSONNALISÉ
  const handleEditFieldLabel = (field) => {
    setEditingField(field);
    setEditLabel((newTemplate.fieldsLabels[field.id] || field.label || "").toUpperCase());
  };

  const handleSaveLabel = () => {
    if (editingField && editLabel.trim()) {
      // METTRE Ã€ JOUR LE LABEL DANS FIELDSLABELS
      setNewTemplate({
        ...newTemplate,
        fieldsLabels: {
          ...newTemplate.fieldsLabels,
          [editingField.id]: editLabel.trim().toUpperCase()
        },
        // METTRE Ã€ JOUR AUSSI DANS CUSTOMFIELDS
        customFields: newTemplate.customFields.map(f =>
          f.id === editingField.id ? { ...f, label: editLabel.trim().toUpperCase() } : f
        )
      });
    }
    setEditingField(null);
    setEditLabel("");
  };

  // Sauvegarder le template (et le passer automatiquement en template actif,
  // puisque modifier un template pour ne pas l'utiliser derriere n'aurait pas de sens)
  const handleSaveTemplate = async () => {
    if (!newTemplate.name || newTemplate.name.trim() === "") {
      alert("Veuillez entrer un nom pour le template");
      return;
    }

    // SYNCHRONISER fieldsOrder POUR COMPATIBILITÃ‰
    const templateToSave = {
      ...newTemplate,
      name: newTemplate.name.toUpperCase(), // FORCER EN MAJUSCULES
      fieldsOrder: newTemplate.fieldsOrderDisplay // UTILISER DISPLAY COMME RÃ‰FÃ‰RENCE
    };

    // Attendre la sauvegarde avant de confirmer : addTemplate() passe deja ce
    // template en actif, mais sans await la confirmation pouvait s'afficher
    // avant que le changement soit reellement propage.
    await addTemplate(templateToSave);
    alert("Template sauvegardé et appliqué !");
  };

  // Appliquer UN TEMPLATE
  const handleApplyTemplate = (template) => {
    applyTemplate(template.name); // PASSER LE Nom du template, PAS L'OBJET
    // FERMER LA MODAL POUR REVENIR Ã€ LA PAGE PRINCIPALE
    onClose();
  };

  // Supprimer UN TEMPLATE
  const handleDeleteTemplate = (templateName) => {
    deleteTemplate(templateName);
    setShowDeleteConfirm(null);
  };

  // Importer DES TEMPLATES
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const templates = JSON.parse(event.target.result);
            // FORCER LES NOMS EN MAJUSCULES
            const templatesUppercase = templates.map(t => ({
              ...t,
              name: t.name ? t.name.toUpperCase() : t.name
            }));
            importTemplates(templatesUppercase);
            alert("Templates importés avec succès !");
          } catch (error) {
            alert("Erreur lors de l'import des templates");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Exporter LES TEMPLATES
  const handleExport = () => {
    const dataStr = exportTemplates();
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `templates_${Date.now()}.json`;
    link.click();
  };

  const availableFields = getAvailableFields();
  const displayFields = getDisplayFieldsOrdered();
  const filenameFields = getFilenameFieldsOrdered();
  const draggedField = activeId ? getAllFields().find(f => f.id === activeId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Paramètres des champs</h2>
            <p className="text-sm text-blue-200 mt-1">Configurez les champs et templates pour vos documents</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENU - Mes templates */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showCustomizeModal ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Mes templates</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateNewTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau template
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Exporter
                  </button>
                  <button
                    onClick={handleImport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Importer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allTemplates.map((template) => (
                  <div
                    key={template.name}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      currentTemplate?.name === template.name
                        ? "border-blue-400 bg-blue-500/20 backdrop-blur-sm"
                        : "border-white/30 bg-white/10 backdrop-blur-sm hover:border-white/50 hover:bg-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <h4 className="font-bold text-white text-sm">{template.name}</h4>
                      {currentTemplate?.name === template.name && (
                        <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded font-bold whitespace-nowrap">
                          Actif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-200 mb-3">
                      {template.activeFields.length} champs actifs
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="flex-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors text-xs"
                      >
                        Appliquer
                      </button>
                      <button
                        onClick={() => handleOpenCustomize(template)}
                        className="px-2 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded font-bold transition-colors"
                        title="Personnaliser ce template"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                      {template.name !== "PAR DÃ‰FAUT" && (
                        <button
                          onClick={() => setShowDeleteConfirm(template.name)}
                          className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* SOUS-MODAL PERSONNALISATION */}
              <div className="mb-4 flex items-center gap-4">
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="text-blue-200 hover:text-white font-bold"
                >
                  Retour aux templates
                </button>
                <h3 className="text-xl font-bold text-white">Personnaliser les champs</h3>
              </div>

              {/* Nom du template */}
              <div className="mb-3">
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Nom du template
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-sm bg-white/90 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 uppercase text-gray-900 placeholder-gray-500"
                  placeholder="Mon template"
                />
              </div>

              {/* SYSTÃˆME DRAG-AND-DROP Ã€ 3 ZONES HORIZONTALES */}
              <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-4">
                  {/* Zone 1 - Champs disponibles */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="bg-white/15 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {availableFields.length}
                        </span>
                        Champs disponibles
                      </h3>
                      {/* BOUTON AJOUTER CHAMP PERSONNALISÃ‰ */}
                      {!showAddCustomField ? (
                        <button
                          onClick={() => setShowAddCustomField(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold transition-colors text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Ajouter un champ personnalisé
                        </button>
                      ) : (
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            value={newCustomFieldName}
                            onChange={(e) => setNewCustomFieldName(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomField()}
                            placeholder="Nom du champ"
                            className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase text-xs w-48"
                            autoFocus
                          />
                          <button
                            onClick={handleAddCustomField}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors text-xs"
                          >
                            Ajouter
                          </button>
                          <button
                            onClick={() => {
                              setShowAddCustomField(false);
                              setNewCustomFieldName("");
                            }}
                            className="px-2.5 py-1 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-bold transition-colors text-xs"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                    <AvailableZoneContainer>
                      <div className="flex flex-wrap">
                        {availableFields.length === 0 ? (
                          <div className="w-full text-center py-6 text-gray-400">
                            <p className="font-bold text-xs">Tous les champs sont utilisés</p>
                          </div>
                        ) : (
                          <SortableContext
                            items={availableFields.map(f => `available-${f.id}`)}
                            strategy={horizontalListSortingStrategy}
                          >
                            {availableFields.map((field) => (
                              <AvailableFieldItem
                                key={field.id}
                                field={{
                                  ...field,
                                  id: `available-${field.id}`,
                                  realId: field.id,
                                  displayLabel: getFieldDisplayLabel(field.id),
                                }}
                                isCustom={field.isCustom}
                                onEdit={handleEditFieldLabel}
                                onRemove={handleRemoveCustomField}
                                onAddToZones={handleAddToZones}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </div>
                    </AvailableZoneContainer>
                  </div>

                  {/* Zone 2 - Formulaire et exports */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="bg-indigo-400/30 text-indigo-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {displayFields.length}
                        </span>
                        Ordre du formulaire et des exports
                      </h3>
                      <button
                        onClick={handleCopyDisplayToFilename}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-indigo-100 rounded-lg font-medium transition-colors text-xs"
                        title="Copier cet ordre vers le nom de fichier"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                        Copier vers le nom de fichier
                      </button>
                    </div>
                    {displayFields.length > 0 && (
                      <div className="flex flex-wrap items-center gap-y-1 mb-2">
                        {displayFields.map((f, i) => (
                          <div key={f.id} className="flex items-center">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-400/20 text-indigo-100 text-[11px] font-semibold whitespace-nowrap">
                              {getFieldDisplayLabel(f.id)}
                            </span>
                            {i < displayFields.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-indigo-300/40 mx-0.5 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <DisplayZoneContainer>
                      <div className="flex flex-col gap-1.5">
                        {displayFields.length === 0 ? (
                          <div className="w-full text-center py-6 text-gray-400">
                            <p className="font-bold text-xs">Glissez des champs ici</p>
                            <p className="text-xs">Pour definir l'ordre du formulaire et des exports</p>
                          </div>
                        ) : (
                          <SortableContext
                            items={displayFields.map(f => `display-${f.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {displayFields.map((field, index) => (
                              <ActiveFieldItem
                                key={`display-${field.id}`}
                                field={{
                                  ...field,
                                  id: `display-${field.id}`,
                                  realId: field.id,
                                  displayLabel: getFieldDisplayLabel(field.id),
                                }}
                                isCustom={field.isCustom}
                                isSystem={field.isSystem}
                                zoneColor="blue"
                                onRemove={handleRemoveFromDisplay}
                                onMoveUp={(fieldId) => handleMoveFieldInDisplay(fieldId, 'up')}
                                onMoveDown={(fieldId) => handleMoveFieldInDisplay(fieldId, 'down')}
                                isFirst={index === 0}
                                isLast={index === displayFields.length - 1}
                                index={index + 1}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </div>
                    </DisplayZoneContainer>
                  </div>

                  {/* Zone 3 - Nom de fichier */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="bg-emerald-400/30 text-emerald-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {filenameFields.length}
                        </span>
                        Ordre du nom de fichier
                      </h3>
                      <button
                        onClick={handleCopyFilenameToDisplay}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-emerald-100 rounded-lg font-medium transition-colors text-xs"
                        title="Copier cet ordre vers le formulaire et les exports"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        Copier vers le formulaire
                      </button>
                    </div>
                    {filenameFields.length > 0 && (
                      <div className="flex flex-wrap items-center gap-y-1 mb-2">
                        {filenameFields.map((f, i) => (
                          <div key={f.id} className="flex items-center">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-100 text-[11px] font-semibold whitespace-nowrap">
                              {getFieldDisplayLabel(f.id)}
                            </span>
                            {i < filenameFields.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-emerald-300/40 mx-0.5 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <FilenameZoneContainer>
                      <div className="flex flex-col gap-1.5">
                        {filenameFields.length === 0 ? (
                          <div className="w-full text-center py-6 text-gray-400">
                            <p className="font-bold text-xs">Glissez des champs ici</p>
                            <p className="text-xs">Pour definir l'ordre du nom de fichier</p>
                          </div>
                        ) : (
                          <SortableContext
                            items={filenameFields.map(f => `filename-${f.id}`)}
                            strategy={verticalListSortingStrategy}
                          >
                            {filenameFields.map((field, index) => (
                              <ActiveFieldItem
                                key={`filename-${field.id}`}
                                field={{
                                  ...field,
                                  id: `filename-${field.id}`,
                                  realId: field.id,
                                  displayLabel: getFieldDisplayLabel(field.id),
                                }}
                                isCustom={field.isCustom}
                                zoneColor="green"
                                onRemove={handleRemoveFromFilename}
                                onMoveUp={(fieldId) => handleMoveFieldInFilename(fieldId, 'up')}
                                onMoveDown={(fieldId) => handleMoveFieldInFilename(fieldId, 'down')}
                                isFirst={index === 0}
                                isLast={index === filenameFields.length - 1}
                                index={index + 1}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </div>
                    </FilenameZoneContainer>

                    {/* PRÃ‰VISUALISATION DES CHAMPS DU FORMULAIRE (FUSION ZONES 2 ET 3) */}
                    <div className="mt-3 p-2.5 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-bold text-white/60 mb-1.5 uppercase tracking-wide">Champs du formulaire</p>
                      <div className="flex flex-wrap gap-1">
                        {mergeFormFieldsOrder(newTemplate).filter(f => f !== 'NOM' && newTemplate.activeFields.includes(f)).map((fieldId) => {
                          const label = newTemplate.fieldsLabels[fieldId] || fieldId;
                          return (
                            <span key={fieldId} className="px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded font-medium border border-white/10">
                              {label}
                            </span>
                          );
                        })}
                        <span className="px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded font-medium border border-white/10">
                          NOM
                        </span>
                      </div>
                    </div>

                    {/* PRÃ‰VISUALISATION DU NOM DE FICHIER */}
                    <div className="mt-2 p-2.5 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-xs font-bold text-white/60 mb-1 uppercase tracking-wide">Aperçu du nom de fichier</p>
                      <p className="text-xs font-mono text-white">{getFilenamePreview()}</p>
                    </div>
                  </div>
                </div>

                <DragOverlay>
                  {draggedField ? (
                    <div className="inline-flex items-center gap-2 p-2 bg-white rounded-lg border-2 border-blue-500 shadow-xl">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                        draggedField.isCustom ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                        {getFieldDisplayLabel(draggedField.id)}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {/* Bouton sauvegarder */}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder ce template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALE D'ÉDITION DE LIBELLÉ */}
      {editingField && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Modifier le libellé</h3>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveLabel()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 uppercase"
              placeholder="Nouveau libellé"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveLabel}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
              >
                Sauvegarder
              </button>
              <button
                onClick={() => {
                  setEditingField(null);
                  setEditLabel("");
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-bold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Confirmer la suppression</h3>
            <p className="text-blue-200 mb-6">
              Voulez-vous vraiment supprimer le template "{showDeleteConfirm}" ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteTemplate(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-bold transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};













































