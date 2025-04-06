// Konstanten
const LOADING_TIMEOUT = 1000; // 1 Sekunde Mindestanzeige für Ladeanimation

// Lade-Status Verwaltung
let isLoading = false;
let isRendering = false; // Flag, um mehrfache gleichzeitige renderFilters-Aufrufe zu verhindern

// Filter-Zustand
let activeFilters = {
    activeAreas: {}
};

// Hilfsfunktion zum Aktualisieren des Loading-Status
function setLoading(loading) {
    isLoading = loading;
    const filterOptions = document.getElementById('filterOptions');
    
    if (loading) {
        filterOptions.classList.add('loading');
        filterOptions.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Lädt...</span>
                </div>
                <p class="mt-2">Filter werden geladen...</p>
            </div>
        `;
    } else {
        filterOptions.classList.remove('loading');
    }
}

// Funktion zum Speichern der Filter im Backend
async function saveFilters() {
    try {
        await fetch('/api/solo/filters', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activeAreas: activeFilters.activeAreas })
        });
    } catch (error) {
        console.error('Fehler beim Speichern der Filter:', error);
        showErrorMessage('Filter konnten nicht gespeichert werden');
    }
}

// Funktion zum Laden der gespeicherten Filter vom Backend
async function loadSavedFilters() {
    try {
        const response = await fetch('/api/solo/filters');
        if (!response.ok) throw new Error('Fehler beim Laden der Filter');
        
        const filters = await response.json();
        return filters;
    } catch (error) {
        console.error('Fehler beim Laden der gespeicherten Filter:', error);
        return null;
    }
}

// Funktion zum Zurücksetzen der Filter
async function resetFilters() {
    try {
        // Setze die Filter im Backend zurück
        const response = await fetch('/api/solo/filters', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                activeAreas: {}
            })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Zurücksetzen der Filter');
        }

        // UI aktualisieren
        document.querySelectorAll('.filter-btn.active').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Filter-Banner ausblenden
        const filterBanner = document.getElementById('filterBanner');
        if (filterBanner) {
            filterBanner.classList.add('d-none');
        }
        
        // Lade FilterManager und setze Filter zurück
        import('./Module/filter-manager.js').then(({ FilterManager }) => {
            FilterManager.applyFilter(null);
        }).catch(error => {
            console.error('Fehler beim Laden des FilterManager:', error);
        });
        
        // Lade Filter-Konfiguration
        const formConfig = await loadFormConfig();
        
        // Filter neu rendern
        const filterOptions = document.getElementById('filterOptions');
        if (filterOptions) {
            renderFilters(filterOptions, formConfig);
        }
        
    } catch (error) {
        console.error('Fehler beim Zurücksetzen der Filter:', error);
        showErrorMessage('Filter konnten nicht zurückgesetzt werden');
    }
}

// Hilfsfunktion für Toast-Nachrichten
function showErrorMessage(message) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header bg-danger text-white">
                <strong class="me-auto">Fehler</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Schließen"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toast = toastContainer.lastElementChild;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Toast nach dem Ausblenden entfernen
    toast.addEventListener('hidden.bs.toast', () => toast.remove());
}

// Hilfsfunktion zum Erstellen des Toast-Containers
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
}

// Funktion zum Aktualisieren des Filter-Banners
function updateFilterBanner(filteredCount) {
    const filterBanner = document.getElementById('filterBanner');
    const filterCountElement = document.getElementById('activeFilterCount');
    
    if (!filterBanner || !filterCountElement) return;

    const numActiveFilters = Object.keys(activeFilters.activeAreas).length;
    
    if (numActiveFilters > 0) {
        filterBanner.classList.remove('d-none');
        filterCountElement.textContent = `${filteredCount} Bewohner gefunden (${numActiveFilters} aktive Filter)`;
    } else {
        filterBanner.classList.add('d-none');
    }
}

// Funktion zum Laden der Filter-Konfiguration
async function loadFormConfig() {
    try {
        const response = await fetch('/api/solo/config');
        if (!response.ok) throw new Error('Fehler beim Laden der Formular-Konfiguration');
        const formConfig = await response.json();
        return formConfig;
    } catch (error) {
        console.error('Fehler beim Laden der Formular-Konfiguration:', error);
        showErrorMessage('Filter-Konfiguration konnte nicht geladen werden');
        return { areas: [] };
    }
}

/**
 * Rendert Filter-Komponenten basierend auf der Konfiguration
 * @param {HTMLElement} container - Der Container, in dem die Filter angezeigt werden
 * @param {Object} config - Die Konfiguration mit Filter-Definitionen
 */
function renderFilters(container, config) {
    if (!container || !config || !config.areas) {
        console.error('Ungültige Parameter für renderFilters');
        return;
    }
    
    // Leere den Container
    container.innerHTML = '';
    
    // Liste der gewünschten Filter-Bereiche
    const desiredAreaNames = ['Sexy', 'Allergene', 'Frühstück', 'Mittagessen', 'Abendessen', 'Wo wird das Essen eingetragen!'];
    
    // Filtere die Bereiche, die angezeigt werden sollen
    const filterAreas = config.areas.filter(area => desiredAreaNames.includes(area.name));
    
    // Wenn keine Filter vorhanden sind, zeige eine Meldung an
    if (filterAreas.length === 0) {
        container.innerHTML = '<p class="text-muted">Keine Filter konfiguriert</p>';
        return;
    }
    
    // Erstelle Filter-Buttons für jeden Bereich
    filterAreas.forEach(area => {
        const filterGroup = document.createElement('div');
        filterGroup.className = 'filter-group mb-4';
        
        // Überschrift für den Filter-Bereich
        const groupHeader = document.createElement('h5');
        groupHeader.className = 'filter-header mb-2';
        groupHeader.textContent = area.name;
        filterGroup.appendChild(groupHeader);
        
        // Container für die Filter-Buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'filter-buttons d-flex flex-wrap gap-2';
        
        // Haupt-Filter-Button für den gesamten Bereich
        const mainButton = document.createElement('button');
        mainButton.className = 'btn btn-sm btn-outline-primary filter-btn';
        mainButton.dataset.area = area.name;
        mainButton.textContent = 'Alle anzeigen';
        mainButton.addEventListener('click', (event) => {
            // Deaktiviere alle Filter-Buttons in dieser Gruppe
            buttonsContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Aktiviere diesen Button
            mainButton.classList.add('active');
            
            // Lade FilterManager und wende Filter an
            import('./Module/filter-manager.js').then(({ FilterManager }) => {
                FilterManager.applyFilter(area.name);
            }).catch(error => {
                console.error('Fehler beim Laden des FilterManager:', error);
            });
        });
        
        buttonsContainer.appendChild(mainButton);
        
        // Erstelle Buttons für jeden Wert im Bereich
        if (area.buttons && area.buttons.length > 0) {
            area.buttons.forEach(button => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-outline-secondary filter-btn';
                btn.dataset.area = area.name;
                btn.dataset.value = button.label;
                btn.textContent = button.label;
                
                btn.addEventListener('click', (event) => {
                    // Deaktiviere alle Filter-Buttons in dieser Gruppe
                    buttonsContainer.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    
                    // Aktiviere diesen Button
                    btn.classList.add('active');
                    
                    // Lade FilterManager und wende Filter an
                    import('./Module/filter-manager.js').then(({ FilterManager }) => {
                        FilterManager.applyFilter(area.name, button.label);
                    }).catch(error => {
                        console.error('Fehler beim Laden des FilterManager:', error);
                    });
                });
                
                buttonsContainer.appendChild(btn);
            });
        }
        
        filterGroup.appendChild(buttonsContainer);
        container.appendChild(filterGroup);
    });
    
    // Füge einen "Alle zurücksetzen" Button hinzu
    const resetButtonContainer = document.createElement('div');
    resetButtonContainer.className = 'mt-3';
    
    const resetButton = document.createElement('button');
    resetButton.className = 'btn btn-sm btn-outline-danger';
    resetButton.textContent = 'Filter zurücksetzen';
    resetButton.addEventListener('click', () => {
        // Deaktiviere alle Filter-Buttons
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Lade FilterManager und setze Filter zurück
        import('./Module/filter-manager.js').then(({ FilterManager }) => {
            FilterManager.applyFilter(null);
        }).catch(error => {
            console.error('Fehler beim Laden des FilterManager:', error);
        });
    });
    
    resetButtonContainer.appendChild(resetButton);
    container.appendChild(resetButtonContainer);
    
    console.log('Filter wurden gerendert:', filterAreas.length, 'Bereiche');
}

// Hilfsfunktion zum Sortieren der Bewohner nach Bereich
async function sortResidentsByArea(area) {
    try {
        const response = await fetch('/api/solo/residents');
        if (!response.ok) throw new Error('Fehler beim Laden der Bewohner');
        const residents = await response.json();

        // Gruppiere Bewohner nach den Button-Labels des Bereichs
        const groups = {};
        area.buttons.forEach(button => {
            groups[button.label] = [];
        });
        groups['Keine Informationen vorhanden!'] = [];

        residents.forEach(resident => {
            const areaValue = resident[area.name];
            if (areaValue && groups.hasOwnProperty(areaValue)) {
                groups[areaValue].push(resident);
            } else {
                groups['Keine Informationen vorhanden!'].push(resident);
            }
        });

        updateResidentGroups(groups);
        updateFilterBanner(residents.length);

    } catch (error) {
        console.error('Fehler beim Sortieren der Bewohner:', error);
        showErrorMessage('Fehler beim Sortieren der Bewohner');
    }
}

function updateResidentGroups(groups) {
    const residentsList = document.getElementById('residentsList');
    if (!residentsList) return;

    residentsList.innerHTML = '';

    Object.entries(groups).forEach(([groupName, residents]) => {
        if (residents.length === 0) return; // Überspringe leere Gruppen

        const groupDiv = document.createElement('div');
        groupDiv.className = 'mb-4';

        const groupTitle = document.createElement('h4');
        groupTitle.className = 'mb-3 pb-2 border-bottom';
        groupTitle.textContent = groupName;
        groupDiv.appendChild(groupTitle);

        // Sortiere Bewohner nach Nachname
        residents
            .sort((a, b) => a.lastName.localeCompare(b.lastName))
            .forEach(resident => {
                const residentCard = createResidentCard(resident);
                groupDiv.appendChild(residentCard);
            });

        residentsList.appendChild(groupDiv);
    });
}

function createResidentCard(resident) {
    const card = document.createElement('div');
    card.className = 'card mb-2';
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${resident.firstName} ${resident.lastName}</h5>
        </div>
    `;
    return card;
}

async function showAllResidents() {
    try {
        const response = await fetch('/api/solo/residents');
        if (!response.ok) throw new Error('Fehler beim Laden der Bewohner');
        const residents = await response.json();

        const residentsList = document.getElementById('residentsList');
        if (!residentsList) return;

        residentsList.innerHTML = '';

        // Sortiere alle Bewohner nach Nachname
        residents
            .sort((a, b) => a.lastName.localeCompare(b.lastName))
            .forEach(resident => {
                const card = createResidentCard(resident);
                residentsList.appendChild(card);
            });

    } catch (error) {
        console.error('Fehler beim Laden der Bewohner:', error);
        showErrorMessage('Bewohner konnten nicht geladen werden');
    }
}

// CSS für die Bewohnerkarten
const style = document.createElement('style');
style.textContent = `
    .resident-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .resident-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .detail-item {
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
    }
    
    .detail-label {
        font-weight: 500;
        margin-right: 0.5rem;
    }
    
    .detail-value {
        color: var(--bs-gray-700);
    }
    
    .detail-value.text-success {
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// Event-Listener für Reset-Button
document.getElementById('resetFilterBtn')?.addEventListener('click', resetFilters);

// Initialisierung
let isInitialized = false;

function initializeFilters() {
    if (isInitialized) {
        console.log('Filter wurden bereits initialisiert');
        return;
    }
    
    console.log('Initialisiere Filter...'); // Debug-Log
    
    const filterOptions = document.getElementById('filterOptions');
    if (filterOptions) {
        renderFilters(filterOptions, { areas: [] });
        isInitialized = true;
    } else {
        console.error('filterOptions Element nicht gefunden bei Initialisierung');
    }
}

// Nur ein Event-Listener für das DOM
document.addEventListener('DOMContentLoaded', initializeFilters, { once: true });

// Exportiere beide Funktionen gemeinsam
export { renderFilters, initializeFilters };

// Füge einen Debug-Button hinzu, wenn wir nicht im Production-Mode sind
// Wir verwenden hier window.location.hostname anstelle von process.env.NODE_ENV,
// da process.env im Browser nicht verfügbar ist
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    document.addEventListener('DOMContentLoaded', () => {
        const debugBtn = document.createElement('button');
        debugBtn.className = 'btn btn-warning mt-3';
        debugBtn.textContent = 'Filter neu laden';
        debugBtn.onclick = () => {
            console.log('Manuelles Neuladen der Filter');
            renderFilters(document.getElementById('filterOptions'), { areas: [] });
        };
        
        // Sicheres Anhängen des Buttons an den filterOptions Container
        const filterOptions = document.getElementById('filterOptions');
        if (filterOptions && filterOptions.parentNode) {
            filterOptions.parentNode.appendChild(debugBtn);
        }
    }, { once: true });
}

function applyFilters() {
    const activeFilters = getActiveFilters();
    const residentCards = document.querySelectorAll('.resident-card');
    
    // Statt neue Karten zu erstellen, vorhandene ein-/ausblenden
    residentCards.forEach(card => {
        const shouldShow = filterResident(card, activeFilters);
        card.closest('.col-sm-12').style.display = shouldShow ? 'block' : 'none';
    });
    
    updateFilterBadges(activeFilters);
}

function filterResident(card, activeFilters) {
    // Prüfen ob der Bewohner alle Filterkriterien erfüllt
    // Wenn keine Filter aktiv, alles anzeigen
    if (Object.keys(activeFilters).length === 0) {
        return true;
    }
    
    // Filterlogik implementieren
    let matches = true;
    
    // Für jeden Filtertyp prüfen
    for (const [filterType, filterValues] of Object.entries(activeFilters)) {
        // Relevante Daten aus der Karte extrahieren
        const cardBadges = card.querySelectorAll('.badge.bg-light');
        const badges = Array.from(cardBadges).map(b => b.textContent.trim());
        
        // Je nach Filtertyp unterschiedlich auswerten
        if (filterType === 'gender') {
            const genderText = card.querySelector('[data-gender]')?.dataset.gender || 
                               card.querySelector('.card-text strong:contains("Geschlecht:")');
            if (genderText && !filterValues.includes(genderText)) {
                matches = false;
                break;
            }
        } else {
            // Für andere Filtertypen nach passenden Badges suchen
            const hasMatch = badges.some(badge => 
                badge.startsWith(filterType) && filterValues.some(val => badge.includes(val))
            );
            
            if (!hasMatch) {
                matches = false;
                break;
            }
        }
    }
    
    return matches;
} 