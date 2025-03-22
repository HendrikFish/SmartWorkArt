/**
 * Modul für die Verwaltung der Bewohnerdaten
 */

import * as BewohnerButton from './bewohnerButton.js';

// Globale Variablen
let alleBewohner = [];
let filterConfig = null;
let aktiverBereich = null;

/**
 * Lädt alle Bewohner vom Server
 * @returns {Promise<Array>} Array mit Bewohnern
 */
async function ladeBewohner() {
    try {
        const response = await fetch('/api/solomenue/bewohner');
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        
        // Parsen der Antwort als JSON
        const data = await response.json();
        console.log('Bewohner geladen:', data.length);
        
        // Bewohner nach Nachnamen sortieren
        data.sort((a, b) => {
            const nachnameSortierung = a.lastName.localeCompare(b.lastName);
            if (nachnameSortierung !== 0) return nachnameSortierung;
            return a.firstName.localeCompare(b.firstName);
        });
        
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Bewohner:', error);
        return [];
    }
}

/**
 * Lädt die Filterkonfiguration vom Server
 * @returns {Promise<Object>} Die Filterkonfiguration
 */
async function ladeFilterConfig() {
    try {
        const response = await fetch('/api/solomenue/config/filter');
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Filter-Konfiguration geladen');
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Filter-Konfiguration:', error);
        return [];
    }
}

/**
 * Filtert Bewohner nach einem bestimmten Bereich/Etage
 * @param {Array} bewohner - Array mit Bewohnern
 * @param {string} bereich - Bereich/Etage zum Filtern
 * @returns {Array} Gefilterte Bewohner
 */
function filtereBewohnerNachBereich(bewohner, bereich) {
    if (!bereich || bereich === 'Alle') return bewohner;
    
    return bewohner.filter(b => {
        const bewohnerBereich = b.areas && b.areas['Wo wird das Essen eingetragen!'];
        return bewohnerBereich === bereich;
    });
}

/**
 * Erstellt die Etagen-Filter-Buttons
 * @param {Array} bereiche - Array mit verfügbaren Bereichen
 */
function erstelleEtageFilter(bereiche) {
    // Container für die Filter-Buttons finden
    const filterContainer = document.getElementById('etagen-filter');
    if (!filterContainer) return;
    
    // Container leeren
    filterContainer.innerHTML = '';
    
    // "Alle" Button hinzufügen (Standardauswahl)
    const alleButton = document.createElement('button');
    alleButton.className = 'filter-button active';
    alleButton.textContent = 'Alle';
    alleButton.addEventListener('click', () => filternNachBereich('Alle'));
    filterContainer.appendChild(alleButton);
    
    // Für jeden Bereich einen Button erstellen
    bereiche.forEach(bereich => {
        if (!bereich) return; // Leere Bereiche überspringen

        const button = document.createElement('button');
        button.className = 'filter-button';
        button.textContent = bereich;
        button.addEventListener('click', () => filternNachBereich(bereich));
        filterContainer.appendChild(button);
    });
}

/**
 * Filtert die Bewohnerliste nach einem bestimmten Bereich
 * @param {string} bereich - Der auszuwählende Bereich
 */
function filternNachBereich(bereich) {
    // Aktiven Bereich aktualisieren
    aktiverBereich = bereich;
    
    // Aktiven Button markieren
    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        if (button.textContent === bereich) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Bewohner filtern und anzeigen
    const gefilterteBewohner = filtereBewohnerNachBereich(alleBewohner, bereich);
    zeigeBewohner(gefilterteBewohner);
}

/**
 * Zeigt die Bewohnerliste an
 * @param {Array} bewohner - Array mit anzuzeigenden Bewohnern
 */
function zeigeBewohner(bewohner) {
    const container = document.getElementById('bewohner-container');
    if (!container) return;
    
    // Container leeren
    container.innerHTML = '';
    
    // Prüfen, ob Bewohner vorhanden sind
    if (!bewohner || bewohner.length === 0) {
        const leerElement = document.createElement('div');
        leerElement.className = 'keine-bewohner';
        leerElement.textContent = aktiverBereich === 'Alle' ? 
            'Keine Bewohner gefunden.' : 
            `Keine Bewohner im Bereich "${aktiverBereich}" gefunden.`;
        container.appendChild(leerElement);
        return;
    }
    
    // Bewohner gruppieren
    const gruppierteBewohner = {};
    
    bewohner.forEach(bewohner => {
        // Bereich des Bewohners bestimmen
        const bereich = bewohner.areas && bewohner.areas['Wo wird das Essen eingetragen!'] 
            ? bewohner.areas['Wo wird das Essen eingetragen!'] 
            : 'Andere';
        
        // Bereichsgruppe erstellen, falls noch nicht vorhanden
        if (!gruppierteBewohner[bereich]) {
            gruppierteBewohner[bereich] = [];
        }
        
        // Bewohner zur Gruppe hinzufügen
        gruppierteBewohner[bereich].push(bewohner);
    });
    
    // Für jede Gruppe einen Abschnitt erstellen
    Object.entries(gruppierteBewohner).forEach(([bereich, bewohnerInBereich]) => {
        // Bereichs-Header erstellen
        const bereichHeader = document.createElement('div');
        bereichHeader.className = 'bewohner-bereich-header';
        bereichHeader.textContent = bereich;
        container.appendChild(bereichHeader);
        
        // Container für die Bewohner-Karten in diesem Bereich
        const bereichContainer = document.createElement('div');
        bereichContainer.className = 'bewohner-bereich-container';
        
        // Bewohner-Karten hinzufügen
        bewohnerInBereich.forEach(bewohner => {
            // Bewohner-Karte mit der neuen Funktion erstellen
            const bewohnerKarte = BewohnerButton.erstelleBewohnerKarte(
                bewohner, 
                bereich,
                (bewohner) => bewohnerAusgewaehlt(bewohner)
            );
            
            bereichContainer.appendChild(bewohnerKarte);
        });
        
        container.appendChild(bereichContainer);
    });
    
    // Nach Erstellung der Karten die einheitliche Breite setzen
    BewohnerButton.setzeEinheitlicheKartenbreite();
}

/**
 * Wird aufgerufen, wenn ein Bewohner ausgewählt wurde
 * @param {Object} bewohner - Der ausgewählte Bewohner
 */
function bewohnerAusgewaehlt(bewohner) {
    console.log('Bewohner ausgewählt:', `${bewohner.firstName} ${bewohner.lastName}`);
    
    // Event auslösen, um andere Module zu informieren
    // (z.B. für die Anzeige des Menüplans dieses Bewohners)
    const event = new CustomEvent('bewohnerAusgewaehlt', {
        detail: { bewohner: bewohner }
    });
    document.dispatchEvent(event);
}

/**
 * Initialisiert das Modul
 */
export async function initialisiere() {
    try {
        // Bewohner und Filterkonfiguration laden
        const [bewohner, config] = await Promise.all([
            ladeBewohner(),
            ladeFilterConfig()
        ]);
        
        // Globale Variablen setzen
        alleBewohner = bewohner;
        filterConfig = config;
        
        // Bereiche für die Filter-Buttons ermitteln
        const menuRelevanteBereiche = filterConfig.filter(area => 
            area.name === 'Wo wird das Essen eingetragen!' && area.menuRelevant
        );
        
        // Wenn keine menürelevanten Bereiche gefunden wurden, einen Fallback verwenden
        const bereicheButtons = menuRelevanteBereiche.length > 0 
            ? menuRelevanteBereiche[0].buttons.map(btn => btn.label) 
            : ['Keine Bereiche gefunden'];
        
        // Filter-Buttons erstellen
        erstelleEtageFilter(bereicheButtons);
        
        // Bewohner anzeigen (initial alle)
        aktiverBereich = 'Alle';
        zeigeBewohner(alleBewohner);
        
        console.log('Bewohner-Modul initialisiert');
    } catch (error) {
        console.error('Fehler bei der Initialisierung des Bewohner-Moduls:', error);
    }
}
