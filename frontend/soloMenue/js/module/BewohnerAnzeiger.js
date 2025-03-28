/**
 * BewohnerAnzeiger.js
 * Modul für die Anzeige der Bewohnerdaten im Lesemodus
 */

// Module importieren
import * as I18n from './Internationalisierung.js';
import EventBusModule, { EventBus } from './EventBus.js';

/**
 * Zeigt die normale Ansicht des Bewohners (ohne Bearbeitung)
 * @param {HTMLElement} content - Das Content-Element des Panels
 * @param {Object} aktiverBewohner - Der aktive Bewohner
 * @param {Function} schliessePanel - Funktion zum Schließen des Panels
 * @param {Function} aktiviereBearbeitungsModus - Funktion zum Aktivieren des Bearbeitungsmodus
 */
function zeigeNormaleAnsicht(content, aktiverBewohner, schliessePanel, aktiviereBearbeitungsModus) {
    if (!aktiverBewohner || !content) return;
    
    // Event auslösen, dass Bewohnerdaten angezeigt werden
    EventBusModule.emit('bewohner:details:anzeigen', { bewohner: aktiverBewohner });
    
    // Inhalt aktualisieren mit normaler Ansicht
    content.innerHTML = `
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
        <div class="form-group">
            <label data-i18n="bereiche">${I18n.getText('bereiche')}:</label>
            <div class="bereiche-liste">
                ${Object.entries(aktiverBewohner.areas || {}).map(([key, value]) => `
                    <div class="bereich-item">
                        <strong>${key}:</strong> ${value}
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="button-group">
            <button class="btn btn-primary" id="bearbeiten-btn" data-i18n="bearbeiten">${I18n.getText('bearbeiten')}</button>
            <button class="btn btn-secondary" id="abbrechen-btn" data-i18n="schliessen">${I18n.getText('schliessen')}</button>
        </div>
    `;

    // Event-Listener hinzufügen
    const abbrechenBtn = document.getElementById('abbrechen-btn');
    if (abbrechenBtn) {
        abbrechenBtn.addEventListener('click', () => {
            EventBusModule.emit('bewohner:details:schliessen', { bewohner: aktiverBewohner });
            schliessePanel();
        });
    }

    const bearbeitenBtn = document.getElementById('bearbeiten-btn');
    if (bearbeitenBtn) {
        bearbeitenBtn.addEventListener('click', () => {
            EventBusModule.emit('bewohner:details:bearbeiten', { bewohner: aktiverBewohner });
            aktiviereBearbeitungsModus();
        });
    }
}

/**
 * Initialisiert das BewohnerAnzeiger-Modul
 */
function initialisiere() {
    // Event-Listener für Sprachänderungen
    document.addEventListener('spracheGeaendert', () => {
        // Alle i18n-Elemente aktualisieren
        I18n.aktualisiereUebersetzungen();
    });
    
    console.log('BewohnerAnzeiger-Modul initialisiert');
}

// Modul exportieren
export {
    initialisiere,
    zeigeNormaleAnsicht
}; 