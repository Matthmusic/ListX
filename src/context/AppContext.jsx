import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation state
  const [currentView, setCurrentView] = useState('clients'); // 'clients', 'projects', 'listings', 'editor'
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  // Navigation functions
  const navigateToClients = () => {
    setCurrentView('clients');
    setSelectedClient(null);
    setSelectedProject(null);
    setSelectedListing(null);
  };

  const navigateToProjects = (client) => {
    setCurrentView('projects');
    setSelectedClient(client);
    setSelectedProject(null);
    setSelectedListing(null);
  };

  const navigateToListings = (client, project) => {
    setCurrentView('listings');
    setSelectedClient(client);
    setSelectedProject(project);
    setSelectedListing(null);
  };

  const navigateToEditor = (client, project, listing = null) => {
    setCurrentView('editor');
    setSelectedClient(client);
    setSelectedProject(project);
    setSelectedListing(listing);
  };

  const value = {
    // State
    currentView,
    selectedClient,
    selectedProject,
    selectedListing,
    // Navigation
    navigateToClients,
    navigateToProjects,
    navigateToListings,
    navigateToEditor,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
