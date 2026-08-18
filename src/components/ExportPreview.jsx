import React, { useState } from 'react';
import { Eye, EyeOff, FileText, Table } from 'lucide-react';
import { useNatures } from '../context/NaturesContext';

// Palette de couleurs pour les catégories (identique à DocumentListingApp)
const COLOR_PALETTE = [
  { bg: '#CCE5FF', text: '#1e40af' }, // Bleu
  { bg: '#CCFFFF', text: '#0e7490' }, // Cyan
  { bg: '#CCFFCC', text: '#166534' }, // Vert
  { bg: '#FFFFCC', text: '#854d0e' }, // Jaune
  { bg: '#FFE6CC', text: '#c2410c' }, // Orange
  { bg: '#E5CCFF', text: '#7c3aed' }, // Violet
];

/**
 * Composant de prévisualisation de l'export PDF/Excel
 */
export default function ExportPreview({
  documents,
  exportHeaders,
  exportNomProjet,
  exportNomListe,
  exportDateListe,
  exportIndiceListe,
  exportAfficherCategories,
  exportLogoClient,
  exportLogoBE,
}) {
  const { naturesMap } = useNatures();
  const [isVisible, setIsVisible] = useState(false);
  const [previewMode, setPreviewMode] = useState('table'); // 'table' ou 'pdf'

  // Obtenir les catégories présentes dans l'ordre d'apparition
  const categoriesPresentes = [];
  documents.forEach(doc => {
    if (!categoriesPresentes.includes(doc.nature)) {
      categoriesPresentes.push(doc.nature);
    }
  });

  // Créer un mapping des couleurs par catégorie
  const getCategoryColor = (nature) => {
    const index = categoriesPresentes.indexOf(nature);
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  const categoryLabels = naturesMap;

  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      {/* Bouton pour afficher/masquer l'aperçu */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors w-full justify-center"
      >
        {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        {isVisible ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
      </button>

      {isVisible && (
        <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden bg-white">
          {/* Barre de navigation de l'aperçu */}
          <div className="flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-300">
            <button
              onClick={() => setPreviewMode('table')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                previewMode === 'table'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Table size={16} />
              Tableau
            </button>
            <button
              onClick={() => setPreviewMode('pdf')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${
                previewMode === 'pdf'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={16} />
              Mise en page PDF
            </button>
            <span className="ml-auto text-xs text-gray-500">
              {documents.length} document{documents.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Contenu de l'aperçu */}
          <div className="max-h-96 overflow-auto">
            {previewMode === 'pdf' ? (
              // Aperçu style PDF
              <div className="p-4 bg-gray-50">
                <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '800px', aspectRatio: '297/210' }}>
                  {/* En-tête avec logos */}
                  <div className="flex items-stretch border-2 border-black" style={{ height: '80px' }}>
                    {/* Zone logo client */}
                    <div className="w-24 border-r-2 border-black flex items-center justify-center bg-gray-50">
                      {exportLogoClient ? (
                        <img
                          src={URL.createObjectURL(exportLogoClient)}
                          alt="Logo client"
                          className="max-h-16 max-w-20 object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Logo Client</span>
                      )}
                    </div>

                    {/* Zone titre */}
                    <div className="flex-1 flex items-center justify-center px-4">
                      <h1 className="text-lg font-bold text-blue-900 text-center" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                        {exportNomProjet || 'NOM DU PROJET'}
                      </h1>
                    </div>

                    {/* Zone logo BE */}
                    <div className="w-24 border-l-2 border-black flex items-center justify-center bg-gray-50">
                      {exportLogoBE ? (
                        <img
                          src={URL.createObjectURL(exportLogoBE)}
                          alt="Logo BE"
                          className="max-h-16 max-w-20 object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Logo BE</span>
                      )}
                    </div>
                  </div>

                  {/* Bande de sous-titre */}
                  <div className="flex items-center bg-blue-400 text-white border-x-2 border-b-2 border-black" style={{ height: '28px' }}>
                    <div className="w-24 px-2 text-xs font-bold text-center border-2 border-black">
                      {exportDateListe ? new Date(exportDateListe).toLocaleDateString('fr-FR') : ''}
                    </div>
                    <div className="flex-1 text-center font-bold text-sm" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
                      {exportNomListe || 'NOM DE LA LISTE'}
                    </div>
                    <div className="w-24 px-2 text-xs font-bold text-center border-2 border-black">
                      {exportIndiceListe ? `Indice : ${exportIndiceListe}` : ''}
                    </div>
                  </div>

                  {/* Aperçu du tableau */}
                  <div className="p-2">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-blue-400 text-white">
                          {exportHeaders.slice(0, 6).map((header, idx) => (
                            <th key={idx} className="border border-black px-1 py-1 text-center font-bold">
                              {header.label}
                            </th>
                          ))}
                          {exportHeaders.length > 6 && (
                            <th className="border border-black px-1 py-1 text-center font-bold">...</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {exportAfficherCategories ? (
                          // Avec séparateurs de catégories
                          categoriesPresentes.slice(0, 2).map(category => {
                            const color = getCategoryColor(category);
                            const docsOfCategory = documents.filter(d => d.nature === category).slice(0, 2);
                            return (
                              <React.Fragment key={category}>
                                {/* Ligne de catégorie */}
                                <tr>
                                  <td
                                    colSpan={Math.min(exportHeaders.length, 7)}
                                    className="border border-black px-2 py-1 font-bold text-left"
                                    style={{ backgroundColor: color.bg, color: color.text }}
                                  >
                                    {category} - {categoryLabels[category] || category}
                                  </td>
                                </tr>
                                {/* Documents de la catégorie */}
                                {docsOfCategory.map((doc, idx) => (
                                  <tr key={doc.id || idx}>
                                    {exportHeaders.slice(0, 6).map((header, hIdx) => (
                                      <td
                                        key={hIdx}
                                        className="border border-black px-1 py-0.5 text-center"
                                        style={{ backgroundColor: color.bg }}
                                      >
                                        {doc[header.field] || ''}
                                      </td>
                                    ))}
                                    {exportHeaders.length > 6 && (
                                      <td className="border border-black px-1 py-0.5 text-center" style={{ backgroundColor: color.bg }}>
                                        ...
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          // Sans séparateurs
                          documents.slice(0, 5).map((doc, idx) => {
                            const color = getCategoryColor(doc.nature);
                            return (
                              <tr key={doc.id || idx}>
                                {exportHeaders.slice(0, 6).map((header, hIdx) => (
                                  <td
                                    key={hIdx}
                                    className="border border-black px-1 py-0.5 text-center"
                                    style={{ backgroundColor: color.bg }}
                                  >
                                    {doc[header.field] || ''}
                                  </td>
                                ))}
                                {exportHeaders.length > 6 && (
                                  <td className="border border-black px-1 py-0.5 text-center" style={{ backgroundColor: color.bg }}>
                                    ...
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        )}
                        {documents.length > 5 && (
                          <tr>
                            <td colSpan={Math.min(exportHeaders.length, 7)} className="border border-black px-2 py-1 text-center text-gray-500 italic">
                              ... et {documents.length - 5} autres documents
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Aperçu tableau simple
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-blue-500 text-white">
                    {exportHeaders.map((header, idx) => (
                      <th key={idx} className="border border-blue-600 px-2 py-2 text-center font-semibold whitespace-nowrap">
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exportAfficherCategories ? (
                    // Avec séparateurs de catégories
                    categoriesPresentes.map(category => {
                      const color = getCategoryColor(category);
                      const docsOfCategory = documents.filter(d => d.nature === category);
                      return (
                        <>
                          {/* Ligne de catégorie */}
                          <tr key={`cat-${category}`}>
                            <td
                              colSpan={exportHeaders.length}
                              className="border border-gray-300 px-3 py-2 font-bold"
                              style={{ backgroundColor: color.bg, color: color.text }}
                            >
                              {category} - {categoryLabels[category] || category}
                            </td>
                          </tr>
                          {/* Documents de la catégorie */}
                          {docsOfCategory.map((doc, idx) => (
                            <tr key={doc.id || `doc-${category}-${idx}`}>
                              {exportHeaders.map((header, hIdx) => (
                                <td
                                  key={hIdx}
                                  className="border border-gray-300 px-2 py-1 text-center"
                                  style={{ backgroundColor: color.bg }}
                                >
                                  {doc[header.field] || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      );
                    })
                  ) : (
                    // Sans séparateurs
                    documents.map((doc, idx) => {
                      const color = getCategoryColor(doc.nature);
                      return (
                        <tr key={doc.id || idx}>
                          {exportHeaders.map((header, hIdx) => (
                            <td
                              key={hIdx}
                              className="border border-gray-300 px-2 py-1 text-center"
                              style={{ backgroundColor: color.bg }}
                            >
                              {doc[header.field] || ''}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
