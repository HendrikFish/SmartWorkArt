/**
 * i18nextAdapter.js - Globale Version
 * 
 * Adapter für i18next Bibliothek zur Internationalisierung
 * Verwaltet die Initialisierung und Sprachänderungen für die Anwendung
 */

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
        console.log('i18nextAdapter (global): Bereits initialisiert, überspringe...');
        return Promise.resolve();
    }
    
    if (initializing) {
        console.log('i18nextAdapter (global): Initialisierung läuft bereits, überspringe...');
        return Promise.resolve();
    }
    
    initializing = true;
    console.log('i18nextAdapter (global): Starte Initialisierung...');

    try {
        // Prüfen, ob i18next verfügbar ist
        if (!window.i18next) {
            console.error('i18nextAdapter (global): i18next ist nicht definiert. Stelle sicher, dass die Bibliothek geladen wurde.');
            initializing = false;
            return Promise.reject(new Error('i18next ist nicht definiert'));
        }
        
        // Gespeicherte Sprache aus localStorage abrufen oder Standardwert verwenden
        const savedLang = localStorage.getItem('language') || 'de';
        console.log(`i18nextAdapter (global): Gespeicherte Sprache: ${savedLang}`);
        
        // i18next mit Backend-Plugin initialisieren
        await window.i18next
            .use(window.i18nextHttpBackend)
            .init({
                fallbackLng: 'de',
                lng: savedLang,
                debug: true,
                backend: {
                    loadPath: 'locales/{{lng}}/translation.json'
                }
            });
        
        console.log(`i18nextAdapter (global): i18next initialisiert mit Sprache: ${window.i18next.language}`);
        
        // Sprachauswahl-Element im DOM finden
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            // Aktuellen Wert setzen
            languageSelector.value = window.i18next.language;
            
            // Event-Listener für Änderungen hinzufügen
            languageSelector.addEventListener('change', (event) => {
                aendereSpracheMit(event.target.value);
            });
            
            console.log('i18nextAdapter (global): Sprachauswahl-Element initialisiert');
        } else {
            console.warn('i18nextAdapter (global): Sprachauswahl-Element nicht gefunden');
        }
        
        // Text-Elemente initial übersetzen
        aktualisiereAlleTexte();
        
        // EventBus-Unterstützung für beide API-Varianten
        if (window.EventBus) {
            if (typeof window.EventBus.on === 'function') {
                window.EventBus.on('sprache:aendern', (data) => {
                    if (data && data.sprache) {
                        aendereSpracheMit(data.sprache);
                    }
                });
            } else if (typeof window.EventBus.subscribe === 'function') {
                window.EventBus.subscribe('sprache:aendern', (data) => {
                    if (data && data.sprache) {
                        aendereSpracheMit(data.sprache);
                    }
                });
            }
        }
        
        initialized = true;
        initializing = false;
        console.log('i18nextAdapter (global): Initialisierung abgeschlossen');
        return Promise.resolve();
    } catch (error) {
        initializing = false;
        console.error('i18nextAdapter (global): Fehler bei der Initialisierung:', error);
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
        console.error('i18nextAdapter (global): i18next ist nicht definiert. Initialisiere zuerst.');
        return Promise.reject(new Error('i18next ist nicht definiert'));
    }

    console.log(`i18nextAdapter (global): Ändere Sprache zu ${sprache}`);

    try {
        // Sprache wechseln
        await window.i18next.changeLanguage(sprache);
        
        // In localStorage speichern
        localStorage.setItem('language', sprache);
        
        // Alle Texte aktualisieren
        aktualisiereAlleTexte();
        
        // EventBus-Event für Sprachänderung auslösen
        if (window.EventBus) {
            if (typeof window.EventBus.emit === 'function') {
                window.EventBus.emit('sprache:geaendert', { sprache });
            } else if (typeof window.EventBus.publish === 'function') {
                window.EventBus.publish('sprache:geaendert', { sprache });
            }
        }
        
        console.log(`i18nextAdapter (global): Sprache erfolgreich geändert zu ${sprache}`);
        return Promise.resolve();
    } catch (error) {
        console.error(`i18nextAdapter (global): Fehler beim Ändern der Sprache zu ${sprache}:`, error);
        return Promise.reject(error);
    }
}

/**
 * Aktualisiert alle Texte auf der Seite basierend auf den data-i18n-key Attributen
 */
function aktualisiereAlleTexte() {
    if (!window.i18next) {
        console.error('i18nextAdapter (global): i18next ist nicht definiert. Initialisiere zuerst.');
        return;
    }

    console.log('i18nextAdapter (global): Aktualisiere alle Texte...');
    
    // Alle Elemente mit data-i18n-key Attribut finden
    const elements = document.querySelectorAll('[data-i18n-key]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-key');
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
            console.warn(`i18nextAdapter (global): Fehler bei Übersetzung für Schlüssel '${key}':`, error);
        }
    });
    
    console.log(`i18nextAdapter (global): ${elements.length} Text-Elemente aktualisiert`);
}

/**
 * Übersetzt einen einzelnen Schlüssel
 * @param {string} key - Übersetzungsschlüssel
 * @param {Object} options - Optionen für die Übersetzung
 * @returns {string} Übersetzte Zeichenkette
 */
function t(key, options = {}) {
    if (!window.i18next) {
        console.error('i18nextAdapter (global): i18next ist nicht definiert. Initialisiere zuerst.');
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
        console.error('i18nextAdapter (global): i18next ist nicht definiert. Initialisiere zuerst.');
        return 'de'; // Fallback auf Deutsch
    }
    return window.i18next.language;
}

// Abwärtskompatibilität
const setzeAktiveSprache = aendereSpracheMit;
const uebersetze = t;
const updateContent = aktualisiereAlleTexte;
const getAktiveSprache = getAktuelleSprache;

// Globales Objekt für den i18nextAdapter
window.i18nextAdapter = {
    initialisiere,
    aendereSpracheMit,
    aktualisiereAlleTexte,
    t,
    getAktuelleSprache,
    // Abwärtskompatibilität
    setzeAktiveSprache,
    uebersetze,
    updateContent,
    getAktiveSprache
};

// Globales i18n-Helfer-Objekt
window.i18n = {
    t,
    aktualisiereAlleTexte,
    getAktuelleSprache
}; 