import { createContext, useEffect, useState } from "react";
// Champs par defaut disponibles (predefinis dans l'application)
export const DEFAULT_FIELDS = [
  { id: "AFFAIRE", label: "AFFAIRE", isDefault: true, type: "text-with-autocomplete" },
  { id: "PHASE", label: "PHASE", isDefault: true, type: "select" },
  { id: "LOT", label: "LOT", isDefault: true, type: "text" },
  { id: "EMETTEUR", label: "\u00C9METTEUR", isDefault: true, type: "text" },
  { id: "NATURE", label: "NATURE", isDefault: true, type: "select" },
  { id: "ETAT", label: "ETAT", isDefault: true, type: "select" },
  { id: "NUMERO", label: "NUM\u00C9RO DOC", isDefault: true, type: "readonly" },
  { id: "ZONE", label: "ZONE", isDefault: true, type: "text" },
  { id: "NIVEAU", label: "NIVEAU", isDefault: true, type: "text" },
  { id: "FORMAT", label: "FORMAT", isDefault: true, type: "select" },
  { id: "INDICE", label: "INDICE", isDefault: true, type: "text" },
];

const defaultTemplate = {
  name: "PAR D\u00C9FAUT",
  // Ordre pour formulaire et exports (Excel/PDF)
  fieldsOrderDisplay: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // Ordre pour nom de fichier
  fieldsOrderFilename: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // CompatibilitÃ© : ancien champ (Ã  supprimer plus tard)
  fieldsOrder: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // LibellÃ©s personnalisÃ©s pour chaque champ
  fieldsLabels: {
    AFFAIRE: "AFFAIRE",
    PHASE: "PHASE",
    LOT: "LOT",
    EMETTEUR: "\u00C9METTEUR",
    NATURE: "NATURE",
    ETAT: "ETAT",
    NUMERO: "NUM\u00C9RO DOC",
    ZONE: "ZONE",
    NIVEAU: "NIVEAU",
    FORMAT: "FORMAT",
    INDICE: "INDICE",
  },
  // Champs actifs (visibles dans le formulaire)
  activeFields: ["AFFAIRE", "PHASE", "LOT", "EMETTEUR", "NATURE", "ETAT", "NUMERO", "ZONE", "NIVEAU", "FORMAT", "INDICE"],
  // Champs personnalisÃ©s ajoutÃ©s par l'utilisateur
  customFields: [],
};

export const TemplateContext = createContext();

export const TemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState(() => {
    const savedTemplates = localStorage.getItem("listx-templates");
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        if (parsed.templates && parsed.currentTemplate) {
          const validTemplates = parsed.templates.filter(
            (t) =>
              t &&
              t.name &&
              Array.isArray(t.fieldsOrder) &&
              Array.isArray(t.activeFields) &&
              typeof t.fieldsLabels === "object" &&
              t.fieldsOrder.length > 0
          );

          if (validTemplates.length > 0) {
            const currentExists = validTemplates.find((t) => t.name === parsed.currentTemplate.name);
            return {
              templates: validTemplates,
              currentTemplate: currentExists || validTemplates[0],
            };
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des templates :", error);
        localStorage.removeItem("listx-templates");
      }
    }
    return { templates: [defaultTemplate], currentTemplate: defaultTemplate };
  });

  useEffect(() => {
    localStorage.setItem("listx-templates", JSON.stringify(templates));
  }, [templates]);

  const saveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
  };

  const addTemplate = (template) => {
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
    saveTemplates(newTemplates);
  };

  const applyTemplate = (templateName) => {
    const template = templates.templates.find((t) => t.name === templateName);
    if (template) {
      saveTemplates({ ...templates, currentTemplate: template });
    }
  };

  const deleteTemplate = (templateName) => {
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
    saveTemplates(newTemplates);
  };

  const importTemplates = (importedTemplates) => {
    if (!Array.isArray(importedTemplates) || importedTemplates.length === 0) {
      throw new Error("Format de templates invalide");
    }
    saveTemplates({ templates: importedTemplates, currentTemplate: importedTemplates[0] });
  };

  const exportTemplates = () => {
    return JSON.stringify(templates.templates, null, 2);
  };

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
