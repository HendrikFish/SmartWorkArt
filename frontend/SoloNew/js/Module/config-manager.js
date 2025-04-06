/**
 * Config-Manager Modul
 * Verwaltet die Konfiguration der Anwendung (Felder, Bereiche, Filter)
 */

import { ApiService } from './api-service.js';
import { ToastManager } from './toast-manager.js';
import { ModalManager } from './modal-manager.js';

export const ConfigManager = {
    config: {
        fields: [],
        areas: []
    },
    
    /**
     * Initialisiert den Config-Manager
     * @param {Object} options - Konfigurationsoptionen
     * @returns {Promise<void>}
     */
    async init(options = {}) {
        try {
            // Lade die Konfiguration vom Server
            const config = await ApiService.getConfig();
            
            if (config && typeof config === 'object') {
                this.config = config;
                console.log('Konfiguration geladen:', this.config);
            } else {
                console.warn('Ungültiges Konfigurationsformat, verwende Standardkonfiguration');
            }
            
            // Initialisiere Event-Listener für Konfigurationsmodal
            this.initConfigModalListeners();
        } catch (error) {
            console.error('Fehler beim Laden der Konfiguration:', error);
            ToastManager.error('Fehler beim Laden der Konfiguration. Verwende Standardkonfiguration.');
            
            // Verwende Standardkonfiguration
            this.config = {
                fields: [],
                areas: []
            };
        }
    },
    
    /**
     * Initialisiert die Event-Listener für das Konfigurationsmodal
     */
    initConfigModalListeners() {
        console.log('Initialisiere Event-Listener für das Konfigurationsmodal');
        
            // Event-Listener für Tab-Buttons
            document.querySelectorAll('[data-bs-toggle="tab"]').forEach(button => {
                button.addEventListener('shown.bs.tab', (event) => {
                    const targetId = event.target.getAttribute('data-bs-target');
                    
                    // Wenn der Filter-Tab angezeigt wird, aktualisiere die Filteroptionen
                    if (targetId === '#filterTab') {
                        this.updateFilterOptions();
                    } else if (targetId === '#fieldsTab') {
                        this.updateFieldsList();
                    } else if (targetId === '#areasTab') {
                        this.updateAreasList();
                    }
                });
            });
            
        // Event-Listener für das Speichern der Konfiguration - VERBESSERT
            const saveConfigBtn = document.getElementById('saveConfigBtn');
            if (saveConfigBtn) {
            // Alle vorhandenen Event-Listener entfernen
                const newSaveBtn = saveConfigBtn.cloneNode(true);
                saveConfigBtn.parentNode.replaceChild(newSaveBtn, saveConfigBtn);
                
            // Neuen Event-Listener hinzufügen
                newSaveBtn.addEventListener('click', async (event) => {
                    console.log('Speichern-Button wurde geklickt');
                    event.preventDefault();
                    
                    try {
                        // Sammle die aktualisierten Konfigurationsdaten aus dem Modal
                        const updatedConfig = this.collectConfigData();
                    console.log('Gesammelte Konfigurationsdaten:', updatedConfig);
                        
                        // Speichere die Konfiguration
                        await this.saveConfig(updatedConfig);
                    console.log('Konfiguration wurde gespeichert');
                        
                    // Erfasse den aktiven Filter im Filter-Tab
                        const activeFilterButton = document.querySelector('#filterTab .filter-btn.area-filter.active');
                        if (activeFilterButton) {
                        const areaName = activeFilterButton.dataset.area || activeFilterButton.dataset.value;
                            console.log('Aktiver Filter gefunden:', areaName);
                            
                            // Importiere FilterManager und wende Filter an
                        import('./filter-manager.js').then(async ({ FilterManager }) => {
                            console.log('FilterManager importiert, wende Filter an:', areaName);
                            await FilterManager.applyFilter(areaName);
                        }).catch(err => {
                            console.error('Fehler beim Importieren des FilterManagers:', err);
                        });
                    } else {
                        console.log('Kein aktiver Filter gefunden im Filter-Tab');
                        }
                        
                        // Schließe das Modal
                    const configModal = document.getElementById('configModal');
                        if (configModal) {
                        // Prüfe zuerst, ob Bootstrap global verfügbar ist
                        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                            const bootstrapModal = bootstrap.Modal.getInstance(configModal);
                            if (bootstrapModal) {
                                bootstrapModal.hide();
                            } else {
                                // Falls keine Instanz existiert, aber Bootstrap global ist
                                new bootstrap.Modal(configModal).hide();
                            }
                        } else {
                            // Direkter DOM-Ansatz, wenn Bootstrap nicht verfügbar ist
                            configModal.classList.remove('show');
                            configModal.style.display = 'none';
                            document.body.classList.remove('modal-open');
                            
                            // Entferne den Modal-Backdrop
                            const backdrop = document.querySelector('.modal-backdrop');
                            if (backdrop) {
                                backdrop.parentNode.removeChild(backdrop);
                            }
                            
                            // Data-Attribut setzen, damit Bootstrap weiß, dass das Modal geschlossen ist
                            configModal.setAttribute('aria-hidden', 'true');
                            configModal.removeAttribute('aria-modal');
                        }
                        }
                        
                        ToastManager.success('Konfiguration erfolgreich gespeichert');
                    } catch (error) {
                        console.error('Fehler beim Speichern der Konfiguration:', error);
                        ToastManager.error('Fehler beim Speichern: ' + error.message);
                    }
                });
                
                console.log('Event-Listener für saveConfigBtn hinzugefügt');
            } else {
                console.error('saveConfigBtn nicht gefunden');
            }
            
            // Event-Listener für Hinzufügen von Feldern
            const addFieldBtn = document.getElementById('addFieldBtn');
            if (addFieldBtn) {
                addFieldBtn.addEventListener('click', () => {
                    this.addNewField();
                });
            }
            
            // Event-Listener für Hinzufügen von Bereichen
            const addAreaBtn = document.getElementById('addAreaBtn');
            if (addAreaBtn) {
                addAreaBtn.addEventListener('click', () => {
                    this.addNewArea();
                });
            }
    },
    
    /**
     * Aktualisiert die Anzeige der Felder im Konfigurationsmodal
     */
    updateFieldsList() {
        const fieldsList = document.getElementById('fieldsList');
        if (!fieldsList) return;
        
        // Leere die Liste
        fieldsList.innerHTML = '';
        
        // Füge für jedes Feld eine Karte hinzu
        this.config.fields.forEach((field, index) => {
            // Ignoriere die Standardfelder firstName und lastName
            if (!['firstName', 'lastName'].includes(field.id)) {
                const fieldCard = document.createElement('div');
                fieldCard.className = 'card mb-3';
                fieldCard.dataset.fieldId = field.id;
                
                fieldCard.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${field.label}</h5>
                        <button type="button" class="btn btn-sm btn-danger delete-field-btn" data-field-id="${field.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <label for="field-label-${index}" class="form-label">Bezeichnung</label>
                            <input type="text" class="form-control field-label" id="field-label-${index}" value="${field.label}">
                        </div>
                        <div class="mb-3">
                            <label for="field-type-${index}" class="form-label">Typ</label>
                            <select class="form-select field-type" id="field-type-${index}">
                                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                <option value="number" ${field.type === 'number' ? 'selected' : ''}>Zahl</option>
                                <option value="date" ${field.type === 'date' ? 'selected' : ''}>Datum</option>
                                <option value="checkbox" ${field.type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                                <option value="select" ${field.type === 'select' ? 'selected' : ''}>Auswahl</option>
                            </select>
                        </div>
                        <div class="form-check form-switch">
                            <input class="form-check-input field-required" type="checkbox" id="field-required-${index}" ${field.required ? 'checked' : ''}>
                            <label class="form-check-label" for="field-required-${index}">Pflichtfeld</label>
                        </div>
                    </div>
                `;
                
                fieldsList.appendChild(fieldCard);
                
                // Event-Listener für Änderungen
                const labelInput = fieldCard.querySelector('.field-label');
                const typeSelect = fieldCard.querySelector('.field-type');
                const requiredCheckbox = fieldCard.querySelector('.field-required');
                
                labelInput.addEventListener('change', () => {
                    this.updateField(field.id, { label: labelInput.value });
                });
                
                typeSelect.addEventListener('change', () => {
                    this.updateField(field.id, { type: typeSelect.value });
                });
                
                requiredCheckbox.addEventListener('change', () => {
                    this.updateField(field.id, { required: requiredCheckbox.checked });
                });
                
                // Event-Listener für Löschen-Button
                const deleteBtn = fieldCard.querySelector('.delete-field-btn');
                deleteBtn.addEventListener('click', () => {
                    this.removeField(field.id);
                    this.updateFieldsList();
                });
            }
        });
    },
    
    /**
     * Fügt ein neues Feld hinzu
     */
    addNewField() {
        const newField = {
            id: 'field_' + Date.now(),
            label: 'Neues Feld',
            type: 'text',
            required: false
        };
        
        this.addField(newField);
        this.updateFieldsList();
    },
    
    /**
     * Aktualisiert die Anzeige der Bereiche im Konfigurationsmodal
     */
    updateAreasList() {
        const areasList = document.getElementById('areasList');
        if (!areasList) return;
        
        // Leere die Liste
        areasList.innerHTML = '';
        
        // Wenn keine Bereiche vorhanden sind, zeige eine Meldung an
        if (!this.config.areas || this.config.areas.length === 0) {
            areasList.innerHTML = `
                <div class="alert alert-info">
                    Keine Bereiche konfiguriert. Klicken Sie auf "Bereich hinzufügen", um einen neuen Bereich zu erstellen.
                </div>
            `;
            return;
        }
        
        // Füge für jeden Bereich eine Karte hinzu
        this.config.areas.forEach((area, index) => {
            const areaCard = document.createElement('div');
            areaCard.className = 'card mb-3';
            areaCard.dataset.areaName = area.name;
            
            areaCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">${area.name}</h5>
                    <button type="button" class="btn btn-sm btn-danger delete-area-btn" data-area-name="${area.name}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="area-name-${index}" class="form-label">Name</label>
                        <input type="text" class="form-control area-name" id="area-name-${index}" value="${area.name}">
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-multiple" type="checkbox" id="area-multiple-${index}" ${area.multiple ? 'checked' : ''}>
                            <label class="form-check-label" for="area-multiple-${index}">Mehrfachauswahl</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-menu-filter" type="checkbox" id="area-menu-filter-${index}" ${area.menuFilter ? 'checked' : ''}>
                            <label class="form-check-label" for="area-menu-filter-${index}">Als Filter verwenden</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <div class="form-check form-switch">
                            <input class="form-check-input area-changeable" type="checkbox" id="area-changeable-${index}" ${area.changeable ? 'checked' : ''}>
                            <label class="form-check-label" for="area-changeable-${index}">In Bewohner Card anzeigen</label>
                        </div>
                    </div>
                    <div class="mb-3">
                        <h6>Buttons</h6>
                        <div class="buttons-list" id="area-buttons-${index}">
                            ${area.buttons.map((button, btnIndex) => `
                                <div class="input-group mb-2">
                                    <input type="text" class="form-control button-label" value="${button.label}" data-index="${btnIndex}">
                                    <button class="btn btn-outline-danger delete-button-btn" type="button" data-index="${btnIndex}">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary add-button-btn" data-area-name="${area.name}">
                            <i class="fas fa-plus"></i> Button hinzufügen
                        </button>
                    </div>
                </div>
            `;
            
            areasList.appendChild(areaCard);
            
            // Event-Listener für Änderungen
            const nameInput = areaCard.querySelector('.area-name');
            const multipleCheckbox = areaCard.querySelector('.area-multiple');
            const menuFilterCheckbox = areaCard.querySelector('.area-menu-filter');
            const changeableCheckbox = areaCard.querySelector('.area-changeable');
            
            nameInput.addEventListener('change', () => {
                const oldName = area.name;
                const newName = nameInput.value;
                this.updateArea(oldName, { name: newName });
                areaCard.dataset.areaName = newName;
                this.updateAreasList();
            });
            
            multipleCheckbox.addEventListener('change', () => {
                this.updateArea(area.name, { multiple: multipleCheckbox.checked });
            });
            
            menuFilterCheckbox.addEventListener('change', () => {
                this.updateArea(area.name, { menuFilter: menuFilterCheckbox.checked });
            });
            
            changeableCheckbox.addEventListener('change', () => {
                this.updateArea(area.name, { changeable: changeableCheckbox.checked });
            });
            
            // Event-Listener für Löschen-Button
            const deleteBtn = areaCard.querySelector('.delete-area-btn');
            deleteBtn.addEventListener('click', () => {
                this.removeArea(area.name);
                this.updateAreasList();
            });
            
            // Event-Listener für Button-Labels und Löschen-Buttons
            const buttonLabels = areaCard.querySelectorAll('.button-label');
            buttonLabels.forEach(input => {
                input.addEventListener('change', () => {
                    const btnIndex = parseInt(input.dataset.index);
                    const oldLabel = area.buttons[btnIndex].label;
                    this.updateButton(area.name, oldLabel, { label: input.value });
                });
            });
            
            const deleteButtonBtns = areaCard.querySelectorAll('.delete-button-btn');
            deleteButtonBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const btnIndex = parseInt(btn.dataset.index);
                    const buttonLabel = area.buttons[btnIndex].label;
                    this.removeButton(area.name, buttonLabel);
                    this.updateAreasList();
                });
            });
            
            // Event-Listener für Button hinzufügen
            const addButtonBtn = areaCard.querySelector('.add-button-btn');
            addButtonBtn.addEventListener('click', () => {
                this.addButton(area.name, { label: 'Neuer Button' });
                this.updateAreasList();
            });
        });
    },
    
    /**
     * Fügt einen neuen Bereich hinzu
     */
    addNewArea() {
        const newArea = {
            name: 'Neuer Bereich',
            multiple: false,
            menuFilter: false,
            changeable: false,
            buttons: [
                { label: 'Option 1' },
                { label: 'Option 2' }
            ]
        };
        
        this.addArea(newArea);
        this.updateAreasList();
    },
    
    /**
     * Aktualisiert die Filteroptionen im Konfigurationsmodal
     */
    updateFilterOptions() {
        console.log('Aktualisiere Sortieroptionen...');
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) {
            console.error('Element #filterOptions nicht gefunden');
            return;
        }
        
        // Leere die Filteroptionen
        filterOptions.innerHTML = '';
        
        // Extrahiere die filterfähigen Bereiche aus der Konfiguration
        const filterAreas = this.config.areas.filter(area => area.menuFilter === true);
        
        if (filterAreas.length === 0) {
                filterOptions.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Keine Bereiche für Sortierung konfiguriert. Bitte fügen Sie Bereiche hinzu und markieren Sie sie als "Als Filter verwenden".
                    </div>
                `;
            return;
        }

        console.log('Sortierbereiche:', filterAreas);

        // Für jeden Bereich eine Sortier-Gruppe erstellen
        filterAreas.forEach(area => {
            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group mb-4';

            // Bereichsname als Überschrift
            const header = document.createElement('h5');
            header.className = 'filter-header mb-2';
            header.textContent = `Nach ${area.name} sortieren`;
            filterGroup.appendChild(header);

            // Buttons-Container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'filter-buttons d-flex flex-wrap gap-2';

            // "Alle anzeigen" Button für allgemeine Sortierung nach Bereich
            const allButton = document.createElement('button');
            allButton.className = 'btn btn-sm btn-outline-primary filter-btn area-filter';
            allButton.dataset.area = area.name;
            allButton.textContent = 'Nach allen Optionen gruppieren';

            // Aktiven Status setzen, wenn der Bereich bereits ausgewählt ist
            try {
                // Versuche, den FilterManager zu importieren
                import('./filter-manager.js').then(({ FilterManager }) => {
                    if (FilterManager.config && 
                        FilterManager.config.filters && 
                        FilterManager.config.filters.areas && 
                        FilterManager.config.filters.areas.includes(area.name)) {
                        allButton.classList.add('active');
                    }
                }).catch(err => {
                    console.warn('FilterManager konnte nicht importiert werden:', err);
                });
            } catch (error) {
                console.warn('Fehler beim Überprüfen des aktiven Filters:', error);
            }

            // Event-Listener für den Button
            allButton.addEventListener('click', () => {
                // Entferne aktiven Status von allen Buttons
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });

                // Setze aktiven Status für diesen Button
                allButton.classList.add('active');
            });

            buttonsContainer.appendChild(allButton);

            // Erstelle für jeden Button im Bereich einen Sortier-Button
            if (area.buttons && area.buttons.length > 0) {
                area.buttons.forEach(button => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-sm btn-outline-secondary filter-btn';
                    btn.dataset.area = area.name;
                    btn.dataset.value = button.label;
                    btn.textContent = button.label;

                    // Event-Listener für spezifische Sortierung
                    btn.addEventListener('click', () => {
                        // Entferne aktiven Status von allen Buttons
                        document.querySelectorAll('.filter-btn').forEach(b => {
                            b.classList.remove('active');
                        });

                        // Setze aktiven Status für diesen Button
                        btn.classList.add('active');
                    });

                    buttonsContainer.appendChild(btn);
                });
            }

            filterGroup.appendChild(buttonsContainer);
            filterOptions.appendChild(filterGroup);
        });

        // Füge einen "Sortierung zurücksetzen" Button hinzu
        const resetButton = document.createElement('div');
        resetButton.className = 'mt-3';
        resetButton.innerHTML = `
            <button class="btn btn-sm btn-outline-danger reset-filter-btn">Sortierung zurücksetzen</button>
        `;
        resetButton.querySelector('button').addEventListener('click', () => {
            try {
                import('./filter-manager.js').then(({ FilterManager }) => {
                    FilterManager.resetFilter();
                    
                    // Deaktiviere alle Filter-Buttons
                    document.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                }).catch(err => {
                    console.warn('FilterManager konnte nicht importiert werden:', err);
                });
            } catch (error) {
                console.warn('Fehler beim Zurücksetzen der Sortierung:', error);
            }
        });
        filterOptions.appendChild(resetButton);
        
        // Registriere Event-Listener für den Speichern-Button
        this.registerFilterSaveHandler();
    },
    
    /**
     * Registriert den Event-Handler für den Speichern-Button im Konfigurationsmodal
     * für die Filteranwendung
     */
    registerFilterSaveHandler() {
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        
        if (!saveConfigBtn) {
            console.warn('saveConfigBtn nicht gefunden, kann Event-Handler für Sortierung nicht registrieren');
            return;
        }

        // Entferne alle bestehenden Event-Listener
        const newSaveBtn = saveConfigBtn.cloneNode(true);
        saveConfigBtn.parentNode.replaceChild(newSaveBtn, saveConfigBtn);
        
        // Füge neuen Event-Listener hinzu
        newSaveBtn.addEventListener('click', () => {
            // Speichere die Konfiguration
            this.saveConfig().then(() => {
                console.log('Konfiguration gespeichert, wende Sortierung an...');
                
                // Finde alle aktiven Filter-Buttons
                const activeFilterBtns = document.querySelectorAll('#filterOptions .filter-btn.active');
                
                if (activeFilterBtns.length > 0) {
                    // Importiere FilterManager und wende den Filter an
                    import('./filter-manager.js').then(({ FilterManager }) => {
                        const activeBtn = activeFilterBtns[0]; // Nimm den ersten aktiven Button
                        const area = activeBtn.dataset.area;
                        const value = activeBtn.dataset.value;
                        
                        if (area) {
                            FilterManager.applyFilter(area, value);
                        }
                    }).catch(err => {
                        console.error('Fehler beim Importieren des FilterManagers:', err);
                    });
                }
                
                // Schließe das Modal
                const configModal = document.getElementById('configModal');
                if (configModal) {
                    // Prüfe zuerst, ob Bootstrap global verfügbar ist
                    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                        const bootstrapModal = bootstrap.Modal.getInstance(configModal);
                        if (bootstrapModal) {
                            bootstrapModal.hide();
                        } else {
                            // Falls keine Instanz existiert, aber Bootstrap global ist
                            new bootstrap.Modal(configModal).hide();
                        }
                    } else {
                        // Direkter DOM-Ansatz, wenn Bootstrap nicht verfügbar ist
                        configModal.classList.remove('show');
                        configModal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        
                        // Entferne den Modal-Backdrop
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.parentNode.removeChild(backdrop);
                        }
                        
                        // Data-Attribut setzen, damit Bootstrap weiß, dass das Modal geschlossen ist
                        configModal.setAttribute('aria-hidden', 'true');
                        configModal.removeAttribute('aria-modal');
                    }
                }
            }).catch(err => {
                console.error('Fehler beim Speichern der Konfiguration:', err);
            });
        });
    },
    
    /**
     * Sammelt die aktualisierten Konfigurationsdaten aus dem Modal
     * @returns {Object} - Gesammelte Konfigurationsdaten
     */
    collectConfigData() {
        try {
            // Beginne mit einer Kopie der aktuellen Konfiguration
            const configData = {
                fields: [...this.config.fields],
                areas: [...this.config.areas]
            };

            // Sammle die aktualisierten Daten für Felder
            const fieldCards = document.querySelectorAll('#fieldsList .card');
            fieldCards.forEach(card => {
                const fieldId = card.dataset.fieldId;
                if (!fieldId) return;

                const labelInput = card.querySelector('.field-label');
                const typeSelect = card.querySelector('.field-type');
                const requiredCheckbox = card.querySelector('.field-required');

                if (labelInput && typeSelect) {
                    const fieldIndex = configData.fields.findIndex(f => f.id === fieldId);
                    if (fieldIndex !== -1) {
                        configData.fields[fieldIndex] = {
                            ...configData.fields[fieldIndex],
                            label: labelInput.value,
                            type: typeSelect.value,
                            required: requiredCheckbox ? requiredCheckbox.checked : false
                        };
                    }
                }
            });

            // Sammle die aktualisierten Daten für Bereiche
            const areaCards = document.querySelectorAll('#areasList .card');
            areaCards.forEach(card => {
                const areaName = card.dataset.areaName;
                if (!areaName) return;

                const nameInput = card.querySelector('.area-name');
                const multipleCheckbox = card.querySelector('.area-multiple');
                const menuFilterCheckbox = card.querySelector('.area-menu-filter');
                const changeableCheckbox = card.querySelector('.area-changeable');
                
                if (nameInput) {
                    const areaIndex = configData.areas.findIndex(a => a.name === areaName);
                    if (areaIndex !== -1) {
                        // Buttons sammeln
                        const buttonLabels = Array.from(card.querySelectorAll('.button-label')).map(input => ({
                            label: input.value
                        }));

                        // Bereich aktualisieren
                        configData.areas[areaIndex] = {
                            ...configData.areas[areaIndex],
                            name: nameInput.value,
                            multiple: multipleCheckbox ? multipleCheckbox.checked : false,
                            menuFilter: menuFilterCheckbox ? menuFilterCheckbox.checked : false,
                            changeable: changeableCheckbox ? changeableCheckbox.checked : false,
                            buttons: buttonLabels
                        };
                    }
                }
            });

            // Sammle die ausgewählten Filter aus dem Filter-Tab
            const activeFilterButtons = document.querySelectorAll('#filterTab .filter-btn.active');
            if (activeFilterButtons.length > 0) {
                // Hole die aktiven Filter
                const activeAreaFilters = Array.from(activeFilterButtons)
                    .filter(btn => btn.classList.contains('area-filter'))
                    .map(btn => btn.dataset.value || btn.dataset.area);

                // Aktualisiere die Filtereinstellungen in der Konfiguration
                if (activeAreaFilters.length > 0) {
                    console.log('Aktive Filter erfasst:', activeAreaFilters);
                }
            }

            console.log('Gesammelte Konfigurationsdaten:', configData);
            return configData;
        } catch (error) {
            console.error('Fehler beim Sammeln der Konfigurationsdaten:', error);
            ToastManager.error('Fehler beim Sammeln der Konfigurationsdaten');
            throw error;
        }
    },
    
    /**
     * Lädt die Konfiguration neu
     * @returns {Promise<Object>} - Geladene Konfiguration
     */
    async reloadConfig() {
        try {
            const config = await ApiService.getConfig();
            
            if (config && typeof config === 'object') {
                this.config = config;
                console.log('Konfiguration neu geladen:', this.config);
            }
            
            return this.config;
        } catch (error) {
            console.error('Fehler beim Neuladen der Konfiguration:', error);
            ToastManager.error('Fehler beim Neuladen der Konfiguration.');
            throw error;
        }
    },
    
    /**
     * Speichert die Konfiguration
     * @param {Object} newConfig - Neue Konfiguration
     * @returns {Promise<Object>} - Gespeicherte Konfiguration
     */
    async saveConfig(newConfig = null) {
        try {
            const configToSave = newConfig || this.config;
            
            // Validiere die Konfiguration vor dem Speichern
            if (!this.validateConfig(configToSave)) {
                throw new Error('Ungültige Konfiguration');
            }
            
            const result = await ApiService.updateConfig(configToSave);
            
            if (result && result.success) {
                this.config = configToSave;
                ToastManager.success('Konfiguration erfolgreich gespeichert');
                
                // Nach dem Speichern der Konfiguration die Filter aktualisieren
                try {
                    // Module importieren
                    const { FilterManager } = await import('./filter-manager.js');
                    const { renderFilters } = await import('../filters.js');
                    
                    // Aktiven Filter aus der UI auslesen
                    const activeFilterButton = document.querySelector('.filter-btn.area-filter.active');
                    if (activeFilterButton) {
                        const areaName = activeFilterButton.dataset.value || activeFilterButton.dataset.area;
                        console.log('Aktiver Filter gefunden:', areaName);
                        
                        // Finde den Bereich in der neuen Konfiguration
                        const area = this.config.areas.find(a => a.name === areaName);
                        if (area) {
                            // Filter-Konfiguration aktualisieren und speichern
                            FilterManager.config.filters.areas = [areaName];
                            await FilterManager.saveFilterConfig();
                            
                            // Filter anwenden, um die Bewohner zu sortieren
                            await FilterManager.applyFilter(areaName);
                        }
                    }
                    
                    // Filter im Konfigurationsmodal neu rendern
                    const filterOptionsContainer = document.getElementById('filterOptions');
                    if (filterOptionsContainer) {
                        console.log('Filter im Konfigurationsmodal werden neu gerendert');
                        renderFilters(filterOptionsContainer, this.config);
                    }
                    
                    // Filter in der Seitenleiste neu rendern
                    const filterSidebar = document.getElementById('filterSidebar');
                    if (filterSidebar) {
                        console.log('Filter in der Seitenleiste werden neu gerendert');
                        renderFilters(filterSidebar, this.config);
                    }
                    
                } catch (filterError) {
                    console.error('Fehler beim Aktualisieren der Filter nach Konfigurationsänderung:', filterError);
                }
                
                return this.config;
            } else {
                throw new Error('Server konnte die Konfiguration nicht speichern');
            }
        } catch (error) {
            console.error('Fehler beim Speichern der Konfiguration:', error);
            ToastManager.error('Fehler beim Speichern der Konfiguration: ' + error.message);
            throw error;
        }
    },
    
    /**
     * Validiert eine Konfiguration
     * @param {Object} config - Zu validierende Konfiguration
     * @returns {boolean} - Ist die Konfiguration gültig?
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            return false;
        }
        
        // Prüfe, ob fields ein Array ist
        if (!Array.isArray(config.fields)) {
            return false;
        }
        
        // Prüfe, ob areas ein Array ist
        if (!Array.isArray(config.areas)) {
            return false;
        }
        
        // Zusätzliche Validierungen für Felder
        for (const field of config.fields) {
            if (!field.id || !field.label || typeof field.id !== 'string' || typeof field.label !== 'string') {
                return false;
            }
        }
        
        // Zusätzliche Validierungen für Bereiche
        for (const area of config.areas) {
            if (!area.name || typeof area.name !== 'string') {
                return false;
            }
            
            if (!Array.isArray(area.buttons)) {
                return false;
            }
            
            // Prüfe Buttons in jedem Bereich
            for (const button of area.buttons) {
                if (!button.label || typeof button.label !== 'string') {
                    return false;
                }
            }
        }
        
        return true;
    },
    
    /**
     * Fügt ein neues Feld zur Konfiguration hinzu
     * @param {Object} field - Felddaten
     */
    addField(field) {
        // Prüfe, ob das Feld gültig ist
        if (!field.id || !field.label) {
            throw new Error('Feld-ID und Bezeichnung sind erforderlich');
        }
        
        // Prüfe, ob die ID bereits existiert
        const existingField = this.config.fields.find(f => f.id === field.id);
        if (existingField) {
            throw new Error(`Feld mit ID "${field.id}" existiert bereits`);
        }
        
        // Füge das Feld hinzu
        this.config.fields.push(field);
    },
    
    /**
     * Aktualisiert ein Feld in der Konfiguration
     * @param {string} fieldId - ID des zu aktualisierenden Felds
     * @param {Object} updatedField - Aktualisierte Felddaten
     */
    updateField(fieldId, updatedField) {
        const index = this.config.fields.findIndex(f => f.id === fieldId);
        
        if (index === -1) {
            throw new Error(`Feld mit ID "${fieldId}" nicht gefunden`);
        }
        
        // Aktualisiere das Feld
        this.config.fields[index] = {
            ...this.config.fields[index],
            ...updatedField,
            id: fieldId // ID kann nicht geändert werden
        };
    },
    
    /**
     * Entfernt ein Feld aus der Konfiguration
     * @param {string} fieldId - ID des zu entfernenden Felds
     */
    removeField(fieldId) {
        const index = this.config.fields.findIndex(f => f.id === fieldId);
        
        if (index === -1) {
            throw new Error(`Feld mit ID "${fieldId}" nicht gefunden`);
        }
        
        // Entferne das Feld
        this.config.fields.splice(index, 1);
    },
    
    /**
     * Fügt einen neuen Bereich zur Konfiguration hinzu
     * @param {Object} area - Bereichsdaten
     */
    addArea(area) {
        // Prüfe, ob der Bereich gültig ist
        if (!area.name) {
            throw new Error('Bereichsname ist erforderlich');
        }
        
        // Prüfe, ob der Bereich bereits existiert
        const existingArea = this.config.areas.find(a => a.name === area.name);
        if (existingArea) {
            throw new Error(`Bereich "${area.name}" existiert bereits`);
        }
        
        // Stelle sicher, dass buttons ein Array ist
        if (!area.buttons || !Array.isArray(area.buttons)) {
            area.buttons = [];
        }
        
        // Füge den Bereich hinzu
        this.config.areas.push({
            name: area.name,
            multiple: !!area.multiple,
            menuFilter: !!area.menuFilter,
            changeable: !!area.changeable,
            buttons: area.buttons
        });
    },
    
    /**
     * Aktualisiert einen Bereich in der Konfiguration
     * @param {string} areaName - Name des zu aktualisierenden Bereichs
     * @param {Object} updatedArea - Aktualisierte Bereichsdaten
     */
    updateArea(areaName, updatedArea) {
        const index = this.config.areas.findIndex(a => a.name === areaName);
        
        if (index === -1) {
            throw new Error(`Bereich "${areaName}" nicht gefunden`);
        }
        
        // Aktualisiere den Bereich
        this.config.areas[index] = {
            ...this.config.areas[index],
            ...updatedArea,
            name: updatedArea.name || areaName // Name kann geändert werden
        };
    },
    
    /**
     * Entfernt einen Bereich aus der Konfiguration
     * @param {string} areaName - Name des zu entfernenden Bereichs
     */
    removeArea(areaName) {
        const index = this.config.areas.findIndex(a => a.name === areaName);
        
        if (index === -1) {
            throw new Error(`Bereich "${areaName}" nicht gefunden`);
        }
        
        // Entferne den Bereich
        this.config.areas.splice(index, 1);
    },
    
    /**
     * Fügt einen Button zu einem Bereich hinzu
     * @param {string} areaName - Name des Bereichs
     * @param {Object} button - Buttondaten
     */
    addButton(areaName, button) {
        const area = this.config.areas.find(a => a.name === areaName);
        
        if (!area) {
            throw new Error(`Bereich "${areaName}" nicht gefunden`);
        }
        
        if (!button.label) {
            throw new Error('Button-Bezeichnung ist erforderlich');
        }
        
        // Prüfe, ob der Button bereits existiert
        const existingButton = area.buttons.find(b => b.label === button.label);
        if (existingButton) {
            throw new Error(`Button "${button.label}" existiert bereits in diesem Bereich`);
        }
        
        // Füge den Button hinzu
        area.buttons.push({ label: button.label });
    },
    
    /**
     * Aktualisiert einen Button in einem Bereich
     * @param {string} areaName - Name des Bereichs
     * @param {string} oldLabel - Alte Bezeichnung des Buttons
     * @param {Object} updatedButton - Aktualisierte Buttondaten
     */
    updateButton(areaName, oldLabel, updatedButton) {
        const area = this.config.areas.find(a => a.name === areaName);
        
        if (!area) {
            throw new Error(`Bereich "${areaName}" nicht gefunden`);
        }
        
        const index = area.buttons.findIndex(b => b.label === oldLabel);
        
        if (index === -1) {
            throw new Error(`Button "${oldLabel}" nicht gefunden in Bereich "${areaName}"`);
        }
        
        // Aktualisiere den Button
        area.buttons[index] = { label: updatedButton.label };
    },
    
    /**
     * Entfernt einen Button aus einem Bereich
     * @param {string} areaName - Name des Bereichs
     * @param {string} buttonLabel - Bezeichnung des zu entfernenden Buttons
     */
    removeButton(areaName, buttonLabel) {
        const area = this.config.areas.find(a => a.name === areaName);
        
        if (!area) {
            throw new Error(`Bereich "${areaName}" nicht gefunden`);
        }
        
        const index = area.buttons.findIndex(b => b.label === buttonLabel);
        
        if (index === -1) {
            throw new Error(`Button "${buttonLabel}" nicht gefunden in Bereich "${areaName}"`);
        }
        
        // Entferne den Button
        area.buttons.splice(index, 1);
    },
    
    /**
     * Gibt alle Bereiche zurück
     * @returns {Array} - Liste aller Bereiche
     */
    getAreas() {
        return this.config.areas || [];
    },
    
    /**
     * Gibt einen Bereich anhand des Namens zurück
     * @param {string} areaName - Name des Bereichs
     * @returns {Object|null} - Bereichsobjekt oder null, wenn nicht gefunden
     */
    getArea(areaName) {
        return this.config.areas.find(a => a.name === areaName) || null;
    },
    
    /**
     * Gibt alle Felder zurück
     * @returns {Array} - Liste aller Felder
     */
    getFields() {
        return this.config.fields || [];
    },
    
    /**
     * Gibt ein Feld anhand der ID zurück
     * @param {string} fieldId - ID des Felds
     * @returns {Object|null} - Feldobjekt oder null, wenn nicht gefunden
     */
    getField(fieldId) {
        return this.config.fields.find(f => f.id === fieldId) || null;
    },
    
    /**
     * Gibt alle Bereiche zurück, die als Filter verwendet werden können
     * @returns {Array} - Liste der Filterbereiche
     */
    getFilterAreas() {
        return this.config.areas.filter(area => area.menuFilter) || [];
    },
    
    /**
     * Gibt alle Bereiche zurück, die in einem Bewohnerformular angezeigt werden sollen
     * @returns {Array} - Liste der relevanten Bereiche
     */
    getMenuRelevantAreas() {
        return this.config.areas.filter(area => area.menuFilter) || [];
    },
    
    /**
     * Gibt alle Bereiche zurück, die als In Bewohner Card anzeigen markiert sind
     * @returns {Array} - Liste der In Bewohner Card anzeigen Bereiche
     */
    getChangeableAreas() {
        return this.config.areas.filter(area => area.changeable) || [];
    },
    
    /**
     * Registriert Event-Listener für das Konfigurationsmodal
     */
    registerEventListeners() {
        // Event-Listener für saveConfigBtn
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', async () => {
                try {
                    console.log('Speichere Konfiguration...');
                    
                    // Sammle die aktuellen Konfigurationswerte aus den Formularfeldern
                    await this.collectConfigFromForm();
                    
                    // Speichere die Konfiguration
                    await this.saveConfig();
                    
                    // Aktualisiere Filter, wenn verfügbar
                    if (document.getElementById('filterOptions')) {
                        // Importiere FilterManager und aktualisiere dessen Konfiguration
                        import('./filter-manager.js').then(({ FilterManager }) => {
                            FilterManager.updateFilterOptions();
                        }).catch(err => {
                            console.error('Fehler beim Importieren des FilterManagers:', err);
                        });
                    } else {
                        console.log('Kein aktiver Filter gefunden im Filter-Tab');
                    }
                    
                    // Schließe das Modal mit Bootstrap
                    const configModal = document.getElementById('configModal');
                    if (configModal) {
                        // Schließe das Modal mit der Bootstrap API
                        const modal = bootstrap.Modal.getInstance(configModal);
                        if (modal) {
                            modal.hide();
                        } else {
                            // Falls keine Instance gefunden wurde, erstelle eine neue und schließe sie
                            new bootstrap.Modal(configModal).hide();
                        }
                    }
                    
                    ToastManager.success('Konfiguration erfolgreich gespeichert');
                } catch (error) {
                    console.error('Fehler beim Speichern der Konfiguration:', error);
                    ToastManager.error('Fehler beim Speichern: ' + error.message);
                }
            });
            
            console.log('Event-Listener für saveConfigBtn hinzugefügt');
        } else {
            console.error('saveConfigBtn nicht gefunden');
        }
        
        // Event-Listener für Hinzufügen von Feldern
        const addFieldBtn = document.getElementById('addFieldBtn');
        if (addFieldBtn) {
            addFieldBtn.addEventListener('click', () => {
                this.addNewField();
            });
        }
        
        // Event-Listener für Hinzufügen von Bereichen
        const addAreaBtn = document.getElementById('addAreaBtn');
        if (addAreaBtn) {
            addAreaBtn.addEventListener('click', () => {
                this.addNewArea();
            });
        }
    }
}; 