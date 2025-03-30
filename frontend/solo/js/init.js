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
    try {
        const configResponse = await fetch('/api/solo/config');
        if (!configResponse.ok) {
            throw new Error(`Fehler beim Laden der Konfiguration: ${configResponse.status} ${configResponse.statusText}`);
        }
        
        const configData = await configResponse.json();
        console.log('Rohdaten der Konfiguration:', configData);
        
        // Validiere die geladene Konfiguration
        const validConfig = {
            fields: Array.isArray(configData.fields) ? configData.fields : [],
            areas: Array.isArray(configData.areas) ? configData.areas : []
        };
        
        // Überprüfe, ob wir die falsche Konfiguration erhalten haben (mit Pfaden statt Feldern)
        if (configData.paths && !configData.fields && !configData.areas) {
            console.error('Falsche Konfigurationsdatei geladen (config.js statt formConfig.json)');
            // Erzwinge das Laden einer Standardkonfiguration
            return {
                fields: [],
                areas: []
            };
        }
        
        console.log('Validierte Konfiguration:', validConfig);
        return validConfig;
    } catch (error) {
        console.error('Fehler beim Laden der Konfiguration:', error);
        Toast.show('Fehler beim Laden der Konfiguration', 'error');
        // Gib eine Standardkonfiguration zurück
        return {
            fields: [],
            areas: []
        };
    }
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
        
        // Entferne doppelte "Bereich hinzufügen" Buttons, falls vorhanden
        const removeDuplicateAreaButtons = () => {
            // Sammle alle Buttons mit der ID "addAreaBtn"
            const addAreaButtons = document.querySelectorAll('#addAreaBtn');
            
            // Wenn mehr als ein Button gefunden wurde, behalte nur den ersten (sticky header)
            if (addAreaButtons.length > 1) {
                console.log(`${addAreaButtons.length} "+ Bereich hinzufügen" Buttons gefunden, entferne doppelte...`);
                
                // Behalte den ersten Button und entferne die anderen
                for (let i = 1; i < addAreaButtons.length; i++) {
                    const buttonParent = addAreaButtons[i].closest('.config-item');
                    if (buttonParent) {
                        buttonParent.remove();
                        console.log('Doppelten "+ Bereich hinzufügen" Button entfernt');
                    }
                }
            }
            
            // Entferne auch alle Buttons innerhalb von areasList, die nicht zu einem Bereich gehören
            const areaTitles = newAreasList.querySelectorAll('.config-header:not(.sticky-header)');
            areaTitles.forEach(header => {
                if (!header.querySelector('h4')) {
                    header.remove();
                    console.log('Zusätzlichen Header in areasList entfernt');
                }
            });
        };
        
        // Führe die Bereinigung nach einem kurzen Timeout aus, um sicherzustellen, dass das DOM aktualisiert wurde
        setTimeout(removeDuplicateAreaButtons, 100);
        
        // Event-Listener für Bereichaktionen hinzufügen
        initAreasEventListeners(newAreasList);
        
        // Event-Listener für den Add-Button im sticky-header hinzufügen
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
                
                // HINZUGEFÜGT: Entferne den doppelten "+ Bereich hinzufügen" Button
                setTimeout(() => {
                    const removeExtraButtons = () => {
                        // Finde alle "+ Bereich hinzufügen" Buttons
                        const addAreaButtons = document.querySelectorAll('#addAreaBtn');
                        
                        if (addAreaButtons.length > 1) {
                            console.log(`${addAreaButtons.length} "+ Bereich hinzufügen" Buttons gefunden, entferne doppelte...`);
                            
                            // Der erste Button ist im sticky-header, behalte diesen
                            for (let i = 1; i < addAreaButtons.length; i++) {
                                const buttonContainer = addAreaButtons[i].closest('.config-item');
                                if (buttonContainer) {
                                    console.log('Entferne doppelten Button-Container:', buttonContainer);
                                    buttonContainer.remove();
                                } else {
                                    // Falls der Button nicht in einem .config-item ist, entferne ihn direkt
                                    console.log('Entferne doppelten Button direkt:', addAreaButtons[i]);
                                    addAreaButtons[i].remove();
                                }
                            }
                            console.log('Doppelte Buttons wurden entfernt');
                        }
                        
                        // Entferne auch leere Header-Elemente in areasList
                        const areasList = document.getElementById('areasList');
                        if (areasList) {
                            const emptyHeaders = areasList.querySelectorAll('.config-header:not(.sticky-header)');
                            emptyHeaders.forEach(header => {
                                if (!header.querySelector('h4')) {
                                    console.log('Entferne leeren Header:', header);
                                    header.remove();
                                }
                            });
                        }
                    };
                    
                    // Führe die Bereinigung aus
                    removeExtraButtons();
                    
                    // Stelle sicher, dass die Funktion auch ausgeführt wird, wenn Tabs gewechselt werden
                    const areaTabs = document.querySelectorAll('.tab-btn[data-tab="areas"]');
                    areaTabs.forEach(tab => {
                        tab.addEventListener('click', () => {
                            setTimeout(removeExtraButtons, 100);
                        });
                    });
                }, 100);
                
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
    
    // Speichern-Button im Konfigurationsmodal
    const saveConfigBtn = document.getElementById('saveConfigBtn');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', async function() {
            console.log('Konfiguration wird gespeichert...');
            
            // Speichere den aktuellen Filter-Zustand für die spätere Wiederherstellung
            const currentFilterState = window.currentSavedFilter || 
                (FilterManager && FilterManager.currentFilters ? 
                    JSON.parse(JSON.stringify(FilterManager.currentFilters)) : 
                    { fields: [], areas: [] });
            
            // Debug-Ausgabe, welcher Filter aktuell aktiv ist
            const activeFilter = 
                currentFilterState.fields.length > 0 ? 
                    `Feld: ${currentFilterState.fields[0]}` : 
                    (currentFilterState.areas.length > 0 ? 
                        `Bereich: ${currentFilterState.areas[0]}` : 
                        'Keine');
            console.log(`Speichere Konfiguration mit aktivem Filter: ${activeFilter}`);    
            console.log('Aktueller Filter-Zustand vor dem Speichern:', currentFilterState);

            // Zeige Lade-Animation
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = '<div class="spinner"></div><p>Konfiguration wird gespeichert...</p>';
            document.body.appendChild(loadingIndicator);
            
            try {
                // Sammle Konfigurationsdaten
                const configData = collectConfigData();
                console.log('Gesammelte Konfiguration:', configData);
                
                if (!configData || !configData.fields || !configData.areas) {
                    throw new Error('Ungültige Konfigurationsdaten');
                }
                
                // Speichere Konfiguration auf dem Server
                const response = await fetch('/api/solo/config', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(configData)
                });
                
                if (!response.ok) {
                    throw new Error(`Server-Fehler: ${response.status} ${response.statusText}`);
                }
                
                const result = await response.json();
                console.log('Konfiguration erfolgreich gespeichert:', result);
                
                // WICHTIG: Erst Tabs aktualisieren, dann Modal schließen
                try {
                    // UI aktualisieren, bevor das Modal geschlossen wird
                    await updateTabsWithNewConfig(configData);
                    
                    // WICHTIG: Filter-Zustand als globale Variable speichern vor dem Modal-Schließen
                    window.currentSavedFilter = currentFilterState;
                    
                    // Erst jetzt das Modal schließen
                    Modal.hide('configModal');
                    
                    // KRITISCH: 500ms Verzögerung, um sicherzustellen, dass das Modal vollständig geschlossen ist
                    // bevor wir die Filter anwenden
                    setTimeout(async () => {
                        try {
                            // Prüfe, ob noch ein Filter aktiv sein sollte
                            if ((currentFilterState.fields && currentFilterState.fields.length > 0) ||
                                (currentFilterState.areas && currentFilterState.areas.length > 0)) {
                                
                                console.log('Wende gespeicherten Filter an nach Modal-Schließung:', currentFilterState);
                                
                                // Filter-Zustand explizit setzen
                                FilterManager.currentFilters = currentFilterState;
                                
                                // Aktualisiere die Filter-Buttons
                                FilterManager.updateFilterButtons();
                                
                                // Filtere und zeige die Bewohner erneut an
                                await FilterManager.loadAndDisplayResidents();
                                
                                // Prüfe nach dem Anwenden, ob der Filter richtig gesetzt wurde
                                console.log('Filter nach Anwendung:', FilterManager.currentFilters);
                            } else {
                                console.log('Kein Filter zum Anwenden vorhanden');
                                // Trotzdem neu laden, damit die Liste aktualisiert wird
                                await FilterManager.loadAndDisplayResidents();
                            }
                            console.log('Filtervorgang nach Modal-Schließung abgeschlossen');
                        } catch (filterError) {
                            console.error('Fehler beim Anwenden der Filter:', filterError);
                        }
                    }, 500);
                } catch (uiError) {
                    console.error('Fehler bei der UI-Aktualisierung:', uiError);
                    // Trotz UI-Fehler Modal schließen und weitermachen
                    Modal.hide('configModal');
                    Toast.show('Konfiguration gespeichert, UI-Aktualisierung fehlgeschlagen', 'warning');
                }
                
                // Entferne Lade-Animation
                if (document.body.contains(loadingIndicator)) {
                    document.body.removeChild(loadingIndicator);
                }
                
                // Erfolgs-Nachricht anzeigen
                Toast.show('Konfiguration erfolgreich gespeichert', 'success');
            } catch (error) {
                console.error('Fehler beim Speichern der Konfiguration:', error);
                // Entferne Lade-Animation
                if (document.body.contains(loadingIndicator)) {
                    document.body.removeChild(loadingIndicator);
                }
                Toast.show('Fehler beim Speichern der Konfiguration', 'error');
            }
        });
    }
    
    // Hilfsfunktion zum Aktualisieren der Tabs nach Konfigurationsänderung
    async function updateTabsWithNewConfig(configData) {
        console.log('Aktualisiere Tabs mit neuer Konfiguration...');
        
        try {
            // Wir verwenden die bestehenden Initialisierungsfunktionen statt undefinierter Funktionen
            await initializeFieldsTab(configData);
            await initializeAreasTab(configData);
            
            // FilterManager aktualisieren, wenn er existiert
            if (window.FilterManager) {
                await FilterManager.forceRenderFilterOptions(configData);
            }
            
            console.log('Tabs wurden erfolgreich aktualisiert');
        } catch (error) {
            console.error('Fehler bei der Aktualisierung der Tabs:', error);
            throw error;
        }
    }
    
    // Weitere Button-Initialisierungen können hier hinzugefügt werden
    
    console.log('Buttons initialisiert');
}

function collectConfigData() {
    // Erstelle ein leeres Konfigurationsobjekt
    const config = {
        fields: [],
        areas: []
    };
    
    try {
        // Felder sammeln
        const fieldItems = document.querySelectorAll('#fieldsList .config-item');
        console.log(`Gefundene Feld-Elemente: ${fieldItems.length}`);
        
        fieldItems.forEach(item => {
            const labelElement = item.querySelector('.field-label');
            const typeElement = item.querySelector('.field-type');
            const requiredElement = item.querySelector('.field-required');
            
            if (!labelElement || !typeElement || !requiredElement) {
                console.warn('Fehlende Elemente für Feld:', item);
                return; // Überspringe dieses Feld
            }
            
            const label = labelElement.value.trim();
            const type = typeElement.value;
            const required = requiredElement.checked;
            const id = item.dataset.id || label.toLowerCase().replace(/\s+/g, '_');
            
            config.fields.push({ id, label, type, required });
        });
        
        // Bereiche sammeln
        const areaItems = document.querySelectorAll('#areasList .config-area');
        console.log(`Gefundene Bereich-Elemente: ${areaItems.length}`);
        
        areaItems.forEach(item => {
            const nameElement = item.querySelector('.area-name');
            const multipleElement = item.querySelector('.area-multiple');
            const menuFilterElement = item.querySelector('.area-menu-filter');
            const changeableElement = item.querySelector('.area-changeable');
            
            if (!nameElement || !multipleElement || !menuFilterElement || !changeableElement) {
                console.warn('Fehlende Elemente für Bereich:', item);
                return; // Überspringe diesen Bereich
            }
            
            const name = nameElement.value.trim();
            const multiple = multipleElement.checked;
            const menuFilter = menuFilterElement.checked;
            const changeable = changeableElement.checked;
            
            // ID für den Bereich generieren
            const id = name;
            
            const buttons = [];
            const buttonItems = item.querySelectorAll('.button-item');
            
            buttonItems.forEach(btnItem => {
                const buttonLabelElement = btnItem.querySelector('.button-label');
                if (!buttonLabelElement) {
                    console.warn('Fehlendes Label-Element für Button:', btnItem);
                    return; // Überspringe diesen Button
                }
                
                const label = buttonLabelElement.value.trim();
                if (label) {
                    buttons.push({ label });
                }
            });
            
            if (name && buttons.length > 0) {
                config.areas.push({ id, name, multiple, menuFilter, changeable, buttons });
            }
        });
        
        console.log('Gesammelte Konfiguration:', config);
        
        // Verifiziere, dass die JSON-Serialisierung fehlerfrei funktioniert
        const jsonString = JSON.stringify(config, null, 2);
        try {
            // Versuche die Serialisierung zu dekodieren, um sicherzustellen, dass sie gültig ist
            JSON.parse(jsonString);
        } catch (jsonError) {
            console.error('Ungültiges JSON würde generiert:', jsonError);
            throw new Error('Die generierte Konfiguration ist kein gültiges JSON');
        }
        
        return config;
    } catch (error) {
        console.error('Fehler beim Sammeln der Konfigurationsdaten:', error);
        // Stelle sicher, dass immer ein gültiges Objekt zurückgegeben wird
        return {
            fields: [],
            areas: []
        };
    }
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
    const fields = config.fields || [];
    const areas = config.areas || [];
    
    console.log('Generiere Filter-Optionen mit Bereichen:', areas);
    
    // Debug: Prüfe, ob Bereiche korrekte Namen haben
    areas.forEach((area, index) => {
        if (!area.name || area.name === 'undefined') {
            console.warn(`Bereich #${index} hat ungültigen Namen:`, area);
        }
    });
    
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
                        .map(area => {
                            console.log(`Generiere Button für Bereich: ${area.name}`);
                            return `
                                <button class="filter-btn area-filter" data-value="${area.name}">
                                    ${area.name}
                                </button>
                            `;
                        }).join('')}
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
        
        // Warte kurz, um sicherzustellen, dass das DOM aktualisiert wurde
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Initialisiere den FilterManager
        await FilterManager.init();
        console.log('FilterManager erfolgreich initialisiert');
        
        // Teste Filter-Buttons nach dem Generieren mit Verzögerung, um DOM-Updates zu berücksichtigen
        setTimeout(() => {
            const filterButtons = document.querySelectorAll('.filter-btn');
            console.log(`${filterButtons.length} Filter-Buttons gefunden und generiert`);
            
            // Wenn keine Buttons gefunden wurden, versuche es noch einmal
            if (filterButtons.length === 0) {
                console.warn('Keine Filter-Buttons gefunden, versuche es erneut mit globalem Selektor');
                const allButtons = document.querySelectorAll('.filter-btn');
                console.log(`${allButtons.length} Filter-Buttons über globalen Selektor gefunden`);
            }
        }, 250);
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