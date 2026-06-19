import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableCategory({ natureCode, label, categoryColor, isDragging }) {
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
