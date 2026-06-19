import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { loadListing } from '../services/storageService';
import DocumentListingApp from '../DocumentListingApp';

export default function EditorWrapper() {
  const { selectedClient, selectedProject, selectedListing } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      if (!selectedClient || !selectedProject || !selectedListing) return;

      const listingData = await loadListing(selectedClient.id, selectedProject.id, selectedListing.id);
      const listingKey = `listing_${selectedListing.id}`;

      if (listingData && listingData.documents && listingData.documents.length > 0) {
        const affairesData = listingData.affairesData ? {
          ...listingData.affairesData,
          lastAffaire: listingKey
        } : {
          affaires: { [listingKey]: listingData.documents },
          lastAffaire: listingKey,
          settings: listingData.settings || { modeNumerotation: 'categorie', categoriesOrder: [] }
        };
        localStorage.setItem('affairesData', JSON.stringify(affairesData));
        localStorage.setItem('lastAffaire', listingKey);
        localStorage.setItem('currentListingKey', listingKey);
        localStorage.setItem('exportNomListe', selectedListing.name);
      } else {
        const currentAffairesData = JSON.parse(localStorage.getItem('affairesData') || '{}');
        const existingDocs = currentAffairesData.affaires?.[listingKey];
        const currentLastAffaire = localStorage.getItem('lastAffaire');

        if (currentLastAffaire !== listingKey && !existingDocs) {
          localStorage.setItem('affairesData', JSON.stringify({
            affaires: { [listingKey]: [] },
            lastAffaire: listingKey,
            settings: { modeNumerotation: 'categorie', categoriesOrder: [] }
          }));
          localStorage.setItem('lastAffaire', listingKey);
          localStorage.setItem('currentListingKey', listingKey);
          localStorage.setItem('isFirstOpen', 'true');
          localStorage.setItem('exportNomListe', selectedListing.name);
        }
      }
    };
    loadData();
  }, [selectedClient?.id, selectedProject?.id, selectedListing?.id]);

  if (!selectedClient || !selectedProject) return null;

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <div className="wave-background">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="relative z-10">
        <div className="absolute left-8 right-8 z-20" style={{ top: 'calc(2rem + 5rem + 1.5rem)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="relative text-center">
              <button
                onClick={() => navigate('/listings')}
                className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 shadow-lg"
              >
                <ChevronLeft className="w-5 h-5" />
                Retour aux listings
              </button>
            </div>
          </div>
        </div>
        <DocumentListingApp />
      </div>
    </div>
  );
}
