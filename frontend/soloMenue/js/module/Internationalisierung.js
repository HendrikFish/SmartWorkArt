/**
 * Internationalisierungsmodul für die SoloMenü-Anwendung
 * Verwaltet mehrsprachige Texte und stellt Funktionen zur Sprachänderung bereit
 */
import EventBusModule, { EventBus } from './EventBus.js';

// Aktuell ausgewählte Sprache (Default: Deutsch)
let aktuellerSprachCode = 'de';

// Übersetzungen für unterstützte Sprachen
const uebersetzungen = {
    de: {
        // Navigation und Buttons
        'prev-week-btn': 'Vorherige Woche',
        'next-week-btn': 'Nächste Woche',
        'current-week-btn': 'Aktuelle Woche',
        'nach-oben-button': 'Zurück zur Personenauswahl',
        'add-kategorie-btn': 'Kategorien verwalten',
        
        // Kalenderwochen
        'kw-display': 'Kalenderwoche {kw}/{jahr}',
        
        // Bewohner und Karten
        'keine-bewohner': 'Keine Bewohner gefunden',
        'bewohner-laden': 'Bewohner werden geladen...',
        'station': 'Station: {station}',
        'tisch': 'Tisch: {tisch}',
        'zimmer': 'Zimmer: {zimmer}',
        
        // Formularfelder
        'speichern': 'Speichern',
        'abbrechen': 'Abbrechen',
        'loeschen': 'Löschen',
        'aktualisieren': 'Aktualisieren',
        'zurueck': 'Zurück',
        
        // Kategorien-Formular
        'kategorien-verwalten': 'Kategorien verwalten',
        'kategorien-tab': 'Kategorien',
        'extra-optionen-tab': 'Extra-Optionen',
        'sonderwuensche-tab': 'Sonderwünsche',
        'neue-kategorie-hinzufuegen': '+ Neue Kategorie hinzufügen',
        'neue-kategorie-titel': 'Neue Kategorie hinzufügen',
        'anzeigename-kategorie': 'Anzeigename der Kategorie',
        'kategorie-text': 'Text für alle Tage (Montag - Sonntag)',
        'vorhandene-kategorien': 'Vorhandene Kategorien',
        'kategorien-laden': 'Kategorien werden geladen...',
        
        // Extra-Optionen
        'neue-extra-option': '+ Neue Extra-Option hinzufügen',
        'neue-extra-option-titel': 'Neue Extra-Option hinzufügen',
        'extra-kategorie': 'Kategorie',
        'neue-extra-kategorie': 'Name der neuen Kategorie',
        'extra-option-name': 'Name der Option',
        'extra-option-beschreibung': 'Beschreibung',
        'vorhandene-extra-optionen': 'Vorhandene Extra-Optionen',
        'extra-optionen-laden': 'Extra-Optionen werden geladen...',
        
        // Sonderwünsche
        'neuer-sonderwunsch': '+ Neuen Sonderwunsch hinzufügen',
        'neuer-sonderwunsch-titel': 'Neuen Sonderwunsch hinzufügen',
        'sonderwunsch-name': 'Name des Sonderwunsches',
        'sonderwunsch-beschreibung': 'Beschreibung',
        'vorhandene-sonderwuensche': 'Vorhandene Sonderwünsche',
        'sonderwuensche-laden': 'Sonderwünsche werden geladen...',
        
        // Menüplan-Tabelle
        'menueplan-laden': 'Menüplan wird geladen...',
        'fehler-laden': 'Fehler beim Laden der Daten',
        'keine-daten': 'Keine Daten verfügbar',
        
        // Bewohner-Detail
        'bewohner-details': 'Bewohner-Details',
        'bewohner-bearbeiten': 'Bewohner bearbeiten',
        'plan-zuruecksetzen': 'Plan zurücksetzen',
        'plan-loeschen': 'Plan löschen',
        
        // Fehlermeldungen
        'fehler-speichern': 'Fehler beim Speichern der Daten',
        'fehler-laden-daten': 'Fehler beim Laden der Daten',
        'fehler-loeschen': 'Fehler beim Löschen',
        'fehler-bewohner-laden': 'Fehler beim Laden der Bewohnerdaten',
        'fehler-plan-laden': 'Fehler beim Laden des Menüplans',
        
        // Erfolgsmedlungen
        'erfolg-gespeichert': 'Erfolgreich gespeichert',
        'erfolg-geloescht': 'Erfolgreich gelöscht',
        'erfolg-aktualisiert': 'Erfolgreich aktualisiert',
        
        // Bestätigungsdialoge
        'bestaetigung-loeschen': 'Möchten Sie diesen Eintrag wirklich löschen?',
        'bestaetigung-zuruecksetzen': 'Möchten Sie den Plan wirklich zurücksetzen?'
    },
    en: {
        // Navigation and Buttons
        'prev-week-btn': 'Previous Week',
        'next-week-btn': 'Next Week',
        'current-week-btn': 'Current Week',
        'nach-oben-button': 'Back to Person Selection',
        'add-kategorie-btn': 'Manage Categories',
        
        // Calendar weeks
        'kw-display': 'Calendar Week {kw}/{jahr}',
        
        // Residents and Cards
        'keine-bewohner': 'No residents found',
        'bewohner-laden': 'Loading residents...',
        'station': 'Ward: {station}',
        'tisch': 'Table: {tisch}',
        'zimmer': 'Room: {zimmer}',
        
        // Form Fields
        'speichern': 'Save',
        'abbrechen': 'Cancel',
        'loeschen': 'Delete',
        'aktualisieren': 'Update',
        'zurueck': 'Back',
        
        // Categories Form
        'kategorien-verwalten': 'Manage Categories',
        'kategorien-tab': 'Categories',
        'extra-optionen-tab': 'Extra Options',
        'sonderwuensche-tab': 'Special Requests',
        'neue-kategorie-hinzufuegen': '+ Add New Category',
        'neue-kategorie-titel': 'Add New Category',
        'anzeigename-kategorie': 'Display Name of Category',
        'kategorie-text': 'Text for All Days (Monday - Sunday)',
        'vorhandene-kategorien': 'Existing Categories',
        'kategorien-laden': 'Loading categories...',
        
        // Extra Options
        'neue-extra-option': '+ Add New Extra Option',
        'neue-extra-option-titel': 'Add New Extra Option',
        'extra-kategorie': 'Category',
        'neue-extra-kategorie': 'Name of New Category',
        'extra-option-name': 'Option Name',
        'extra-option-beschreibung': 'Description',
        'vorhandene-extra-optionen': 'Existing Extra Options',
        'extra-optionen-laden': 'Loading Extra Options...',
        
        // Special Requests
        'neuer-sonderwunsch': '+ Add New Special Request',
        'neuer-sonderwunsch-titel': 'Add New Special Request',
        'sonderwunsch-name': 'Name of Special Request',
        'sonderwunsch-beschreibung': 'Description',
        'vorhandene-sonderwuensche': 'Existing Special Requests',
        'sonderwuensche-laden': 'Loading Special Requests...',
        
        // Menu Table
        'menueplan-laden': 'Loading menu plan...',
        'fehler-laden': 'Error loading data',
        'keine-daten': 'No data available',
        
        // Resident Detail
        'bewohner-details': 'Resident Details',
        'bewohner-bearbeiten': 'Edit Resident',
        'plan-zuruecksetzen': 'Reset Plan',
        'plan-loeschen': 'Delete Plan',
        
        // Error Messages
        'fehler-speichern': 'Error saving data',
        'fehler-laden-daten': 'Error loading data',
        'fehler-loeschen': 'Error deleting',
        'fehler-bewohner-laden': 'Error loading resident data',
        'fehler-plan-laden': 'Error loading menu plan',
        
        // Success Messages
        'erfolg-gespeichert': 'Successfully saved',
        'erfolg-geloescht': 'Successfully deleted',
        'erfolg-aktualisiert': 'Successfully updated',
        
        // Confirmation Dialogs
        'bestaetigung-loeschen': 'Do you really want to delete this entry?',
        'bestaetigung-zuruecksetzen': 'Do you really want to reset the plan?'
    }
};

/**
 * Internationalisierungsmodul initialisieren und Sprachselektor einrichten
 * @param {Object} optionen - Konfigurationsoptionen
 */
export function initialisiere(optionen = {}) {
    console.log('Initialisiere Internationalisierungsmodul...');
    
    // Sprachpräferenz aus lokalem Speicher laden (falls vorhanden)
    const gespeicherteSprachpraeferenz = localStorage.getItem('soloMenue_sprachpraeferenz');
    if (gespeicherteSprachpraeferenz && uebersetzungen[gespeicherteSprachpraeferenz]) {
        aktuellerSprachCode = gespeicherteSprachpraeferenz;
    }
    
    // Sprachselektor Event-Listener einrichten
    const sprachSelector = document.getElementById('sprache-selector');
    if (sprachSelector) {
        // Aktuellen Wert setzen
        sprachSelector.value = aktuellerSprachCode;
        
        // Event-Listener für Sprachänderung
        sprachSelector.addEventListener('change', (event) => {
            setzeAktiveSprache(event.target.value);
        });
    }
    
    // Initial alle Texte entsprechend aktualisieren
    aktualisiereAlleTexte();
    
    // Event für erfolgreiche Initialisierung
    EventBusModule.emit('internationalisierung:initialisiert', { sprachCode: aktuellerSprachCode });
    console.log(`Internationalisierungsmodul initialisiert mit Sprache: ${aktuellerSprachCode}`);
}

/**
 * Aktive Sprache setzen und UI aktualisieren
 * @param {string} sprachCode - Code der neuen aktiven Sprache (z.B. 'de', 'en')
 */
export function setzeAktiveSprache(sprachCode) {
    if (!uebersetzungen[sprachCode]) {
        console.error(`Sprache ${sprachCode} wird nicht unterstützt!`);
        return;
    }
    
    // Neue Sprache setzen
    aktuellerSprachCode = sprachCode;
    
    // Sprache in lokalem Speicher speichern
    localStorage.setItem('soloMenue_sprachpraeferenz', sprachCode);
    
    // UI aktualisieren
    aktualisiereAlleTexte();
    
    // Event für Sprachänderung emittieren
    EventBusModule.emit('sprache:geaendert', { sprachCode });
    console.log(`Sprache geändert zu: ${sprachCode}`);
}

/**
 * Übersetzung für einen bestimmten Schlüssel holen
 * @param {string} schluessel - Der Übersetzungsschlüssel
 * @param {Object} variablen - Variablen für dynamische Texte (optional)
 * @returns {string} - Der übersetzte Text
 */
export function getText(schluessel, variablen = {}) {
    // Übersetzung abrufen oder Schlüssel als Fallback verwenden
    const vorlage = uebersetzungen[aktuellerSprachCode]?.[schluessel] || schluessel;
    
    // Variablen in Text einsetzen, wenn vorhanden
    if (Object.keys(variablen).length > 0) {
        return vorlage.replace(/{([^}]+)}/g, (match, key) => {
            return variablen[key] !== undefined ? variablen[key] : match;
        });
    }
    
    return vorlage;
}

/**
 * Alle Textelemente auf der Seite aktualisieren
 * (Findet Elemente mit data-i18n-key und aktualisiert deren Inhalt)
 */
function aktualisiereAlleTexte() {
    // Buttons und statische Texte aktualisieren
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        element.textContent = getText(key);
    });
    
    // Text für bestimmte bekannte Elemente aktualisieren
    const elementIds = [
        'prev-week-btn', 
        'next-week-btn', 
        'current-week-btn', 
        'nach-oben-button'
    ];
    
    elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = getText(id);
            if (element.title) {
                element.title = getText(`${id}-title`);
            }
        }
    });
    
    // Buttons und Elemente auch dynamisch aktualisieren
    const addKategorieBtn = document.getElementById('add-kategorie-btn');
    if (addKategorieBtn) {
        addKategorieBtn.title = getText('add-kategorie-btn');
    }
    
    // Event emittieren, damit andere Module informiert werden
    EventBusModule.emit('texte:aktualisiert', { sprachCode: aktuellerSprachCode });
}

/**
 * Fügt einem Element ein data-i18n-key Attribut hinzu und setzt den Text entsprechend
 * @param {HTMLElement} element - Das zu aktualisierende Element
 * @param {string} key - Der Übersetzungsschlüssel
 * @param {Object} variablen - Variablen für dynamische Texte (optional)
 */
export function setzeElementText(element, key, variablen = {}) {
    if (!element) return;
    
    element.setAttribute('data-i18n-key', key);
    element.textContent = getText(key, variablen);
}

/**
 * Aktuelle Sprache zurückgeben
 * @returns {string} - Der aktuelle Sprachcode (z.B. 'de', 'en')
 */
export function getAktiveSprache() {
    return aktuellerSprachCode;
}

/**
 * Prüft, ob eine bestimmte Sprache unterstützt wird
 * @param {string} sprachCode - Der zu prüfende Sprachcode
 * @returns {boolean} - True, wenn die Sprache unterstützt wird
 */
export function istSpracheUnterstuetzt(sprachCode) {
    return !!uebersetzungen[sprachCode];
}

/**
 * Liste aller unterstützten Sprachen abrufen
 * @returns {Array<string>} - Liste der unterstützten Sprachcodes
 */
export function getUnterstuetzteSprachen() {
    return Object.keys(uebersetzungen);
}