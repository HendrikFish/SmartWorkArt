/**
 * i18nextAdapter.js - Modul-Version
 * 
 * Adapter für i18next Bibliothek zur Internationalisierung
 * Verwaltet die Initialisierung und Sprachänderungen für die Anwendung
 */

import EventBusModule, { EventBus } from './EventBus.js';

// Status-Flags
let initialized = false;
let initializing = false;

/**
 * Initialisiert die i18next-Bibliothek mit Konfiguration für Backend
 * @returns {Promise} Promise, das aufgelöst wird, wenn die Initialisierung abgeschlossen ist
 */
async function initialisiere() {
    // Verhindert mehrfache Initialisierung
    if (initialized) {
        console.log('i18nextAdapter: Bereits initialisiert, überspringe...');
        return Promise.resolve();
    }
    
    if (initializing) {
        console.log('i18nextAdapter: Initialisierung läuft bereits, überspringe...');
        return Promise.resolve();
    }
    
    initializing = true;
    console.log('i18nextAdapter: Starte Initialisierung...');

    try {
        // Prüfen, ob i18next verfügbar ist
        if (!window.i18next) {
            console.error('i18nextAdapter: i18next ist nicht definiert. Stelle sicher, dass die Bibliothek geladen wurde.');
            initializing = false;
            return Promise.reject(new Error('i18next ist nicht definiert'));
        }
        
        // Initialisierung von i18next
        await window.i18next.init({
            lng: 'de',           // Standardsprache
            fallbackLng: 'de',   // Fallback-Sprache
            debug: true,         // Für Fehlersuche
            resources: {
                de: {
                    translation: require('./locales/de/translation.json')
                },
                en: {
                    translation: require('./locales/en/translation.json')
                }
            },
            interpolation: {
                escapeValue: false
            }
        });
        
        // Warte auf das vollständige Laden der Übersetzungen
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Sprachauswahl-Element finden und Standardwert setzen
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            // Gespeicherte Sprache aus localStorage abrufen oder 'de' als Standard
            const savedLanguage = localStorage.getItem('userLanguage') || 'de';
            
            // Sprache im Selector setzen
            languageSelector.value = savedLanguage;
            
            // i18next auf die gespeicherte/Standard-Sprache setzen
            await window.i18next.changeLanguage(savedLanguage);
            
            // Warte auf die Sprachänderung
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Event-Listener für Änderungen hinzufügen
            languageSelector.addEventListener('change', async function(event) {
                const newLanguage = event.target.value;
                try {
                    await window.i18next.changeLanguage(newLanguage);
                    localStorage.setItem('userLanguage', newLanguage);
                    // Seiteninhalte aktualisieren
                    document.querySelectorAll('[data-i18n]').forEach(element => {
                        const key = element.getAttribute('data-i18n');
                        element.textContent = window.i18next.t(key);
                    });
                } catch (error) {
                    console.error('Fehler beim Ändern der Sprache:', error);
                }
            });
            
            console.log('i18nextAdapter: Sprachauswahl-Element initialisiert');
        } else {
            console.warn('i18nextAdapter: Sprachauswahl-Element nicht gefunden');
        }
        
        // Text-Elemente initial übersetzen
        aktualisiereAlleTexte();
        
        // Warte auf die Aktualisierung der Texte
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // EventBus-Unterstützung für beide API-Varianten
        const bus = EventBus || EventBusModule;
        if (typeof bus.on === 'function') {
            bus.on('sprache:aendern', (data) => {
                if (data && data.sprache) {
                    aendereSpracheMit(data.sprache);
                }
            });
        } else if (typeof bus.subscribe === 'function') {
            bus.subscribe('sprache:aendern', (data) => {
                if (data && data.sprache) {
                    aendereSpracheMit(data.sprache);
                }
            });
        }
        
        initialized = true;
        initializing = false;
        console.log('i18nextAdapter: Initialisierung abgeschlossen');
        return Promise.resolve();
    } catch (error) {
        initializing = false;
        console.error('i18nextAdapter: Fehler bei der Initialisierung:', error);
        return Promise.reject(error);
    }
}

/**
 * Ändert die aktuelle Sprache und aktualisiert alle Übersetzungen
 * @param {string} sprache - Sprachcode (z.B. 'de', 'en')
 * @returns {Promise} Promise, das aufgelöst wird, wenn die Sprache geändert wurde
 */
async function aendereSpracheMit(sprache) {
    if (!window.i18next) {
        console.error('i18nextAdapter: i18next ist nicht definiert. Initialisiere zuerst.');
        return Promise.reject(new Error('i18next ist nicht definiert'));
    }

    console.log(`i18nextAdapter: Ändere Sprache zu ${sprache}`);

    try {
        // Sprache wechseln
        await window.i18next.changeLanguage(sprache);
        
        // In localStorage speichern
        localStorage.setItem('language', sprache);
        
        // Alle Texte aktualisieren
        aktualisiereAlleTexte();
        
        // EventBus-Event für Sprachänderung auslösen
        const bus = EventBus || EventBusModule;
        if (typeof bus.emit === 'function') {
            bus.emit('sprache:geaendert', { sprache });
        } else if (typeof bus.publish === 'function') {
            bus.publish('sprache:geaendert', { sprache });
        }
        
        console.log(`i18nextAdapter: Sprache erfolgreich geändert zu ${sprache}`);
        return Promise.resolve();
    } catch (error) {
        console.error(`i18nextAdapter: Fehler beim Ändern der Sprache zu ${sprache}:`, error);
        return Promise.reject(error);
    }
}

/**
 * Aktualisiert alle Texte auf der Seite basierend auf den data-i18n-key Attributen
 */
function aktualisiereAlleTexte() {
    if (!window.i18next) {
        console.error('i18nextAdapter: i18next ist nicht definiert. Initialisiere zuerst.');
        return;
    }

    console.log('i18nextAdapter: Aktualisiere alle Texte...');
    
    // Alle Elemente mit data-i18n oder data-i18n-key Attribut finden
    const elements = document.querySelectorAll('[data-i18n], [data-i18n-key]');
    
    elements.forEach(element => {
        // Beide Attribute prüfen
        const key = element.getAttribute('data-i18n') || element.getAttribute('data-i18n-key');
        if (!key) return;
        
        try {
            const translation = window.i18next.t(key);
            
            // Wenn das Element ein Eingabefeld oder ein Textbereich ist
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                // Bei Platzhaltern
                if (element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translation);
                } else {
                    // Bei Werten
                    element.value = translation;
                }
            } else {
                // Bei allen anderen Elementen (Buttons, Überschriften, Absätze usw.)
                element.textContent = translation;
            }
        } catch (error) {
            console.warn(`i18nextAdapter: Fehler bei Übersetzung für Schlüssel '${key}':`, error);
        }
    });
    
    console.log(`i18nextAdapter: ${elements.length} Text-Elemente aktualisiert`);
}

/**
 * Übersetzt einen einzelnen Schlüssel
 * @param {string} key - Übersetzungsschlüssel
 * @param {Object} options - Optionen für die Übersetzung
 * @returns {string} Übersetzte Zeichenkette
 */
function t(key, options = {}) {
    if (!window.i18next) {
        console.error('i18nextAdapter: i18next ist nicht definiert. Initialisiere zuerst.');
        return key;
    }
    return window.i18next.t(key, options);
}

/**
 * Gibt die aktuelle Sprache zurück
 * @returns {string} Aktuelle Sprache (z.B. 'de', 'en')
 */
function getAktuelleSprache() {
    if (!window.i18next) {
        console.error('i18nextAdapter: i18next ist nicht definiert. Initialisiere zuerst.');
        return 'de'; // Fallback auf Deutsch
    }
    return window.i18next.language;
}

// Öffentliche API
export default {
    initialisiere,
    aendereSpracheMit,
    aktualisiereAlleTexte,
    t,
    getAktuelleSprache
}; 