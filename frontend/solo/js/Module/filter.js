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

            // Setze die HTML-Struktur direkt
            await this.forceRenderFilterOptions(config);

            // Lade die gespeicherten Filter
            await this.loadFilters();

            // Initialisiere die Event-Listener
            this.initFilterListeners();
        } catch (error) {
            console.error('Fehler beim Initialisieren der Filter:', error);
            Toast.show('Fehler beim Initialisieren der Filter', 'error');
        }
    },

    // Diese neue Methode setzt das HTML direkt
    async forceRenderFilterOptions(config) {
        const filterTab = document.getElementById('filterTab');
        if (!filterTab) {
            console.error('Filter-Tab nicht gefunden');
            return;
        }

        // Prüfe, ob die Konfiguration die erforderlichen Eigenschaften hat
        if (!config || !config.fields || !config.areas) {
            console.warn('Unvollständige Konfiguration für Filter:', config);
            filterTab.innerHTML = `
                <div id="filterOptions">
                    <div class="filter-section">
                        <h4>Filter konnten nicht geladen werden</h4>
                        <p>Die Konfiguration ist unvollständig oder fehlerhaft.</p>
                        <button class="primary-btn" id="retry-filters-btn">Erneut versuchen</button>
                    </div>
                </div>
            `;
            
            // Event-Listener für den Retry-Button hinzufügen
            const retryBtn = filterTab.querySelector('#retry-filters-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', async () => {
                    try {
                        // Versuche die Konfiguration erneut zu laden
                        const configResponse = await fetch('/api/solo/config');
                        if (!configResponse.ok) {
                            throw new Error('Fehler beim Laden der Konfiguration');
                        }
                        const newConfig = await configResponse.json();
                        await this.forceRenderFilterOptions(newConfig);
                        // Lade die gespeicherten Filter
                        await this.loadFilters();
                    } catch (err) {
                        console.error('Fehler beim erneuten Laden der Filter:', err);
                        Toast.show('Fehler beim Laden der Filter', 'error');
                    }
                });
            }
            return;
        }

        // Sicherheitsüberprüfung für fields und areas Arrays
        const fieldsArray = Array.isArray(config.fields) ? config.fields : [];
        const areasArray = Array.isArray(config.areas) ? config.areas : [];

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

        // Setze den HTML-Inhalt des Filter-Tabs
        filterTab.innerHTML = filterOptionsHtml;
        console.log('Filter-Optionen wurden neu gerendert');
    },

    async loadFilters() {
        try {
            const response = await fetch('/api/solo/filters');
            if (!response.ok) {
                console.error('Server-Antwort:', response.status, response.statusText);
                throw new Error(`Fehler beim Laden der Filter: ${response.status} ${response.statusText}`);
            }
            const filters = await response.json();
            console.log('Geladene Filter:', filters);
            this.currentFilters = filters;
            this.updateFilterUI();
            
            // Lade die Bewohner mit den aktiven Filtern
            await this.loadAndDisplayResidents();
        } catch (error) {
            console.error('Fehler beim Laden der Filter:', error);
            // Setze Standardwerte bei Fehler
            this.currentFilters = { fields: [], areas: [] };
            Toast.show('Fehler beim Laden der Filter', 'error');
        }
    },

    async saveFilters() {
        try {
            const response = await fetch('/api/solo/filters', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.currentFilters)
            });
            if (!response.ok) {
                throw new Error('Fehler beim Speichern der Filter');
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Filter:', error);
            Toast.show('Fehler beim Speichern der Filter', 'error');
        }
    },

    updateFilterUI() {
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) return;

        // Entferne den aktiven Status von allen Filtern
        filterOptions.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Aktiviere den ausgewählten Feld-Filter
        if (this.currentFilters.fields.length > 0) {
            const fieldBtn = filterOptions.querySelector(`.field-filter[data-value="${this.currentFilters.fields[0]}"]`);
            if (fieldBtn) {
                fieldBtn.classList.add('active');
            }
        }

        // Aktiviere den ausgewählten Bereichs-Filter
        if (this.currentFilters.areas.length > 0) {
            const areaBtn = filterOptions.querySelector(`.area-filter[data-value="${this.currentFilters.areas[0]}"]`);
            if (areaBtn) {
                areaBtn.classList.add('active');
            }
        }
    },

    setFilters(filters) {
        this.currentFilters = filters || { fields: [], areas: [] };
    },

    async displayResidents(residents, config) {
        // Verwende die verbesserte Methode zur Anzeige
        this.loadAndDisplayResidents();
    },

    async loadAndDisplayResidents() {
        try {
            const response = await fetch('/api/solo/residents');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Bewohner');
            }
            const residents = await response.json();
            console.log('Geladene Bewohner:', residents);

            // Filtere die Bewohner basierend auf den aktiven Filtern
            const filteredResidents = this.filterResidents(residents);
            
            // Zeige die gefilterten Bewohner an
            this.displayFilteredResidents(filteredResidents);
        } catch (error) {
            console.error('Fehler beim Laden der Bewohner:', error);
            Toast.show('Fehler beim Laden der Bewohner', 'error');
        }
    },

    filterResidents(residents) {
        // Bei aktiven Filtern sollen ALLE Bewohner angezeigt werden, 
        // damit sie in der entsprechenden Gruppe "Kein Informationen vorhanden" erscheinen können
        if (this.currentFilters.fields.length > 0 || this.currentFilters.areas.length > 0) {
            return residents;
        }

        // Ohne aktive Filter zeige nur die Bewohner, die den Kriterien entsprechen
        return residents.filter(resident => {
            // Prüfe Feld-Filter
            const fieldFilterMatch = this.currentFilters.fields.length === 0 || 
                this.currentFilters.fields.every(field => {
                    const value = resident[field];
                    return value !== undefined && value !== null && value !== '';
                });

            // Prüfe Bereichs-Filter
            const areaFilterMatch = this.currentFilters.areas.length === 0 ||
                this.currentFilters.areas.every(area => {
                    return resident.areas && resident.areas[area] && resident.areas[area].length > 0;
                });

            return fieldFilterMatch && areaFilterMatch;
        });
    },

    displayFilteredResidents(residents) {
        const residentsList = document.getElementById('residentsList');
        if (!residentsList) return;

        // Entferne alle bestehenden Inhalte
        residentsList.innerHTML = '';
        
        // Stelle sicher, dass die richtige Klasse gesetzt ist
        residentsList.className = 'residents-list';

        // Füge aktive Filter als Header hinzu
        const activeFilter = this.getActiveFilterName();
        if (activeFilter) {
            const filterHeader = document.createElement('div');
            filterHeader.className = 'filter-header';
            filterHeader.textContent = activeFilter;
            residentsList.appendChild(filterHeader);
        }

        // Container für die Bewohnerkarten
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'residents-cards';

        // Wenn keine Filter aktiv sind, zeige alle Bewohner
        if (!activeFilter) {
            residents.forEach(resident => {
                const card = document.createElement('div');
                card.className = 'resident-card';
                card.innerHTML = `<h3>${resident.firstName} ${resident.lastName}</h3>`;
                card.addEventListener('click', () => this.showResidentDetails(resident));
                cardsContainer.appendChild(card);
            });
        } else {
            // Wenn ein Filter aktiv ist, zeige die gruppierten Bewohner
            const groupedResidents = this.groupResidentsByActiveFilter(residents);
            
            // Sortiere die Gruppen, sodass "Kein Informationen vorhanden" an letzter Stelle erscheint
            const sortedGroups = Object.entries(groupedResidents).sort(([groupA], [groupB]) => {
                if (groupA === 'Kein Informationen vorhanden') return 1;
                if (groupB === 'Kein Informationen vorhanden') return -1;
                return groupA.localeCompare(groupB);
            });
            
            sortedGroups.forEach(([group, groupResidents]) => {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'group-header';
                groupHeader.textContent = group;
                cardsContainer.appendChild(groupHeader);
                
                // Erstelle einen Container für die Karten dieser Gruppe
                const groupCardsContainer = document.createElement('div');
                groupCardsContainer.className = 'group-cards';
                
                groupResidents.forEach(resident => {
                    const card = document.createElement('div');
                    card.className = 'resident-card';
                    card.innerHTML = `<h3>${resident.firstName} ${resident.lastName}</h3>`;
                    card.addEventListener('click', () => this.showResidentDetails(resident));
                    groupCardsContainer.appendChild(card);
                });
                
                cardsContainer.appendChild(groupCardsContainer);
            });
        }

        residentsList.appendChild(cardsContainer);
    },

    getActiveFilterName() {
        if (this.currentFilters.fields.length > 0) {
            const fieldValue = this.currentFilters.fields[0];
            const filterOptions = document.getElementById('filterOptions');
            const fieldBtn = filterOptions.querySelector(`.field-filter[data-value="${fieldValue}"]`);
            return fieldBtn ? fieldBtn.textContent.trim() : fieldValue;
        }
        
        if (this.currentFilters.areas.length > 0) {
            return this.currentFilters.areas[0];
        }
        
        return null;
    },

    groupResidentsByActiveFilter(residents) {
        const groups = {};
        
        // Wenn ein Feld-Filter aktiv ist
        if (this.currentFilters.fields.length > 0) {
            const fieldId = this.currentFilters.fields[0];
            
            // Standardgruppe für Personen ohne Informationen
            groups['Kein Informationen vorhanden'] = [];

        residents.forEach(resident => {
                const value = resident[fieldId];
                
                if (!value || value === '') {
                    groups['Kein Informationen vorhanden'].push(resident);
                } else {
                    if (!groups[value]) {
                        groups[value] = [];
                    }
                    groups[value].push(resident);
                }
            });
            
            return groups;
        }
        
        // Wenn ein Bereichs-Filter aktiv ist
        if (this.currentFilters.areas.length > 0) {
            const areaName = this.currentFilters.areas[0];
            const areaGroups = {};
            
            // Standardgruppe für Personen ohne Informationen
            areaGroups['Kein Informationen vorhanden'] = [];
            
            residents.forEach(resident => {
                if (!resident.areas || !resident.areas[areaName] || !resident.areas[areaName].length) {
                    areaGroups['Kein Informationen vorhanden'].push(resident);
                    return;
                }
                
                const values = resident.areas[areaName].split(',').map(v => v.trim()).filter(v => v);
                
                if (values.length === 0) {
                    areaGroups['Kein Informationen vorhanden'].push(resident);
                    return;
                }
                
                values.forEach(value => {
                    if (!areaGroups[value]) {
                        areaGroups[value] = [];
                    }
                    if (!areaGroups[value].includes(resident)) {
                        areaGroups[value].push(resident);
                    }
                });
            });
            
            // Entferne leere Gruppen
            Object.keys(areaGroups).forEach(key => {
                if (areaGroups[key].length === 0 && key !== 'Kein Informationen vorhanden') {
                    delete areaGroups[key];
                }
            });
            
            return areaGroups;
        }
        
        // Wenn kein Filter aktiv ist
        groups['Alle Bewohner'] = residents;
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

    // Initialisiere die Event-Listener für die Filter
    initFilterListeners() {
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) return;

        filterOptions.addEventListener('click', (event) => {
            const target = event.target;
            
            if (target.classList.contains('field-filter') || target.classList.contains('area-filter')) {
                this.handleFilterButtonClick(target);
            }
        });
    },

    // Event-Handler für Filter-Button-Klicks
    async handleFilterButtonClick(button) {
        const isFieldFilter = button.classList.contains('field-filter');
        const isAreaFilter = button.classList.contains('area-filter');
        const filterValue = button.dataset.value;
        const wasActive = button.classList.contains('active');

        // Zurücksetzen aller Filter
        this.currentFilters.fields = [];
        this.currentFilters.areas = [];

        // Aktiviere den Filter, wenn er nicht bereits aktiv war
        if (!wasActive) {
            if (isFieldFilter) {
                this.currentFilters.fields = [filterValue];
            } else if (isAreaFilter) {
                this.currentFilters.areas = [filterValue];
            }
        }

        // Speichere die Filter
        await this.saveFilters();

        // Aktualisiere die Benutzeroberfläche
        this.updateFilterUI();

        // Lade die Bewohner neu und wende die Filter an
        await this.loadAndDisplayResidents();
    },

    createResidentCard(resident, showLastNameFirst = false) {
        const card = document.createElement('div');
        card.className = 'resident-card';
        
        const displayName = showLastNameFirst 
            ? `${resident.lastName}, ${resident.firstName}`
            : `${resident.firstName} ${resident.lastName}`;
            
        card.innerHTML = `<h3>${displayName}</h3>`;
        
        // Event-Listener für Klicks
        card.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/solo/config');
                const config = await response.json();
                
                const modal = document.getElementById('residentDetailModal');
                const content = modal.querySelector('.modal-content');

                // Gruppiere die Bereiche
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
                                        data-multiple="${area.allowMultiple || false}"
                                        ${!area.menuRelevant ? 'disabled' : ''}>
                                        ${button.label}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `).join('') || '';

                content.innerHTML = `
                    <div class="modal-header">
                        <h2>${resident.firstName} ${resident.lastName}</h2>
                        <button type="button" class="icon-btn close-modal">×</button>
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

                // Event Listener für die Bereichs-Buttons
                content.querySelectorAll('.area-buttons .filter-button:not([disabled])').forEach(button => {
                    button.addEventListener('click', () => {
                        const area = button.dataset.area;
                        const buttonLabel = button.dataset.button;
                        const currentArea = config.areas.find(a => a.name === area);
                        
                        // Hier prüfen wir auf allowMultiple statt multiple
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
                        
                        console.log(`Bereich ${area}, Multiple: ${isMultiple}, Buttons: ${buttons.join(', ')}, Button Status: ${wasActive ? 'war aktiv' : 'war inaktiv'}`);
                    });
                });

                // Event Listener für den Speichern-Button
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
                        const residentsResponse = await fetch('/api/solo/residents');
                        const residents = await residentsResponse.json();
                        this.displayResidents(residents, config);
                    } else {
                        const error = await response.json();
                        Toast.show('Fehler beim Speichern: ' + (error.error || 'Unbekannter Fehler'), 'error');
                    }
                });

                // Event Listener für den Entlassen-Button
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

                Modal.show('residentDetailModal');
            } catch (error) {
                console.error('Fehler beim Anzeigen der Bewohnerdetails:', error);
                Toast.show('Fehler beim Anzeigen der Bewohnerdetails', 'error');
            }
        });
        
        return card;
    }
}; 