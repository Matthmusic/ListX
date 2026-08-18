import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const ICONS = {
  info: null,
  success: CheckCircle,
  error: AlertTriangle,
};

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
};

/**
 * Remplacement stylé de window.alert() : une popup avec un seul bouton OK,
 * cohérente avec le reste de l'app (ConfirmDialog/InputDialog) au lieu de la
 * boîte de dialogue générique du système d'exploitation.
 */
export default function AlertDialog({ isOpen, onClose, title = 'Information', message, type = 'info', buttonText = 'OK' }) {
  if (!isOpen) return null;

  const Icon = ICONS[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {Icon && <Icon className={`w-6 h-6 ${ICON_COLORS[type]}`} />}
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 whitespace-pre-line">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
            autoFocus
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
