/**
 * EventBus-Modul
 * Ermöglicht die Kommunikation zwischen Komponenten über Ereignisse
 */

let debug = false;
const subscribers = {};

/**
 * Initialisiert das EventBus-Modul
 * @param {Object} optionen - Konfigurationsoptionen
 * @param {boolean} optionen.debug - Debug-Modus aktivieren
 */
function initialisiere(optionen = {}) {
    debug = optionen.debug || false;
    if (debug) console.log('EventBus: Initialisiert mit Debug-Modus:', debug);
    
    // Für Abwärtskompatibilität auch die globale Instanz initialisieren
    if (typeof window !== 'undefined' && window.EventBus && typeof window.EventBus.initialisiere === 'function') {
        window.EventBus.initialisiere(optionen);
        if (debug) console.log('EventBus: Globale EventBus-Instanz auch initialisiert');
    }
    
    return { success: true };
}

/**
 * Abonniert ein Ereignis
 * @param {string} ereignis - Name des Ereignisses
 * @param {Function} callback - Funktion, die bei Auslösung des Ereignisses aufgerufen wird
 */
function abonniere(ereignis, callback) {
    if (!subscribers[ereignis]) {
        subscribers[ereignis] = [];
    }
    subscribers[ereignis].push(callback);
    if (debug) console.log(`EventBus: Abonniert für ${ereignis}`);
}

/**
 * Publiziert ein Ereignis mit Daten
 * @param {string} ereignis - Name des Ereignisses
 * @param {*} daten - Daten, die an die Callback-Funktionen übergeben werden
 */
function publiziere(ereignis, daten) {
    if (!subscribers[ereignis]) {
        if (debug) console.log(`EventBus: Keine Abonnenten für Ereignis ${ereignis}`);
        return;
    }
    
    if (debug) console.log(`EventBus: Publiziere ${ereignis} mit Daten:`, daten);
    subscribers[ereignis].forEach(callback => {
        try {
            callback(daten);
        } catch (error) {
            console.error(`EventBus: Fehler beim Ausführen des Callbacks für ${ereignis}:`, error);
        }
    });
}

/**
 * Entfernt ein Abonnement
 * @param {string} ereignis - Name des Ereignisses
 * @param {Function} callback - Die zu entfernende Callback-Funktion
 */
function deabonniere(ereignis, callback) {
    if (!subscribers[ereignis]) {
        if (debug) console.log(`EventBus: Keine Abonnenten für Ereignis ${ereignis} zum Deabonnieren`);
        return;
    }
    
    const index = subscribers[ereignis].indexOf(callback);
    if (index !== -1) {
        subscribers[ereignis].splice(index, 1);
        if (debug) console.log(`EventBus: Deabonniert von ${ereignis}`);
    } else {
        if (debug) console.log(`EventBus: Callback nicht gefunden für ${ereignis}`);
    }
}

/**
 * Alternative Namen und Aliase für bessere Kompatibilität
 */
// Diese Funktionen werden an die Hauptfunktionen delegiert
const subscribe = abonniere;
const publish = publiziere;
const unsubscribe = deabonniere;
const on = subscribe;
const emit = publish;
const off = unsubscribe;

// Event-Bus API-Objekt mit allen Funktionen
const EventBusAPI = {
    initialisiere,
    abonniere,
    publiziere,
    deabonniere,
    subscribe,
    publish,
    unsubscribe,
    on,
    emit,
    off
};

// Exportiere das gesamte API-Objekt als Default-Export
export default EventBusAPI;

// Exportiere das API-Objekt auch als benannten Export für Destrukturierung
export const EventBus = EventBusAPI; 