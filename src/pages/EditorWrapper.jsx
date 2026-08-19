import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { loadListing } from '../services/storageService';
import DocumentListingApp from '../DocumentListingApp';

export default function EditorWrapper() {
  const { selectedClient, selectedProject, selectedListing, navigateToListings } = useApp();

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

  // DocumentListingApp a déjà son propre fond animé et sa propre mise en
  // page pleine page : pas besoin d'un wrapper ici avec un second fond et
  // un bouton retour positionné en absolu depuis l'extérieur (fragile —
  // ça dépendait d'un calc() deviné à la main et rivalisait avec le fond
  // fixed de DocumentListingApp pour l'empilement/les clics). Le bouton
  // vit maintenant dans le flux normal de DocumentListingApp lui-même.
  return <DocumentListingApp onBack={handleBackClick} />;
}
