/**
 * Filter-Manager Modul
 * Verwaltet die Filter für die Bewohnerliste
 */

import { ApiService } from './api-service.js';
import { ConfigManager } from './config-manager.js';
import { ResidentManager } from './resident-manager.js';
import { ToastManager } from './toast-manager.js';

export const FilterManager = {
    config: {
        filters: {
            fields: [],
            areas: []
        }
    },
    _isRendering: false, // Flag, um mehrfache gleichzeitige renderFilter-Aufrufe zu verhindern

    /**
     * Initialisiert den Filter-Manager
     * @param {Object} options - Konfigurationsoptionen
     */
    async init(options = {}) {
        console.log('Filter-Manager wird als Sortierungs-Manager initialisiert...');
        
        // Eventlistener für alle Reset-Filter-Buttons hinzufügen
        document.querySelectorAll('#resetFilterBtn, .reset-filter-btn, button[data-action="reset-filter"]').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                this.resetFilter();
            });
                console.log('Event-Listener für Reset-Button hinzugefügt');
        }
        });
        
        // Lade die Sortieroptionen aus dem Backend
        try {
            const filters = await ApiService.getFilters();
            if (filters) {
                this.config.filters = filters;
                console.log('Sortierkonfiguration geladen:', this.config.filters);
                
                // Wende gespeicherte Sortierung an, falls vorhanden
                if (this.config.filters.areas && this.config.filters.areas.length > 0) {
                    // Importiere ConfigManager, um den Bereich zu finden
                    import('./config-manager.js').then(({ ConfigManager }) => {
                        const areaName = this.config.filters.areas[0];
                        const area = ConfigManager.config.areas.find(a => a.name === areaName);
                        if (area) {
                            console.log('Wende gespeicherte Sortierung an:', areaName);
                            this.applyFilter(areaName);
                        }
                    }).catch(err => {
                        console.error('Fehler beim Importieren des ConfigManagers:', err);
                    });
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Sortierkonfiguration:', error);
            ToastManager.error('Fehler beim Laden der Sortieroptionen');
        }
        
        // Füge Event-Listener für dynamisch erzeugte Sortier-Buttons hinzu
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Prüfe, ob ein Filter-Button geklickt wurde
            if (target.classList.contains('filter-btn') || target.closest('.filter-btn')) {
                const button = target.classList.contains('filter-btn') ? target : target.closest('.filter-btn');
                const area = button.dataset.area;
                const value = button.dataset.value;
                
                if (area) {
                    console.log(`Sortier-Button geklickt: ${area}${value ? ' - ' + value : ''}`);
                    this.applyFilter(area, value);
                }
            }
        });
        
        console.log('Sortierungs-Manager erfolgreich initialisiert');
    },
    
    /**
     * Wendet einen Filter an (funktioniert als Sortierung nach Bereichen)
     * @param {string} areaName - Name des Bereichs
     * @param {string} value - Wert des Filters (optional)
     */
    async applyFilter(areaName, value = null) {
        try {
            console.log('Sortierung wird angewendet nach Bereich:', areaName, value ? `und Wert: ${value}` : '');
            
            // Wenn kein Bereich angegeben wurde, alle Filter zurücksetzen
            if (!areaName) {
                return this.resetFilter();
            }
            
            // Lade die Konfiguration, um den Bereich zu finden
            let config;
            try {
                const { ConfigManager } = await import('./config-manager.js');
                config = ConfigManager.config;
            } catch (error) {
                console.error('Fehler beim Laden der Konfiguration:', error);
                config = await ApiService.getConfig();
            }
            
            // Finde den Bereich in der Konfiguration
            const area = config.areas.find(a => a.name === areaName);
            if (!area) {
                console.error(`Bereich '${areaName}' nicht in der Konfiguration gefunden`);
                console.log('Verfügbare Bereiche:', config.areas.map(a => a.name));
                ToastManager.error(`Bereich '${areaName}' nicht gefunden`);
                return;
            }
            
            console.log('Gefundener Bereich für Sortierung:', area);
            
            // Speichere den aktiven Sortierbereich
            this.config.filters.areas = [areaName];
            await this.saveFilterConfig();
            
            // Lade ALLE Bewohner (keine Filterung)
            let residents;
            try {
                residents = await ApiService.getResidents();
                console.log(`${residents.length} Bewohner geladen für Sortierung nach ${areaName}`);
            } catch (error) {
                console.error('Fehler beim Laden der Bewohner:', error);
                ToastManager.error('Fehler beim Laden der Bewohner');
                return;
            }
            
            // Verarbeite die Bewohner je nach Sortierart
                if (value) {
                // Sortiere nach einem spezifischen Wert
                this.filterBySpecificValue(residents, areaName, value);
            } else {
                // Gruppiere nach allen möglichen Werten des Bereichs
                this.groupByArea(residents, areaName, area);
            }
            
            // Aktualisiere die UI - aktive Filter-Buttons markieren
            this.updateActiveFilterButtons(areaName, value);
            
            ToastManager.success(`Sortierung nach "${areaName}" angewendet`);
            
        } catch (error) {
            console.error('Fehler beim Anwenden der Sortierung:', error);
            ToastManager.error('Fehler beim Sortieren der Bewohner: ' + error.message);
        }
    },
    
    /**
     * Filtert Bewohner nach einem spezifischen Wert
     * @param {Array} residents - Liste der Bewohner
     * @param {string} areaName - Name des Bereichs
     * @param {string} value - Wert, nach dem gefiltert werden soll
     */
    filterBySpecificValue(residents, areaName, value) {
        console.log(`Sortiere nach ${areaName} = ${value}`);
                
        // Gruppiere Bewohner nach dem spezifischen Wert
        const groups = {};
        groups[value] = [];
        groups['Keine Information'] = [];
        
        residents.forEach(resident => {
            // Prüfe, ob der Bewohner ein areas-Objekt hat und der gesuchte Wert vorhanden ist
                    if (resident.areas && resident.areas[areaName] === value) {
                        groups[value].push(resident);
                    } else {
                groups['Keine Information'].push(resident);
                    }
                });
                
                // Aktualisiere die Bewohnerliste
        this.updateResidentGroups(groups, areaName);
        
        // Aktualisiere den Filter-Banner
        this.updateFilterBannerWithCount(residents.length, `${areaName} - ${value}`);
    },
    
    /**
     * Gruppiert Bewohner nach allen möglichen Werten eines Bereichs
     * @param {Array} residents - Liste der Bewohner
     * @param {string} areaName - Name des Bereichs
     * @param {Object} area - Bereichsobjekt aus der Konfiguration
     */
    groupByArea(residents, areaName, area) {
                console.log(`Gruppiere nach Bereich: ${areaName}`);
                
                // Erstelle Gruppen basierend auf den im Bereich definierten Buttons
                const groups = {};
                
                // Füge alle im Bereich definierten Button-Labels als Gruppen hinzu
                if (area.buttons && area.buttons.length > 0) {
                    area.buttons.forEach(button => {
                        groups[button.label] = [];
                    });
                }
                
                // Füge eine Gruppe für "Keine Information" hinzu
                groups['Keine Information'] = [];
                
                // Sortiere die Bewohner in die entsprechenden Gruppen
        residents.forEach(resident => {
            // Prüfe, ob der Bewohner ein areas-Objekt hat und der Bereich darin vorhanden ist
                    const value = resident.areas && resident.areas[areaName];
            
                    if (value && groups[value]) {
                // Wenn der Wert als Gruppe existiert, füge den Bewohner dort hinzu
                        groups[value].push(resident);
                    } else {
                // Sonst zur "Keine Information" Gruppe hinzufügen
                        groups['Keine Information'].push(resident);
                    }
                });
        
        // Entferne leere Gruppen
        Object.keys(groups).forEach(groupName => {
            if (groups[groupName].length === 0 && groupName !== 'Keine Information') {
                delete groups[groupName];
                    }
                });
                
                // Aktualisiere die Bewohnerliste mit den gruppierten Bewohnern
        this.updateResidentGroups(groups, areaName);
        
        // Aktualisiere den Filter-Banner
        this.updateFilterBannerWithCount(residents.length, areaName);
    },
    
    /**
     * Aktualisiert das Filter-Banner mit der Anzahl der gefundenen Bewohner und dem Filter
     * @param {number} count - Anzahl der Bewohner
     * @param {string} filterDesc - Beschreibung des Filters
     */
    updateFilterBannerWithCount(count, filterDesc) {
                const filterBanner = document.getElementById('filterBanner');
                const activeFilterCount = document.getElementById('activeFilterCount');
        
                if (filterBanner && activeFilterCount) {
                    filterBanner.classList.remove('d-none');
            activeFilterCount.textContent = `${count} Bewohner gefunden (Filter: ${filterDesc})`;
        }
    },
    
    /**
     * Aktualisiert die Bewohnerliste mit gruppierten Bewohnern
     * @param {Object} groups - Nach Gruppen sortierte Bewohner
     * @param {string} areaName - Name des Bereichs/Filters
     */
    updateResidentGroups(groups, areaName) {
        const residentContainer = document.getElementById('residentContainer');
        if (!residentContainer) {
            console.error('Element #residentContainer nicht gefunden');
            return;
        }
        
        console.log('Aktualisiere Bewohnerliste mit Gruppen:', Object.keys(groups));
        console.log('Anzahl der Gruppen:', Object.keys(groups).length);
        console.log('Sortierbereich:', areaName);
        
        // Debugging: Gruppengröße ausgeben
        Object.keys(groups).forEach(groupName => {
            console.log(`Gruppe "${groupName}": ${groups[groupName].length} Bewohner`);
        });
        
        // Leere die Liste
        residentContainer.innerHTML = '';
        
        // Sortiere die Gruppennamen alphabetisch, aber "Keine Information" immer am Ende
        const sortedGroupNames = Object.keys(groups).sort((a, b) => {
            if (a === 'Keine Information' || a === 'Keine Informationen') return 1;
            if (b === 'Keine Information' || b === 'Keine Informationen') return -1;
            return a.localeCompare(b);
        });
        
        // Erstelle für jede Gruppe einen Abschnitt
        sortedGroupNames.forEach(groupName => {
            const residents = groups[groupName];
            
            // Überspringen, wenn keine Bewohner in dieser Gruppe sind
            if (residents.length === 0) return;
            
            // Erstelle einen Gruppencontainer
            const groupContainer = document.createElement('div');
            groupContainer.className = 'group-container mb-0';
            
            // Erstelle eine Gruppenüberschrift
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header d-flex justify-content-between align-items-center p-2 bg-light rounded-top border';
            
            // Erstelle ein Badge für die Anzahl der Bewohner
            const countBadge = document.createElement('span');
            countBadge.className = 'badge rounded-pill bg-primary';
            countBadge.textContent = residents.length;
            
            // Füge den Gruppennamen und das Badge hinzu
            groupHeader.innerHTML = `<h5 class="mb-0 filter-group-title" data-group="${groupName}" data-area="${areaName}">${groupName}</h5>`;
            groupHeader.appendChild(countBadge);
            
            // Füge den Header zum Container hinzu
            groupContainer.appendChild(groupHeader);
            
            // Erstelle einen Container für die Bewohnerkarten
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'cards-container p-2 border border-top-0 rounded-bottom';
            
            // Erstelle für jeden Bewohner eine Karte
            if (residents.length > 0) {
                const row = document.createElement('div');
                row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3';
                
                // Sortiere die Bewohner nach Nachname, dann Vorname
                const sortedResidents = [...residents].sort((a, b) => {
                    const lastNameComparison = a.lastName.localeCompare(b.lastName);
                    if (lastNameComparison !== 0) return lastNameComparison;
                    return a.firstName.localeCompare(b.firstName);
                });
                
                // Erstelle für jeden Bewohner eine Karte
            sortedResidents.forEach(resident => {
                    const col = document.createElement('div');
                    col.className = 'col';
                    col.appendChild(this.createResidentCard(resident));
                    row.appendChild(col);
                });
                
                cardsContainer.appendChild(row);
            } else {
                // Falls keine Bewohner in dieser Gruppe sind
                cardsContainer.innerHTML = `
                    <div class="alert alert-info mb-0">
                        Keine Bewohner in dieser Gruppe
                    </div>
                `;
            }
            
            // Füge den Container zum Gruppencontainer hinzu
            groupContainer.appendChild(cardsContainer);
            
            // Füge den Gruppencontainer zum Container hinzu
            residentContainer.appendChild(groupContainer);
        });
        
        // Wenn überhaupt keine Gruppen angezeigt werden
        if (residentContainer.children.length === 0) {
            residentContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    Keine Bewohner gefunden.
                </div>
            `;
        }
        
        // Timeout hinzufügen, damit die Karten die gleiche Breite haben
        setTimeout(() => {
            this.adjustCardWidths();
        }, 100);
    },
    
    /**
     * Passt die Breite der Bewohnerkarten an, damit sie alle gleich breit sind
     */
    adjustCardWidths() {
        const residentCards = document.querySelectorAll('.resident-card');
        if (residentCards.length === 0) return;
        
        // Setze eine feste Breite von 180px für alle Karten
        console.log(`Setze alle Bewohnerkarten auf die feste Breite: 180px`);
        
        residentCards.forEach(card => {
            card.style.width = '180px';
            card.style.minWidth = '180px';
            card.style.maxWidth = '180px';
            card.style.flex = '0 0 180px';
        });
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
        card.style.flex = '0 0 180px !important';
        
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
        }
        
        infoLine.textContent = infoParts.join(' | ');
        
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
                        badge.innerHTML = `${areaName}:<br>${value.join('<br>')}`;
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
        detailButton.addEventListener('click', () => {
            // Importiere den ModalManager, um das Bewohnerdetail-Modal zu öffnen
            import('./modal-manager.js')
                .then(({ ModalManager }) => {
                    ModalManager.showResidentDetailModal(resident);
                })
                .catch(err => {
                    console.error('Fehler beim Laden des ModalManagers:', err);
                    alert('Fehler beim Öffnen der Bewohnerdetails');
                });
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
        
        // Setze die Breite der Karte auf 180px
        card.style.width = '180px';
        card.style.minWidth = '180px';
        card.style.maxWidth = '180px';
        
        return card;
    },
    
    /**
     * Aktualisiert die UI, um aktive Filter-Buttons zu markieren
     * @param {string} areaName - Name des aktiven Bereichs
     * @param {string} value - Spezifischer Wert (optional)
     */
    updateActiveFilterButtons(areaName, value = null) {
        // Finde alle Filter-Buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        // Entferne die aktive Klasse von allen Buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Markiere den aktiven Filter-Button
        if (areaName) {
            if (value) {
                // Suche nach Button mit dem spezifischen Wert
                const valueButton = document.querySelector(`.filter-btn[data-area="${areaName}"][data-value="${value}"]`);
                if (valueButton) {
                    valueButton.classList.add('active');
                }
            } else {
                // Suche nach dem Hauptbutton für den Bereich
                const areaButtons = document.querySelectorAll(`.filter-btn[data-area="${areaName}"]:not([data-value]), .area-filter[data-value="${areaName}"]`);
                areaButtons.forEach(btn => btn.classList.add('active'));
            }
        }
    },
    
    /**
     * Aktualisiert das Filter-Banner mit der aktuellen Filterauswahl
     */
    updateFilterBanner() {
        const filterBanner = document.getElementById('filterBanner');
        const activeFilterCount = document.getElementById('activeFilterCount');
        
        if (!filterBanner || !activeFilterCount) {
            console.error('Filter-Banner oder Active-Filter-Count nicht gefunden');
            return;
        }
        
        // Prüfe, ob Filter aktiv sind
        const hasActiveFilters = this.config.filters && (
            (this.config.filters.areas && this.config.filters.areas.length > 0) ||
            (this.config.filters.fields && this.config.filters.fields.length > 0)
        );
        
        if (!hasActiveFilters) {
            // Keine aktiven Filter, Banner ausblenden
            filterBanner.classList.add('d-none');
            return;
        }
        
        // Hole aktuelle Anzahl der gefilterten Bewohner
        const filteredCount = ResidentManager.filteredResidents ? 
                             ResidentManager.filteredResidents.length : 0;
        
        // Erstelle Filterbeschreibung
        let filterDescription = '';
        
        // Bereichsfilter
        if (this.config.filters.areas && this.config.filters.areas.length > 0) {
            const areaNames = this.config.filters.areas.join(', ');
            filterDescription += `Bereiche: ${areaNames}`;
        }
        
        // Feldfilter (falls implementiert)
        if (this.config.filters.fields && this.config.filters.fields.length > 0) {
            if (filterDescription) filterDescription += ' | ';
            const fieldNames = this.config.filters.fields.join(', ');
            filterDescription += `Felder: ${fieldNames}`;
        }
        
        // Aktualisiere Text im Banner
        activeFilterCount.textContent = `${filteredCount} Bewohner gefunden${filterDescription ? ` (Filter: ${filterDescription})` : ''}`;
        
        // Banner anzeigen
        filterBanner.classList.remove('d-none');
    },
    
    /**
     * Erstellt die Filter-Buttons in der UI
     * @param {HTMLElement} container - Container für die Filter-Buttons
     */
    createFilterButtons(container) {
        if (!container) return;
        
        // Leere den Container
        container.innerHTML = '';
        
        // Hole die Filter-Bereiche aus der Konfiguration
        const filterAreas = ConfigManager.getFilterAreas();
        
        if (filterAreas.length === 0) {
            container.innerHTML = '<p class="text-muted">Keine Filter konfiguriert</p>';
            return;
        }
        
        // Erstelle Filter-Gruppen für jeden Bereich
        filterAreas.forEach(area => {
            const areaGroup = document.createElement('div');
            areaGroup.className = 'filter-group mb-4';
            
            // Bereichsname
            const areaTitle = document.createElement('h5');
            areaTitle.className = 'mb-2';
            areaTitle.textContent = area.name;
            
            // Bereichs-Button (für generellen Filter nach Bereich)
            const areaButton = document.createElement('button');
            areaButton.className = 'btn btn-outline-primary mb-2 me-2';
            areaButton.textContent = 'Alle anzeigen';
            
            // Prüfe, ob der Bereich bereits als Filter aktiviert ist
            if (this.config.filters.areas.includes(area.name)) {
                areaButton.classList.add('active');
            }
            
            areaButton.addEventListener('click', () => {
                this.applyFilter(area.name);
            });
            
            // Container für Wert-Buttons
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'd-flex flex-wrap gap-2';
            
            // Erstelle Buttons für jeden Wert
            area.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-outline-secondary';
                btn.textContent = button.label;
                btn.addEventListener('click', () => {
                    this.applyFilter(area.name, button.label);
                });
                
                buttonsContainer.appendChild(btn);
            });
            
            // Füge alle Elemente zusammen
            areaGroup.appendChild(areaTitle);
            areaGroup.appendChild(areaButton);
            areaGroup.appendChild(buttonsContainer);
            
            container.appendChild(areaGroup);
        });
    },
    
    /**
     * Erstellt die Filteroptionen im Konfigurationsmodal
     * @param {HTMLElement} container - Der Container, in dem die Filteroptionen angezeigt werden
     */
    createFilterOptions(container) {
        if (!container) return;
        
        // Verhindere mehrfache gleichzeitige Aufrufe
        if (this._isRendering) {
            console.log('Filter-Optionen werden bereits gerendert');
            return;
        }
        
        this._isRendering = true;
        
        // Leere den Container
        container.innerHTML = '';
        
        try {
            // Importiere den ConfigManager, um auf die Konfiguration zuzugreifen
            import('./config-manager.js').then(({ ConfigManager }) => {
                const config = ConfigManager.config;
                let hasFilters = false;
                
                // Liste der gewünschten Filter-Bereiche
                const desiredAreaNames = ['Sexy', 'Allergene', 'Frühstück', 'Mittagessen', 'Abendessen', 'Wo wird das Essen eingetragen!'];
                
                // Filtere die Bereiche, die angezeigt werden sollen
                const filterAreas = config.areas.filter(area => desiredAreaNames.includes(area.name));
                
                // Bereichsfilter erstellen
                if (filterAreas && filterAreas.length > 0) {
                    const areaFilterGroup = document.createElement('div');
                    areaFilterGroup.className = 'filter-group mb-4';
                    
                    const areaFilterHeader = document.createElement('h5');
                    areaFilterHeader.className = 'mb-2';
                    areaFilterHeader.textContent = 'Filter nach Bereich';
                    areaFilterGroup.appendChild(areaFilterHeader);
                    
                    const areaButtonsContainer = document.createElement('div');
                    areaButtonsContainer.className = 'd-flex flex-wrap gap-2';
                    
                    // Füge für jeden gewünschten Bereich einen Filter hinzu
                    filterAreas.forEach(area => {
                            const filterButton = document.createElement('button');
                            filterButton.className = 'btn btn-sm btn-outline-secondary filter-btn area-filter';
                            filterButton.dataset.value = area.name;
                            filterButton.textContent = area.name;
                            
                        // Event-Listener für Filterauswahl - nur ein Filter gleichzeitig
                            filterButton.addEventListener('click', () => {
                            const wasActive = filterButton.classList.contains('active');
                            
                            // Deaktiviere alle Filter-Buttons
                            areaButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            
                            // Aktiviere diesen Button, wenn er nicht bereits aktiv war
                            if (!wasActive) {
                                filterButton.classList.add('active');
                            }
                            
                            // Aktualisiere die Filter-Konfiguration
                            this.updateFilterConfig();
                        });
                        
                        // Aktivieren, wenn der Filter bereits aktiv ist
                        if (this.config.filters && this.config.filters.areas && this.config.filters.areas.includes(area.name)) {
                            filterButton.classList.add('active');
                        }
                        
                        areaButtonsContainer.appendChild(filterButton);
                        hasFilters = true;
                    });
                    
                    // Nur hinzufügen, wenn es tatsächlich Filter gibt
                    if (areaButtonsContainer.children.length > 0) {
                        areaFilterGroup.appendChild(areaButtonsContainer);
                        container.appendChild(areaFilterGroup);
                    }
                }
                
                // Information anzeigen, wenn keine Filter verfügbar sind
                if (!hasFilters) {
                    const noFiltersInfo = document.createElement('div');
                    noFiltersInfo.className = 'alert alert-info';
                    noFiltersInfo.textContent = 'Keine Filter verfügbar. Stellen Sie sicher, dass die Bereiche (Sexy, Allergene, etc.) in der Konfiguration vorhanden sind.';
                    container.appendChild(noFiltersInfo);
                }
                
                // Rendering abgeschlossen
                this._isRendering = false;
            }).catch(error => {
                console.error('Fehler beim Laden des ConfigManager:', error);
                
                // Fehler anzeigen
                const errorInfo = document.createElement('div');
                errorInfo.className = 'alert alert-danger';
                errorInfo.textContent = 'Fehler beim Laden der Filteroptionen: ' + error.message;
                container.appendChild(errorInfo);
                
                // Rendering zurücksetzen
                this._isRendering = false;
            });
        } catch (error) {
            console.error('Fehler beim Erstellen der Filteroptionen:', error);
            
            // Fehler anzeigen
            const errorInfo = document.createElement('div');
            errorInfo.className = 'alert alert-danger';
            errorInfo.textContent = 'Fehler beim Erstellen der Filteroptionen: ' + error.message;
            container.appendChild(errorInfo);
            
            // Rendering zurücksetzen
            this._isRendering = false;
        }
    },
    
    /**
     * Aktualisiert die Filteroptionen im Konfigurationsmodal
     * Diese Methode wird von ConfigManager.updateFilterOptions aufgerufen
     */
    updateFilterOptions() {
        // Finde den Filter-Tab-Container
        const filterOptionsContainer = document.getElementById('filterOptions');
        if (filterOptionsContainer) {
            // Erstelle die Filteroptionen neu
            this.createFilterOptions(filterOptionsContainer);
        }
    },
    
    /**
     * Aktualisiert die Filterkonfiguration basierend auf den ausgewählten Filtern
     */
    updateFilterConfig() {
        try {
            // Aktive Feldfilter sammeln
            const activeFieldFilters = Array.from(document.querySelectorAll('.field-filter.active')).map(button => button.dataset.value);
            
            // Aktive Bereichsfilter sammeln - Nur maximal ein Filter speichern
            const activeAreaFilterButtons = Array.from(document.querySelectorAll('.area-filter.active'));
            let activeAreaFilters = [];
            
            if (activeAreaFilterButtons.length > 0) {
                // Nehme nur den ersten aktiven Filter
                activeAreaFilters = [activeAreaFilterButtons[0].dataset.value];
                
                // Deaktiviere alle anderen Filter (falls mehrere aktiv sind)
                if (activeAreaFilterButtons.length > 1) {
                    activeAreaFilterButtons.slice(1).forEach(button => {
                        button.classList.remove('active');
                    });
                }
            }
            
            // Filterkonfiguration aktualisieren
            this.config.filters = {
                fields: activeFieldFilters,
                areas: activeAreaFilters
            };
            
            console.log('Filterkonfiguration aktualisiert:', this.config.filters);
            
            // Speichere die aktualisierte Konfiguration automatisch
            this.saveFilterConfig().catch(error => {
                console.error('Fehler beim automatischen Speichern der Filter:', error);
            });
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Filterkonfiguration:', error);
            ToastManager.error('Fehler beim Aktualisieren der Filter');
        }
    },
    
    /**
     * Speichert die Filterkonfiguration
     * @returns {Promise<boolean>} - Erfolgreich gespeichert?
     */
    async saveFilterConfig() {
        try {
            // Speichere die aktualisierten Filter im Backend
            await ApiService.updateFilters(this.config.filters);
            
            // Aktualisiere die Filter-Buttons
            const filterSidebar = document.getElementById('filterSidebar');
            if (filterSidebar) {
                this.createFilterButtons(filterSidebar);
            }
            
            // Aktualisiere das Filter-Banner
            this.updateFilterBanner();
            
            console.log('Filter erfolgreich gespeichert:', this.config.filters);
            
            return true;
        } catch (error) {
            console.error('Fehler beim Speichern der Filterkonfiguration:', error);
            ToastManager.error('Fehler beim Speichern der Filter: ' + error.message);
            return false;
        }
    },

    /**
     * Sortiert Bewohner nach einem bestimmten Bereich 
     * @param {Array} residents - Liste der Bewohner
     * @param {string} areaName - Name des Bereichs
     * @returns {Object} - Sortierte Bewohner, gruppiert nach Bereichswerten
     */
    groupResidentsByArea(residents, areaName) {
        if (!residents || !areaName) return {};

        const groupedResidents = {};
        const noInfoGroup = [];
        const numericGroups = {};
        const alphaGroups = {};
        
        // Gruppieren der Bewohner nach den Werten des ausgewählten Bereichs
        residents.forEach(resident => {
            const areaValue = resident.areas && resident.areas[areaName];
            
            if (!areaValue) {
                // Keine Information vorhanden
                noInfoGroup.push(resident);
            } else {
                // Prüfen, ob es ein nummerischer Wert ist (beginnend mit einer Zahl)
                const isNumeric = /^\d+/.test(areaValue);
                
                if (isNumeric) {
                    numericGroups[areaValue] = numericGroups[areaValue] || [];
                    numericGroups[areaValue].push(resident);
                } else {
                    alphaGroups[areaValue] = alphaGroups[areaValue] || [];
                    alphaGroups[areaValue].push(resident);
                }
            }
        });
        
        // Sortiere die numerischen Gruppen nach Zahlenwert
        const sortedNumericKeys = Object.keys(numericGroups).sort((a, b) => {
            // Extrahiere die Zahlen am Anfang des Strings
            const numA = parseInt(a.match(/^\d+/)[0]);
            const numB = parseInt(b.match(/^\d+/)[0]);
            return numA - numB;
        });
        
        // Sortiere die alphabetischen Gruppen alphabetisch
        const sortedAlphaKeys = Object.keys(alphaGroups).sort();
        
        // Füge die Gruppen in der gewünschten Reihenfolge zusammen (erst Zahlen, dann Buchstaben)
        sortedNumericKeys.forEach(key => {
            groupedResidents[key] = numericGroups[key];
        });
        
        sortedAlphaKeys.forEach(key => {
            groupedResidents[key] = alphaGroups[key];
        });
        
        // Füge "Keine Informationen" als letzte Gruppe hinzu, falls vorhanden
        if (noInfoGroup.length > 0) {
            groupedResidents['Keine Informationen'] = noInfoGroup;
        }
        
        return groupedResidents;
    },

    async sortResidentsByArea(area) {
        try {
            // Sortiere die Bewohner nach dem ausgewählten Bereich
            const residents = await fetch('/api/solo/residents').then(response => response.json());
            const sortedResidents = this.groupResidentsByArea(residents, area.name);
            
            // Aktualisiere die Bewohnerliste
            ResidentManager.applyFilter(sortedResidents);
            
            // Aktualisiere das UI
            const filterBanner = document.getElementById('filterBanner');
            const activeFilterCount = document.getElementById('activeFilterCount');
            if (filterBanner && activeFilterCount) {
                filterBanner.classList.remove('d-none');
                
                // Hole die Anzahl der Bewohner
                activeFilterCount.textContent = `${residents.length} Bewohner gefunden (Filter: ${area.name})`;
            }
        } catch (error) {
            console.error('Fehler beim Sortieren der Bewohner:', error);
            ToastManager.error('Fehler beim Sortieren der Bewohner');
        }
    },

    async showAllResidents() {
        try {
            // Zeige alle Bewohner ohne Gruppierung an
            const residents = await fetch('/api/solo/residents').then(response => response.json());
            ResidentManager.applyFilter(residents);
            
            // Aktualisiere das UI
            const filterBanner = document.getElementById('filterBanner');
            const activeFilterCount = document.getElementById('activeFilterCount');
            if (filterBanner && activeFilterCount) {
                filterBanner.classList.add('d-none');
                
                // Hole die Anzahl der Bewohner
                activeFilterCount.textContent = `${residents.length} Bewohner gefunden (Filter: Alle)`;
            }
        } catch (error) {
            console.error('Fehler beim Anzeigen aller Bewohner:', error);
            ToastManager.error('Fehler beim Anzeigen aller Bewohner');
        }
    },

    /**
     * Setzt alle Filter zurück und aktualisiert die Bewohnerliste
     */
    resetFilters() {
        try {
            // Setze die Filter zurück
            this.config.filters = {
                fields: [],
                areas: []
            };
            
            // Reset aktive Filter
            const activeFilterButtons = document.querySelectorAll('.filter-btn.active');
            activeFilterButtons.forEach(button => {
                button.classList.remove('active');
            });
            
            // Speichere die Filter im Backend
            this.saveFilterConfig().then(() => {
                console.log('Filter wurden zurückgesetzt und gespeichert');
            }).catch(error => {
                console.error('Fehler beim Speichern der zurückgesetzten Filter:', error);
            });
            
            // Aktualisiere die Bewohnerliste ohne Filter
            ResidentManager.displayAllResidents();
            
            // Filter-Banner ausblenden
            const filterBanner = document.getElementById('filterBanner');
            if (filterBanner) {
                filterBanner.classList.add('d-none');
            }
            
            ToastManager.success('Filter zurückgesetzt');
        } catch (error) {
            console.error('Fehler beim Zurücksetzen der Filter:', error);
            ToastManager.error('Fehler beim Zurücksetzen der Filter');
        }
    },

    /**
     * Setzt den aktuellen Filter zurück und zeigt alle Bewohner
     */
    async resetFilter() {
        try {
            console.log('Setze Sortierung zurück...');
            
            // Setze die Filter zurück
            this.config.filters = {
                fields: [],
                areas: []
            };
            
            // Speichere die Filter im Backend
            await this.saveFilterConfig();
            
            // Lade alle Bewohner
            let residents;
            try {
                residents = await ApiService.getResidents();
                console.log(`${residents.length} Bewohner geladen (ohne Sortierung)`);
            } catch (error) {
                console.error('Fehler beim Laden der Bewohner:', error);
                ToastManager.error('Fehler beim Laden der Bewohner');
                return;
            }
            
            // Suche das Bewohner-Container-Element
            const residentContainer = document.getElementById('residentContainer');
            if (!residentContainer) {
                console.error('Element #residentContainer nicht gefunden');
                return;
            }
            
            // Leere den Container, aber behalte die ursprünglichen Klassen
            // Wir setzen nur den Inhalt zurück, nicht die Klassen
            residentContainer.innerHTML = '';
            
            // WICHTIG: Die Klasse 'residents-container row g-3' ist bereits am Container,
            // wir fügen KEINEN neuen Container mit anderen Klassen hinzu!
            
            // Sortiere die Bewohner nach Nachname, dann Vorname
            const sortedResidents = [...residents].sort((a, b) => {
                const lastNameComparison = a.lastName.localeCompare(b.lastName);
                if (lastNameComparison !== 0) return lastNameComparison;
                return a.firstName.localeCompare(b.firstName);
            });
            
            // Erstelle für jeden Bewohner eine Karte und füge sie direkt zum Container hinzu
            sortedResidents.forEach(resident => {
                const col = document.createElement('div');
                col.className = 'col';
                col.appendChild(this.createResidentCard(resident));
                residentContainer.appendChild(col); // Direkt zum Hauptcontainer hinzufügen
            });
            
            // Verstecke das Filter-Banner
            const filterBanner = document.getElementById('filterBanner');
            if (filterBanner) {
                filterBanner.classList.add('d-none');
            }
            
            // Deaktiviere alle Filter-Buttons
            document.querySelectorAll('.filter-btn.active').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Warte einen Moment und passe dann die Breite der Karten an
            setTimeout(() => {
                this.adjustCardWidths();
            }, 100);
            
            ToastManager.success('Sortierung zurückgesetzt');
            return true;
        } catch (error) {
            console.error('Fehler beim Zurücksetzen der Sortierung:', error);
            ToastManager.error('Fehler beim Zurücksetzen der Sortierung');
            return false;
        }
    }
}; 