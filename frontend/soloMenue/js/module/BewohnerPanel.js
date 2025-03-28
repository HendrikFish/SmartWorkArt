/**
 * BewohnerPanel.js
 * Hauptmodul für das Bearbeitungspanel der Bewohnerdaten,
 * das die anderen Module koordiniert
 */

// Module importieren
import * as FormularConfig from './FormularConfig.js';
import * as PanelStruktur from './PanelStruktur.js';
import * as BewohnerAnzeiger from './BewohnerAnzeiger.js';
import * as FormularContainer from './FormularContainer.js';
import * as DatenSpeicher from './DatenSpeicher.js';
import * as I18n from './Internationalisierung.js';
import EventBusModule, { EventBus } from './EventBus.js';

// Zustandsvariablen
let aktiverBewohner = null;
let bearbeitungsModus = false;

// Definierte Event-Namen für den EventBus
const EVENTS = {
    BEWOHNER_AUSGEWAEHLT: 'bewohner:ausgewaehlt',
    BEWOHNER_ANZEIGEN: 'bewohner:anzeigen',
    BEWOHNER_BEARBEITEN: 'bewohner:bearbeiten',
    BEWOHNER_SPEICHERN: 'bewohner:speichern',
    BEWOHNER_SPEICHERN_ERFOLG: 'bewohner:speichern:erfolg',
    BEWOHNER_SPEICHERN_FEHLER: 'bewohner:speichern:fehler',
    PANEL_SCHLIESSEN: 'panel:schliessen',
    MODUS_WECHSELN: 'modus:wechseln'
};

/**
 * Schließt das Panel und setzt den Status zurück
 */
function schliessePanel() {
    PanelStruktur.verbergePanel(document.getElementById('bearbeitungs-panel'));
    aktiverBewohner = null;
    bearbeitungsModus = false;
    
    // Event über EventBus auslösen
    EventBusModule.emit(EVENTS.PANEL_SCHLIESSEN);
}

/**
 * Aktiviert den Bearbeitungsmodus und aktualisiert die Anzeige
 */
function aktiviereBearbeitungsModus() {
    bearbeitungsModus = true;
    
    // Event über EventBus auslösen
    EventBusModule.emit(EVENTS.MODUS_WECHSELN, { modus: 'bearbeiten' });
    
    aktualisiereAnzeige();
}

/**
 * Deaktiviert den Bearbeitungsmodus und aktualisiert die Anzeige
 */
function deaktiviereBearbeitungsModus() {
    bearbeitungsModus = false;
    
    // Event über EventBus auslösen
    EventBusModule.emit(EVENTS.MODUS_WECHSELN, { modus: 'anzeigen' });
    
    aktualisiereAnzeige();
}

/**
 * Aktualisiert die Anzeige des Panels basierend auf dem aktuellen Modus
 */
function aktualisiereAnzeige() {
    const content = document.getElementById('bewohner-details');
    if (!content) return;

    if (bearbeitungsModus) {
        FormularContainer.zeigeBearbeitungsAnsicht(
            content,
            aktiverBewohner,
            FormularConfig.getFormConfig(),
            deaktiviereBearbeitungsModus,
            speichereBewohnerAenderungen
        );
    } else {
        BewohnerAnzeiger.zeigeNormaleAnsicht(
            content,
            aktiverBewohner,
            schliessePanel,
            aktiviereBearbeitungsModus
        );
    }
}

/**
 * Speichert die Änderungen an den Bewohnerdaten
 */
async function speichereBewohnerAenderungen() {
    try {
        if (!aktiverBewohner) return;
        
        // Event über EventBus auslösen, dass Speichervorgang beginnt
        EventBusModule.emit(EVENTS.BEWOHNER_SPEICHERN, { bewohner: aktiverBewohner });
        
        // Formulardaten sammeln
        const aktualisierteAreas = FormularContainer.sammleFormulardaten(
            aktiverBewohner,
            FormularConfig.getFormConfig()
        );
        
        if (!aktualisierteAreas) {
            throw new Error(I18n.getText('keineFormulardaten'));
        }
        
        // Daten speichern
        const ergebnis = await DatenSpeicher.speichereBewohnerdaten(
            aktiverBewohner,
            aktualisierteAreas
        );
        
        // Lokale Daten aktualisieren
        aktiverBewohner = ergebnis.bewohner;
        
        // Event über EventBus auslösen, dass Speichervorgang erfolgreich war
        EventBusModule.emit(EVENTS.BEWOHNER_SPEICHERN_ERFOLG, { 
            bewohner: aktiverBewohner,
            meldung: ergebnis.meldung
        });
        
        // Erfolgsmeldung anzeigen
        alert(I18n.getText('datenGespeichert'));
        
        // Zurück zur normalen Ansicht
        deaktiviereBearbeitungsModus();
    } catch (error) {
        console.error(I18n.getText('fehlerSpeichern') + ':', error);
        
        // Event über EventBus auslösen, dass ein Fehler aufgetreten ist
        EventBusModule.emit(EVENTS.BEWOHNER_SPEICHERN_FEHLER, { 
            bewohner: aktiverBewohner,
            fehler: error
        });
        
        alert(`${I18n.getText('fehlerSpeichern')}: ${error.message} 
        
${I18n.getText('adminKontaktieren')}`);
    }
}

/**
 * Öffnet das Panel mit den Bewohnerdaten
 * @param {Object} bewohner - Der anzuzeigende Bewohner
 */
async function zeigeBewohner(bewohner) {
    if (!bewohner) return;

    aktiverBewohner = bewohner;
    bearbeitungsModus = false;
    
    // Event über EventBus auslösen
    EventBusModule.emit(EVENTS.BEWOHNER_ANZEIGEN, { bewohner });
    
    // Panel anzeigen
    const panel = PanelStruktur.erstellePanel(schliessePanel);
    PanelStruktur.zeigePanel(panel);
    
    // Ansicht aktualisieren
    aktualisiereAnzeige();
}

/**
 * Initialisiert das Bearbeitungspanel
 */
async function initialisiere() {
    // EventBus initialisieren
    EventBusModule.initialisiere({ debug: false });
    
    // Internationalisierung initialisieren
    I18n.initialisiere();
    
    // Formular-Konfiguration laden
    await FormularConfig.initialisiere();
    
    // Panel-Struktur initialisieren
    PanelStruktur.initialisiere(schliessePanel);
    
    // EventBus-Listener registrieren
    EventBusModule.on(EVENTS.BEWOHNER_AUSGEWAEHLT, (data) => {
        if (data && data.bewohner) {
            zeigeBewohner(data.bewohner);
        }
    });
    
    // Abwärtskompatibilität: CustomEvent-Listener auf DOM-Ebene
    document.addEventListener('bewohnerDataUpdated', (event) => {
        // CustomEvent in EventBus-Event umwandeln
        if (event.detail && event.detail.bewohner) {
            EventBusModule.emit(EVENTS.BEWOHNER_SPEICHERN_ERFOLG, {
                bewohner: event.detail.bewohner,
                meldung: I18n.getText('datenGespeichert')
            });
        }
    });
    
    console.log('BewohnerPanel-Modul initialisiert');
}

// EventBus-Events öffentlich machen
export const Events = EVENTS;

// Module exportieren
export {
    initialisiere,
    zeigeBewohner,
    schliessePanel
}; 