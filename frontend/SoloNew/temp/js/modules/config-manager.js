/**
 * Config-Manager
 * Verwaltet die Konfiguration der Anwendung
 */

import { ApiService } from './api-service.js';
import { ToastManager } from './toast-manager.js';

export const ConfigManager = {
    config: null,
    filters: null,
    bootstrap: null,
    
    /**
     * Initialisiert den Config-Manager
     * @returns {Promise<void>}
     */
    async init() {
        console.log('Config-Manager wird initialisiert...');
        this.bootstrap = window.bootstrap;
        
        try {
            // Konfiguration und Filter vom Server laden
            await this.loadConfig();
            await this.loadFilters();
            
            // Event-Listener für Konfigurationsformulare
            this.initEventListeners();
            
            console.log('Config-Manager erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Config-Managers:', error);
            ToastManager.error('Fehler beim Laden der Konfiguration');
            throw error;
        }
    },
    
    /**
     * Lädt die Konfiguration vom Server
     * @returns {Promise<Object>} - Geladene Konfiguration
     */
    async loadConfig() {
        try {
            this.config = await ApiService.getConfig();
            console.log('Konfiguration geladen:', this.config);
            return this.config;
        } catch (error) {
            console.error('Fehler beim Laden der Konfiguration:', error);
            
            // Fallback-Konfiguration
            this.config = {
                fields: [],
                areas: []
            };
            
            throw error;
        }
    },
    
    /**
     * Lädt die Filter-Konfiguration vom Server
     * @returns {Promise<Object>} - Geladene Filter-Konfiguration
     */
    async loadFilters() {
        try {
            this.filters = await ApiService.getFilters();
            console.log('Filter geladen:', this.filters);
            return this.filters;
        } catch (error) {
            console.error('Fehler beim Laden der Filter:', error);
            
            // Fallback-Filter
            this.filters = {
                fields: [],
                areas: []
            };
            
            throw error;
        }
    },
    
    /**
     * Initialisiert Event-Listener für Konfigurationsformulare
     */
    initEventListeners() {
        // Speichern-Button im Konfigurations-Modal
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            saveConfigBtn.addEventListener('click', async () => {
                await this.saveConfigFromModal();
            });
        }
        
        // "Bereich hinzufügen"-Button
        const addAreaBtn = document.getElementById('addAreaBtn');
        if (addAreaBtn) {
            addAreaBtn.addEventListener('click', () => {
                this.showAddAreaModal();
            });
        }
        
        // Speichern-Button im "Neuer Bereich"-Modal
        const saveAreaBtn = document.getElementById('saveAreaBtn');
        if (saveAreaBtn) {
            saveAreaBtn.addEventListener('click', () => {
                this.saveNewArea();
            });
        }
        
        // Option hinzufügen Button im "Neuer Bereich"-Modal
        const addOptionBtn = document.getElementById('addOptionBtn');
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', () => {
                this.addNewOption();
            });
        }
        
        // Event-Delegation für dynamisch erstellte Elemente
        document.addEventListener('click', (event) => {
            // Löschen-Button für Bereiche
            if (event.target.closest('.delete-area-btn')) {
                const areaId = event.target.closest('.area-card').dataset.areaId;
                this.deleteArea(areaId);
            }
            
            // Bearbeiten-Button für Bereiche
            if (event.target.closest('.edit-area-btn')) {
                const areaId = event.target.closest('.area-card').dataset.areaId;
                this.editArea(areaId);
            }
            
            // Löschen-Button für Optionen
            if (event.target.closest('.remove-option')) {
                const optionElement = event.target.closest('.area-button-input');
                if (optionElement) {
                    optionElement.remove();
                }
            }
        });
        
        // Event-Listener für Tabs im Konfigurations-Modal
        const configTabs = document.querySelectorAll('#configTab button');
        configTabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (event) => {
                const targetId = event.target.getAttribute('data-bs-target');
                if (targetId === '#filterTab') {
                    this.renderFilterOptions();
                } else if (targetId === '#areasTab') {
                    this.renderAreas();
                }
            });
        });
    },
    
    /**
     * Zeigt das Modal zum Hinzufügen eines neuen Bereichs an
     */
    showAddAreaModal() {
        // Modal-Formular zurücksetzen
        const form = document.getElementById('newAreaForm');
        if (form) form.reset();
        
        // Bestehende Optionsfelder entfernen
        const areaButtonsContainer = document.getElementById('areaButtonsContainer');
        if (areaButtonsContainer) {
            areaButtonsContainer.innerHTML = `
                <div class="input-group mb-2 area-button-input">
                    <input type="text" class="form-control" placeholder="Optionsname">
                    <button class="btn btn-outline-danger remove-option" type="button">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }
        
        // Modal anzeigen
        const newAreaModal = document.getElementById('newAreaModal');
        if (newAreaModal && this.bootstrap) {
            const modal = new this.bootstrap.Modal(newAreaModal);
            modal.show();
        }
    },
    
    /**
     * Fügt ein neues Optionsfeld zum "Neuer Bereich"-Formular hinzu
     */
    addNewOption() {
        const areaButtonsContainer = document.getElementById('areaButtonsContainer');
        if (areaButtonsContainer) {
            const newOptionElement = document.createElement('div');
            newOptionElement.className = 'input-group mb-2 area-button-input';
            newOptionElement.innerHTML = `
                <input type="text" class="form-control" placeholder="Optionsname">
                <button class="btn btn-outline-danger remove-option" type="button">
                    <i class="fas fa-times"></i>
                </button>
            `;
            areaButtonsContainer.appendChild(newOptionElement);
        }
    },
    
    /**
     * Speichert einen neuen Bereich aus dem Modal-Formular
     */
    saveNewArea() {
        // Formularvalidierung
        const areaName = document.getElementById('areaName').value.trim();
        if (!areaName) {
            ToastManager.error('Bitte geben Sie einen Namen für den Bereich ein.');
            document.getElementById('areaName').classList.add('is-invalid');
            return;
        }
        
        // Optionen sammeln
        const optionInputs = document.querySelectorAll('#areaButtonsContainer input');
        const buttons = [];
        
        optionInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                buttons.push({ label: value });
            }
        });
        
        if (buttons.length === 0) {
            ToastManager.error('Bitte fügen Sie mindestens eine Option hinzu.');
            return;
        }
        
        // Bereichsobjekt erstellen
        const newArea = {
            name: areaName,
            multiple: document.getElementById('areaMultiple').checked,
            menuFilter: document.getElementById('areaMenuFilter').checked,
            changeable: document.getElementById('areaChangeable').checked,
            buttons: buttons
        };
        
        // Zur Konfiguration hinzufügen
        if (!this.config.areas) this.config.areas = [];
        
        // Prüfen ob ein Bereich mit diesem Namen bereits existiert
        const existingAreaIndex = this.config.areas.findIndex(area => 
            area.name.toLowerCase() === areaName.toLowerCase()
        );
        
        if (existingAreaIndex !== -1) {
            // Bestehenden Bereich aktualisieren
            this.config.areas[existingAreaIndex] = newArea;
            ToastManager.success(`Bereich "${areaName}" wurde aktualisiert.`);
        } else {
            // Neuen Bereich hinzufügen
            this.config.areas.push(newArea);
            ToastManager.success(`Bereich "${areaName}" wurde hinzugefügt.`);
        }
        
        // Modal schließen
        const newAreaModal = document.getElementById('newAreaModal');
        if (newAreaModal && this.bootstrap) {
            const modal = this.bootstrap.Modal.getInstance(newAreaModal);
            if (modal) modal.hide();
        }
        
        // Bereichsliste aktualisieren
        this.renderAreas();
    },
    
    /**
     * Löscht einen Bereich aus der Konfiguration
     * @param {string} areaId - ID des zu löschenden Bereichs (Name)
     */
    deleteArea(areaId) {
        if (!this.config.areas) return;
        
        const areaIndex = this.config.areas.findIndex(area => 
            area.name === areaId
        );
        
        if (areaIndex !== -1) {
            // Bestätigung vom Benutzer einholen
            if (confirm(`Möchten Sie den Bereich "${areaId}" wirklich löschen?`)) {
                this.config.areas.splice(areaIndex, 1);
                ToastManager.success(`Bereich "${areaId}" wurde gelöscht.`);
                this.renderAreas();
            }
        }
    },
    
    /**
     * Öffnet einen Bereich zur Bearbeitung
     * @param {string} areaId - ID des zu bearbeitenden Bereichs (Name)
     */
    editArea(areaId) {
        if (!this.config.areas) return;
        
        const area = this.config.areas.find(area => area.name === areaId);
        if (!area) return;
        
        // Formular mit Bereichsdaten füllen
        const areaNameInput = document.getElementById('areaName');
        const areaMultipleCheckbox = document.getElementById('areaMultiple');
        const areaMenuFilterCheckbox = document.getElementById('areaMenuFilter');
        const areaChangeableCheckbox = document.getElementById('areaChangeable');
        const areaButtonsContainer = document.getElementById('areaButtonsContainer');
        
        if (areaNameInput) areaNameInput.value = area.name;
        if (areaMultipleCheckbox) areaMultipleCheckbox.checked = !!area.multiple;
        if (areaMenuFilterCheckbox) areaMenuFilterCheckbox.checked = !!area.menuFilter;
        if (areaChangeableCheckbox) areaChangeableCheckbox.checked = !!area.changeable;
        
        if (areaButtonsContainer) {
            areaButtonsContainer.innerHTML = '';
            
            // Buttons hinzufügen
            if (area.buttons && area.buttons.length > 0) {
                area.buttons.forEach(button => {
                    const optionElement = document.createElement('div');
                    optionElement.className = 'input-group mb-2 area-button-input';
                    optionElement.innerHTML = `
                        <input type="text" class="form-control" placeholder="Optionsname" value="${button.label || ''}">
                        <button class="btn btn-outline-danger remove-option" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    areaButtonsContainer.appendChild(optionElement);
                });
            } else {
                // Mindestens ein leeres Feld hinzufügen
                areaButtonsContainer.innerHTML = `
                    <div class="input-group mb-2 area-button-input">
                        <input type="text" class="form-control" placeholder="Optionsname">
                        <button class="btn btn-outline-danger remove-option" type="button">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }
        }
        
        // Modal öffnen
        const newAreaModal = document.getElementById('newAreaModal');
        if (newAreaModal && this.bootstrap) {
            const modal = new this.bootstrap.Modal(newAreaModal);
            modal.show();
        }
    },
    
    /**
     * Zeichnet die Bereichsliste neu
     */
    renderAreas() {
        const areasList = document.getElementById('areasList');
        if (!areasList) return;
        
        areasList.innerHTML = '';
        
        if (!this.config.areas || this.config.areas.length === 0) {
            areasList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>Keine Bereiche vorhanden. Klicken Sie auf "Bereich hinzufügen", um einen neuen Bereich zu erstellen.
                </div>
            `;
            return;
        }
        
        // Sortierte Bereiche anzeigen
        const sortedAreas = [...this.config.areas].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        sortedAreas.forEach(area => {
            const areaCard = document.createElement('div');
            areaCard.className = 'card mb-3 area-card';
            areaCard.dataset.areaId = area.name;
            
            // Badges für die Bereiche-Eigenschaften
            const badgesHtml = `
                ${area.multiple ? '<span class="badge bg-info me-1">Mehrfachauswahl</span>' : ''}
                ${area.menuFilter ? '<span class="badge bg-primary me-1">Filter</span>' : ''}
                ${area.changeable ? '<span class="badge bg-success me-1">Änderbar</span>' : ''}
            `;
            
            // Buttons für die Auswahl-Optionen
            const buttonsHtml = area.buttons?.map(btn => 
                `<span class="badge bg-light text-dark border me-1 mb-1">${btn.label}</span>`
            ).join('') || '';
            
            areaCard.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">${area.name}</h5>
                    <div>
                        <button class="btn btn-sm btn-outline-primary edit-area-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-area-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="mb-2">${badgesHtml}</div>
                    <p class="text-muted mb-2">Auswahloptionen:</p>
                    <div class="d-flex flex-wrap">${buttonsHtml}</div>
                </div>
            `;
            
            areasList.appendChild(areaCard);
        });
    },
    
    /**
     * Zeichnet die Filter-Optionen neu
     */
    renderFilterOptions() {
        const filterOptions = document.getElementById('filterOptions');
        if (!filterOptions) return;
        
        filterOptions.innerHTML = '';
        filterOptions.setAttribute('data-initialized', 'true');
        
        if (!this.config.areas || this.config.areas.length === 0) {
            filterOptions.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>Keine Bereiche vorhanden. Erstellen Sie zuerst Bereiche im "Bereiche"-Tab.
                </div>
            `;
            return;
        }
        
        // Nur Bereiche mit menuFilter=true filtern
        const filterableAreas = this.config.areas.filter(area => area.menuFilter);
        
        if (filterableAreas.length === 0) {
            filterOptions.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>Keine Bereiche sind als Filter markiert. Bearbeiten Sie einen Bereich und aktivieren Sie "Als Filter verwenden".
                </div>
            `;
            return;
        }
        
        // Filtertabelle erstellen
        const table = document.createElement('table');
        table.className = 'table table-hover';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Bereich</th>
                    <th>Als Filter anzeigen</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        
        const tbody = table.querySelector('tbody');
        
        // Jedes Filterelement in der Tabelle anzeigen
        filterableAreas.forEach(area => {
            const isActive = this.filters?.areas?.includes(area.name) || false;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${area.name}</td>
                <td>
                    <div class="form-check form-switch">
                        <input class="form-check-input filter-area-toggle" type="checkbox" 
                               id="filter-${area.name}" 
                               data-area="${area.name}" 
                               ${isActive ? 'checked' : ''}>
                        <label class="form-check-label" for="filter-${area.name}">
                            ${isActive ? 'Aktiv' : 'Inaktiv'}
                        </label>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        filterOptions.appendChild(table);
        
        // Event-Listener für Filter-Toggles
        const filterToggles = document.querySelectorAll('.filter-area-toggle');
        filterToggles.forEach(toggle => {
            toggle.addEventListener('change', (event) => {
                const label = event.target.nextElementSibling;
                label.textContent = event.target.checked ? 'Aktiv' : 'Inaktiv';
            });
        });
    },
    
    /**
     * Sammelt alle Konfigurationsdaten aus dem Modal
     * @returns {Object} - Gesammelte Konfigurationsdaten
     */
    collectConfigData() {
        // Aktive Filter sammeln
        if (document.getElementById('filterOptions')) {
            const activeFilterAreas = [];
            
            document.querySelectorAll('.filter-area-toggle').forEach(toggle => {
                if (toggle.checked) {
                    activeFilterAreas.push(toggle.dataset.area);
                }
            });
            
            this.filters = {
                fields: this.filters?.fields || [],
                areas: activeFilterAreas
            };
        }
        
        return {
            config: this.config,
            filters: this.filters
        };
    },
    
    /**
     * Speichert die Konfiguration aus dem Modal
     * @returns {Promise<void>}
     */
    async saveConfigFromModal() {
        try {
            const configData = this.collectConfigData();
            
            // Konfiguration speichern
            const configResponse = await ApiService.saveConfig(configData.config);
            console.log('Konfiguration gespeichert:', configResponse);
            
            // Filter speichern
            const filterResponse = await ApiService.saveFilters(configData.filters);
            console.log('Filter gespeichert:', filterResponse);
            
            // Modal schließen
            const configModal = document.getElementById('configModal');
            if (configModal && this.bootstrap) {
                const modal = this.bootstrap.Modal.getInstance(configModal);
                if (modal) modal.hide();
            }
            
            ToastManager.success('Konfiguration erfolgreich gespeichert');
            
            // Ereignis auslösen, damit andere Module auf die Änderung reagieren können
            document.dispatchEvent(new CustomEvent('configUpdated', { 
                detail: { config: this.config, filters: this.filters }
            }));
            
        } catch (error) {
            console.error('Fehler beim Speichern der Konfiguration:', error);
            ToastManager.error(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
        }
    },
    
    /**
     * Speichert die Konfiguration direkt (ohne Modal)
     * @param {Object} configData - Zu speichernde Konfigurationsdaten
     * @returns {Promise<Object>} - Ergebnis der Speicheroperation
     */
    async saveConfig(configData) {
        try {
            // Konfiguration aktualisieren
            if (configData.config) {
                this.config = configData.config;
                await ApiService.saveConfig(this.config);
            }
            
            // Filter aktualisieren
            if (configData.filters) {
                this.filters = configData.filters;
                await ApiService.saveFilters(this.filters);
            }
            
            // Ereignis auslösen, damit andere Module auf die Änderung reagieren können
            document.dispatchEvent(new CustomEvent('configUpdated', { 
                detail: { config: this.config, filters: this.filters }
            }));
            
            return { success: true };
        } catch (error) {
            console.error('Fehler beim Speichern der Konfiguration:', error);
            throw error;
        }
    }
}; 