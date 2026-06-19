import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Edit, Trash2, Download, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllClients, createClient, renameClient, deleteClient, exportClient, importClient } from '../services/storageService';
import AppLayout from '../components/AppLayout';
import InputDialog from '../components/InputDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import VersionBadge from '../components/VersionBadge';
import listXLogo from '../assets/ListX.svg';

export default function ClientsPage() {
  const { setSelectedClient, setSelectedProject, setSelectedListing } = useApp();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setLocalSelectedClient] = useState(null);

  useEffect(() => {
    loadClients();

    const handleDataUpdated = () => loadClients();
    window.addEventListener('data-updated', handleDataUpdated);
    return () => window.removeEventListener('data-updated', handleDataUpdated);
  }, []);

  const loadClients = async () => {
    setClients(await getAllClients());
  };

  const handleClientClick = (client) => {
    setSelectedClient(client);
    setSelectedProject(null);
    setSelectedListing(null);
    navigate('/projects');
  };

  const handleCreateClient = async (name) => {
    await createClient(name);
    await loadClients();
  };

  const handleEditClient = async (name) => {
    if (selectedClient) {
      await renameClient(selectedClient.id, name);
      await loadClients();
      setLocalSelectedClient(null);
    }
  };

  const handleDeleteClient = async () => {
    if (selectedClient) {
      await deleteClient(selectedClient.id);
      await loadClients();
      setLocalSelectedClient(null);
    }
  };

  const handleExportClient = async (client) => {
    const exportData = await exportClient(client.id);
    if (!exportData) {
      alert('Erreur lors de l\'export du client');
      return;
    }
    const now = new Date();
    const dateStr = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
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
            alert(`Client "${result.name}" importé avec succès !\n${result.projectCount} projet(s) inclus.`);
          }
        } catch (error) {
          alert('Erreur lors de l\'import : ' + error.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <img src={listXLogo} alt="ListX" className="h-20" />
        </div>

        <div className="relative text-center mb-12">
          <div className="absolute right-0 top-0 flex items-center gap-2">
            <button
              onClick={handleImportClient}
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
              Nouveau client
            </button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Gestion des Clients</h1>
          <p className="text-blue-200">Sélectionnez ou créez un client pour commencer</p>
        </div>

        {clients.length === 0 ? (
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => handleClientClick(client)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-1">{client.name}</h3>
                        <p className="text-sm text-blue-200">
                          {client.projectCount} projet{client.projectCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExportClient(client); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500/20 text-green-200 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Exporter
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLocalSelectedClient(client); setShowEditDialog(true); }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Renommer
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLocalSelectedClient(client); setShowDeleteDialog(true); }}
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
        onClose={() => { setShowEditDialog(false); setLocalSelectedClient(null); }}
        onConfirm={handleEditClient}
        title="Renommer le client"
        label="Nouveau nom"
        placeholder="Ex: ACME Corporation"
        initialValue={selectedClient?.name || ''}
        confirmText="Renommer"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setLocalSelectedClient(null); }}
        onConfirm={handleDeleteClient}
        title="Supprimer le client"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedClient?.name}" ? Tous les projets et listings associés seront également supprimés.`}
        confirmText="Supprimer"
        isDestructive
      />

      <VersionBadge />
    </AppLayout>
  );
}
