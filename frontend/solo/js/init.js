import { FilterManager } from './Module/filter.js';
import { Modal } from './Module/modal.js';
import { Toast } from './Module/module.js';

async function initializeApp() {
    console.log('App-Initialisierung startet...');
    
    try {
        // Initialisiere Tabs
        initTabs();
        
        // Warte kurz, um sicherzustellen, dass das DOM vollständig geladen ist
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialisiere Event-Listener für Buttons
        initButtons();
        
        // Lade die Konfiguration
        const config = await loadConfiguration();
        
        // Initialisiere Felder-Tab (standardmäßig aktiv)
        await initializeFieldsTab(config);
        
        // Initialisiere Bereiche-Tab
        await initializeAreasTab(config);
        
        // Erzwinge das Setzen des Filter-Tabs
        await initializeFilterTab(config);
        
        console.log('App-Initialisierung abgeschlossen');
    } catch (error) {
        console.error('Fehler bei der App-Initialisierung:', error);
        Toast.show('Fehler beim Laden der Anwendung', 'error');
    }
}

// Konfiguration laden (Helper-Funktion)
async function loadConfiguration() {
    const configResponse = await fetch('/api/solo/config');
    if (!configResponse.ok) {
        throw new Error('Fehler beim Laden der Konfiguration');
    }
    const config = await configResponse.json();
    console.log('Konfiguration geladen:', config);
    return config;
}

async function initializeFieldsTab(config) {
    const fieldsTab = document.getElementById('fieldsTab');
    const fieldsList = document.getElementById('fieldsList');
    
    if (!fieldsTab || !fieldsList) {
        console.error('Felder-Tab oder fieldsList nicht gefunden');
        return;
    }
    
    try {
        console.log('Initialisiere Felder-Tab...');
        
        // Generiere HTML für die Felder
        let fieldsHtml = '';
        config.fields.forEach((field, index) => {
            // Überspringen von firstName und lastName, die fest eingebaut sind
            if (field.id === 'firstName' || field.id === 'lastName') return;
            
            fieldsHtml += `
                <div class="config-item" data-id="${field.id}">
                    <div class="config-item-header">
                        <h4>${field.label}</h4>
                        <button type="button" class="danger-btn delete-field" data-index="${index}">×</button>
                    </div>
                    <div class="config-item-content">
                        <div class="form-group">
                            <label>Label</label>
                            <input type="text" class="field-label" value="${field.label}">
                        </div>
                        <div class="form-group">
                            <label>Typ</label>
                            <select class="field-type">
                                <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
                                <option value="number" ${field.type === 'number' ? 'selected' : ''}>Nummer</option>
                                <option value="date" ${field.type === 'date' ? 'selected' : ''}>Datum</option>
                                <option value="email" ${field.type === 'email' ? 'selected' : ''}>E-Mail</option>
                                <option value="tel" ${field.type === 'tel' ? 'selected' : ''}>Telefon</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Pflichtfeld</span>
                            <label class="switch">
                                <input type="checkbox" class="field-required" data-index="${index}" ${field.required ? 'checked' : ''}>
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Setze das generierte HTML
        fieldsList.innerHTML = fieldsHtml;
        console.log('Felder-Tab HTML generiert');
        
        // Event-Listener für Feldaktionen hinzufügen
        initFieldsEventListeners(fieldsList);
        
    } catch (error) {
        console.error('Fehler beim Initialisieren des Felder-Tabs:', error);
    }
}

async function initializeAreasTab(config) {
    const areasTab = document.getElementById('areasTab');
    const areasList = document.getElementById('areasList');
    
    if (!areasTab || !areasList) {
        console.error('Bereiche-Tab oder areasList nicht gefunden');
        return;
    }
    
    try {
        console.log('Initialisiere Bereiche-Tab...');
        
        // Neue Struktur - Button ist außerhalb der scrollbaren Liste
        areasTab.innerHTML = `
            <div class="config-item config-header sticky-header">
                <div class="config-item-header">
                    <button type="button" id="addAreaBtn" class="secondary-btn">+ Bereich hinzufügen</button>
                </div>
            </div>
            <div id="areasList" class="areas-list"></div>
        `;
        
        // Hole den neu erstellten areasList-Container
        const newAreasList = document.getElementById('areasList');
        
        // Alle Bereiche hinzufügen
        let areasHtml = '';
        config.areas.forEach((area, index) => {
            areasHtml += `
                <div class="config-item config-area" data-name="${area.name}">
                    <div class="config-item-header">
                        <h4>${area.name}</h4>
                        <button type="button" class="danger-btn delete-area" data-index="${index}">×</button>
                    </div>
                    <div class="config-item-content">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" class="area-name" value="${area.name}">
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Mehrfachauswahl erlauben</span>
                            <label class="switch">
                                <input type="checkbox" class="area-multiple" data-index="${index}" ${area.multiple ? 'checked' : ''}>
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Menü-Filter</span>
                            <label class="switch">
                                <input type="checkbox" class="area-menu-filter" data-index="${index}" ${area.menuFilter ? 'checked' : ''}>
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Menü Relevant</span>
                            <label class="switch">
                                <input type="checkbox" class="area-changeable" data-index="${index}" ${area.changeable ? 'checked' : ''}>
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                        <div class="buttons-list">
                            ${area.buttons.map((button, btnIndex) => `
                                <div class="button-item">
                                    <input type="text" class="button-label" value="${button.label}">
                                    <button type="button" class="danger-btn delete-button" data-index="${btnIndex}">×</button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" class="secondary-btn add-button">+ Button hinzufügen</button>
                    </div>
                </div>
            `;
        });
        
        // Setze das generierte HTML
        newAreasList.innerHTML = areasHtml;
        console.log('Bereiche-Tab HTML generiert');
        
        // Event-Listener für Bereichaktionen hinzufügen
        initAreasEventListeners(newAreasList);
        
        // Jetzt den Event-Listener für den Add-Button hinzufügen, der außerhalb der Liste ist
        const addAreaBtn = document.getElementById('addAreaBtn');
        if (addAreaBtn) {
            addAreaBtn.addEventListener('click', function() {
                const newArea = document.createElement('div');
                newArea.className = 'config-item config-area';
                newArea.dataset.name = 'Neuer Bereich';
                
                newArea.innerHTML = `
                    <div class="config-item-header">
                        <h4>Neuer Bereich</h4>
                        <button type="button" class="danger-btn delete-area">×</button>
                    </div>
                    <div class="config-item-content">
                        <div class="form-group">
                            <label>Name</label>
                            <input type="text" class="area-name" value="Neuer Bereich">
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Mehrfachauswahl erlauben</span>
                            <label class="switch">
                                <input type="checkbox" class="area-multiple">
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Menü-Filter</span>
                            <label class="switch">
                                <input type="checkbox" class="area-menu-filter">
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                        <div class="form-group">
                            <span class="switch-label">Menü Relevant</span>
                            <label class="switch">
                                <input type="checkbox" class="area-changeable" checked>
                                <span class="switch-slider"></span>
                            </label>
                        </div>
                        <div class="buttons-list">
                            <div class="button-item">
                                <input type="text" class="button-label" value="Option 1">
                                <button type="button" class="danger-btn delete-button">×</button>
                            </div>
                            <div class="button-item">
                                <input type="text" class="button-label" value="Option 2">
                                <button type="button" class="danger-btn delete-button">×</button>
                            </div>
                        </div>
                        <button type="button" class="secondary-btn add-button">+ Button hinzufügen</button>
                    </div>
                `;
                
                newAreasList.prepend(newArea); // Füge neuen Bereich am Anfang der Liste hinzu
                
                // Event-Listener für den neuen Lösch-Button
                newArea.querySelector('.delete-area').addEventListener('click', function() {
                    newArea.remove();
                });
                
                // Event-Listener für die neuen Button-Lösch-Buttons
                newArea.querySelectorAll('.delete-button').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const buttonItem = this.closest('.button-item');
                        buttonItem.remove();
                    });
                });
                
                // Event-Listener für den neuen "Button hinzufügen"-Button
                newArea.querySelector('.add-button').addEventListener('click', function() {
                    const buttonsList = this.previousElementSibling;
                    const newButton = document.createElement('div');
                    newButton.className = 'button-item';
                    
                    newButton.innerHTML = `
                        <input type="text" class="button-label" value="Neue Option">
                        <button type="button" class="danger-btn delete-button">×</button>
                    `;
                    
                    buttonsList.appendChild(newButton);
                    
                    // Event-Listener für den neuen Lösch-Button
                    newButton.querySelector('.delete-button').addEventListener('click', function() {
                        newButton.remove();
                    });
                });
                
                // Scrolle zum neuen Bereich
                newArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
        
    } catch (error) {
        console.error('Fehler beim Initialisieren des Bereiche-Tabs:', error);
    }
}

function initButtons() {
    // Konfigurationsbutton
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', async () => {
            // Zeige das Konfigurations-Modal
            const configModal = document.getElementById('configModal');
            if (configModal) {
                configModal.classList.add('show');
                
                // Stellen Sie sicher, dass der Filter-Tab korrekt initialisiert ist,
                // wenn er in der Konfiguration angezeigt wird
                const filterTab = document.getElementById('filterTab');
                if (filterTab && !filterTab.querySelector('.filter-btn')) {
                    console.log('Filter-Buttons nicht gefunden, initialisiere bei Konfigurationsöffnung erneut...');
                    const config = await loadConfiguration();
                    await initializeFilterTab(config);
                }
            }
        });
    }
    
    // Speichern-Button für Konfiguration
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async () => {
            try {
                console.log('Speichere Konfiguration...');
                
                // Sammle die Daten aus den Formularfeldern
                const config = collectConfigData();
                
                // Sende die Daten an den Server
                const response = await fetch('/api/solo/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(config)
                });
                
                if (!response.ok) {
                    throw new Error('Fehler beim Speichern der Konfiguration');
                }
                
                // Erfolgreiche Speicherung
                console.log('Konfiguration erfolgreich gespeichert');
                Toast.show('Konfiguration gespeichert', 'success');
                
                // Schließe das Modal
                document.getElementById('configModal').classList.remove('show');
                
                // Lade die Seite neu, um die Änderungen zu übernehmen
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } catch (error) {
                console.error('Fehler beim Speichern der Konfiguration:', error);
                Toast.show('Fehler beim Speichern der Konfiguration', 'error');
            }
        });
    }
    
    // Weitere Button-Initialisierungen können hier hinzugefügt werden
    
    console.log('Buttons initialisiert');
}

function collectConfigData() {
    const config = {
        fields: [],
        areas: []
    };
    
    // Felder sammeln
    document.querySelectorAll('#fieldsList .config-item').forEach(item => {
        const label = item.querySelector('.field-label').value;
        const type = item.querySelector('.field-type').value;
        const required = item.querySelector('.field-required').checked;
        const id = item.dataset.id || label.toLowerCase().replace(/\s+/g, '_');
        
        config.fields.push({ id, label, type, required });
    });
    
    // Bereiche sammeln
    document.querySelectorAll('#areasList .config-area').forEach(item => {
        const name = item.querySelector('.area-name').value;
        const multiple = item.querySelector('.area-multiple').checked;
        const menuFilter = item.querySelector('.area-menu-filter').checked;
        const changeable = item.querySelector('.area-changeable').checked;
        
        const buttons = [];
        item.querySelectorAll('.button-item').forEach(btnItem => {
            const label = btnItem.querySelector('.button-label').value;
            buttons.push({ label });
        });
        
        config.areas.push({ name, multiple, menuFilter, changeable, buttons });
    });
    
    return config;
}

function initFieldsEventListeners(fieldsList) {
    // Event-Listener für Feld-Lösch-Buttons
    fieldsList.querySelectorAll('.delete-field').forEach(btn => {
        btn.addEventListener('click', function() {
            const configItem = this.closest('.config-item');
            configItem.remove();
        });
    });
    
    // Event-Listener für "Feld hinzufügen"-Button
    const addFieldBtn = document.getElementById('addFieldBtn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function() {
            const newField = document.createElement('div');
            newField.className = 'config-item';
            newField.dataset.id = 'new_field_' + Date.now();
            
            newField.innerHTML = `
                <div class="config-item-header">
                    <h4>Neues Feld</h4>
                    <button type="button" class="danger-btn delete-field">×</button>
                </div>
                <div class="config-item-content">
                    <div class="form-group">
                        <label>Label</label>
                        <input type="text" class="field-label" value="Neues Feld">
                    </div>
                    <div class="form-group">
                        <label>Typ</label>
                        <select class="field-type">
                            <option value="text">Text</option>
                            <option value="number">Nummer</option>
                            <option value="date">Datum</option>
                            <option value="email">E-Mail</option>
                            <option value="tel">Telefon</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <span class="switch-label">Pflichtfeld</span>
                        <label class="switch">
                            <input type="checkbox" class="field-required">
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                </div>
            `;
            
            fieldsList.appendChild(newField);
            
            // Event-Listener für den neuen Lösch-Button
            newField.querySelector('.delete-field').addEventListener('click', function() {
                newField.remove();
            });
        });
    }
}

function initAreasEventListeners(areasList) {
    // Event-Listener für Bereich-Lösch-Buttons
    areasList.querySelectorAll('.delete-area').forEach(btn => {
        btn.addEventListener('click', function() {
            const configItem = this.closest('.config-item');
            configItem.remove();
        });
    });
    
    // Event-Listener für Button-Lösch-Buttons
    areasList.querySelectorAll('.delete-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const buttonItem = this.closest('.button-item');
            buttonItem.remove();
        });
    });
    
    // Event-Listener für "Button hinzufügen"-Buttons
    areasList.querySelectorAll('.add-button').forEach(btn => {
        btn.addEventListener('click', function() {
            const buttonsList = this.previousElementSibling;
            const newButton = document.createElement('div');
            newButton.className = 'button-item';
            
            newButton.innerHTML = `
                <input type="text" class="button-label" value="Neuer Button">
                <button type="button" class="danger-btn delete-button">×</button>
            `;
            
            buttonsList.appendChild(newButton);
            
            // Event-Listener für den neuen Lösch-Button
            newButton.querySelector('.delete-button').addEventListener('click', function() {
                newButton.remove();
            });
        });
    });
}

function initTabs() {
    // Tabs im Konfigurationsmodal
    const tabsContainer = document.querySelector('#configModal .tabs');
    if (tabsContainer) {
        const tabs = tabsContainer.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('#configModal .tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                console.log('Tab geklickt:', tabName);
                
                // Deaktiviere alle Tabs und Tab-Inhalte
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Aktiviere den ausgewählten Tab und Inhalt
                this.classList.add('active');
                const activeContent = document.getElementById(tabName + 'Tab');
                if (activeContent) {
                    activeContent.classList.add('active');
                    console.log('Tab-Inhalt aktiviert:', tabName + 'Tab');
                    
                    // Überprüfe Scrollbarkeit
                    console.log('Höhe des Tab-Inhalts:', activeContent.scrollHeight);
                    console.log('Sichtbare Höhe:', activeContent.clientHeight);
                    
                    // Stelle sicher, dass der Inhalt scrollbar ist, wenn nötig
                    if (activeContent.scrollHeight > activeContent.clientHeight) {
                        console.log('Tab-Inhalt benötigt Scrollbar');
                    }
                    
                    // Wenn Filter-Tab aktiviert wird, initialisiere ihn erneut
                    if (tabName === 'filter' && window.FilterManagerInitialized !== true) {
                        // Lade die Konfiguration, bevor der Filter-Tab initialisiert wird
                        loadConfiguration()
                            .then(config => {
                                if (config) {
                                    return initializeFilterTab(config);
                                } else {
                                    console.error('Keine Konfiguration geladen für Filter-Tab');
                                    Toast.show('Fehler beim Laden der Filter-Konfiguration', 'error');
                                }
                            })
                            .catch(error => {
                                console.error('Fehler beim Laden der Konfiguration:', error);
                                Toast.show('Fehler beim Laden der Filter-Konfiguration', 'error');
                            });
                        window.FilterManagerInitialized = true;
                    }
                } else {
                    console.error('Tab-Inhalt nicht gefunden:', tabName + 'Tab');
                }
            });
        });
        
        console.log('Tab-Funktionalität initialisiert');
    } else {
        console.warn('Tabs-Container nicht gefunden');
    }
}

// Generiere HTML für Filter-Optionen
function generateFilterOptionsHtml(config) {
    // Sicherstellen, dass config nicht undefined ist
    if (!config) {
        console.error('Keine Konfiguration für Filter-Optionen vorhanden');
        return '<div id="filterOptions"><p>Konfiguration konnte nicht geladen werden.</p></div>';
    }

    // Sicherstellen, dass die erforderlichen Felder vorhanden sind
    const fields = Array.isArray(config.fields) ? config.fields : [];
    const areas = Array.isArray(config.areas) ? config.areas : [];

    return `
        <div id="filterOptions">
            <div class="filter-section">
                <h4>Nach Feld filtern</h4>
                <div class="filter-options">
                    ${fields
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
                    ${areas
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
}

async function initializeFilterTab(config) {
    // Prüfe, ob der Filter-Tab und seine Inhalte bereits existieren
    const filterTab = document.getElementById('filterTab');
    
    if (!filterTab) {
        console.error('Filter-Tab nicht gefunden');
        return;
    }
    
    try {
        console.log('FilterManager wird initialisiert...');
        
        // Überprüfe, ob config gültig ist und lade es ggf. neu
        if (!config || !config.fields || !config.areas) {
            console.log('Konfiguration fehlt oder unvollständig, lade sie neu...');
            try {
                const configResponse = await fetch('/api/solo/config');
                if (!configResponse.ok) {
                    throw new Error('Fehler beim Laden der Konfiguration');
                }
                config = await configResponse.json();
            } catch (error) {
                console.error('Fehler beim Laden der Konfiguration:', error);
                // Zeige eine Fehlermeldung im Filter-Tab an
                filterTab.innerHTML = `
                    <div id="filterOptions">
                        <div class="filter-section">
                            <h4>Filter konnten nicht geladen werden</h4>
                            <p>Die Konfiguration ist unvollständig oder fehlerhaft.</p>
                            <button class="primary-btn" id="retry-filters-btn">Erneut versuchen</button>
                        </div>
                    </div>
                `;
                
                // Füge Event-Listener für den Retry-Button hinzu
                const retryBtn = filterTab.querySelector('#retry-filters-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', async () => {
                        try {
                            const newConfig = await loadConfiguration();
                            await initializeFilterTab(newConfig);
                        } catch (err) {
                            console.error('Fehler beim erneuten Laden der Filter:', err);
                        }
                    });
                }
                return;
            }
        }
        
        // Überprüfe erneut, ob die Konfiguration jetzt gültig ist
        if (!config || !config.fields || !config.areas) {
            console.error('Konfiguration ist immer noch unvollständig:', config);
            filterTab.innerHTML = `
                <div id="filterOptions">
                    <div class="filter-section">
                        <h4>Unvollständige Konfiguration</h4>
                        <p>Die Konfiguration enthält nicht alle erforderlichen Felder.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Generiere HTML für Filter-Optionen
        filterTab.innerHTML = generateFilterOptionsHtml(config);
        console.log('Filter-Tab HTML generiert');
        
        // Initialisiere den FilterManager
        await FilterManager.init();
        console.log('FilterManager erfolgreich initialisiert');
        
        // Teste Filter-Buttons nach dem Generieren
        const filterButtons = filterTab.querySelectorAll('.filter-btn');
        console.log(`${filterButtons.length} Filter-Buttons gefunden und generiert`);
    } catch (error) {
        console.error('Fehler beim Initialisieren des Filter-Tabs:', error);
        // Stelle sicher, dass der Filter-Tab trotz Fehler nicht leer bleibt
        if (filterTab && filterTab.innerHTML === '') {
            filterTab.innerHTML = `
                <div id="filterOptions">
                    <div class="error-message">
                        <p>Fehler beim Laden der Filter: ${error.message}</p>
                        <button class="primary-btn" id="retry-filters-btn">Erneut versuchen</button>
                    </div>
                </div>
            `;
            
            // Füge Event-Listener für den Retry-Button hinzu
            const retryBtn = filterTab.querySelector('#retry-filters-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', async () => {
                    try {
                        const newConfig = await loadConfiguration();
                        await initializeFilterTab(newConfig);
                    } catch (err) {
                        console.error('Fehler beim erneuten Laden der Filter:', err);
                    }
                });
            }
        }
    }
}

// Initialisiere die App, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initializeApp); 