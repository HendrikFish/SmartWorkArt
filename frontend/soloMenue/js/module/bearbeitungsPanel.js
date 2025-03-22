/**
 * Modul für das Bearbeitungspanel der Bewohnerdaten
 */

let aktiverBewohner = null;
let formConfig = null;
let bearbeitungsModus = false;

/**
 * Lädt die Formular-Konfiguration vom Server
 * @returns {Promise<Object>} Die Formular-Konfiguration
 */
async function ladeFormConfig() {
    try {
        const response = await fetch('/api/solomenue/config/filter');
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        const data = await response.json();
        formConfig = { areas: data };
        console.log('Formular-Konfiguration geladen:', formConfig);
        return formConfig;
    } catch (error) {
        console.error('Fehler beim Laden der Formular-Konfiguration:', error);
        return null;
    }
}

/**
 * Erstellt das Panel im DOM, falls es noch nicht existiert
 */
function erstellePanel() {
    // Prüfen, ob das Panel bereits existiert
    let panel = document.getElementById('bearbeitungs-panel');
    if (panel) return panel;

    // Overlay für Hintergrund erstellen
    const overlay = document.createElement('div');
    overlay.id = 'panel-overlay';
    overlay.classList.add('overlay');
    overlay.addEventListener('click', schliessePanel);
    document.body.appendChild(overlay);

    // Panel erstellen
    panel = document.createElement('div');
    panel.id = 'bearbeitungs-panel';
    panel.classList.add('panel');

    // Panel-Header
    const panelHeader = document.createElement('div');
    panelHeader.classList.add('panel-header');

    const panelTitle = document.createElement('div');
    panelTitle.classList.add('panel-title');
    panelTitle.textContent = 'Bewohnerdetails';

    const closeButton = document.createElement('button');
    closeButton.classList.add('close-panel');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', schliessePanel);

    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(closeButton);

    // Panel-Content
    const panelContent = document.createElement('div');
    panelContent.classList.add('panel-content');
    panelContent.id = 'bewohner-details';

    panel.appendChild(panelHeader);
    panel.appendChild(panelContent);
    document.body.appendChild(panel);

    return panel;
}

/**
 * Schließt das Panel
 */
function schliessePanel() {
    const panel = document.getElementById('bearbeitungs-panel');
    const overlay = document.getElementById('panel-overlay');

    if (panel) panel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    aktiverBewohner = null;
    bearbeitungsModus = false;
}

/**
 * Öffnet das Panel mit den Bewohnerdaten
 * @param {Object} bewohner - Der anzuzeigende Bewohner
 */
async function zeigeBewohner(bewohner) {
    if (!bewohner) return;

    aktiverBewohner = bewohner;
    
    // Formular-Konfiguration laden, wenn noch nicht vorhanden
    if (!formConfig) {
        await ladeFormConfig();
    }
    
    const panel = erstellePanel();
    const content = document.getElementById('bewohner-details');

    if (!content) return;

    // Bewohnerdaten anzeigen (entweder im Anzeige- oder Bearbeitungsmodus)
    aktualisiereAnzeige(content);

    // Panel und Overlay anzeigen
    panel.classList.add('active');
    const overlay = document.getElementById('panel-overlay');
    if (overlay) overlay.classList.add('active');
}

/**
 * Aktualisiert die Anzeige des Panels basierend auf dem aktuellen Modus
 * @param {HTMLElement} content - Das Content-Element des Panels
 */
function aktualisiereAnzeige(content) {
    if (bearbeitungsModus) {
        zeigeBearbeitungsAnsicht(content);
    } else {
        zeigeNormaleAnsicht(content);
    }
}

/**
 * Zeigt die normale Ansicht des Bewohners (ohne Bearbeitung)
 * @param {HTMLElement} content - Das Content-Element des Panels
 */
function zeigeNormaleAnsicht(content) {
    if (!aktiverBewohner) return;
    
    // Inhalt aktualisieren mit normaler Ansicht
    content.innerHTML = `
        <div class="form-group">
            <label>Name:</label>
            <div>${aktiverBewohner.firstName} ${aktiverBewohner.lastName}</div>
        </div>
        ${aktiverBewohner.gender ? `
        <div class="form-group">
            <label>Geschlecht:</label>
            <div>${aktiverBewohner.gender}</div>
        </div>
        ` : ''}
        ${aktiverBewohner.vergin ? `
        <div class="form-group">
            <label>Alter:</label>
            <div>${aktiverBewohner.vergin}</div>
        </div>
        ` : ''}
        <div class="form-group">
            <label>Bereiche:</label>
            <div class="bereiche-liste">
                ${Object.entries(aktiverBewohner.areas || {}).map(([key, value]) => `
                    <div class="bereich-item">
                        <strong>${key}:</strong> ${value}
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="button-group">
            <button class="btn btn-primary" id="bearbeiten-btn">Bearbeiten</button>
            <button class="btn btn-secondary" id="abbrechen-btn">Schließen</button>
        </div>
    `;

    // Event-Listener hinzufügen
    const abbrechenBtn = document.getElementById('abbrechen-btn');
    if (abbrechenBtn) {
        abbrechenBtn.addEventListener('click', schliessePanel);
    }

    const bearbeitenBtn = document.getElementById('bearbeiten-btn');
    if (bearbeitenBtn) {
        bearbeitenBtn.addEventListener('click', () => {
            bearbeitungsModus = true;
            aktualisiereAnzeige(content);
        });
    }
}

/**
 * Zeigt die Bearbeitungsansicht des Bewohners
 * @param {HTMLElement} content - Das Content-Element des Panels
 */
function zeigeBearbeitungsAnsicht(content) {
    if (!aktiverBewohner || !formConfig) return;
    
    // HTML für die bearbeitbaren Bereiche erstellen
    let bereicheHTML = '';
    
    // Bereiche aus der Formular-Konfiguration filtern, die menuRelevant sind
    const relevanteAreas = formConfig.areas.filter(area => area.menuRelevant === true);
    
    // Fallback, wenn keine relevanten Bereiche gefunden wurden
    if (relevanteAreas.length === 0) {
        content.innerHTML = `
            <div class="alert alert-info">
                <p>Es wurden keine menürelevanten Bereiche gefunden.</p>
                <p>Bitte prüfen Sie die Konfiguration der Bereiche.</p>
            </div>
            <div class="button-group">
                <button type="button" class="btn btn-secondary" id="abbrechen-bearbeitung-btn">Zurück</button>
            </div>
        `;
        
        const abbrechenBtn = document.getElementById('abbrechen-bearbeitung-btn');
        if (abbrechenBtn) {
            abbrechenBtn.addEventListener('click', () => {
                bearbeitungsModus = false;
                aktualisiereAnzeige(content);
            });
        }
        
        return;
    }
    
    // Für jeden relevanten Bereich ein Dropdown-Menü erstellen
    relevanteAreas.forEach(area => {
        const bereichName = area.name;
        const aktuellerWert = aktiverBewohner.areas?.[bereichName] || '';
        const mehrfachauswahl = area.allowMultiple === true;
        
        if (mehrfachauswahl) {
            // Mehrfachauswahl mit Checkboxen
            const aktuelleWerte = aktuellerWert.split(',').map(val => val.trim());
            
            bereicheHTML += `
                <div class="form-group">
                    <label for="bereich-${bereichName}">${bereichName}:</label>
                    <div class="checkbox-container" id="bereich-${bereichName}">
                        ${area.buttons.map(button => `
                            <div class="checkbox-item">
                                <input type="checkbox" 
                                       id="checkbox-${bereichName}-${button.label}" 
                                       name="${bereichName}" 
                                       value="${button.label}"
                                       ${aktuelleWerte.includes(button.label) ? 'checked' : ''}>
                                <label for="checkbox-${bereichName}-${button.label}">${button.label}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            // Einfachauswahl mit Dropdown
            bereicheHTML += `
                <div class="form-group">
                    <label for="bereich-${bereichName}">${bereichName}:</label>
                    <select id="bereich-${bereichName}" name="${bereichName}" class="form-control">
                        <option value="">Bitte wählen</option>
                        ${area.buttons.map(button => `
                            <option value="${button.label}" ${aktuellerWert === button.label ? 'selected' : ''}>
                                ${button.label}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
    });
    
    // HTML für das Formular erstellen
    content.innerHTML = `
        <form id="bewohner-edit-form">
            <div class="form-group">
                <label>Name:</label>
                <div>${aktiverBewohner.firstName} ${aktiverBewohner.lastName}</div>
            </div>
            ${aktiverBewohner.gender ? `
            <div class="form-group">
                <label>Geschlecht:</label>
                <div>${aktiverBewohner.gender}</div>
            </div>
            ` : ''}
            ${aktiverBewohner.vergin ? `
            <div class="form-group">
                <label>Alter:</label>
                <div>${aktiverBewohner.vergin}</div>
            </div>
            ` : ''}
            
            <h3>Menü-relevante Einstellungen</h3>
            <div class="editable-bereiche">
                ${bereicheHTML}
            </div>
            
            <div class="button-group">
                <button type="button" class="btn btn-success" id="speichern-btn">Speichern</button>
                <button type="button" class="btn btn-secondary" id="abbrechen-bearbeitung-btn">Abbrechen</button>
            </div>
        </form>
    `;
    
    // Event-Listener hinzufügen
    const abbrechenBtn = document.getElementById('abbrechen-bearbeitung-btn');
    if (abbrechenBtn) {
        abbrechenBtn.addEventListener('click', () => {
            bearbeitungsModus = false;
            aktualisiereAnzeige(content);
        });
    }
    
    const speichernBtn = document.getElementById('speichern-btn');
    if (speichernBtn) {
        speichernBtn.addEventListener('click', speichereBewohnerAenderungen);
    }
}

/**
 * Speichert die Änderungen an den Bewohnerdaten
 */
async function speichereBewohnerAenderungen() {
    try {
        if (!aktiverBewohner || !formConfig) return;
        
        // Bereiche sammeln, die menuRelevant sind
        const relevanteAreas = formConfig.areas.filter(area => area.menuRelevant === true);
        
        // Daten aus dem Formular sammeln
        const aktualisierteBereiche = {};
        
        // Für jeden relevanten Bereich den Wert aus dem Formular auslesen
        relevanteAreas.forEach(area => {
            const bereichName = area.name;
            const mehrfachauswahl = area.allowMultiple === true;
            
            if (mehrfachauswahl) {
                // Bei Mehrfachauswahl alle ausgewählten Checkboxen sammeln
                const checkboxes = document.querySelectorAll(`input[name="${bereichName}"]:checked`);
                const werte = Array.from(checkboxes).map(checkbox => checkbox.value);
                aktualisierteBereiche[bereichName] = werte.join(', ');
            } else {
                // Bei Einfachauswahl den Wert des Dropdowns auslesen
                const dropdown = document.getElementById(`bereich-${bereichName}`);
                if (dropdown) {
                    aktualisierteBereiche[bereichName] = dropdown.value;
                }
            }
        });
        
        // Bestehende Bereiche kopieren und mit den aktualisierten Werten überschreiben
        const aktualisierteAreas = {
            ...aktiverBewohner.areas,
            ...aktualisierteBereiche
        };
        
        // Bewohnerdaten aktualisieren
        const bewohnerName = aktiverBewohner.firstName + '_' + aktiverBewohner.lastName;
        const bewohnerDaten = {
            ...aktiverBewohner,
            areas: aktualisierteAreas
        };
        
        try {
            // Daten an das Backend senden - Korrekter API-Endpunkt
            const response = await fetch(`/api/bewohner/update/${bewohnerName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bewohnerDaten)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP Fehler: ${response.status} - ${errorText}`);
            }
            
            const ergebnis = await response.json();
            console.log('Bewohnerdaten erfolgreich aktualisiert:', ergebnis);
            
            // Lokale Daten aktualisieren
            aktiverBewohner.areas = aktualisierteAreas;
            
            // Erfolgsmeldung anzeigen
            alert('Die Bewohnerdaten wurden erfolgreich aktualisiert.');
            
            // Zurück zur normalen Ansicht
            bearbeitungsModus = false;
            const content = document.getElementById('bewohner-details');
            aktualisiereAnzeige(content);
        } catch (error) {
            console.error('Fehler beim Speichern der Bewohnerdaten:', error);
            alert(`Fehler beim Speichern der Bewohnerdaten: ${error.message} 
            
Wenn das Problem weiterhin besteht, informieren Sie bitte den Administrator über diesen Fehler.`);
        }
    } catch (error) {
        console.error('Fehler beim Speichern der Bewohnerdaten:', error);
        alert('Fehler beim Speichern der Bewohnerdaten: ' + error.message);
    }
}

/**
 * Initialisiert das Bearbeitungspanel
 */
async function initialisiere() {
    // Panel erstellen, aber noch nicht anzeigen
    erstellePanel();
    
    // Formular-Konfiguration laden
    await ladeFormConfig();
    
    // Event-Listener für Tastatureingaben (ESC zum Schließen)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            schliessePanel();
        }
    });
    
    console.log('Bearbeitungspanel initialisiert');
}

// Module exportieren
export {
    initialisiere,
    zeigeBewohner,
    schliessePanel
};
