/**
 * FormularContainer.js
 * Modul für die Anzeige und Verwaltung des Bearbeitungsformulars für Bewohnerdaten
 */

// Module importieren
import * as I18n from './Internationalisierung.js';
import EventBusModule, { EventBus } from './EventBus.js';

/**
 * Zeigt die Bearbeitungsansicht des Bewohners
 * @param {HTMLElement} content - Das Content-Element des Panels
 * @param {Object} aktiverBewohner - Der aktive Bewohner
 * @param {Object} formConfig - Die Formularkonfiguration
 * @param {Function} deaktiviereBearbeitungsModus - Funktion zum Deaktivieren des Bearbeitungsmodus
 * @param {Function} speichereDaten - Funktion zum Speichern der Bewohnerdaten
 */
function zeigeBearbeitungsAnsicht(content, aktiverBewohner, formConfig, deaktiviereBearbeitungsModus, speichereDaten) {
    if (!aktiverBewohner || !formConfig || !content) return;
    
    // Event auslösen, dass das Formular geladen wird
    EventBusModule.emit('formular:laden', { bewohner: aktiverBewohner });
    
    // HTML für die bearbeitbaren Bereiche erstellen
    let bereicheHTML = '';
    
    // Bereiche aus der Formular-Konfiguration filtern, die menuRelevant sind
    const relevanteAreas = formConfig.areas.filter(area => area.menuRelevant === true);
    
    // Fallback, wenn keine relevanten Bereiche gefunden wurden
    if (relevanteAreas.length === 0) {
        content.innerHTML = `
            <div class="alert alert-info">
                <p>${I18n.getText('keineBereicheGefunden')}</p>
                <p>${I18n.getText('konfigurationPruefen')}</p>
            </div>
            <div class="button-group">
                <button type="button" class="btn btn-secondary" id="abbrechen-bearbeitung-btn" data-i18n="zurueck">${I18n.getText('zurueck')}</button>
            </div>
        `;
        
        const abbrechenBtn = document.getElementById('abbrechen-bearbeitung-btn');
        if (abbrechenBtn) {
            abbrechenBtn.addEventListener('click', deaktiviereBearbeitungsModus);
        }
        
        return;
    }
    
    // Für jeden relevanten Bereich ein Formularfeld erstellen
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
                        <option value="" data-i18n="bitteWaehlen">${I18n.getText('bitteWaehlen')}</option>
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
                <label data-i18n="name">${I18n.getText('name')}:</label>
                <div>${aktiverBewohner.firstName} ${aktiverBewohner.lastName}</div>
            </div>
            ${aktiverBewohner.gender ? `
            <div class="form-group">
                <label data-i18n="geschlecht">${I18n.getText('geschlecht')}:</label>
                <div>${aktiverBewohner.gender}</div>
            </div>
            ` : ''}
            ${aktiverBewohner.vergin ? `
            <div class="form-group">
                <label data-i18n="alter">${I18n.getText('alter')}:</label>
                <div>${aktiverBewohner.vergin}</div>
            </div>
            ` : ''}
            
            <h3 data-i18n="menuEinstellungen">${I18n.getText('menuEinstellungen')}</h3>
            <div class="editable-bereiche">
                ${bereicheHTML}
            </div>
            
            <div class="button-group">
                <button type="button" class="btn btn-success" id="speichern-btn" data-i18n="speichern">${I18n.getText('speichern')}</button>
                <button type="button" class="btn btn-secondary" id="abbrechen-bearbeitung-btn" data-i18n="abbrechen">${I18n.getText('abbrechen')}</button>
            </div>
        </form>
    `;
    
    // Event-Listener hinzufügen
    const abbrechenBtn = document.getElementById('abbrechen-bearbeitung-btn');
    if (abbrechenBtn) {
        abbrechenBtn.addEventListener('click', deaktiviereBearbeitungsModus);
    }
    
    const speichernBtn = document.getElementById('speichern-btn');
    if (speichernBtn) {
        speichernBtn.addEventListener('click', () => {
            // Event auslösen, dass das Formular gespeichert wird
            EventBusModule.emit('formular:speichern', { bewohner: aktiverBewohner });
            speichereDaten();
        });
    }
    
    // Event auslösen, dass das Formular geladen wurde
    EventBusModule.emit('formular:geladen', { bewohner: aktiverBewohner });
}

/**
 * Sammelt die Formulardaten aus dem Formular
 * @param {Object} aktiverBewohner - Der aktive Bewohner
 * @param {Object} formConfig - Die Formularkonfiguration
 * @returns {Object} Die gesammelten Formulardaten
 */
function sammleFormulardaten(aktiverBewohner, formConfig) {
    if (!aktiverBewohner || !formConfig) return null;
    
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
    
    // Event auslösen mit den gesammelten Daten
    EventBusModule.emit('formular:daten:gesammelt', { 
        bewohner: aktiverBewohner,
        bereiche: aktualisierteBereiche
    });
    
    // Bestehende Bereiche kopieren und mit den aktualisierten Werten überschreiben
    return {
        ...aktiverBewohner.areas,
        ...aktualisierteBereiche
    };
}

/**
 * Initialisiert das Formular-Container-Modul
 */
function initialisiere() {
    // Event-Listener für Sprachänderungen
    document.addEventListener('spracheGeaendert', () => {
        // Alle i18n-Elemente im aktuellen Formular aktualisieren
        I18n.aktualisiereUebersetzungen();
    });
    
    console.log('FormularContainer-Modul initialisiert');
}

// Modul exportieren
export {
    initialisiere,
    zeigeBearbeitungsAnsicht,
    sammleFormulardaten
}; 