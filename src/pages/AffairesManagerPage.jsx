import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Download, Upload, Search, X, ChevronLeft } from 'lucide-react';
import AppLayout from '../components/AppLayout';

export default function AffairesManagerPage() {
  const navigate = useNavigate();
  const [affaires, setAffaires] = useState([]);
  const [filteredAffaires, setFilteredAffaires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newAffaire, setNewAffaire] = useState('');
  const [notification, setNotification] = useState(null);

  // Charger les affaires au montage
  useEffect(() => {
    chargerAffaires();
  }, []);

  // Filtrer les affaires selon le terme de recherche
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAffaires(affaires);
    } else {
      const filtered = affaires.filter(affaire =>
        affaire.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAffaires(filtered);
    }
  }, [searchTerm, affaires]);

  const chargerAffaires = () => {
    try {
      const affairesData = localStorage.getItem('affairesCSV') || '';
      const affairesArray = affairesData
        .split('\n')
        .map(a => a.trim())
        .filter(a => a !== '');

      // Supprimer les doublons et trier
      const uniqueAffaires = [...new Set(affairesArray)].sort();
      setAffaires(uniqueAffaires);
      setFilteredAffaires(uniqueAffaires);
    } catch (error) {
      console.error('Erreur lors du chargement des affaires:', error);
      showNotification('Erreur lors du chargement des affaires', 'error');
    }
  };

  const sauvegarderAffaires = (nouvellesAffaires) => {
    try {
      localStorage.setItem('affairesCSV', nouvellesAffaires.join('\n'));
      setAffaires(nouvellesAffaires);
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showNotification('Erreur lors de la sauvegarde', 'error');
      return false;
    }
  };

  const ajouterAffaire = () => {
    const affaireTrimmee = newAffaire.trim();

    if (affaireTrimmee === '') {
      showNotification('Veuillez entrer un nom d\'affaire', 'error');
      return;
    }

    if (affaires.includes(affaireTrimmee)) {
      showNotification('Cette affaire existe déjà', 'error');
      return;
    }

    const nouvellesAffaires = [...affaires, affaireTrimmee].sort();
    if (sauvegarderAffaires(nouvellesAffaires)) {
      setNewAffaire('');
      showNotification('Affaire ajoutée avec succès', 'success');
    }
  };

  const supprimerAffaire = (affaireASupprimer) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${affaireASupprimer}" ?`)) {
      return;
    }

    const nouvellesAffaires = affaires.filter(a => a !== affaireASupprimer);
    if (sauvegarderAffaires(nouvellesAffaires)) {
      showNotification('Affaire supprimée avec succès', 'success');
    }
  };

  const exporterCSV = () => {
    const csv = affaires.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `affaires_${Date.now()}.csv`;
    link.click();
    showNotification('Export réussi', 'success');
  };

  const importerCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const contenu = event.target.result;
          const affairesImportees = contenu
            .split('\n')
            .map(a => a.trim())
            .filter(a => a !== '');

          // Fusionner avec les affaires existantes et supprimer les doublons
          const affairesFusionnees = [...new Set([...affaires, ...affairesImportees])].sort();

          if (sauvegarderAffaires(affairesFusionnees)) {
            showNotification(`${affairesImportees.length} affaires importées (${affairesFusionnees.length - affaires.length} nouvelles)`, 'success');
          }
        } catch (error) {
          console.error('Erreur lors de l\'import:', error);
          showNotification('Erreur lors de l\'import du fichier', 'error');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  };

  const nettoyerDoublons = () => {
    const uniqueAffaires = [...new Set(affaires)].sort();
    const nombreDoublons = affaires.length - uniqueAffaires.length;

    if (nombreDoublons === 0) {
      showNotification('Aucun doublon trouvé', 'info');
      return;
    }

    if (sauvegarderAffaires(uniqueAffaires)) {
      showNotification(`${nombreDoublons} doublon(s) supprimé(s)`, 'success');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <AppLayout>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' :
          'bg-blue-500'
        } text-white flex items-center gap-2`}>
          {notification.message}
        </div>
      )}

      {/* Bouton retour */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5" />
          Retour aux clients
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Gestion des Affaires
          </h1>
          <p className="text-blue-200">
            Gérez la liste des affaires pour l'autocomplétion
          </p>
        </div>

        {/* Actions principales */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={importerCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-colors shadow-md"
            >
              <Download size={20} />
              Importer CSV
            </button>
            <button
              onClick={exporterCSV}
              className="flex items-center gap-2 px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors shadow-md"
            >
              <Upload size={20} />
              Exporter CSV
            </button>
            <button
              onClick={nettoyerDoublons}
              className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors shadow-md"
            >
              <Trash2 size={20} />
              Nettoyer les doublons
            </button>
          </div>

          {/* Formulaire d'ajout */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={newAffaire}
                onChange={(e) => setNewAffaire(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && ajouterAffaire()}
                placeholder="Nom de la nouvelle affaire..."
                className="w-full px-4 py-2 bg-white/80 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white"
              />
            </div>
            <button
              onClick={ajouterAffaire}
              className="flex items-center gap-2 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-950 transition-colors shadow-md"
            >
              <Plus size={20} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Barre de recherche et statistiques */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher une affaire..."
                className="w-full pl-10 pr-10 py-2 bg-white/80 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white text-gray-900"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <div className="text-sm text-white font-semibold bg-white/20 px-4 py-2 rounded-lg ml-4">
              {filteredAffaires.length} / {affaires.length} affaires
            </div>
          </div>
        </div>

        {/* Liste des affaires */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredAffaires.length === 0 ? (
              <div className="p-12 text-center text-blue-200">
                {searchTerm ? 'Aucune affaire ne correspond à votre recherche' : 'Aucune affaire enregistrée'}
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredAffaires.map((affaire, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white font-medium">{affaire}</span>
                    <button
                      onClick={() => supprimerAffaire(affaire)}
                      className="text-red-300 hover:text-red-100 p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
