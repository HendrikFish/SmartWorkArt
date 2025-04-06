/**
 * Filter-Manager
 * Verwaltet die Filter für die Bewohnerliste
 */

import { ApiService } from './api-service.js';
import { ToastManager } from './toast-manager.js';
import { ConfigManager } from './config-manager.js';

export const FilterManager = {
    activeFilters: {},
    config: null,
    filterList: null,
    
    /**
     * Initialisiert den Filter-Manager
     * @returns {Promise<void>}
     */
    async init() {
        console.log('Filter-Manager wird initialisiert...');
        
        try {
            // Config für Filter abrufen
            if (!ConfigManager.config) {
                await ConfigManager.init();
            }
            
            this.config = ConfigManager.config;
            this.filterList = ConfigManager.filters;
            
            // Filter-Container abrufen
            const filterContainer = document.getElementById('filterContainer');
            if (filterContainer) {
                this.renderFilters(filterContainer);
            }
            
            // Event-Listener für Filter-Reset registrieren
            document.addEventListener('resetFilter', () => {
                this.resetFilters();
            });
            
            // Event-Listener für Konfigurations-Updates registrieren
            document.addEventListener('configUpdated', (event) => {
                console.log('Konfiguration aktualisiert, Filter werden neu geladen');
                this.config = event.detail.config;
                this.filterList = event.detail.filters;
                this.renderFilters(filterContainer);
            });
            
            console.log('Filter-Manager erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Filter-Managers:', error);
            ToastManager.error('Filter konnten nicht geladen werden');
            throw error;
        }
    },
    
    /**
     * Rendert die verfügbaren Filter
     * @param {HTMLElement} container - Container-Element für die Filter
     */
    renderFilters(container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        // Prüfen ob aktive Filter existieren
        if (!this.config || !this.config.areas || !this.filterList || !this.filterList.areas) {
            container.innerHTML = `
                <div class="alert alert-info w-100">
                    <i class="fas fa-info-circle me-2"></i>Keine Filter konfiguriert. Bitte unter "Konfiguration" Filter erstellen.
                </div>
            `;
            return;
        }
        
        // Nur Bereiche anzeigen, die in den Filter-Konfigurationen aktiv sind
        const activeFilterAreas = this.config.areas.filter(area => 
            this.filterList.areas.includes(area.name)
        );
        
        if (activeFilterAreas.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info w-100">
                    <i class="fas fa-info-circle me-2"></i>Keine aktiven Filter. Bitte unter "Konfiguration" Filter aktivieren.
                </div>
            `;
            return;
        }
        
        // Filterbereiche erstellen
        activeFilterAreas.forEach(area => {
            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group me-3 mb-3';
            
            // Nur anzeigen, wenn der Bereich Buttons hat
            if (!area.buttons || area.buttons.length === 0) return;
            
            filterGroup.innerHTML = `
                <div class="filter-group-header">
                    <span>${area.name}</span>
                </div>
                <div class="filter-buttons" data-area="${area.name}" data-multiple="${area.multiple || false}">
                    ${area.buttons.map(btn => `
                        <span class="filter-badge badge" 
                              data-area="${area.name}" 
                              data-value="${btn.label}">
                            ${btn.label}
                        </span>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(filterGroup);
        });
        
        // Aktive Filter wiederherstellen
        this.restoreActiveFilters();
    },
    
    /**
     * Stellt aktive Filter nach dem Neu-Rendern wieder her
     */
    restoreActiveFilters() {
        if (!this.activeFilters) return;
        
        // Alle Filter-Areas durchgehen
        Object.keys(this.activeFilters).forEach(areaName => {
            const activeValues = this.activeFilters[areaName];
            
            // Aktive Werte im DOM markieren
            activeValues.forEach(value => {
                const filterElement = document.querySelector(
                    `.filter-badge[data-area="${areaName}"][data-value="${value}"]`
                );
                
                if (filterElement) {
                    filterElement.classList.add('active');
                }
            });
        });
        
        // Filter-Banner updaten
        this.updateFilterBanner();
    },
    
    /**
     * Fügt oder entfernt einen Filter
     * @param {string} areaName - Name des Filterbereichs
     * @param {string} value - Wert des Filters
     */
    toggleFilter(areaName, value) {
        if (!areaName || !value) return;
        
        // Prüfen, ob für den Bereich Mehrfachauswahl erlaubt ist
        const filterButtonsContainer = document.querySelector(`.filter-buttons[data-area="${areaName}"]`);
        const isMultiple = filterButtonsContainer ? 
            filterButtonsContainer.dataset.multiple === 'true' : false;
        
        // Aktive Filter für den Bereich abrufen oder initialisieren
        if (!this.activeFilters[areaName]) {
            this.activeFilters[areaName] = [];
        }
        
        const activeValues = this.activeFilters[areaName];
        const valueIndex = activeValues.indexOf(value);
        
        // Wenn der Wert bereits aktiv ist, entfernen
        if (valueIndex !== -1) {
            activeValues.splice(valueIndex, 1);
            
            // Klasse vom entsprechenden Badge entfernen
            const filterElement = document.querySelector(
                `.filter-badge[data-area="${areaName}"][data-value="${value}"]`
            );
            
            if (filterElement) {
                filterElement.classList.remove('active');
            }
        } 
        // Wenn der Wert nicht aktiv ist, hinzufügen
        else {
            // Bei Einfachauswahl erst alle anderen Werte des Bereichs entfernen
            if (!isMultiple) {
                // Alle aktiven Filter dieses Bereichs deaktivieren
                document.querySelectorAll(`.filter-badge[data-area="${areaName}"].active`)
                    .forEach(element => {
                        element.classList.remove('active');
                    });
                
                // Array leeren
                this.activeFilters[areaName] = [];
            }
            
            // Neuen Wert hinzufügen
            activeValues.push(value);
            
            // Klasse zum entsprechenden Badge hinzufügen
            const filterElement = document.querySelector(
                `.filter-badge[data-area="${areaName}"][data-value="${value}"]`
            );
            
            if (filterElement) {
                filterElement.classList.add('active');
            }
        }
        
        // Filter-Banner aktualisieren
        this.updateFilterBanner();
        
        // Bewohnerliste aktualisieren
        document.dispatchEvent(new CustomEvent('filtersChanged', {
            detail: { filters: this.activeFilters }
        }));
    },
    
    /**
     * Setzt alle Filter zurück
     */
    resetFilters() {
        // Alle aktiven Filter-Classes entfernen
        document.querySelectorAll('.filter-badge.active').forEach(element => {
            element.classList.remove('active');
        });
        
        // Aktive Filter zurücksetzen
        this.activeFilters = {};
        
        // Filter-Banner aktualisieren
        this.updateFilterBanner();
        
        // Bewohnerliste aktualisieren
        document.dispatchEvent(new CustomEvent('filtersChanged', {
            detail: { filters: this.activeFilters }
        }));
        
        ToastManager.info('Filter zurückgesetzt');
    },
    
    /**
     * Aktualisiert das Filter-Banner mit Informationen zu den aktiven Filtern
     */
    updateFilterBanner() {
        const filterBanner = document.getElementById('filterBanner');
        const activeFilterCount = document.getElementById('activeFilterCount');
        
        if (!filterBanner || !activeFilterCount) return;
        
        // Aktive Filter zählen
        const activeAreasCount = Object.keys(this.activeFilters).length;
        const totalValuesCount = Object.values(this.activeFilters)
            .reduce((sum, values) => sum + values.length, 0);
        
        // Filter-Banner ein- oder ausblenden
        if (totalValuesCount === 0) {
            filterBanner.classList.add('d-none');
            return;
        } else {
            filterBanner.classList.remove('d-none');
        }
        
        // Filterinformationen anzeigen
        let filterText = '';
        
        Object.entries(this.activeFilters).forEach(([areaName, values]) => {
            if (values.length > 0) {
                filterText += `${areaName}: ${values.join(', ')}; `;
            }
        });
        
        // Text abschneiden, wenn er zu lang ist
        if (filterText.length > 50) {
            filterText = filterText.substring(0, 47) + '...';
        }
        
        // Text im Banner setzen
        activeFilterCount.textContent = `Filter aktiv: ${filterText}`;
    },
    
    /**
     * Prüft, ob ein Bewohner den aktiven Filtern entspricht
     * @param {Object} resident - Bewohnerobjekt
     * @returns {boolean} - true, wenn der Bewohner den Filtern entspricht
     */
    matchesFilters(resident) {
        // Wenn keine Filter aktiv sind, werden alle Bewohner angezeigt
        if (Object.keys(this.activeFilters).length === 0) {
            return true;
        }
        
        // Für jeden aktiven Filterbereich prüfen
        for (const [areaName, values] of Object.entries(this.activeFilters)) {
            // Wenn keine Werte für diesen Bereich aktiv sind, überspringen
            if (values.length === 0) continue;
            
            // Bereichswert des Bewohners abrufen
            const residentValue = resident.areas?.[areaName];
            
            // Wenn der Bewohner keinen Wert für diesen Bereich hat, entspricht er nicht dem Filter
            if (!residentValue) return false;
            
            // Bei Arrays (für Mehrfachauswahl) prüfen, ob mindestens ein Wert übereinstimmt
            if (Array.isArray(residentValue)) {
                const hasMatch = values.some(value => residentValue.includes(value));
                if (!hasMatch) return false;
            } 
            // Bei einzelnen Werten (für Einfachauswahl) prüfen, ob der Wert übereinstimmt
            else {
                if (!values.includes(residentValue)) return false;
            }
        }
        
        // Bewohner entspricht allen aktiven Filtern
        return true;
    },
    
    /**
     * Wendet einen bestimmten Filter an 
     * @param {string} areaName - Bereichsname
     * @param {string} value - Optionaler Wert
     */
    applyFilter(areaName, value = null) {
        if (!areaName) return;
        
        // Erst alle Filter zurücksetzen
        this.resetFilters();
        
        // Wenn ein Wert angegeben ist, diesen spezifischen Filter setzen
        if (value) {
            this.toggleFilter(areaName, value);
        } 
        // Sonst den ersten verfügbaren Wert für diesen Bereich nehmen
        else {
            const filterElement = document.querySelector(
                `.filter-badge[data-area="${areaName}"]`
            );
            
            if (filterElement) {
                const value = filterElement.dataset.value;
                this.toggleFilter(areaName, value);
            }
        }
    },
    
    /**
     * Filtert Bewohner nach einer Suchanfrage
     * @param {Array} residents - Liste der Bewohner
     * @param {string} query - Suchanfrage
     * @returns {Array} - Gefilterte Bewohnerliste
     */
    filterBySearchQuery(residents, query) {
        if (!query || query.trim() === '') {
            // Bei leerer Suchanfrage nur nach aktiven Filtern filtern
            return residents.filter(resident => this.matchesFilters(resident));
        }
        
        // Suchanfrage normalisieren
        const normalizedQuery = query.trim().toLowerCase();
        
        // Bewohner nach Suchanfrage und aktiven Filtern filtern
        return residents.filter(resident => {
            // Erst prüfen, ob der Bewohner den aktiven Filtern entspricht
            if (!this.matchesFilters(resident)) {
                return false;
            }
            
            // Dann nach der Suchanfrage filtern
            const firstName = resident.firstName?.toLowerCase() || '';
            const lastName = resident.lastName?.toLowerCase() || '';
            const fullName = `${firstName} ${lastName}`;
            const reversedName = `${lastName} ${firstName}`;
            
            return fullName.includes(normalizedQuery) || 
                   reversedName.includes(normalizedQuery);
        });
    }
}; 