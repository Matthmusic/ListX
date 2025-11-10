import { useState, useEffect } from 'react';
import { Plus, Users, Edit, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAllClients, createClient, renameClient, deleteClient } from '../services/storageService';
import AppLayout from '../components/AppLayout';
import InputDialog from '../components/InputDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import listXLogo from '../assets/listX.svg';

export default function ClientsPage() {
  const { navigateToProjects } = useApp();
  const [clients, setClients] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const loadedClients = getAllClients();
    setClients(loadedClients);
  };

  const handleCreateClient = (name) => {
    createClient(name);
    loadClients();
  };

  const handleEditClient = (name) => {
    if (selectedClient) {
      renameClient(selectedClient.id, name);
      loadClients();
      setSelectedClient(null);
    }
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      deleteClient(selectedClient.id);
      loadClients();
      setSelectedClient(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header avec logo */}
        <div className="flex items-center justify-center mb-6">
          <img src={listXLogo} alt="ListX" className="h-20" />
        </div>

        {/* Titre principal avec bouton création */}
        <div className="relative text-center mb-12">
          <button
            onClick={() => setShowCreateDialog(true)}
            className="absolute right-0 top-0 flex items-center gap-2 px-4 py-2 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nouveau client
          </button>
          <h1 className="text-4xl font-bold text-white mb-3">Gestion des Clients</h1>
          <p className="text-blue-200">Sélectionnez ou créez un client pour commencer</p>
        </div>

        {clients.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center max-w-md">
              <Users className="w-20 h-20 text-white/60 mb-6 mx-auto" />
              <h2 className="text-2xl font-semibold text-white mb-3">Aucun client</h2>
              <p className="text-blue-200 mb-8">Créez votre premier client pour commencer à gérer vos projets</p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-900 rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl mx-auto font-semibold"
              >
                <Plus className="w-5 h-5" />
                Créer mon premier client
              </button>
            </div>
          </div>
        ) : (
          // Card container
          <div className="space-y-6">
            {/* Grid de clients */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-200 cursor-pointer group shadow-lg hover:shadow-2xl"
                  onClick={() => navigateToProjects(client)}
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(client);
                        setShowEditDialog(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Renommer
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
        title="Renommer le client"
        label="Nouveau nom"
        placeholder="Ex: ACME Corporation"
        initialValue={selectedClient?.name || ''}
        confirmText="Renommer"
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
    </AppLayout>
  );
}
