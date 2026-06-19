import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Copy, Edit, Trash2, Calendar, FileStack, ChevronLeft, Download, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getProjectListings, createListing, renameListing, deleteListing, duplicateListing, exportListing, importListing } from '../services/storageService';
import AppLayout from '../components/AppLayout';
import InputDialog from '../components/InputDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import VersionBadge from '../components/VersionBadge';
import listXLogo from '../assets/ListX.svg';

export default function ListingsPage() {
  const { selectedClient, selectedProject, setSelectedListing } = useApp();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedListing, setLocalSelectedListing] = useState(null);

  useEffect(() => {
    if (selectedClient && selectedProject) {
      loadListings();
    }
  }, [selectedClient, selectedProject]);

  const loadListings = async () => {
    setListings(await getProjectListings(selectedClient.id, selectedProject.id));
  };

  const handleListingClick = (listing) => {
    setSelectedListing(listing);
    navigate('/editor');
  };

  const handleCreateListing = async (name) => {
    const newListing = await createListing(selectedClient.id, selectedProject.id, name);
    if (newListing) {
      setSelectedListing(newListing);
      navigate('/editor');
    }
  };

  const handleEditListing = async (name) => {
    if (selectedListing) {
      await renameListing(selectedClient.id, selectedProject.id, selectedListing.id, name);
      await loadListings();
      setLocalSelectedListing(null);
    }
  };

  const handleDeleteListing = async () => {
    if (selectedListing) {
      await deleteListing(selectedClient.id, selectedProject.id, selectedListing.id);
      await loadListings();
      setLocalSelectedListing(null);
    }
  };

  const handleDuplicateListing = async (listing) => {
    await duplicateListing(selectedClient.id, selectedProject.id, listing.id);
    await loadListings();
  };

  const handleExportListing = async (listing) => {
    const exportData = await exportListing(selectedClient.id, selectedProject.id, listing.id);
    if (!exportData) {
      alert('Erreur lors de l\'export du listing');
      return;
    }
    const now = new Date();
    const dateStr = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ListX_Listing_${listing.name.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportListing = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          const result = await importListing(selectedClient.id, selectedProject.id, data);
          if (result.success) {
            await loadListings();
            alert(`Listing "${result.name}" importé avec succès !\n${result.documentCount} document(s) inclus.`);
          }
        } catch (error) {
          alert('Erreur lors de l\'import : ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!selectedClient || !selectedProject) return null;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <img src={listXLogo} alt="ListX" className="h-20" />
        </div>

        <div className="relative text-center mb-12">
          <button
            onClick={() => navigate('/projects')}
            className="absolute left-0 top-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
            Retour aux projets
          </button>
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              onClick={handleImportListing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              Importer
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nouveau listing
            </button>
          </div>
          <p className="text-sm text-blue-300 mb-2">{selectedClient.name}</p>
          <h1 className="text-4xl font-bold text-white mb-3">{selectedProject.name}</h1>
          <p className="text-blue-200">Sélectionnez ou créez un listing</p>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center max-w-md">
              <FileText className="w-20 h-20 text-white/60 mb-6 mx-auto" />
              <h2 className="text-2xl font-semibold text-white mb-3">Aucun listing</h2>
              <p className="text-blue-200 mb-8">Créez votre premier listing ou importez-en un existant</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleImportListing}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Importer un listing
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Créer mon premier listing
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => handleListingClick(listing)}
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

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExportListing(listing); }}
                        className="p-2.5 bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors"
                        title="Exporter"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDuplicateListing(listing); }}
                        className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        title="Dupliquer"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLocalSelectedListing(listing); setShowEditDialog(true); }}
                        className="p-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        title="Renommer"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLocalSelectedListing(listing); setShowDeleteDialog(true); }}
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
        onClose={() => { setShowEditDialog(false); setLocalSelectedListing(null); }}
        onConfirm={handleEditListing}
        title="Renommer le listing"
        label="Nouveau nom"
        placeholder="Ex: Plans Électriques - Version 2.0"
        initialValue={selectedListing?.name || ''}
        confirmText="Renommer"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setLocalSelectedListing(null); }}
        onConfirm={handleDeleteListing}
        title="Supprimer le listing"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedListing?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        isDestructive
      />

      <VersionBadge />
    </AppLayout>
  );
}
