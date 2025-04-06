/**
 * Resident-Manager
 * Verwaltet die Bewohnerdaten und -anzeige
 */

import { ApiService } from './api-service.js';
import { ToastManager } from './toast-manager.js';
import { FilterManager } from './filter-manager.js';

export const ResidentManager = {
    residents: [],
    filteredResidents: [],
    searchQuery: '',
    
    /**
     * Initialisiert den Resident-Manager
     * @returns {Promise<void>}
     */
    async init() {
        console.log('Resident-Manager wird initialisiert...');
        
        try {
            // Bewohnerdaten laden
            await this.loadResidents();
            
            // Bewohnerliste anzeigen
            this.displayResidents(this.residents);
            
            // Event-Listener für Filter-Änderungen registrieren
            document.addEventListener('filtersChanged', event => {
                this.applyFilters(event.detail.filters);
            });
            
            console.log('Resident-Manager erfolgreich initialisiert');
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Resident-Managers:', error);
            ToastManager.error('Bewohnerdaten konnten nicht geladen werden');
            throw error;
        }
    },
    
    /**
     * Lädt die Bewohnerdaten vom Server
     * @returns {Promise<Array>} - Geladene Bewohnerdaten
     */
    async loadResidents() {
        try {
            // Verzeichnisse sicherstellen
            await ApiService.ensureDirectories();
            
            // Bewohner laden
            this.residents = await ApiService.getResidents();
            console.log(`${this.residents.length} Bewohner geladen`);
            
            // Wenn keine Bewohner vorhanden sind, Hinweis anzeigen
            const noResultsElement = document.getElementById('noResults');
            if (noResultsElement) {
                if (this.residents.length === 0) {
                    noResultsElement.classList.remove('d-none');
                    noResultsElement.innerHTML = '<i class="fas fa-info-circle me-2"></i>Keine Bewohner gefunden. Erstellen Sie einen neuen Bewohner mit "Neuer Bewohner".';
                } else {
                    noResultsElement.classList.add('d-none');
                }
            }
            
            // Bewohner nach Namen sortieren
            this.sortResidents();
            
            return this.residents;
        } catch (error) {
            console.error('Fehler beim Laden der Bewohnerdaten:', error);
            ToastManager.error('Bewohnerdaten konnten nicht geladen werden');
            throw error;
        }
    },
    
    /**
     * Sortiert die Bewohner alphabetisch nach Nachname, dann Vorname
     */
    sortResidents() {
        this.residents.sort((a, b) => {
            // Erst nach Nachnamen sortieren
            const lastNameA = a.lastName?.toLowerCase() || '';
            const lastNameB = b.lastName?.toLowerCase() || '';
            
            if (lastNameA !== lastNameB) {
                return lastNameA.localeCompare(lastNameB);
            }
            
            // Bei gleichem Nachnamen nach Vornamen sortieren
            const firstNameA = a.firstName?.toLowerCase() || '';
            const firstNameB = b.firstName?.toLowerCase() || '';
            return firstNameA.localeCompare(firstNameB);
        });
    },
    
    /**
     * Zeigt alle Bewohner an (mit oder ohne Filter)
     */
    displayAllResidents() {
        this.displayResidents(this.residents);
    },
    
    /**
     * Zeigt die angegebenen Bewohner im Container an
     * @param {Array} residents - Anzuzeigende Bewohner
     */
    displayResidents(residents) {
        const container = document.getElementById('residentContainer');
        if (!container) return;
        
        // Spinner ausblenden
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) {
            loadingSpinner.classList.add('d-none');
        }
        
        // Container leeren
        container.innerHTML = '';
        
        // Keine-Ergebnisse-Hinweis
        const noResultsElement = document.getElementById('noResults');
        if (noResultsElement) {
            if (residents.length === 0) {
                noResultsElement.classList.remove('d-none');
                if (this.searchQuery) {
                    noResultsElement.innerHTML = '<i class="fas fa-search me-2"></i>Keine Bewohner für diese Suche gefunden.';
                } else {
                    noResultsElement.innerHTML = '<i class="fas fa-filter me-2"></i>Keine Bewohner für diese Filter gefunden.';
                }
            } else {
                noResultsElement.classList.add('d-none');
            }
        }
        
        // Bewohnerkarten erstellen
        residents.forEach(resident => {
            const residentCard = this.createResidentCard(resident);
            container.appendChild(residentCard);
        });
    },
    
    /**
     * Erstellt eine Bewohnerkarte für die Anzeige
     * @param {Object} resident - Bewohnerdaten
     * @returns {HTMLElement} - Bewohnerkarte als HTML-Element
     */
    createResidentCard(resident) {
        const card = document.createElement('div');
        card.className = 'col';
        
        const fullName = `${resident.lastName}, ${resident.firstName}`;
        const residentId = `${resident.firstName}_${resident.lastName}`;
        
        // Image-Pfad mit Fallback
        const imagePath = '/frontend/SoloNew/img/person.png';
        
        // Geschlechtsabhängige Farbgebung
        const cardHeaderClass = resident.gender === 'Frau' ? 
            'bg-danger text-white' : 'bg-primary text-white';
        
        card.innerHTML = `
            <div class="card resident-card h-100 shadow-sm" data-id="${residentId}">
                <div class="card-header ${cardHeaderClass}">
                    <h5 class="card-title mb-0 text-center">${fullName}</h5>
                </div>
                <div class="card-img-container">
                    <img src="${imagePath}" class="card-img-top" alt="${fullName}">
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="mt-auto text-center">
                        <button class="btn btn-sm btn-outline-primary details-btn">
                            <i class="fas fa-info-circle me-1"></i>Details
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    },
    
    /**
     * Erstellt oder aktualisiert einen Bewohner
     * @param {Object} residentData - Bewohnerdaten
     * @param {boolean} isUpdating - true, wenn ein bestehender Bewohner aktualisiert wird
     * @returns {Promise<Object>} - Ergebnisdaten vom Server
     */
    async saveResident(residentData, isUpdating = false) {
        try {
            let response;
            
            // Validierung für Pflichtfelder
            if (!residentData.firstName || !residentData.lastName || !residentData.gender) {
                throw new Error('Vorname, Nachname und Geschlecht sind Pflichtfelder');
            }
            
            if (isUpdating) {
                // Bei Update den Namen für die ID extrahieren
                const residentName = `${residentData.firstName}_${residentData.lastName}`;
                response = await ApiService.updateResident(residentName, residentData);
            } else {
                response = await ApiService.createResident(residentData);
            }
            
            // Nach erfolgreicher Speicherung alle Bewohner neu laden
            await this.loadResidents();
            
            // Aktualisierte Bewohnerliste anzeigen
            this.applyFilters();
            
            return response;
        } catch (error) {
            console.error('Fehler beim Speichern des Bewohners:', error);
            throw error;
        }
    },
    
    /**
     * Bewohner nach Suchanfrage filtern
     * @param {string} query - Suchanfrage
     */
    searchResidents(query) {
        this.searchQuery = query;
        
        // Bei leerer Suche nur die Filter anwenden
        if (!query || query.trim() === '') {
            this.applyFilters();
            return;
        }
        
        // Bewohner nach Suchanfrage filtern
        const filtered = FilterManager.filterBySearchQuery(this.residents, query);
        
        // Gefilterte Bewohner anzeigen
        this.filteredResidents = filtered;
        this.displayResidents(filtered);
    },
    
    /**
     * Wendet aktive Filter auf die Bewohnerliste an
     * @param {Object} filters - Aktive Filter (optional)
     */
    applyFilters(filters = null) {
        // Wenn keine expliziten Filter übergeben wurden, aktuelle Filter verwenden
        if (!filters) {
            // Wenn eine Suchanfrage aktiv ist, diese anwenden
            if (this.searchQuery && this.searchQuery.trim() !== '') {
                this.searchResidents(this.searchQuery);
                return;
            }
            
            // Sonst nur nach den aktiven Filtern aus dem FilterManager filtern
            const filtered = this.residents.filter(resident => 
                FilterManager.matchesFilters(resident)
            );
            
            this.filteredResidents = filtered;
            this.displayResidents(filtered);
            return;
        }
        
        // Mit den übergebenen Filtern filtern
        const filtered = this.residents.filter(resident => {
            // Wenn keine Filter aktiv sind, alle anzeigen
            if (Object.keys(filters).length === 0) {
                return true;
            }
            
            // Für jeden Filter prüfen
            for (const [areaName, values] of Object.entries(filters)) {
                if (values.length === 0) continue;
                
                const residentValue = resident.areas?.[areaName];
                
                // Wenn der Bewohner keinen Wert für diesen Bereich hat, nicht anzeigen
                if (!residentValue) return false;
                
                // Wert-Vergleich je nach Typ
                if (Array.isArray(residentValue)) {
                    // Mindestens ein Wert muss übereinstimmen
                    const hasMatch = values.some(value => residentValue.includes(value));
                    if (!hasMatch) return false;
                } else {
                    // Exakte Übereinstimmung erforderlich
                    if (!values.includes(residentValue)) return false;
                }
            }
            
            return true;
        });
        
        this.filteredResidents = filtered;
        this.displayResidents(filtered);
    },
    
    /**
     * Entlässt einen Bewohner (verschiebt ihn in den old-Ordner)
     * @param {string} residentId - ID des zu entlassenden Bewohners
     * @returns {Promise<Object>} - Ergebnis der Entlassung
     */
    async dismissResident(residentId) {
        try {
            const response = await ApiService.dismissResident(residentId);
            
            // Nach erfolgreicher Entlassung alle Bewohner neu laden
            await this.loadResidents();
            this.applyFilters();
            
            return response;
        } catch (error) {
            console.error('Fehler beim Entlassen des Bewohners:', error);
            throw error;
        }
    },
    
    /**
     * Sucht einen Bewohner anhand seiner ID
     * @param {string} residentId - ID des Bewohners
     * @returns {Object|null} - Gefundener Bewohner oder null
     */
    findResidentById(residentId) {
        if (!residentId) return null;
        
        // ID-Format: "Vorname_Nachname"
        const idParts = residentId.split('_');
        if (idParts.length !== 2) return null;
        
        const firstName = idParts[0];
        const lastName = idParts[1];
        
        // Bewohner mit übereinstimmendem Vor- und Nachnamen suchen
        return this.residents.find(resident => 
            resident.firstName === firstName && resident.lastName === lastName
        ) || null;
    }
}; 