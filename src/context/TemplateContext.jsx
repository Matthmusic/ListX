import { createContext, useEffect, useState } from "react";
import { getAllTemplates, saveTemplates as saveTemplatesToServer } from '../services/storageService';

// Champs par defaut disponibles (predefinis dans l'application)
export const DEFAULT_FIELDS = [
  { id: "AFFAIRE", label: "AFFAIRE", isDefault: true, type: "text-with-autocomplete" },
  { id: "PHASE", label: "PHASE", isDefault: true, type: "select" },
  { id: "LOT", label: "LOT", isDefault: true, type: "text" },
  { id: "EMETTEUR", label: "ÉMETTEUR", isDefault: true, type: "text" },
  { id: "NATURE", label: "NATURE", isDefault: true, type: "select" },
  { id: "ETAT", label: "ETAT", isDefault: true, type: "select" },
  { id: "NUMERO", label: "NUMÉRO DOC", isDefault: true, type: "readonly" },
  { id: "ZONE", label: "ZONE", isDefault: true, type: "text" },
  { id: "NIVEAU", label: "NIVEAU", isDefault: true, type: "text" },
  { id: "FORMAT", label: "FORMAT", isDefault: true, type: "select" },
  { id: "INDICE", label: "INDICE", isDefault: true, type: "text" },
];

const defaultTemplate = {
  name: "PAR DÉFAUT",
  // Ordre pour formulaire et exports (Excel/PDF)
  fieldsOrderDisplay: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // Ordre pour nom de fichier
  fieldsOrderFilename: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // Compatibilité : ancien champ (à supprimer plus tard)
  fieldsOrder: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // Libellés personnalisés pour chaque champ
  fieldsLabels: {
    AFFAIRE: "AFFAIRE",
    PHASE: "PHASE",
    LOT: "LOT",
    EMETTEUR: "ÉMETTEUR",
    NATURE: "NATURE",
    ETAT: "ETAT",
    NUMERO: "NUMÉRO DOC",
    ZONE: "ZONE",
    NIVEAU: "NIVEAU",
    FORMAT: "FORMAT",
    INDICE: "INDICE",
  },
  // Champs actifs (visibles dans le formulaire)
  activeFields: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // Champs personnalisés ajoutés par l'utilisateur
  customFields: [],
};

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState({
    templates: [defaultTemplate],
    currentTemplate: defaultTemplate
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les templates depuis le serveur au démarrage
  useEffect(() => {
    const loadTemplatesFromServer = async () => {
      try {
        // Migrer d'abord les templates locaux vers le serveur si nécessaire
        const localTemplates = localStorage.getItem("listx-templates");
        if (localTemplates) {
          try {
            const parsed = JSON.parse(localTemplates);
            if (parsed.templates && Array.isArray(parsed.templates) && parsed.templates.length > 0) {
              console.log('Migration des templates locaux vers le serveur...');
              await saveTemplatesToServer(parsed.templates);
              localStorage.removeItem("listx-templates");
              console.log('Templates migrés avec succès');
            }
          } catch (error) {
            console.error('Erreur migration templates locaux:', error);
          }
        }

        // Charger depuis le serveur
        const serverTemplates = await getAllTemplates();

        if (serverTemplates && serverTemplates.length > 0) {
          const validTemplates = serverTemplates.filter(
            (t) =>
              t &&
              t.name &&
              Array.isArray(t.fieldsOrder) &&
              Array.isArray(t.activeFields) &&
              typeof t.fieldsLabels === "object" &&
              t.fieldsOrder.length > 0
          );

          if (validTemplates.length > 0) {
            setTemplates({
              templates: validTemplates,
              currentTemplate: validTemplates[0],
            });
            setIsLoaded(true);
            return;
          }
        }

        // Si pas de templates sur le serveur, sauvegarder le template par défaut
        await saveTemplatesToServer([defaultTemplate]);
        setTemplates({ templates: [defaultTemplate], currentTemplate: defaultTemplate });
        setIsLoaded(true);
      } catch (error) {
        console.error("Erreur lors du chargement des templates depuis le serveur:", error);
        // En cas d'erreur, utiliser le template par défaut
        setTemplates({ templates: [defaultTemplate], currentTemplate: defaultTemplate });
        setIsLoaded(true);
      }
    };

    loadTemplatesFromServer();
  }, []);

  const saveTemplates = async (newTemplates) => {
    try {
      await saveTemplatesToServer(newTemplates.templates);
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Erreur sauvegarde templates:', error);
      throw error;
    }
  };

  const addTemplate = async (template) => {
    const cleanedTemplate = {
      ...template,
      fieldsOrder: [...new Set(template.fieldsOrder)],
      activeFields: template.activeFields.filter((f) => template.fieldsOrder.includes(f)),
      customFields: template.customFields || [],
    };

    const existingIndex = templates.templates.findIndex((t) => t.name === cleanedTemplate.name);

    let newTemplates;
    if (existingIndex !== -1) {
      const updatedTemplatesList = [...templates.templates];
      updatedTemplatesList[existingIndex] = cleanedTemplate;
      newTemplates = {
        templates: updatedTemplatesList,
        currentTemplate: cleanedTemplate,
      };
    } else {
      newTemplates = {
        templates: [...templates.templates, cleanedTemplate],
        currentTemplate: cleanedTemplate,
      };
    }
    await saveTemplates(newTemplates);
  };

  const applyTemplate = async (templateName) => {
    const template = templates.templates.find((t) => t.name === templateName);
    if (template) {
      await saveTemplates({ ...templates, currentTemplate: template });
    }
  };

  const deleteTemplate = async (templateName) => {
    if (templates.templates.length <= 1) {
      alert("Vous ne pouvez pas supprimer le dernier template.");
      return;
    }

    const filteredTemplates = templates.templates.filter((t) => t.name !== templateName);
    const newCurrentTemplate =
      templates.currentTemplate.name === templateName ? filteredTemplates[0] : templates.currentTemplate;

    const newTemplates = {
      templates: filteredTemplates,
      currentTemplate: newCurrentTemplate,
    };
    await saveTemplates(newTemplates);
  };

  const importTemplates = async (importedTemplates) => {
    if (!Array.isArray(importedTemplates) || importedTemplates.length === 0) {
      throw new Error("Format de templates invalide");
    }
    await saveTemplates({ templates: importedTemplates, currentTemplate: importedTemplates[0] });
  };

  const exportTemplates = () => {
    return JSON.stringify(templates.templates, null, 2);
  };

  // Ne rien afficher tant que les templates ne sont pas chargés
  if (!isLoaded) {
    return null;
  }

  return (
    <TemplateContext.Provider
      value={{
        currentTemplate: templates.currentTemplate,
        allTemplates: templates.templates,
        addTemplate,
        applyTemplate,
        deleteTemplate,
        importTemplates,
        exportTemplates,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
};
