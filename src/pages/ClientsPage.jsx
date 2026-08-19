import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2, Download, Upload, Clock, FileText, FileStack, Calendar, ImagePlus, ImageOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllClients, createClient, renameClient, deleteClient, exportClient, importClient, getRecentListings, updateClientLogo } from '../services/storageService';
import AppLayout from '../components/AppLayout';
import InputDialog from '../components/InputDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import VersionBadge from '../components/VersionBadge';
import listXLogo from '../assets/listX.svg';

export default function ClientsPage() {
  const { navigateToProjects, navigateToEditor } = useApp();
  const [clients, setClients] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const showAlert = (message, title = 'Information') => setAlertInfo({ message, title });

  useEffect(() => {
    loadClients();
    loadRecentListings();

    // Écouter les événements de mise à jour
    const handleDataUpdated = () => {
      loadClients();
      loadRecentListings();
    };
    window.addEventListener('data-updated', handleDataUpdated);

    return () => window.removeEventListener('data-updated', handleDataUpdated);
  }, []);

  const loadClients = async () => {
    const loadedClients = await getAllClients();
    // Ordre alphanumérique (ex: "Client 2" avant "Client 10")
    const sorted = [...loadedClients].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { numeric: true, sensitivity: 'base' })
    );
    setClients(sorted);
  };

  const loadRecentListings = async () => {
    const loaded = await getRecentListings(3);
    setRecentListings(loaded);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleCreateClient = async (name) => {
    await createClient(name);
    await loadClients();
  };

  const handleEditClient = async (name) => {
    if (selectedClient) {
      await renameClient(selectedClient.id, name);
      await loadClients();
      setSelectedClient(null);
    }
  };

  const handleDeleteClient = async () => {
    if (selectedClient) {
      await deleteClient(selectedClient.id);
      await loadClients();
      setSelectedClient(null);
    }
  };

  const handleExportClient = async (client) => {
    const exportData = await exportClient(client.id);
    if (!exportData) {
      showAlert('Erreur lors de l\'export du client', 'Erreur');
      return;
    }

    // Formater la date au format AAMMJJ
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ListX_Client_${client.name.replace(/[^a-z0-9]/gi, '_')}_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClient = () => {
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
          const result = await importClient(data);

          if (result.success) {
            await loadClients();
            showAlert(`Client "${result.name}" importé avec succès !\n${result.projectCount} projet(s) inclus.`, 'Import réussi');
          }
        } catch (error) {
          showAlert('Erreur lors de l\'import : ' + error.message, 'Erreur');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Redimensionne l'image choisie (côté canvas) avant de la stocker en data
  // URI : évite qu'une photo haute résolution ne fasse gonfler data.json.
  const resizeImageToDataUrl = (file, maxSize = 256) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
          const width = Math.round(img.width * ratio);
          const height = Math.round(img.height * ratio);
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Fichier image invalide'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
      reader.readAsDataURL(file);
    });
  };

  const handleChangeLogo = (client) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const dataUrl = await resizeImageToDataUrl(file);
        await updateClientLogo(client.id, dataUrl);
        await loadClients();
        // Rafraîchir l'aperçu dans la modale "Modifier" restée ouverte
        setSelectedClient((prev) => (prev && prev.id === client.id ? { ...prev, logo: dataUrl } : prev));
      } catch (error) {
        showAlert('Erreur lors du chargement du logo : ' + error.message, 'Erreur');
      }
    };
    input.click();
  };

  const handleRemoveLogo = async (client) => {
    await updateClientLogo(client.id, null);
    await loadClients();
    setSelectedClient((prev) => (prev && prev.id === client.id ? { ...prev, logo: null } : prev));
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header avec logo */}
        <div className="flex items-center justify-center mb-6">
          <img src={listXLogo} alt="ListX" className="h-20" />
        </div>

        {/* Titre principal avec boutons actions */}
        <div className="relative text-center mb-12">
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              onClick={handleImportClient}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
              title="Importer un client"
            >
              <Download className="w-4 h-4" />
              Importer
            </button>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nouveau client
            </button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Gestion des Clients</h1>
          <p className="text-blue-200">Sélectionnez ou créez un client pour commencer</p>
        </div>

        {/* Derniers listings ouverts (tous clients/projets confondus) */}
        {recentListings.length > 0 && (
          <div className="mb-10">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-200 uppercase tracking-wide mb-3">
              <Clock className="w-4 h-4" />
              Derniers listings ouverts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 border-t-white/30 rounded-2xl p-5 hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => navigateToEditor(listing.client, listing.project, listing)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-purple-500/20 ring-1 ring-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">{listing.name}</h3>
                      <p className="text-xs text-blue-300 truncate">
                        {listing.client.name} / {listing.project.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-blue-200">
                    <div className="flex items-center gap-1.5">
                      <FileStack className="w-3.5 h-3.5" />
                      <span>{listing.documentCount} document{listing.documentCount > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(listing.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {clients.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center max-w-md">
              <Users className="w-20 h-20 text-white/60 mb-6 mx-auto" />
              <h2 className="text-2xl font-semibold text-white mb-3">Aucun client</h2>
              <p className="text-blue-200 mb-8">Créez votre premier client ou importez-en un existant</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleImportClient}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Importer un client
                </button>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Créer mon premier client
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Card container
          <div className="space-y-6">
            {recentListings.length > 0 && (
              <h2 className="flex items-center gap-2 text-sm font-semibold text-blue-200 uppercase tracking-wide">
                <Users className="w-4 h-4" />
                Tous les clients
              </h2>
            )}
            {/* Grid de clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 border-t-white/30 rounded-2xl p-6 hover:bg-white/20 hover:-translate-y-1 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => navigateToProjects(client)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl ring-1 ring-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 ${client.logo ? 'bg-white/90' : 'bg-blue-500/20'}`}>
                        {client.logo ? (
                          <img src={client.logo} alt="" className="w-full h-full object-contain p-2" />
                        ) : (
                          <Users className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{client.name}</h3>
                        <p className="text-sm text-blue-200">
                          {client.projectCount} projet{client.projectCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportClient(client);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors"
                      title="Exporter ce client"
                    >
                      <Upload className="w-4 h-4" />
                      Exporter
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        setShowEditDialog(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        setShowDeleteDialog(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
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
        onConfirm={handleCreateClient}
        title="Nouveau client"
        label="Nom du client"
        placeholder="Ex: ACME Corporation"
        confirmText="Créer"
      />

      <InputDialog
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedClient(null);
        }}
        onConfirm={handleEditClient}
        title="Modifier le client"
        label="Nom du client"
        placeholder="Ex: ACME Corporation"
        initialValue={selectedClient?.name || ''}
        confirmText="Enregistrer"
        extraTop={
          selectedClient && (
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-200">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 ${selectedClient.logo ? 'bg-gray-100' : 'bg-blue-100'}`}>
                {selectedClient.logo ? (
                  <img src={selectedClient.logo} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                  <Users className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => handleChangeLogo(selectedClient)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  <ImagePlus className="w-4 h-4" />
                  {selectedClient.logo ? 'Changer le logo' : 'Ajouter un logo'}
                </button>
                {selectedClient.logo && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLogo(selectedClient)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <ImageOff className="w-4 h-4" />
                    Retirer le logo
                  </button>
                )}
              </div>
            </div>
          )
        }
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedClient(null);
        }}
        onConfirm={handleDeleteClient}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedClient?.name}" ? Tous les projets et listings associés seront également supprimés.`}
        confirmText="Supprimer"
        isDestructive
      />

      <AlertDialog
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={alertInfo?.title}
        message={alertInfo?.message}
      />

      <VersionBadge />
    </AppLayout>
  );
}
