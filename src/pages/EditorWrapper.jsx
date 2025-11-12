import { useEffect, useRef } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { loadListing } from '../services/storageService';
import DocumentListingApp from '../DocumentListingApp';

export default function EditorWrapper() {
  const { selectedClient, selectedProject, selectedListing, navigateToListings } = useApp();
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    // Charger les données du listing au montage si on édite un listing existant
    const loadData = async () => {
      if (selectedClient && selectedProject && selectedListing) {
        const listingData = await loadListing(selectedClient.id, selectedProject.id, selectedListing.id);

      // Vérifier si les données actuelles dans localStorage correspondent déjà à ce listing
      const currentAffairesData = JSON.parse(localStorage.getItem('affairesData') || '{}');
      const currentLastAffaire = localStorage.getItem('lastAffaire');

      // Utiliser l'ID du listing comme clé unique (pas le nom)
      const listingKey = `listing_${selectedListing.id}`;

      // Vérifier si les données sont déjà présentes dans affairesData
      const existingDocs = currentAffairesData.affaires?.[listingKey];

      // TOUJOURS charger depuis storageService si des documents existent
      // C'est la source de vérité pour la persistance
      if (listingData && listingData.documents && listingData.documents.length > 0) {
        // Listing existant avec documents - charger depuis storageService
        // Restaurer toute la structure affairesData si elle existe
        const affairesData = listingData.affairesData ? {
          ...listingData.affairesData,
          lastAffaire: listingKey
        } : {
          affaires: {
            [listingKey]: listingData.documents
          },
          lastAffaire: listingKey,
          settings: listingData.settings || {
            modeNumerotation: 'categorie',
            categoriesOrder: []
          }
        };

        localStorage.setItem('affairesData', JSON.stringify(affairesData));
        localStorage.setItem('lastAffaire', listingKey);

        // Stocker la clé technique du listing (ne doit jamais être écrasée)
        localStorage.setItem('currentListingKey', listingKey);

        // Pré-remplir UNIQUEMENT le nom de la liste (pas l'affaire)
        localStorage.setItem('exportNomListe', selectedListing.name); // Nom du listing -> Titre de la liste
      } else if (currentLastAffaire !== listingKey && !existingDocs) {
        // Nouveau listing : initialiser avec des données vides
        const affairesData = {
          affaires: {
            [listingKey]: []
          },
          lastAffaire: listingKey,
          settings: {
            modeNumerotation: 'categorie',
            categoriesOrder: []
          }
        };

        localStorage.setItem('affairesData', JSON.stringify(affairesData));
        localStorage.setItem('lastAffaire', listingKey);

        // Stocker la clé technique du listing (ne doit jamais être écrasée)
        localStorage.setItem('currentListingKey', listingKey);

        // Marquer que c'est la première ouverture (pour ouvrir les paramètres de champs)
        localStorage.setItem('isFirstOpen', 'true');

        // Pré-remplir UNIQUEMENT le nom de la liste pour un nouveau listing
        localStorage.setItem('exportNomListe', selectedListing.name); // Nom du listing -> Titre de la liste
      }
      // Sinon : Listing déjà chargé ou documents existants dans affairesData
      }
    };
    loadData();
  }, [selectedClient?.id, selectedProject?.id, selectedListing?.id]);

  // Gestionnaire pour le bouton retour
  const handleBackClick = () => {
    // DocumentListingApp gère déjà la sauvegarde automatique via useEffect
    // Donc on navigue directement sans besoin de sauvegarder ici
    navigateToListings(selectedClient, selectedProject);
  };

  if (!selectedClient || !selectedProject) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background animé avec vagues */}
      <div className="wave-background">
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Éditeur de listing avec bouton retour */}
      <div className="relative z-10">
        {/* Bouton retour positionné pour s'aligner avec la section titre */}
        <div className="absolute left-8 right-8 z-20" style={{ top: 'calc(2rem + 5rem + 1.5rem)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="relative text-center">
              <button
                onClick={handleBackClick}
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
