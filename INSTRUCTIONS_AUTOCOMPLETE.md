# Instructions pour ajouter l'autocomplete des affaires

Votre application sauvegarde déjà le nom de l'affaire dans localStorage. Voici comment ajouter l'autocomplete :

## 1. Ajouter les useEffect pour charger/sauvegarder (AVANT le `return`)

Ajoutez ces lignes après `const appliquerNouvellesPlages = () => {...}` et avant `// Grouper documents par nature` :

```javascript
  // Fonctions de gestion des affaires
  const handleAffaireChange = (value) => {
    const upperValue = value.toUpperCase();
    setAffaire(upperValue);

    // Filtrer les affaires pour l'autocomplete
    if (upperValue.length > 0) {
      const filtered = affairesList.filter(a =>
        a.toUpperCase().includes(upperValue)
      );
      setFilteredAffaires(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setFilteredAffaires(affairesList);
      setShowAutocomplete(affairesList.length > 0);
    }
  };

  const chargerAffaire = (nomAffaire) => {
    const docs = JSON.parse(localStorage.getItem(`affaire_${nomAffaire}`) || '[]');
    setDocuments(docs);
    setAffaire(nomAffaire);
    localStorage.setItem('lastAffaire', nomAffaire);
    setShowAutocomplete(false);
  };

  const nouvelleAffaire = () => {
    setDocuments([]);
    setAffaire('');
    setShowAutocomplete(false);
  };

  // useEffect pour charger les données au démarrage
  useEffect(() => {
    const affairesExistantes = JSON.parse(localStorage.getItem('affaires') || '[]');
    setAffairesList(affairesExistantes);
    setFilteredAffaires(affairesExistantes);

    if (affaire) {
      const docs = JSON.parse(localStorage.getItem(`affaire_${affaire}`) || '[]');
      setDocuments(docs);
    }
  }, []);

  // useEffect pour sauvegarder automatiquement
  useEffect(() => {
    if (affaire && documents.length > 0) {
      localStorage.setItem(`affaire_${affaire}`, JSON.stringify(documents));
      localStorage.setItem('lastAffaire', affaire);

      const affairesExistantes = JSON.parse(localStorage.getItem('affaires') || '[]');
      if (!affairesExistantes.includes(affaire)) {
        affairesExistantes.push(affaire);
        localStorage.setItem('affaires', JSON.stringify(affairesExistantes));
        setAffairesList(affairesExistantes);
      }
    }
  }, [documents, affaire]);

  // useEffect pour sauvegarder les paramètres
  useEffect(() => {
    localStorage.setItem('useRanges', JSON.stringify(useRanges));
    localStorage.setItem('numberingRanges', JSON.stringify(numberingRanges));
  }, [useRanges, numberingRanges]);
```

## 2. Remplacer le champ Affaire dans le JSX

Remplacez la section du champ Affaire (lignes 340-349) par :

```javascript
            <div className="col-span-12 md:col-span-3 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Affaire</label>
              <input
                type="text"
                value={affaire}
                onChange={(e) => handleAffaireChange(e.target.value)}
                onFocus={() => setShowAutocomplete(affairesList.length > 0)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="ex: ASELYS"
              />

              {/* Dropdown autocomplete */}
              {showAutocomplete && filteredAffaires.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <button
                    onClick={nouvelleAffaire}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-200 font-medium text-blue-600"
                  >
                    + Nouvelle affaire
                  </button>
                  {filteredAffaires.map((aff, idx) => (
                    <button
                      key={idx}
                      onClick={() => chargerAffaire(aff)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                    >
                      {aff}
                    </button>
                  ))}
                </div>
              )}
            </div>
```

## 3. Import Database icon

Ajoutez `Database` dans les imports ligne 2 (c'est déjà fait normalement).

## Ce que ça fait :

- **Autocomplete** : Quand vous tapez dans le champ Affaire, une liste filtrée apparaît
- **Bouton "Nouvelle affaire"** : En haut du dropdown pour créer une nouvelle affaire
- **Chargement automatique** : Cliquer sur une affaire charge ses documents
- **Sauvegarde automatique** : Les documents sont sauvegardés à chaque modification
- **Base de données locale** : Toutes les affaires sont stockées dans localStorage

Testez l'application après avoir fait ces modifications !
