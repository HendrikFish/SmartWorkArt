/**
 * Resident-Manager Modul
 * Verwaltet die Bewohnerdaten und die Bewohnerliste
 */

import { ApiService } from './api-service.js';
import { ConfigManager } from './config-manager.js';
import { ToastManager } from './toast-manager.js';
import { FilterManager } from './filter-manager.js';

export const ResidentManager = {
    residents: [],
    filteredResidents: [],
    activeSearch: '',
    activeFilter: null,
    
    /**
     * Formatiert ein Datum im deutschen Format (TT.MM.JJJJ)
     * @param {string} dateString - Datumstring im Format JJJJ-MM-TT
     * @returns {string} - Formatiertes Datum
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('de-DE');
        } catch (error) {
            console.error('Fehler beim Formatieren des Datums:', error);
            return dateString;
        }
    },
    
    /**
     * Initialisiert den Resident-Manager
     * @param {Object} options - Konfigurationsoptionen
     * @returns {Promise<void>}
     */
    async init(options = {}) {
        try {
            // Lade die Bewohner vom Server
            await this.loadResidents();
            
            console.log('Resident-Manager initialisiert');
        } catch (error) {
            console.error('Fehler bei der Initialisierung des Resident-Managers:', error);
            ToastManager.error('Fehler beim Laden der Bewohner');
        }
    },
    
    /**
     * Lädt alle Bewohner vom Server
     * @returns {Promise<Array>} - Liste der Bewohner
     */
    async loadResidents() {
        try {
            const residents = await ApiService.getResidents();
            
            if (Array.isArray(residents)) {
                this.residents = residents;
                this.filteredResidents = [...residents];
                console.log(`${residents.length} Bewohner geladen`);
            } else {
                throw new Error('Ungültiges Format der Bewohnerdaten');
            }
            
            return this.residents;
        } catch (error) {
            console.error('Fehler beim Laden der Bewohner:', error);
            ToastManager.error('Fehler beim Laden der Bewohner');
            this.residents = [];
            this.filteredResidents = [];
            throw error;
        }
    },
    
    /**
     * Zeigt alle Bewohner in der UI an
     * @returns {Promise<void>}
     */
    async displayAllResidents() {
        try {
            // Stelle sicher, dass Bewohner geladen sind
            if (this.residents.length === 0) {
                await this.loadResidents();
            }
            
            // Reset Filter und Suche
            this.activeFilter = null;
            this.activeSearch = '';
            this.filteredResidents = [...this.residents];
            
            // Verstecke den Filter-Banner
            const filterBanner = document.getElementById('filterBanner');
            if (filterBanner) {
                filterBanner.classList.add('d-none');
            }
            
            // Zeige die Bewohner an
            this.renderResidentsList(this.residents);
        } catch (error) {
            console.error('Fehler beim Anzeigen der Bewohner:', error);
            ToastManager.error('Fehler beim Anzeigen der Bewohner');
        }
    },
    
    /**
     * Erstellt einen neuen Bewohner
     * @param {Object} residentData - Bewohnerdaten
     * @returns {Promise<Object>} - Erstellter Bewohner
     */
    async createResident(residentData) {
        try {
            // Validiere die Daten
            if (!residentData.firstName || !residentData.lastName) {
                throw new Error('Vorname und Nachname sind erforderlich');
            }
            
            // Sende die Daten an den Server
            const result = await ApiService.createResident(residentData);
            
            if (result && result.success) {
                // Füge den neuen Bewohner zur Liste hinzu
                this.residents.push(residentData);
                this.filteredResidents.push(residentData);
                
                // Aktualisiere die Bewohnerliste
                this.renderResidentsList(this.filteredResidents);
                
                ToastManager.success('Bewohner erfolgreich erstellt');
                return residentData;
            } else {
                throw new Error('Bewohner konnte nicht erstellt werden');
            }
        } catch (error) {
            console.error('Fehler beim Erstellen des Bewohners:', error);
            ToastManager.error('Fehler beim Erstellen des Bewohners: ' + error.message);
            throw error;
        }
    },
    
    /**
     * Aktualisiert einen Bewohner
     * @param {string} residentName - Name des Bewohners
     * @param {Object} residentData - Aktualisierte Bewohnerdaten
     * @returns {Promise<Object>} - Aktualisierter Bewohner
     */
    async updateResident(residentName, residentData) {
        try {
            // Sende die Daten an den Server
            const result = await ApiService.updateResident(residentName, residentData);
            
            if (result && result.success) {
                // Aktualisiere den Bewohner in der Liste
                const index = this.residents.findIndex(resident => 
                    this.getResidentFullName(resident) === residentName
                );
                
                if (index !== -1) {
                    this.residents[index] = residentData;
                }
                
                // Aktualisiere auch die gefilterte Liste
                const filteredIndex = this.filteredResidents.findIndex(resident => 
                    this.getResidentFullName(resident) === residentName
                );
                
                if (filteredIndex !== -1) {
                    this.filteredResidents[filteredIndex] = residentData;
                }
                
                // Aktualisiere die Bewohnerliste
                this.renderResidentsList(this.filteredResidents);
                
                ToastManager.success('Bewohner erfolgreich aktualisiert');
                return residentData;
            } else {
                throw new Error('Bewohner konnte nicht aktualisiert werden');
            }
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Bewohners:', error);
            ToastManager.error('Fehler beim Aktualisieren des Bewohners: ' + error.message);
            throw error;
        }
    },
    
    /**
     * Entlässt einen Bewohner (verschiebt ihn in den old-Ordner)
     * @param {string} residentName - Name des Bewohners
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    async dismissResident(residentName) {
        try {
            // Sende die Anfrage an den Server
            const result = await ApiService.dismissResident(residentName);
            
            if (result && result.success) {
                // Entferne den Bewohner aus der Liste
                this.residents = this.residents.filter(resident => 
                    this.getResidentFullName(resident) !== residentName
                );
                
                // Entferne den Bewohner aus der gefilterten Liste
                this.filteredResidents = this.filteredResidents.filter(resident => 
                    this.getResidentFullName(resident) !== residentName
                );
                
                // Aktualisiere die Bewohnerliste
                this.renderResidentsList(this.filteredResidents);
                
                ToastManager.success('Bewohner erfolgreich entlassen');
                return result;
            } else {
                throw new Error('Bewohner konnte nicht entlassen werden');
            }
        } catch (error) {
            console.error('Fehler beim Entlassen des Bewohners:', error);
            ToastManager.error('Fehler beim Entlassen des Bewohners: ' + error.message);
            throw error;
        }
    },
    
    /**
     * Lädt entlassene Bewohner
     * @returns {Promise<Array>} - Liste entlassener Bewohner
     */
    async loadDismissedResidents() {
        try {
            const dismissedResidents = await ApiService.getDismissedResidents();
            
            if (Array.isArray(dismissedResidents)) {
                return dismissedResidents;
            } else {
                throw new Error('Ungültiges Format der entlassenen Bewohner');
            }
        } catch (error) {
            console.error('Fehler beim Laden der entlassenen Bewohner:', error);
            ToastManager.error('Fehler beim Laden der entlassenen Bewohner');
            throw error;
        }
    },
    
    /**
     * Stellt einen entlassenen Bewohner wieder her
     * @param {string} residentName - Name des Bewohners
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    async resurrectResident(residentName) {
        try {
            // Sende die Anfrage an den Server
            const result = await ApiService.resurrectResident(residentName);
            
            if (result && result.success) {
                // Lade die Bewohner neu, um den wiederhergestellten Bewohner zu erhalten
                await this.loadResidents();
                
                // Aktualisiere die Bewohnerliste
                this.renderResidentsList(this.filteredResidents);
                
                ToastManager.success('Bewohner erfolgreich wiederhergestellt');
                return result;
            } else {
                throw new Error('Bewohner konnte nicht wiederhergestellt werden');
            }
        } catch (error) {
            console.error('Fehler beim Wiederherstellen des Bewohners:', error);
            ToastManager.error('Fehler beim Wiederherstellen des Bewohners: ' + error.message);
            throw error;
        }
    },
    
    /**
     * Sucht Bewohner anhand eines Suchbegriffs
     * @param {string} query - Suchbegriff
     */
    searchResidents(query) {
        this.activeSearch = query.trim().toLowerCase();
        
        if (!this.activeSearch) {
            // Zeige alle Bewohner, wenn die Suche leer ist
            if (this.activeFilter) {
                // Wenn ein Filter aktiv ist, wende nur diesen an
                this.applyFilter(this.activeFilter);
            } else {
                // Sonst zeige alle Bewohner
                this.filteredResidents = [...this.residents];
                this.renderResidentsList(this.filteredResidents);
            }
            return;
        }
        
        // Suche in den Bewohnerdaten
        let filteredResidents = this.residents.filter(resident => {
            const fullName = `${resident.firstName} ${resident.lastName}`.toLowerCase();
            
            // Suche nach Namen
            if (fullName.includes(this.activeSearch)) {
                return true;
            }
            
            // Suche in Zimmer (wenn vorhanden)
            if (resident.room && resident.room.toLowerCase().includes(this.activeSearch)) {
                return true;
            }
            
            // Durchsuche auch die Bereiche
            if (resident.areas) {
                for (const [areaName, value] of Object.entries(resident.areas)) {
                    // Wenn der Wert ein Array ist (Mehrfachauswahl)
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            if (item.toLowerCase().includes(this.activeSearch)) {
                                return true;
                            }
                        }
                    } 
                    // Wenn der Wert ein String ist
                    else if (typeof value === 'string' && value.toLowerCase().includes(this.activeSearch)) {
                        return true;
                    }
                }
            }
            
            return false;
        });
        
        // Wende auch den aktiven Filter an, falls vorhanden
        if (this.activeFilter) {
            filteredResidents = this.applyFilterToResidents(filteredResidents, this.activeFilter);
        }
        
        this.filteredResidents = filteredResidents;
        this.renderResidentsList(filteredResidents);
    },
    
    /**
     * Wendet einen Filter auf die Bewohnerliste an
     * @param {Object} filter - Filter-Konfiguration
     */
    applyFilter(filter) {
        try {
            console.log('Filter anwenden:', filter);
            
            // Setze die aktiven Filter global für spätere Verwendung
            this.activeFilter = filter;
            
            // Wenn kein Filter gesetzt ist, zeige alle Bewohner
            if (!filter) {
                this.displayAllResidents();
                this.updateFilterBanner(null);
                return;
            }

            // Filterung durchführen
            let filteredResidents = [...this.residents];

            // Filter nach Bereich
            if (filter.area) {
                // Lade FilterManager, um Gruppierung durchzuführen
                import('./filter-manager.js').then(({ FilterManager }) => {
                    // Filtere Bewohner nach Bereich
                    filteredResidents = filteredResidents.filter(resident => {
                        // Wenn ein spezifischer Wert angegeben wurde, filtere nach diesem Wert
                        if (filter.value) {
                            return resident.areas && resident.areas[filter.area] === filter.value;
                        }
                        
                        // Ansonsten alle Bewohner, die überhaupt einen Wert für diesen Bereich haben
                        return resident.areas && (resident.areas[filter.area] !== undefined);
                    });

                    // Gruppiere Bewohner nach dem Bereich (sortiert)
                    const groupedResidents = FilterManager.groupResidentsByArea(filteredResidents, filter.area);
                    
                    // Zeige die gruppierten Bewohner an
                    this.displayGroupedResidents(groupedResidents, filter.area);
                    
                    // Aktualisiere das Filterbanner
                    this.updateFilterBanner(filter);
                }).catch(error => {
                    console.error('Fehler beim Laden des FilterManager:', error);
                    
                    // Fallback: Zeige ungefilterte Liste an
                    this.displayAllResidents();
                    ToastManager.error('Fehler beim Anwenden des Filters');
                });
            } else {
                // Zeige alle Bewohner, wenn kein Bereich angegeben ist
                this.displayAllResidents();
                this.updateFilterBanner(null);
            }
        } catch (error) {
            console.error('Fehler beim Filtern der Bewohner:', error);
            ToastManager.error('Fehler beim Filtern der Bewohner');
            
            // Fallback: Zeige alle Bewohner an
            this.displayAllResidents();
        }
    },
    
    /**
     * Zeigt gruppierte Bewohner an
     * @param {Object} groupedResidents - Gruppierte Bewohner
     * @param {string} areaName - Name des Bereichs
     */
    displayGroupedResidents(groupedResidents, areaName) {
        const container = document.getElementById('residentsList');
        
        if (!container) {
            console.error('Bewohnerlisten-Container nicht gefunden');
            return;
        }
        
        // Leere den Container
        container.innerHTML = '';
        
        // Wenn keine gruppierten Bewohner vorhanden sind
        if (!groupedResidents || Object.keys(groupedResidents).length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Keine Bewohner für den Filter "${areaName}" gefunden</p>
                </div>
            `;
            return;
        }
        
        // Zeige jede Gruppe an
        Object.entries(groupedResidents).forEach(([groupName, residents]) => {
            // Erstelle eine Gruppenüberschrift
            const groupHeader = document.createElement('div');
            groupHeader.className = 'col-12 mb-3 mt-4';
            groupHeader.innerHTML = `
                <h4 class="border-bottom pb-2">
                    ${groupName} <span class="badge bg-secondary">${residents.length}</span>
                </h4>
            `;
            
            container.appendChild(groupHeader);
            
            // Wenn keine Bewohner in dieser Gruppe vorhanden sind
            if (residents.length === 0) {
                const emptyGroup = document.createElement('div');
                emptyGroup.className = 'col-12 text-center py-3';
                emptyGroup.innerHTML = `<p class="text-muted">Keine Bewohner in dieser Gruppe</p>`;
                container.appendChild(emptyGroup);
            } else {
                // Zeige die Bewohnerkarten in dieser Gruppe an
                residents.forEach(resident => {
                    const card = this.createResidentCard(resident);
                    container.appendChild(card);
                    
                    // Füge Event-Listener hinzu, um Details anzuzeigen
                    card.addEventListener('click', () => {
                        this.showResidentDetails(resident);
                    });
                });
            }
        });
    },
    
    /**
     * Aktualisiert das Filter-Banner im UI
     * @param {Object} filter - Aktiver Filter
     */
    updateFilterBanner(filter) {
        const filterBanner = document.getElementById('filterBanner');
        
        if (!filterBanner) {
            console.error('Filter-Banner nicht gefunden');
            return;
        }
        
        // Wenn kein Filter aktiv ist, blende das Banner aus
        if (!filter) {
            filterBanner.style.display = 'none';
            return;
        }
        
        // Setze den Filtertext
        const filterText = filter.value ? 
            `${filter.area}: ${filter.value}` : 
            `${filter.area}`;
        
        // Aktualisiere das Banner
        filterBanner.querySelector('.filter-text').textContent = filterText;
        filterBanner.style.display = 'flex';
    },
    
    /**
     * Rendert die Bewohnerliste in der UI
     * @param {Array} residents - Anzuzeigende Bewohner
     * @param {Object} filter - Aktiver Filter (optional)
     */
    renderResidentsList(residents, filter = null) {
        const residentsListContainer = document.getElementById('residentContainer');
        
        if (!residentsListContainer) {
            console.error('Bewohnerlisten-Container nicht gefunden');
            return;
        }
        
        // Leere den Container
        residentsListContainer.innerHTML = '';
        
        // Wenn keine Bewohner vorhanden sind
        if (!residents || residents.length === 0) {
            residentsListContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">Keine Bewohner gefunden</p>
                </div>
            `;
            return;
        }
        
        // Sortiere die Bewohner nach Nachname, Vorname
        const sortedResidents = [...residents].sort((a, b) => {
            const lastNameA = a.lastName.toLowerCase();
            const lastNameB = b.lastName.toLowerCase();
            
            if (lastNameA < lastNameB) return -1;
            if (lastNameA > lastNameB) return 1;
            
            const firstNameA = a.firstName.toLowerCase();
            const firstNameB = b.firstName.toLowerCase();
            
            if (firstNameA < firstNameB) return -1;
            if (firstNameA > firstNameB) return 1;
            
            return 0;
        });
        
        // Wenn ein Filter aktiv ist, gruppiere die Bewohner
        if (filter && filter.area) {
            this.renderGroupedResidents(sortedResidents, filter);
            return;
        }
        
        // Zeige die Bewohner als Karten an
        sortedResidents.forEach(resident => {
            const residentCard = this.createResidentCard(resident);
            residentsListContainer.appendChild(residentCard);
        });
    },
    
    /**
     * Rendert gruppierte Bewohner nach Filterwert
     * @param {Array} residents - Anzuzeigende Bewohner
     * @param {Object} filter - Aktiver Filter
     */
    renderGroupedResidents(residents, filter) {
        const residentsListContainer = document.getElementById('residentContainer');
        
        if (!residentsListContainer) {
            console.error('Bewohnerlisten-Container nicht gefunden');
            return;
        }
        
        // Leere den Container
        residentsListContainer.innerHTML = '';
        
        // Gruppiere die Bewohner nach dem Filterwert
        const groups = this.groupResidentsByFilter(residents, filter);
        
        // Rendere jede Gruppe
        for (const [groupName, groupResidents] of Object.entries(groups)) {
            // Erstelle eine Gruppenüberschrift
            const groupHeader = document.createElement('div');
            groupHeader.className = 'col-12 mb-3 mt-4';
            groupHeader.innerHTML = `
                <h4 class="border-bottom pb-2">
                    ${groupName} <span class="badge bg-secondary">${groupResidents.length}</span>
                </h4>
            `;
            
            residentsListContainer.appendChild(groupHeader);
            
            // Füge die Bewohner dieser Gruppe hinzu
            groupResidents.forEach(resident => {
                const residentCard = this.createResidentCard(resident);
                residentsListContainer.appendChild(residentCard);
            });
        }
    },
    
    /**
     * Gruppiert Bewohner nach Filterwert
     * @param {Array} residents - Zu gruppierende Bewohner
     * @param {Object} filter - Aktiver Filter
     * @returns {Object} - Gruppierte Bewohner
     */
    groupResidentsByFilter(residents, filter) {
        if (!filter || !filter.area) {
            return { 'Alle Bewohner': residents };
        }
        
        const groups = {};
        const area = filter.area;
        const areaConfig = ConfigManager.getArea(area);
        
        // Hole alle möglichen Werte für diesen Bereich aus der Konfiguration
        const possibleValues = areaConfig ? areaConfig.buttons.map(btn => btn.label) : [];
        
        // Erstelle für jeden möglichen Wert eine Gruppe
        possibleValues.forEach(value => {
            groups[value] = [];
        });
        
        // Füge eine Gruppe für "Keine Informationen" hinzu
        groups['Keine Informationen'] = [];
        
        // Debug: Ausgabe aller Bewohner
        console.log('Gruppiere Bewohner nach:', area);
        console.log('Mögliche Werte:', possibleValues);
        
        // Ordne die Bewohner den Gruppen zu
        residents.forEach(resident => {
            console.log('Prüfe Bewohner:', `${resident.firstName} ${resident.lastName}`, resident);
            
            if (!resident.areas) {
                // Wenn der Bewohner kein areas-Objekt hat
                console.log('Bewohner hat kein areas-Objekt:', resident.firstName, resident.lastName);
                groups['Keine Informationen'].push(resident);
                return;
            }
            
            const value = resident.areas[area];
            console.log('Gefundener Wert für', area, ':', value);
            
            // Wenn kein Wert für diesen Bereich vorhanden ist
            if (value === undefined || value === null || value === '') {
                console.log('Kein Wert für Bereich', area, 'bei', resident.firstName, resident.lastName);
                groups['Keine Informationen'].push(resident);
                return;
            }
            
            // Wenn der Wert ein Array ist (Mehrfachauswahl)
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    // Leeres Array gilt als "Keine Informationen"
                    groups['Keine Informationen'].push(resident);
                } else {
                    // Füge den Bewohner zu jeder Gruppe hinzu, die seinem Wert entspricht
                    let groupFound = false;
                    value.forEach(singleValue => {
                        if (groups[singleValue]) {
                            groups[singleValue].push(resident);
                            groupFound = true;
                        }
                    });
                    
                    // Wenn keine passende Gruppe gefunden wurde, füge den Bewohner zu "Keine Informationen" hinzu
                    if (!groupFound) {
                        groups['Keine Informationen'].push(resident);
                    }
                }
            } 
            // Wenn der Wert ein String ist
            else if (typeof value === 'string') {
                if (groups[value]) {
                    console.log('Füge', resident.firstName, resident.lastName, 'zur Gruppe', value, 'hinzu');
                    groups[value].push(resident);
                } else {
                    // Wenn keine passende Gruppe gefunden wurde, füge den Bewohner zu "Keine Informationen" hinzu
                    console.log('Unbekannter Wert', value, 'für', resident.firstName, resident.lastName);
                    groups['Keine Informationen'].push(resident);
                }
            } else {
                // Für alle anderen Fälle
                console.log('Unerwarteter Wertetyp für', area, ':', typeof value);
                groups['Keine Informationen'].push(resident);
            }
        });
        
        // Entferne leere Gruppen
        for (const [groupName, groupResidents] of Object.entries(groups)) {
            if (groupResidents.length === 0) {
                console.log('Entferne leere Gruppe:', groupName);
                delete groups[groupName];
            } else {
                console.log('Gruppe', groupName, 'hat', groupResidents.length, 'Bewohner');
            }
        }
        
        return groups;
    },
    
    /**
     * Erstellt eine Karte für einen Bewohner
     * @param {Object} resident - Bewohnerdaten
     * @returns {HTMLElement} - Bewohnerkarte als DOM-Element
     */
    createResidentCard(resident) {
        // Erstelle eine Karte für den Bewohner
        const card = document.createElement('div');
        card.className = 'resident-card card h-100';
        card.style.width = '180px';
        card.style.minWidth = '180px';
        card.style.maxWidth = '180px';
        card.style.flex = '0 0 180px';
        
        // Erstelle den Körper der Karte
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body d-flex flex-column';
        
        // Erstelle das Bild
        const cardImage = document.createElement('img');
        cardImage.className = 'card-img-top';
        
        // Verwende ein Platzhalterbild basierend auf dem Geschlecht oder ein Standard-Bild
        if (resident.gender === 'female') {
            cardImage.src = 'img/person.png';
            cardImage.alt = 'Weibliche Bewohnerin';
        } else if (resident.gender === 'male') {
            cardImage.src = 'img/person.png';
            cardImage.alt = 'Männlicher Bewohner';
        } else {
            cardImage.src = 'img/person.png';
            cardImage.alt = 'Bewohner';
        }
        
        // Erstelle den Titel (Name)
        const cardTitle = document.createElement('h5');
        cardTitle.className = 'card-title';
        cardTitle.textContent = `${resident.firstName} ${resident.lastName}`;
        
        // Erstelle eine Zeile für Zimmer und Alter
        const infoLine = document.createElement('p');
        infoLine.className = 'card-text text-muted small';
        
        const infoParts = [];
        
        if (resident.room) {
            infoParts.push(`Zimmer: ${resident.room}`);
        }
        
        if (resident.vergin) {
            infoParts.push(`Alter: ${resident.vergin}`);
        } else if (resident.birthDate) {
            // Berechne das Alter aus dem Geburtsdatum
            const birthDateObj = new Date(resident.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDateObj.getFullYear();
            
            // Wenn der Geburtstag in diesem Jahr noch nicht war, ein Jahr abziehen
            if (
                today.getMonth() < birthDateObj.getMonth() || 
                (today.getMonth() === birthDateObj.getMonth() && today.getDate() < birthDateObj.getDate())
            ) {
                age--;
            }
            
            infoParts.push(`Alter: ${age}`);
        }
        
        infoLine.textContent = infoParts.join(' | ');
        infoLine.classList.add('text-center'); // Mittige Ausrichtung
        
        // Füge nur die In Bewohner Card anzeigen Bereiche als Badges hinzu
        const badgeContainer = document.createElement('div');
        badgeContainer.className = 'badge-container mb-2 text-center';
        
        // Hole die als In Bewohner Card anzeigen markierten Bereiche
        const changeableAreas = ConfigManager.getChangeableAreas();
        
        // Füge Bereiche als Badges hinzu, wenn vorhanden und In Bewohner Card anzeigen
        if (resident.areas) {
            Object.entries(resident.areas).forEach(([areaName, value]) => {
                // Prüfe, ob der Bereich als In Bewohner Card anzeigen markiert ist
                const isChangeable = changeableAreas.some(area => area.name === areaName);
                
                if (isChangeable) {
                    const badge = document.createElement('span');
                    badge.className = 'badge bg-primary me-1 mb-1 text-start';
                    
                    // Wenn der Wert ein Array ist (bei Multiple-Bereichen)
                    if (Array.isArray(value)) {
                        badge.innerHTML = `${areaName}<br>${value.join('<br>')}`;
                    } else {
                        badge.innerHTML = `${areaName}:<br>${value}`;
                    }
                    
                    badgeContainer.appendChild(badge);
                }
            });
        }
        
        // Erstelle den Button für Details
        const detailButton = document.createElement('button');
        detailButton.className = 'btn btn-sm btn-outline-primary mt-auto';
        detailButton.innerHTML = '<i class="fas fa-info-circle"></i> Details';
        detailButton.type = 'button';
        detailButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.openResidentDetails(resident);
        });
        
        // Füge alle Elemente zur Karte hinzu
        card.appendChild(cardImage);
        cardBody.appendChild(cardTitle);
        
        // Füge Info-Zeile nur hinzu, wenn sie Inhalt hat
        if (infoParts.length > 0) {
            cardBody.appendChild(infoLine);
        }
        
        // Füge Badges nur hinzu, wenn vorhanden
        if (badgeContainer.childNodes.length > 0) {
            cardBody.appendChild(badgeContainer);
        }
        
        cardBody.appendChild(detailButton);
        card.appendChild(cardBody);
        
        return card;
    },
    
    /**
     * Öffnet die Detailansicht eines Bewohners
     * @param {Object} resident - Bewohnerdaten
     */
    openResidentDetails(resident) {
        // Versuche den ModalManager über verschiedene Wege zu erreichen
        if (window.app && window.app.modals) {
            // Bevorzugte Methode: Verwende den ModalManager aus der App-Instanz
            window.app.modals.showResidentDetailModal(resident);
        } else {
            // Importiere und verwende den ModalManager direkt
            import('./modal-manager.js').then(module => {
                const { ModalManager } = module;
                ModalManager.showResidentDetailModal(resident);
            }).catch(error => {
                console.error('Fehler beim Importieren des Modal-Managers:', error);
                ToastManager.error('Details können nicht angezeigt werden');
            });
        }
    },
    
    /**
     * Hilfsfunktion, um den vollständigen Namen eines Bewohners zu erhalten
     * @param {Object} resident - Bewohnerdaten
     * @returns {string} - Vollständiger Name
     */
    getResidentFullName(resident) {
        return `${resident.firstName}_${resident.lastName}`;
    },
    
    /**
     * Erstellt ein Badge für einen Bereich
     * @param {string} areaName - Name des Bereichs
     * @param {string} value - Wert des Bereichs
     * @returns {HTMLElement} - Badge als DOM-Element
     */
    createAreaBadge(areaName, value) {
        const badge = document.createElement('span');
        badge.className = 'badge rounded-pill filter-badge';
        badge.textContent = value;
        badge.title = areaName;
        
        // Wenn der aktive Filter diesem Bereich und Wert entspricht, markiere das Badge
        if (this.activeFilter && this.activeFilter.area === areaName && 
            (!this.activeFilter.value || this.activeFilter.value === value)) {
            badge.classList.add('active');
        }
        
        // Füge einen Event-Listener hinzu, um nach diesem Bereich und Wert zu filtern
        badge.addEventListener('click', (event) => {
            event.stopPropagation(); // Verhindere, dass die Karte geöffnet wird
            
            if (this.activeFilter && this.activeFilter.area === areaName && 
                this.activeFilter.value === value) {
                // Wenn der Filter bereits aktiv ist, deaktiviere ihn
                this.applyFilter(null);
            } else {
                // Sonst aktiviere den Filter
                this.applyFilter({ area: areaName, value });
            }
        });
        
        return badge;
    },

    displayResidents(residents) {
        const container = document.getElementById('residentsList');
        if (!container) return;

        // Leere den Container
        container.innerHTML = '';

        // Hole die aktiven Filter
        const activeFilters = FilterManager.getActiveFilters();
        
        if (activeFilters.length === 0) {
            // Wenn keine Filter aktiv sind, zeige alle Bewohner nebeneinander
            const residentsContainer = document.createElement('div');
            residentsContainer.className = 'residents-container';
            
            // Sortiere alle Bewohner nach Nachname, dann Vorname
            const sortedResidents = residents.sort((a, b) => {
                const lastNameCompare = a.lastName.localeCompare(b.lastName);
                if (lastNameCompare !== 0) return lastNameCompare;
                return a.firstName.localeCompare(b.firstName);
            });

            // Füge alle sortierten Bewohnerkarten hinzu
            sortedResidents.forEach(resident => {
                const card = this.createResidentCard(resident);
                residentsContainer.appendChild(card);
            });

            container.appendChild(residentsContainer);
            return;
        }

        // Wenn Filter aktiv sind, gruppiere die Bewohner nach den Filteroptionen
        activeFilters.forEach(filter => {
            const filterConfig = ConfigManager.getArea(filter.name);
            if (!filterConfig) return;

            // Erstelle eine Filter-Gruppe
            const filterGroup = document.createElement('div');
            filterGroup.className = 'filter-group';

            // Füge die Gruppenüberschrift hinzu
            const filterHeader = document.createElement('h3');
            filterHeader.className = 'filter-group-header';
            filterHeader.textContent = filter.name;
            filterGroup.appendChild(filterHeader);

            // Erstelle ein Objekt für die Gruppierung
            const groups = {};
            filterConfig.buttons.forEach(btn => {
                groups[btn.label] = [];
            });
            groups['Keine Angabe'] = [];

            // Ordne die Bewohner den Gruppen zu
            residents.forEach(resident => {
                const value = resident.areas && resident.areas[filter.name];
                if (!value) {
                    groups['Keine Angabe'].push(resident);
                } else if (Array.isArray(value)) {
                    if (value.length === 0) {
                        groups['Keine Angabe'].push(resident);
                    } else {
                        value.forEach(v => {
                            if (groups[v]) {
                                groups[v].push(resident);
                            }
                        });
                    }
                } else {
                    if (groups[value]) {
                        groups[value].push(resident);
                    } else {
                        groups['Keine Angabe'].push(resident);
                    }
                }
            });

            // Sortiere die Optionen numerisch und alphabetisch
            const sortOptions = (a, b) => {
                // Versuche zuerst numerisch zu sortieren
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                if (numA !== numB) return numA - numB;
                
                // Wenn numerisch gleich oder keine Zahlen, sortiere alphabetisch
                return a.localeCompare(b);
            };

            // Erstelle die Anzeige für jede Gruppe
            Object.keys(groups)
                .sort(sortOptions)
                .forEach(option => {
                    const groupResidents = groups[option];
                    if (groupResidents.length === 0) return;

                    const optionGroup = document.createElement('div');
                    optionGroup.className = 'filter-option-group';

                    // Füge die Optionsüberschrift hinzu
                    const optionHeader = document.createElement('div');
                    optionHeader.className = 'filter-option-header';
                    optionHeader.innerHTML = `${option} <span class="count">(${groupResidents.length})</span>`;
                    optionGroup.appendChild(optionHeader);

                    // Erstelle den Container für die Bewohnerkarten
                    const residentsContainer = document.createElement('div');
                    residentsContainer.className = 'residents-container';

                    // Sortiere die Bewohner nach Nachname, dann Vorname
                    const sortedResidents = groupResidents.sort((a, b) => {
                        const lastNameCompare = a.lastName.localeCompare(b.lastName);
                        if (lastNameCompare !== 0) return lastNameCompare;
                        return a.firstName.localeCompare(b.firstName);
                    });

                    // Füge die sortierten Bewohnerkarten hinzu
                    sortedResidents.forEach(resident => {
                        const card = this.createResidentCard(resident);
                        residentsContainer.appendChild(card);
                    });

                    optionGroup.appendChild(residentsContainer);
                    filterGroup.appendChild(optionGroup);
                });

            container.appendChild(filterGroup);
        });
    }
}; 