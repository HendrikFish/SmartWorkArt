import { Modal } from './modal.js';
import { Toast, normalizeString } from './module.js';
import { SaveManager } from './save.js';

export const FilterManager = {
    currentFilters: {
        fields: [],
        areas: []
    },

    async init() {
        try {
            console.log('Filter-Manager wird initialisiert');
            
            // Lade die Konfiguration
            const configResponse = await fetch('/api/solo/config');
            if (!configResponse.ok) {
                throw new Error('Fehler beim Laden der Konfiguration');
            }
            const config = await configResponse.json();
            console.log('Geladene Konfiguration:', config);

            // Warte einen Moment, um sicherzustellen, dass der DOM bereit ist
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Setze die HTML-Struktur direkt
            await this.forceRenderFilterOptions(config);
            
            // Warte einen weiteren Moment, um sicherzustellen, dass die DOM-Updates abgeschlossen sind
            await new Promise(resolve => setTimeout(resolve, 150));

            // Lade die gespeicherten Filter
            await this.loadFilters();
        } catch (error) {
            console.error('Fehler beim Initialisieren der Filter:', error);
            Toast.show('Fehler beim Initialisieren der Filter', 'error');
        }
    },

    // Diese Methode initialisiert die Filter-Event-Listener und stellt sicher, dass die DOM-Updates abgeschlossen sind
    initFilterListeners() {
        return new Promise((resolve) => {
            // Warte einen Moment, um sicherzustellen, dass DOM-Updates vollständig sind
            setTimeout(() => {
                const filterOptions = document.getElementById('filterOptions');
                if (!filterOptions) {
                    console.error('filterOptions nicht gefunden für Event-Listener');
                    resolve(false);
                    return;
                }

                // Entferne alte Event-Listener (vermeidet Duplikate)
                if (filterOptions.parentNode) {
                    const oldFilterOptions = filterOptions.cloneNode(true);
                    filterOptions.parentNode.replaceChild(oldFilterOptions, filterOptions);
                } else {
                    console.error('filterOptions hat kein Elternelement');
                    resolve(false);
                    return;
                }
                
                // Verbesserte Suche nach Filter-Buttons mit Fallback-Methoden
                let buttons = [];
                // Erste Methode: Direkter Selektor
                buttons = document.querySelectorAll('#filterOptions .filter-btn');
                
                // Zweite Methode: Über den filterTab suchen, falls keine Buttons gefunden wurden
                if (buttons.length === 0) {
                    console.warn('Keine Filter-Buttons über direkten Selektor gefunden, versuche es über filterTab');
        const filterTab = document.getElementById('filterTab');
                    if (filterTab) {
                        buttons = filterTab.querySelectorAll('.filter-btn');
                    }
                }
                
                // Dritte Methode: Globale Suche, als letzter Ausweg
                if (buttons.length === 0) {
                    console.warn('Keine Filter-Buttons über filterTab gefunden, versuche globale Suche');
                    buttons = document.querySelectorAll('.filter-btn');
                }
                
                console.log(`Event-Listener für ${buttons.length} Filter-Buttons werden initialisiert`);
                
                if (buttons.length === 0) {
                    console.error('Keine Filter-Buttons gefunden! Versuche Neuladen der Konfiguration');
                    // Hier könnte man eine Neuladen-Logik implementieren
                    resolve(false);
            return;
        }

                // Event-Listener zu allen gefundenen Buttons hinzufügen
                buttons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        console.log('Filter-Button wurde geklickt:', button.dataset.value);
                        this.handleFilterButtonClick(button);
                    });
                });
                
                resolve(true);
            }, 250); // Längere Verzögerung, um DOM-Updates zu berücksichtigen
        });
    },

    // Erzwinge Neurendering der Filter-Optionen mit optionaler Konfiguration
    async forceRenderFilterOptions(config = null) {
        console.log('Erzwinge Neurendering der Filter-Optionen');
        
        try {
            // Sichere den aktuellen Filter-Zustand durch tiefe Kopie
            const currentFilters = JSON.parse(JSON.stringify(this.currentFilters));
            console.log('Gesicherter Filter-Zustand:', currentFilters);
            
            // Lade Konfiguration, falls nicht übergeben
            if (!config) {
                try {
                    const response = await fetch('/api/solo/config');
                    if (!response.ok) {
                            throw new Error('Fehler beim Laden der Konfiguration');
                        }
                    config = await response.json();
                    console.log('Neue Konfiguration geladen:', config);
                } catch (error) {
                    console.error('Fehler beim Laden der Konfiguration:', error);
                    Toast.show('Fehler beim Laden der Konfiguration', 'error');
                    return;
                }
            }
            
            // Überprüfe, ob die Konfiguration gültig ist
            if (!config || !config.fields || !config.areas) {
                console.error('Ungültige Konfiguration:', config);
                Toast.show('Ungültige Konfiguration', 'error');
                return;
            }
            
            // Prüfe, ob die gesetzten Filter noch in der neuen Konfiguration vorhanden sind
            const validateFilters = () => {
                const validFields = config.fields.map(field => field.id);
                const validAreas = config.areas.map(area => area.id || area.name);
                
                // Filtere ungültige Filter
                const validatedFilters = {
                    fields: currentFilters.fields.filter(fieldId => validFields.includes(fieldId)),
                    areas: currentFilters.areas.filter(areaId => validAreas.includes(areaId))
                };
                
                if (validatedFilters.fields.length !== currentFilters.fields.length || 
                    validatedFilters.areas.length !== currentFilters.areas.length) {
                    console.warn('Einige Filter sind nicht mehr gültig und wurden entfernt', {
                        original: currentFilters,
                        validated: validatedFilters
                    });
                }
                
                return validatedFilters;
            };
            
            // Validiere Filter
            const validatedFilters = validateFilters();
            this.currentFilters = validatedFilters;
            
            // Aktualisiere die globale Variable
            window.currentSavedFilter = JSON.parse(JSON.stringify(this.currentFilters));
            
            // Rendere Filter-Optionen
            const filterTab = document.getElementById('filterTab');
            const filterOptions = document.getElementById('filterOptions');
            
            if (!filterTab || !filterOptions) {
                console.error('Filter-Tab oder FilterOptions nicht gefunden');
            return;
        }

            // Leere Filter-Optionen
            filterOptions.innerHTML = '';
            
            // Erstelle Feld-Filter-Gruppe
            const fieldFilterGroup = document.createElement('div');
            fieldFilterGroup.className = 'filter-group';
            const fieldGroupTitle = document.createElement('h3');
            fieldGroupTitle.textContent = 'Filter nach Feld';
            fieldFilterGroup.appendChild(fieldGroupTitle);
            
            // Füge Feld-Filter hinzu
            config.fields.forEach(field => {
                const filterButton = document.createElement('button');
                filterButton.className = 'filter-btn field-filter';
                filterButton.dataset.value = field.id;
                filterButton.textContent = field.label;
                
                // Setze aktiven Status basierend auf den aktuellen Filtern
                if (this.currentFilters.fields.includes(field.id)) {
                    filterButton.classList.add('active');
                }
                
                fieldFilterGroup.appendChild(filterButton);
            });
            
            // Erstelle Bereichs-Filter-Gruppe
            const areaFilterGroup = document.createElement('div');
            areaFilterGroup.className = 'filter-group';
            const areaGroupTitle = document.createElement('h3');
            areaGroupTitle.textContent = 'Filter nach Bereich';
            areaFilterGroup.appendChild(areaGroupTitle);
            
            // Füge Bereichs-Filter hinzu
            config.areas.forEach(area => {
                // Sicherstellen, dass wir eine gültige ID oder Namen haben
                const areaId = area.id || area.name;
                if (!areaId) {
                    console.warn('Bereich ohne ID oder Namen übersprungen:', area);
                    return;
                }
                
                const filterButton = document.createElement('button');
                filterButton.className = 'filter-btn area-filter';
                filterButton.dataset.value = areaId;
                filterButton.textContent = area.name || areaId;
                
                // Setze aktiven Status basierend auf den aktuellen Filtern
                if (this.currentFilters.areas.includes(areaId)) {
                    filterButton.classList.add('active');
                }
                
                areaFilterGroup.appendChild(filterButton);
            });
            
            // Füge Gruppen zum Filter-Container hinzu
            filterOptions.appendChild(fieldFilterGroup);
            filterOptions.appendChild(areaFilterGroup);
            
            // Initialisiere Event-Listener für Filter-Buttons
            this.initFilterEvents();
            
            console.log('Filter-Optionen erfolgreich aktualisiert');
            return true;
        } catch (error) {
            console.error('Fehler beim Neurendern der Filter-Optionen:', error);
            Toast.show('Fehler beim Aktualisieren der Filter', 'error');
            return false;
        }
    },

    // Initialisiere Event-Listener für Filter-Buttons
    initFilterEvents() {
        console.log('Initialisiere Filter-Event-Listener');
        
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) {
            console.error('FilterOptions nicht gefunden');
            return;
        }
        
        // Entferne zuerst alle bestehenden Event-Listener
        const filterButtons = filterOptions.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            // Alte Event-Listener entfernen (Clone + Replace)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Füge Event-Listener für alle Filter-Buttons hinzu
        const allFilterButtons = filterOptions.querySelectorAll('.filter-btn');
        allFilterButtons.forEach(button => {
            button.addEventListener('click', () => this.handleFilterButtonClick(button));
        });
        
        console.log(`${allFilterButtons.length} Filter-Buttons mit Event-Listenern initialisiert`);
    },

    // Lade Filter vom Server
    async loadFilters() {
        console.log('Lade Filter vom Server');
        
        try {
            const response = await fetch('/api/solo/filters');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Filter');
            }
            
            const filterData = await response.json();
            console.log('Geladene Filter:', filterData);
            
            // Aktualisiere Filter mit den geladenen Daten
            if (filterData && typeof filterData === 'object') {
                // Stelle sicher, dass die Struktur gültig ist
                this.currentFilters = {
                    fields: Array.isArray(filterData.fields) ? filterData.fields : [],
                    areas: Array.isArray(filterData.areas) ? filterData.areas : []
                };
                
                // Aktualisiere die globale Variable
                window.currentSavedFilter = JSON.parse(JSON.stringify(this.currentFilters));
                
                // Aktualisiere die UI
                await this.forceRenderFilterOptions();
            await this.loadAndDisplayResidents();
                
                return true;
            } else {
                console.warn('Ungültiges Filter-Format:', filterData);
                return false;
            }
        } catch (error) {
            console.error('Fehler beim Laden der Filter:', error);
            Toast.show('Fehler beim Laden der Filter', 'error');
            return false;
        }
    },

    // Speichere Filter auf dem Server
    async saveFilters() {
        console.log('Speichere Filter auf dem Server:', this.currentFilters);
        
        // Validiere Filter-Daten
        const validatedFilters = {
            fields: Array.isArray(this.currentFilters.fields) 
                ? this.currentFilters.fields.filter(field => field && field !== 'undefined') 
                : [],
            areas: Array.isArray(this.currentFilters.areas) 
                ? this.currentFilters.areas.filter(area => area && area !== 'undefined') 
                : []
        };
        
        // Log des validierten Objekts
        console.log('Validierte Filter zum Speichern:', validatedFilters);
        
        try {
            const response = await fetch('/api/solo/filters', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(validatedFilters)
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Speichern der Filter');
            }
            
            const result = await response.json();
            console.log('Filter erfolgreich gespeichert:', result);
            
            // Aktualisiere die Filter mit den validierten Werten
            this.currentFilters = validatedFilters;
            
            // Aktualisiere die globale Variable
            window.currentSavedFilter = JSON.parse(JSON.stringify(this.currentFilters));
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Filter:', error);
            return false;
        }
    },

    updateFilterUI() {
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) {
            console.error('filterOptions nicht gefunden für updateFilterUI');
            return;
        }

        // Entferne den aktiven Status von allen Filtern
        const allButtons = filterOptions.querySelectorAll('.filter-btn');
        if (allButtons.length === 0) {
            console.warn('Keine Filter-Buttons für updateFilterUI gefunden');
        }
        
        allButtons.forEach(btn => {
            btn.classList.remove('active');
        });

        // Debuggen der aktuellen Filter
        console.log('Aktualisiere Filter-UI mit:', this.currentFilters);

        // Verzögere die Aktivierung, um sicherzustellen, dass die DOM-Updates abgeschlossen sind
        setTimeout(() => {
        // Aktiviere den ausgewählten Feld-Filter
            if (this.currentFilters.fields && this.currentFilters.fields.length > 0) {
            const fieldBtn = filterOptions.querySelector(`.field-filter[data-value="${this.currentFilters.fields[0]}"]`);
            if (fieldBtn) {
                fieldBtn.classList.add('active');
                    console.log('Feld-Filter aktiviert:', this.currentFilters.fields[0]);
                } else {
                    console.warn('Feld-Filter-Button nicht gefunden für:', this.currentFilters.fields[0]);
                    // Versuche einen alternativen Selektor
                    const altFieldBtn = document.querySelector(`.field-filter[data-value="${this.currentFilters.fields[0]}"]`);
                    if (altFieldBtn) {
                        altFieldBtn.classList.add('active');
                        console.log('Feld-Filter über alternativen Selektor aktiviert:', this.currentFilters.fields[0]);
                    }
            }
        }

        // Aktiviere den ausgewählten Bereichs-Filter
            if (this.currentFilters.areas && this.currentFilters.areas.length > 0) {
            const areaBtn = filterOptions.querySelector(`.area-filter[data-value="${this.currentFilters.areas[0]}"]`);
            if (areaBtn) {
                areaBtn.classList.add('active');
                    console.log('Bereichs-Filter aktiviert:', this.currentFilters.areas[0]);
                } else {
                    console.warn('Bereichs-Filter-Button nicht gefunden für:', this.currentFilters.areas[0]);
                    // Versuche einen alternativen Selektor
                    const altAreaBtn = document.querySelector(`.area-filter[data-value="${this.currentFilters.areas[0]}"]`);
                    if (altAreaBtn) {
                        altAreaBtn.classList.add('active');
                        console.log('Bereichs-Filter über alternativen Selektor aktiviert:', this.currentFilters.areas[0]);
                    }
                }
            }
        }, 100); // Verzögere die Aktivierung, um sicherzustellen, dass der DOM aktualisiert ist
    },

    setFilters(filters) {
        this.currentFilters = filters || { fields: [], areas: [] };
    },

    async displayResidents(residents, config) {
        // Verwende die verbesserte Methode zur Anzeige
        this.loadAndDisplayResidents();
    },

    loadAndDisplayResidents() {
        console.log('Lade und zeige Bewohner mit aktivem Filter:', 
            JSON.stringify({
                fields: this.currentFilters.fields,
                areas: this.currentFilters.areas
            })
        );

        const loadingIndicator = document.getElementById('residentLoadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        // API-Aufruf zum Laden der Bewohner
        fetch('/api/solo/residents')
            .then(response => {
            if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Prüfe verschiedene mögliche Datenformate
                let residents = [];
                
                if (Array.isArray(data)) {
                    // Fall 1: Direkt ein Array von Bewohnern
                    residents = data;
                    console.log('Datenformat: Direktes Array von Bewohnern');
                } else if (data && typeof data === 'object' && Array.isArray(data.residents)) {
                    // Fall 2: Ein Objekt mit einem residents-Array
                    residents = data.residents;
                    console.log('Datenformat: Objekt mit residents-Array');
                } else {
                    // Fall 3: Unbekanntes Format
                    console.error('Ungültiges Datenformat erhalten:', data);
                    throw new Error('Ungültiges Datenformat für Bewohner erhalten');
                }
                
                if (!residents.length) {
                    console.log('Keine Bewohner in den Daten gefunden');
                } else {
                    console.log(`${residents.length} Bewohner geladen`);
                }

                // Debug: Aktive Filter vor dem Filtern
                console.log('Aktive Filter vor dem Filtern:', 
                    JSON.stringify({
                        fields: this.currentFilters.fields,
                        areas: this.currentFilters.areas
                    })
                );

                // Bewohner filtern basierend auf den aktuellen Filtern
            const filteredResidents = this.filterResidents(residents);
                console.log(`${filteredResidents.length} Bewohner nach Filterung`);

                // Debug: Aktive Filter nach dem Filtern (sollten gleich sein)
                console.log('Aktive Filter nach dem Filtern:', 
                    JSON.stringify({
                        fields: this.currentFilters.fields,
                        areas: this.currentFilters.areas
                    })
                );

                // Gefilterte Bewohner anzeigen
            this.displayFilteredResidents(filteredResidents);

                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            })
            .catch(error => {
            console.error('Fehler beim Laden der Bewohner:', error);
                
                const residentContainer = document.getElementById('residentContainer');
                if (residentContainer) {
                    residentContainer.innerHTML = `
                        <div class="error-message">
                            <p>Fehler beim Laden der Bewohner:</p>
                            <p>${error.message}</p>
                        </div>
                    `;
                }
                
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
            });
    },

    filterResidents(residents) {
        console.log('Filtere Bewohner mit Filter:', JSON.stringify(this.currentFilters));
        
        // Wenn keine Filter aktiv sind, zeige alle Bewohner an
        if (this.currentFilters.fields.length === 0 && this.currentFilters.areas.length === 0) {
            return residents;
        }

        // WICHTIG: Bei aktiven Filtern müssen ALLE Bewohner zurückgegeben werden,
        // damit die "Kein Informationen vorhanden"-Gruppe richtig gefüllt wird.
        // Die tatsächliche Gruppierung erfolgt in groupResidentsByActiveFilter.
        
        // Die Filterung wird nur verwendet, um zu prüfen, welche Bewohner 
        // für den aktiven Filter relevant sind (auch mit fehlenden Informationen).
        
        // Bei Bereichs-Filtern ALLE Bewohner zurückgeben, da die Gruppierung
        // in groupResidentsByActiveFilter eine "Kein Informationen vorhanden"-Gruppe erstellt
        if (this.currentFilters.areas.length > 0) {
            console.log('Bereichs-Filter aktiv, gebe alle Bewohner für Gruppierung zurück');
            return residents;
        }
        
        // Bei Feld-Filtern auch alle Bewohner zurückgeben
        if (this.currentFilters.fields.length > 0) {
            console.log('Feld-Filter aktiv, gebe alle Bewohner für Gruppierung zurück');
            return residents;
        }
        
        // Fallback (sollte nie erreicht werden)
        return residents;
    },

    displayFilteredResidents(residents) {
        const residentContainer = document.getElementById('residentContainer');
        const residentsList = document.getElementById('residentsList');
        
        if (!residentContainer) {
            console.error('Bewohner-Container nicht gefunden');
            return;
        }

        // Lösche bestehenden Inhalt
        residentContainer.innerHTML = '';
        
        // Setze aktivem Filter-Header im residentsList
        if (residentsList) {
            // Hole den Namen des aktiven Filters
            const activeFilterName = this.getActiveFilterName();
            
            if (activeFilterName) {
                // Wenn ein Filter aktiv ist, zeige den Filter-Header im residentsList an
                residentsList.innerHTML = `
                    <div class="active-filter-banner">
                        <div class="active-filter-name">
                            <span class="filter-label">Aktiver Filter:</span> 
                            <span class="filter-value">${activeFilterName}</span>
                        </div>
                        <button class="clear-filter-btn" aria-label="Filter zurücksetzen">×</button>
                    </div>
                `;
                
                // Event-Listener für den Filter-Zurücksetzen-Button
                const clearFilterBtn = residentsList.querySelector('.clear-filter-btn');
                if (clearFilterBtn) {
                    clearFilterBtn.addEventListener('click', () => {
                        // Filter zurücksetzen
                        this.setFilters({ fields: [], areas: [] });
                        // UI aktualisieren
                        this.updateFilterButtons();
                        // Bewohner neu laden ohne Filter
                        this.loadAndDisplayResidents();
                        // residentsList leeren
                        residentsList.innerHTML = '';
                    });
                }
            } else {
                // Wenn kein Filter aktiv ist, leere den residentsList
                residentsList.innerHTML = '';
            }
        }
        
        // Prüfe, ob ein Loading-Indikator vorhanden ist, falls nicht, erstelle ihn
        if (!document.getElementById('residentLoadingIndicator')) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'residentLoadingIndicator';
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div><span>Lade Bewohner...</span>';
            loadingIndicator.style.display = 'none';
            document.body.appendChild(loadingIndicator);
        }

        // Wenn keine Bewohner vorhanden sind
        if (!residents || residents.length === 0) {
            residentContainer.innerHTML = '<div class="no-residents">Keine Bewohner gefunden</div>';
            return;
        }

        console.log(`Zeige ${residents.length} gefilterte Bewohner an`);

        // Gruppierung der Bewohner basierend auf aktivem Filter
        const groupedResidents = this.groupResidentsByActiveFilter(residents);
        console.log('Gruppierte Bewohner:', Object.keys(groupedResidents).join(', '));

        // Sortiere die Gruppen mit verbesserter Reihenfolge: 
        // 1. Text-Einträge, 2. Nummern aufsteigend, 3. "Kein Informationen vorhanden" am Ende
        const sortedGroups = Object.keys(groupedResidents).sort((a, b) => {
            // "Kein Informationen vorhanden" soll immer am Ende sein
            if (a === 'Kein Informationen vorhanden') return 1;
            if (b === 'Kein Informationen vorhanden') return -1;
            
            // Prüfe, ob die Strings mit Zahlen beginnen (z.B. "1. OG", "2. OG")
            const aStartsWithNumber = /^\d/.test(a);
            const bStartsWithNumber = /^\d/.test(b);
            
            // Wenn beide mit Zahlen beginnen, sortiere numerisch
            if (aStartsWithNumber && bStartsWithNumber) {
                // Extrahiere die Zahlen am Anfang der Strings
                const aNumber = parseInt(a.match(/^\d+/)[0], 10);
                const bNumber = parseInt(b.match(/^\d+/)[0], 10);
                return aNumber - bNumber; // Aufsteigende numerische Sortierung
            }
            
            // Wenn nur einer mit einer Zahl beginnt, setze den ohne Zahl nach vorne
            if (aStartsWithNumber && !bStartsWithNumber) return 1;
            if (!aStartsWithNumber && bStartsWithNumber) return -1;
            
            // Wenn beide keine Zahlen enthalten, sortiere alphabetisch
            return a.localeCompare(b);
        });

        // Durchlaufe jede Gruppe und zeige die Bewohner an
        sortedGroups.forEach(groupName => {
            const groupResidents = groupedResidents[groupName];
            
            // Überschrift für die Gruppe
            const groupHeader = document.createElement('div');
            groupHeader.className = 'filter-group-header';
            groupHeader.textContent = `${groupName} (${groupResidents.length})`;
            residentContainer.appendChild(groupHeader);

            // Container für die Bewohner dieser Gruppe
            const groupContainer = document.createElement('div');
            groupContainer.className = 'filter-group';
            residentContainer.appendChild(groupContainer);

            // Sortiere Bewohner alphabetisch nach Namen
            const sortedResidents = [...groupResidents].sort((a, b) => {
                const nameA = `${a.lastName || ''} ${a.firstName || ''}`.trim();
                const nameB = `${b.lastName || ''} ${b.firstName || ''}`.trim();
                return nameA.localeCompare(nameB);
            });

            // Zeige jeden Bewohner in der Gruppe an
            sortedResidents.forEach(resident => {
                const card = this.createResidentCard(resident);
                groupContainer.appendChild(card);
            });
        });
    },

    getActiveFilterName() {
        // Prüfe zuerst den Filter-Zustand
        if (this.currentFilters.fields.length > 0) {
            const fieldId = this.currentFilters.fields[0];
            
            // Versuche, das Label vom Button zu holen
            try {
            const filterOptions = document.getElementById('filterOptions');
                if (filterOptions) {
                    const fieldBtn = filterOptions.querySelector(`.field-filter[data-value="${fieldId}"]`);
                    if (fieldBtn) {
                        return fieldBtn.textContent.trim();
                    }
                }
            } catch (error) {
                console.warn('Fehler beim Abrufen des Feld-Labels:', error);
            }
            
            // Fallback: Verwende die ID als Label
            return fieldId;
        }
        
        if (this.currentFilters.areas.length > 0) {
            // Für Bereiche verwenden wir direkt den Namen
            return this.currentFilters.areas[0];
        }
        
        // Kein aktiver Filter
        return null;
    },

    groupResidentsByActiveFilter(residents) {
        console.log('Gruppiere Bewohner nach aktivem Filter');
        if (!residents || residents.length === 0) {
            console.log('Keine Bewohner zum Gruppieren');
            return {};
        }

        // Die Anzahl der Bewohner vor der Gruppierung ausgeben
        console.log(`Gruppiere ${residents.length} Bewohner`);

        // Standardgruppe für Bewohner ohne Informationen erstellen
        const groups = {
            'Kein Informationen vorhanden': []
        };

        // Kein aktiver Filter
        if (this.currentFilters.areas.length === 0 && this.currentFilters.fields.length === 0) {
            console.log('Kein aktiver Filter - keine Gruppierung');
            return { 'Alle Bewohner': residents };
        }

        // Gruppierung nach aktivem Filter
        const activeFilter = this.currentFilters.areas[0] || this.currentFilters.fields[0];
        console.log('Aktiver Filter für Gruppierung:', activeFilter);

        residents.forEach(resident => {
            let value = null;
            
            // Debug für den aktuellen Bewohner
            console.log(`Gruppiere Bewohner: ${resident.name || 'Unbekannt'}`);

            // Wert für Bereichsfilter holen
            if (this.currentFilters.areas.length > 0) {
                const area = this.currentFilters.areas[0];
                
                // Prüfen, ob der Bewohner überhaupt Bereiche hat
                if (!resident.areas) {
                    console.log(`Bewohner ${resident.name} hat keine Bereiche`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
                
                // Prüfen, ob der Bereich vorhanden ist
                if (!(area in resident.areas)) {
                    console.log(`Bewohner ${resident.name} hat keinen Bereich ${area}`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
                
                value = resident.areas[area];
                console.log(`Bewohner ${resident.name}, Bereich ${area}: "${value}"`);
                
                // Prüfen, ob der Wert leer oder nur Whitespace ist
                if (!value || value.trim() === '') {
                    console.log(`Bewohner ${resident.name} hat einen leeren Wert für Bereich ${area}`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
            } 
            // Wert für Feldfilter holen
            else if (this.currentFilters.fields.length > 0) {
                const field = this.currentFilters.fields[0];
                
                // Prüfen, ob das Feld existiert
                if (!(field in resident)) {
                    console.log(`Bewohner ${resident.name} hat kein Feld ${field}`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
                
                value = resident[field];
                console.log(`Bewohner ${resident.name}, Feld ${field}: "${value}"`);
                
                // Prüfen, ob der Wert leer oder nur Whitespace ist
                if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                    console.log(`Bewohner ${resident.name} hat einen leeren Wert für Feld ${field}`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
            }

            // Wenn kein Wert gefunden wurde (sollte nie passieren)
            if (value === null || value === undefined) {
                console.log(`Bewohner ${resident.name} hat keinen Wert für Filter ${activeFilter}`);
                groups['Kein Informationen vorhanden'].push(resident);
                return; // Nächster Bewohner
            }

            // Bei mehreren Werten (durch Komma getrennt) jeden als eigene Gruppe behandeln
            if (typeof value === 'string' && value.includes(',')) {
                const values = value.split(',').map(v => v.trim()).filter(v => v !== '');
                
                if (values.length === 0) {
                    // Wenn nach dem Trimmen keine Werte übrig bleiben
                    console.log(`Bewohner ${resident.name} hat nur leere Werte nach Kommatrennung`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
                
                values.forEach(val => {
                    if (!groups[val]) {
                        groups[val] = [];
                    }
                    groups[val].push(resident);
                });
            } else {
                // Einzelner Wert
                const displayValue = value.toString().trim();
                
                if (displayValue === '') {
                    console.log(`Bewohner ${resident.name} hat einen leeren Wert nach Trimmen`);
                    groups['Kein Informationen vorhanden'].push(resident);
                    return; // Nächster Bewohner
                }
                
                if (!groups[displayValue]) {
                    groups[displayValue] = [];
                }
                groups[displayValue].push(resident);
            }
        });

        // Leere Gruppen entfernen (außer "Kein Informationen vorhanden")
        Object.keys(groups).forEach(key => {
            if (key !== 'Kein Informationen vorhanden' && groups[key].length === 0) {
                delete groups[key];
            }
        });

        // Debug-Ausgabe nach der Gruppierung
        console.log('Gruppen nach Filterung:', Object.keys(groups).map(key => `${key}: ${groups[key].length} Bewohner`).join(', '));
        
        return groups;
    },

    showResidentDetails(resident) {
        // Statt this.createResidentCard aufzurufen, importieren wir das ResidentManager
        try {
            // Als einfache Lösung zeigen wir das Modal direkt hier
            const modal = document.getElementById('residentDetailModal');
            const content = modal.querySelector('.modal-content');

            // Lade zunächst die Konfiguration
            fetch('/api/solo/config')
                .then(response => response.json())
                .then(config => {
                    // Erstelle die persönlichen Informationen
                    const personalInfo = `
                        <div class="form-group">
                            <label>Geschlecht:</label>
                            <select class="form-input" name="gender">
                                <option value="Herr" ${resident.gender === 'Herr' ? 'selected' : ''}>Herr</option>
                                <option value="Frau" ${resident.gender === 'Frau' ? 'selected' : ''}>Frau</option>
                                <option value="" ${!resident.gender ? 'selected' : ''}>Nicht angegeben</option>
                            </select>
                        </div>
                        ${config.fields?.map(field => `
                            <div class="form-group">
                                <label>${field.label}:</label>
                                <input 
                                    type="${field.type || 'text'}" 
                                    class="form-input" 
                                    name="${field.id}" 
                                    value="${resident[field.id] || ''}"
                                    ${field.required ? 'required' : ''}
                                >
                            </div>
                        `).join('') || ''}
                    `;

                    // Erstelle die Bereiche
                    const areasHtml = config.areas?.map(area => `
                        <div class="area-group">
                            <h3 class="area-group-title">${area.name}</h3>
                            <div class="form-group area-buttons">
                                <div class="button-group">
                                    ${area.buttons.map(button => `
                                        <button type="button" 
                                            class="filter-button ${(resident.areas?.[area.name] || '').includes(button.label) ? 'active' : ''}"
                                            data-area="${area.name}"
                                            data-button="${button.label}"
                                            data-multiple="${area.allowMultiple || false}">
                                            ${button.label}
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('') || '';

                    // Setze den HTML-Inhalt des Modals
                    content.innerHTML = `
                        <div class="modal-header">
                            <h2>${resident.firstName} ${resident.lastName}</h2>
                            <button type="button" class="icon-btn close-modal"></button>
                        </div>
                        <div class="fields-container">
                            <div class="personal-info">
                                <h3 class="section-title">Persönliche Informationen</h3>
                                ${personalInfo}
                            </div>
                            ${areasHtml}
                        </div>
                        <div class="button-container">
                            <button type="button" class="primary-btn" id="saveResidentBtn">Speichern</button>
                            <button type="button" class="danger-btn" id="dismissResidentBtn">Entlassen</button>
                        </div>
                    `;

                    // Event-Listener für Buttons hinzufügen
                    this.attachButtonListeners(content, resident, config);

                    // Zeige das Modal an
                    Modal.show('residentDetailModal');
                })
                .catch(error => {
                    console.error('Fehler beim Laden der Konfiguration:', error);
                    Toast.show('Fehler beim Laden der Bewohnerdetails', 'error');
                });
        } catch (error) {
            console.error('Fehler beim Anzeigen der Bewohnerdetails:', error);
            Toast.show('Fehler beim Anzeigen der Bewohnerdetails', 'error');
        }
    },

    attachButtonListeners(content, resident, config) {
        // Event-Listener für die Bereichs-Buttons
        content.querySelectorAll('.area-buttons .filter-button').forEach(button => {
            button.addEventListener('click', () => {
                const area = button.dataset.area;
                const buttonLabel = button.dataset.button;
                const currentArea = config.areas.find(a => a.name === area);
                
                // Hier prüfen wir auf allowMultiple
                const isMultiple = currentArea?.allowMultiple === true;
                const buttonGroup = button.closest('.button-group');
                
                // Aktualisiere resident.areas
                if (!resident.areas) resident.areas = {};
                if (!resident.areas[area]) resident.areas[area] = '';
                
                let buttons = resident.areas[area].split(',').map(b => b.trim()).filter(b => b);
                
                // Prüfe zuerst den aktuellen Status des Buttons
                const wasActive = button.classList.contains('active');
                
                if (!wasActive) {
                    // Button wird aktiviert
                    if (!buttons.includes(buttonLabel)) {
                        if (!isMultiple) {
                            // Bei Einzelauswahl alle anderen Buttons deaktivieren und ihre Klasse entfernen
                            buttonGroup.querySelectorAll('.filter-button.active').forEach(activeButton => {
                                if (activeButton !== button) {
                                    activeButton.classList.remove('active');
                                }
                            });
                            buttons = [buttonLabel];
                        } else {
                            buttons.push(buttonLabel);
                        }
                    }
                    // Füge die aktive Klasse hinzu
                    button.classList.add('active');
                } else {
                    // Button wird deaktiviert
                    buttons = buttons.filter(b => b !== buttonLabel);
                    // Entferne die aktive Klasse
                    button.classList.remove('active');
                }
                
                // Aktualisiere den Wert im resident.areas Objekt
                resident.areas[area] = buttons.join(', ');
            });
        });

        // Event-Listener für den Speichern-Button
        content.querySelector('#saveResidentBtn').addEventListener('click', async () => {
            // Sammle alle Formular-Daten
            const formInputs = content.querySelectorAll('.form-input');
            formInputs.forEach(input => {
                if (input.name === 'gender') {
                    resident.gender = input.value;
                } else {
                    resident[input.name] = input.value;
                }
            });

            const normalizedName = `${normalizeString(resident.firstName)}_${normalizeString(resident.lastName)}`;
            const response = await fetch(`/api/solo/resident/${normalizedName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resident)
            });

            if (response.ok) {
                Toast.show('Bewohner erfolgreich aktualisiert', 'success');
                Modal.hideAll();
                // Lade die Bewohner neu
                this.loadAndDisplayResidents();
            } else {
                const error = await response.json();
                Toast.show('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'error');
            }
        });

        // Event-Listener für den Entlassen-Button
        content.querySelector('#dismissResidentBtn').addEventListener('click', async () => {
            // Heutiges Datum im Format YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            
            // Formatiere das Datum für die Anzeige im Dialog (DD.MM.YYYY)
            const [year, month, day] = today.split('-');
            const formattedDate = `${day}.${month}.${year}`;
            
            if (confirm(`Möchten Sie diesen Bewohner wirklich entlassen?\n\nDas Todesdatum wird auf heute (${formattedDate}) gesetzt.`)) {
                try {
                    const success = await SaveManager.dismissResident(resident);
                    if (success) {
                        // Modal explizit schließen - doppelte Absicherung
                        Modal.hide('residentDetailModal');
                        // Kurz warten, um sicherzustellen, dass das Modal geschlossen ist
                        await new Promise(resolve => setTimeout(resolve, 300));
                        // Dann Liste neu laden
                        await this.loadAndDisplayResidents();
                        // Erfolgsmeldung anzeigen
                        Toast.show('Bewohner erfolgreich entlassen', 'success');
                    }
                } catch (error) {
                    console.error('Fehler beim Entlassen:', error);
                    Toast.show('Fehler beim Entlassen: ' + (error.message || 'Unbekannter Fehler'), 'error');
                }
            }
        });
    },

    // Event-Handler für Filter-Button-Klicks
    async handleFilterButtonClick(button) {
        if (!button) {
            console.error('Filter-Button ist null oder undefined');
            return;
        }

        // Prüfe, ob der Button einen gültigen Wert hat
        const filterValue = button.dataset.value;
        if (!filterValue || filterValue === 'undefined') {
            console.error('Filter-Button hat keinen gültigen Wert:', button);
            Toast.show('Ungültiger Filter-Wert', 'error');
            return;
        }

        console.log('Filter-Button geklickt:', filterValue);
        
        const isFieldFilter = button.classList.contains('field-filter');
        const isAreaFilter = button.classList.contains('area-filter');
        const wasActive = button.classList.contains('active');

        // Speichere den alten Filter-Zustand für mögliche Wiederherstellung
        const oldFilterState = { 
            fields: [...this.currentFilters.fields], 
            areas: [...this.currentFilters.areas] 
        };

        // Zurücksetzen aller Filter
        this.currentFilters.fields = [];
        this.currentFilters.areas = [];

        // Aktiviere den Filter, wenn er nicht bereits aktiv war
        if (!wasActive) {
            if (isFieldFilter) {
                this.currentFilters.fields = [filterValue];
                console.log('Feld-Filter gesetzt:', filterValue);
            } else if (isAreaFilter) {
                this.currentFilters.areas = [filterValue];
                console.log('Bereichs-Filter gesetzt:', filterValue);
            }
        } else {
            console.log('Filter deaktiviert, da bereits aktiv');
        }

        // Hilfsfunktion für die Hervorhebung von ausgewählten Buttons
        const updateButtonStates = () => {
            const filterOptions = document.getElementById('filterOptions');
            if (filterOptions) {
                // Alle Buttons zurücksetzen
                filterOptions.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Wenn ein Filter aktiv ist, den entsprechenden Button hervorheben
                if (this.currentFilters.fields.length > 0) {
                    const fieldBtn = filterOptions.querySelector(`.field-filter[data-value="${this.currentFilters.fields[0]}"]`);
                    if (fieldBtn) fieldBtn.classList.add('active');
                }

                if (this.currentFilters.areas.length > 0) {
                    const areaBtn = filterOptions.querySelector(`.area-filter[data-value="${this.currentFilters.areas[0]}"]`);
                    if (areaBtn) areaBtn.classList.add('active');
                }
            }
        };

        // Sofort die Button-Zustände aktualisieren
        updateButtonStates();
        
        try {
            // Lade Bewohner
            const residentsResponse = await fetch('/api/solo/residents');
            if (!residentsResponse.ok) {
                throw new Error('Fehler beim Laden der Bewohner');
            }
            const residents = await residentsResponse.json();
            
            // Filtere die Bewohner und zeige sie sofort an
            const filteredResidents = this.filterResidents(residents);
            this.displayFilteredResidents(filteredResidents);
            
            // Debug-Ausgabe des aktuellen Filter-Zustands vor dem Speichern
            console.log('Aktueller Filter-Zustand vor dem Speichern:', JSON.stringify(this.currentFilters));

            // WICHTIG: Speichere Filter im Hintergrund
            await this.saveFilters().catch(error => {
                console.error('Fehler beim Speichern des Filters:', error);
                // Fehler beim Speichern sollten die UI nicht beeinträchtigen
                Toast.show('Filter angewendet, aber Speicherung fehlgeschlagen', 'warning');
            });
            
            // Explizit global aktualisieren und speichern
            window.currentSavedFilter = JSON.parse(JSON.stringify(this.currentFilters));
            console.log('Filter erfolgreich angewendet und global gespeichert:', window.currentSavedFilter);
        } catch (error) {
            console.error('Fehler beim Anwenden des Filters:', error);
            // Bei Fehler den alten Filter-Zustand wiederherstellen
            this.currentFilters = oldFilterState;
            updateButtonStates();
            Toast.show('Fehler beim Filtern der Bewohner', 'error');
        }
    },

    // Neue Methode, um Filter im Hintergrund zu speichern ohne auf die Antwort zu warten
    async saveFiltersInBackground() {
        console.log('Speichere Filter im Hintergrund:', this.currentFilters);
        try {
            // Kopie der aktuellen Filter erstellen, um Race Conditions zu vermeiden
            const filtersToSave = JSON.parse(JSON.stringify(this.currentFilters));
            
            // Fetch starten, aber nicht auf Antwort warten
            fetch('/api/solo/filters', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(filtersToSave)
            }).then(response => {
                if (!response.ok) {
                    console.warn('Server-Antwort nicht ok beim Speichern der Filter:', response.status);
                } else {
                    console.log('Filter erfolgreich im Hintergrund gespeichert');
                }
            }).catch(error => {
                console.error('Netzwerkfehler beim Speichern der Filter:', error);
            });
        } catch (error) {
            console.error('Fehler beim Vorbereiten des Filter-Speicherns:', error);
            // Hier keinen Toast anzeigen, da dies im Hintergrund passiert
        }
    },

    createResidentCard(resident) {
        const card = document.createElement('div');
        card.className = 'resident-card';
        
        // Name und grundlegende Informationen
        const fullName = `${resident.firstName || ''} ${resident.lastName || ''}`.trim() || 'Unbekannt';
        
        // Prüfe, ob ein Bild vorhanden ist
        const hasImage = resident.image && resident.image.trim() !== '';
        
        // HTML für die Karte
        card.innerHTML = `
            <div class="resident-card-inner">
                <div class="resident-image ${!hasImage ? 'no-image' : ''}">
                    ${hasImage 
                        ? `<img src="${resident.image}" alt="${fullName}" loading="lazy">` 
                        : `<div class="placeholder-image">${fullName.charAt(0)}</div>`
                    }
                    </div>
                <div class="resident-info">
                    <h3 class="resident-name">${fullName}</h3>
                    ${resident.birthDate ? `<p class="resident-birth-date">Geb.: ${resident.birthDate}</p>` : ''}
                    ${resident.room ? `<p class="resident-room">Zimmer: ${resident.room}</p>` : ''}
                        </div>
            </div>
        `;
        
        // Event-Listener hinzufügen, um Details anzuzeigen
        card.addEventListener('click', () => {
            // Falls eine showResidentDetails-Methode existiert, rufe sie auf
            if (typeof this.showResidentDetails === 'function') {
                this.showResidentDetails(resident);
            } else {
                console.log('Bewohner ausgewählt:', fullName);
                // Falls nicht, zeige eine einfache Nachricht an
                const event = new CustomEvent('residentSelected', { detail: resident });
                document.dispatchEvent(event);
            }
        });
        
        return card;
    },

    // Diese neue Methode aktualisiert die Filter-Optionen leise im Hintergrund
    // ohne die aktuelle Ansicht zu beeinträchtigen
    async updateFilterOptionsQuietly(config, savedFilterState) {
        console.log('Aktualisiere Filter-Optionen im Hintergrund...');
        console.log('Gespeicherter Filter-Zustand:', savedFilterState);
        
        try {
            const filterTab = document.getElementById('filterTab');
            if (!filterTab) {
                console.error('Filter-Tab nicht gefunden');
                return;
            }
            
            // Wenn keine Konfiguration vorliegt, abbrechen
            if (!config || !config.fields || !config.areas) {
                console.warn('Unvollständige Konfiguration für Filter, überspringe Update');
                return;
            }
            
            // Sicherheitsüberprüfung für fields und areas Arrays
            const fieldsArray = Array.isArray(config.fields) ? config.fields : [];
            const areasArray = Array.isArray(config.areas) ? config.areas : [];

            // HTML für Filter-Optionen generieren, aber noch nicht in DOM einfügen
            const filterOptionsHtml = `
                <div id="filterOptions">
                    <div class="filter-section">
                        <h4>Nach Feld filtern</h4>
                        <div class="filter-options">
                            ${fieldsArray
                                .filter(field => field && field.id && field.id !== 'firstName' && field.id !== 'lastName')
                                .map(field => `
                                    <button class="filter-btn field-filter" data-value="${field.id}">
                                        ${field.label || field.id}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    <div class="filter-section">
                        <h4>Nach Bereich filtern</h4>
                        <div class="filter-options">
                            ${areasArray
                                .filter(area => area && area.name)
                                .map(area => `
                                    <button class="filter-btn area-filter" data-value="${area.name}">
                                        ${area.name}
                                    </button>
                                `).join('')}
                    </div>
                    </div>
                    </div>
                `;

            // Prüfe, ob dieser Filter in der neuen Konfiguration überhaupt noch existiert
            let filterIsStillValid = true;
            
            if (savedFilterState.fields && savedFilterState.fields.length > 0) {
                const fieldId = savedFilterState.fields[0];
                filterIsStillValid = fieldsArray.some(field => field.id === fieldId);
            } else if (savedFilterState.areas && savedFilterState.areas.length > 0) {
                const areaName = savedFilterState.areas[0];
                filterIsStillValid = areasArray.some(area => area.name === areaName);
            }
            
            // Aktualisiere nur, wenn das Modal aktuell geschlossen ist
            // und die Hauptansicht aktiv ist
            const configModal = document.getElementById('configModal');
            if (configModal && !configModal.classList.contains('show')) {
                // Aktualisiere die Filter-Optionen nur in dem versteckten Tab
                filterTab.innerHTML = filterOptionsHtml;
                
                // Füge Event-Listener hinzu ohne UI-Updates
                setTimeout(() => {
                    const buttons = filterTab.querySelectorAll('.filter-btn');
                    buttons.forEach(button => {
                        button.addEventListener('click', (event) => {
                            this.handleFilterButtonClick(button);
                        });
                    });
                    
                    // Setze den Filter-Zustand leise, ohne die Bewohnerliste neu zu laden
                    if (filterIsStillValid) {
                        // Setze den Filter-Zustand wieder her
                        this.currentFilters = savedFilterState;
                        
                        // Aktiviere die entsprechenden Buttons ohne komplettes UI-Update
                        if (this.currentFilters.fields && this.currentFilters.fields.length > 0) {
                            const fieldBtn = filterTab.querySelector(`.field-filter[data-value="${this.currentFilters.fields[0]}"]`);
                            if (fieldBtn) fieldBtn.classList.add('active');
                        } else if (this.currentFilters.areas && this.currentFilters.areas.length > 0) {
                            const areaBtn = filterTab.querySelector(`.area-filter[data-value="${this.currentFilters.areas[0]}"]`);
                            if (areaBtn) areaBtn.classList.add('active');
                        }
                        
                        console.log('Filter-Zustand im Hintergrund wiederhergestellt');
                                } else {
                        console.log('Gespeicherter Filter existiert nicht mehr in der neuen Konfiguration');
                                }
                }, 100);
                        } else {
                console.log('Konfigurationsmodal ist geöffnet, Filter-Update wird übersprungen');
            }
        } catch (error) {
            console.error('Fehler beim leisen Aktualisieren der Filter-Optionen:', error);
            // Fehler leise behandeln, keine Benutzerinteraktion erforderlich
        }
    },

    // Hilfsmethode, um sicherzustellen, dass die Filter-Buttons den aktuellen Zustand widerspiegeln
    updateFilterButtons() {
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) {
            console.warn('Filter-Optionen nicht gefunden, kann Buttons nicht aktualisieren');
            return;
        }
        
        // Alle Buttons zurücksetzen
        filterOptions.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Wenn ein Feld-Filter aktiv ist, markiere den entsprechenden Button
        if (this.currentFilters.fields.length > 0) {
            const fieldValue = this.currentFilters.fields[0];
            const fieldBtn = filterOptions.querySelector(`.field-filter[data-value="${fieldValue}"]`);
            if (fieldBtn) {
                fieldBtn.classList.add('active');
                console.log('Feld-Filter-Button aktiviert:', fieldValue);
                    } else {
                console.warn('Feld-Filter-Button nicht gefunden:', fieldValue);
            }
        }
        
        // Wenn ein Bereichs-Filter aktiv ist, markiere den entsprechenden Button
        if (this.currentFilters.areas.length > 0) {
            const areaValue = this.currentFilters.areas[0];
            const areaBtn = filterOptions.querySelector(`.area-filter[data-value="${areaValue}"]`);
            if (areaBtn) {
                areaBtn.classList.add('active');
                console.log('Bereichs-Filter-Button aktiviert:', areaValue);
            } else {
                console.warn('Bereichs-Filter-Button nicht gefunden:', areaValue);
            }
        }
    }
}; 