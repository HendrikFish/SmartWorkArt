/**
 * FormularConfig.js
 * Modul für das Laden und Verwalten der Formularkonfiguration
 */

let formConfig = null;

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
 * Gibt die aktuelle Formularkonfiguration zurück
 * @returns {Object} Die aktuelle Formularkonfiguration
 */
function getFormConfig() {
    return formConfig;
}

/**
 * Initialisiert das Modul und lädt die Formularkonfiguration
 */
async function initialisiere() {
    await ladeFormConfig();
    console.log('FormularConfig-Modul initialisiert');
}

// Modul exportieren
export {
    initialisiere,
    getFormConfig,
    ladeFormConfig
}; 