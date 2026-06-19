import { GripVertical, Edit, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableDocument({ doc, categoryColor, templateHasEtatField, onEdit, onDelete, onCopyFilename }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: doc.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleCopyFilename = async () => {
    try {
      await navigator.clipboard.writeText(doc.nomComplet);
      if (onCopyFilename) onCopyFilename(doc.nomComplet);
    } catch (err) {
      console.error('Erreur copie:', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 border rounded-md hover:bg-gray-50 transition-colors bg-white ${
        isDragging ? 'shadow-lg' : ''
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
      <span
        onClick={handleCopyFilename}
        className="text-xs text-gray-600 font-mono hidden md:block cursor-pointer hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
        title="Cliquer pour copier"
      >
        {doc.nomComplet}
      </span>
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
