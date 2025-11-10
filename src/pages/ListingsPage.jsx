import { useState, useEffect } from 'react';
import { Plus, FileText, Copy, Edit, Trash2, Calendar, FileStack, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getProjectListings, createListing, renameListing, deleteListing, duplicateListing } from '../services/storageService';
import AppLayout from '../components/AppLayout';
import InputDialog from '../components/InputDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import listXLogo from '../assets/listX.svg';

export default function ListingsPage() {
  const { selectedClient, selectedProject, navigateToProjects, navigateToEditor } = useApp();
  const [listings, setListings] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    if (selectedClient && selectedProject) {
      loadListings();
    }
  }, [selectedClient, selectedProject]);

  const loadListings = () => {
    const loadedListings = getProjectListings(selectedClient.id, selectedProject.id);
    setListings(loadedListings);
  };

  const handleCreateListing = (name) => {
    const newListing = createListing(selectedClient.id, selectedProject.id, name);
    if (newListing) {
      navigateToEditor(selectedClient, selectedProject, newListing);
    }
  };

  const handleEditListing = (name) => {
    if (selectedListing) {
      renameListing(selectedClient.id, selectedProject.id, selectedListing.id, name);
      loadListings();
      setSelectedListing(null);
    }
  };

  const handleDeleteListing = () => {
    if (selectedListing) {
      deleteListing(selectedClient.id, selectedProject.id, selectedListing.id);
      loadListings();
      setSelectedListing(null);
    }
  };

  const handleDuplicateListing = (listing) => {
    duplicateListing(selectedClient.id, selectedProject.id, listing.id);
    loadListings();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!selectedClient || !selectedProject) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header avec logo centré */}
        <div className="flex items-center justify-center mb-6">
          <img src={listXLogo} alt="ListX" className="h-20" />
        </div>

        {/* Titre avec boutons retour et création */}
        <div className="relative text-center mb-12">
          <button
            onClick={() => navigateToProjects(selectedClient)}
            className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour aux projets
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nouveau listing
          </button>
          <p className="text-sm text-blue-300 mb-2">{selectedClient.name}</p>
          <h1 className="text-4xl font-bold text-white mb-3">{selectedProject.name}</h1>
          <p className="text-blue-200">Sélectionnez ou créez un listing</p>
        </div>

        {listings.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center max-w-md">
              <FileText className="w-20 h-20 text-white/60 mb-6 mx-auto" />
              <h2 className="text-2xl font-semibold text-white mb-3">Aucun listing</h2>
              <p className="text-blue-200 mb-8">Créez votre premier listing pour ce projet</p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto font-semibold"
              >
                <Plus className="w-5 h-5" />
                Créer mon premier listing
              </button>
            </div>
          </div>
        ) : (
          // List container
          <div className="space-y-6">
            {/* Liste des listings */}
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => navigateToEditor(selectedClient, selectedProject, listing)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-white mb-2">{listing.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-blue-200">
                          <div className="flex items-center gap-1.5">
                            <FileStack className="w-4 h-4" />
                            <span>{listing.documentCount} document{listing.documentCount > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>Modifié le {formatDate(listing.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateListing(listing);
                        }}
                        className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        title="Dupliquer"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(listing);
                          setShowEditDialog(true);
                        }}
                        className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        title="Renommer"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(listing);
                          setShowDeleteDialog(true);
                        }}
                        className="p-2.5 bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <InputDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onConfirm={handleCreateListing}
        title="Nouveau listing"
        label="Nom du listing"
        placeholder="Ex: Plans Électriques - Version 2.0"
        confirmText="Créer"
      />

      <InputDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedListing(null);
        }}
        onConfirm={handleEditListing}
        title="Renommer le listing"
        label="Nouveau nom"
        placeholder="Ex: Plans Électriques - Version 2.0"
        initialValue={selectedListing?.name || ''}
        confirmText="Renommer"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedListing(null);
        }}
        onConfirm={handleDeleteListing}
        title="Supprimer le listing"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedListing?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isDestructive
      />
    </AppLayout>
  );
}
