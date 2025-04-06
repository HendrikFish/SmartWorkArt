/**
 * Modul für die Verwaltung und Anzeige von Bewohnerdaten
 */

import * as BewohnerButton from './bewohnerButton.js';

// Modulvariablen
let alleBewohner = [];
let filterConfig = null;
let aktuelleKategorie = 'Saal'; // Standardmäßig 'Saal' als Kategorie
let globalAktiverBewohnerId = null; // Variable für den global aktiven Bewohner
let aktiverBereich = null;

/**
 * Lädt die Filter-Konfiguration vom Server
 * @returns {Promise<Object>} Die Filter-Konfiguration
 */
async function ladeFilterKonfiguration() {
    console.log('Lade Filter-Konfiguration...');
    
    try {
        // Konfiguration vom Server abrufen
        const response = await fetch('/api/solomenue/config/filter');
        
        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Filter-Konfiguration: ${response.status} ${response.statusText}`);
        }
        
        const config = await response.json();
        console.log('Filter-Konfiguration erfolgreich geladen', config);
        
        return config;
    } catch (error) {
        console.error('Fehler beim Laden der Filter-Konfiguration:', error);
        
        // Fallback-Konfiguration zurückgeben
        return {
            areas: ['Saal', '1.OG', '2.OG', '3.OG']
        };
    }
}

/**
 * Lädt alle Bewohner
 * @returns {Promise<Array>} Liste aller Bewohner
 */
async function ladeBewohner() {
    try {
        const response = await fetch('/api/solomenue/bewohner');
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Bewohnerdaten');
        }

        const daten = await response.json();
        return daten;
    } catch (error) {
        console.error('Fehler beim Laden der Bewohnerdaten:', error);
        return [];
    }
}

/**
 * Erstellt Filter-Buttons basierend auf der Konfiguration
 * @param {Object} filterConfig - Die Filter-Konfiguration
 */
function erstelleFilterButtons(filterConfig) {
    console.log('Erstelle Filter-Buttons');
    
    // Prüfen, ob die Konfiguration vorhanden ist
    if (!filterConfig) {
        console.error('Keine Filter-Konfiguration gefunden');
        return;
    }

    // Container für die Filter-Buttons finden
    const filterContainer = document.getElementById('etagen-filter');
    if (!filterContainer) {
        console.error('Filter-Container nicht gefunden (ID: etagen-filter)');
        return;
    }

    // Container leeren
    filterContainer.innerHTML = '';
    
    // Bereiche aus der Konfiguration oder Fallback verwenden
    const areas = filterConfig.areas || ['Saal', '1.OG', '2.OG', '3.OG'];
    console.log(`${areas.length} Filter-Bereiche gefunden:`, areas);

    // Filter-Buttons erstellen
    areas.forEach(area => {
        const button = document.createElement('button');
        button.classList.add('filter-button');
        button.dataset.filter = area;
        button.textContent = area;
        
        // Ersten Button als aktiv markieren, wenn keine Kategorie gesetzt ist
        if (!aktuelleKategorie && areas.indexOf(area) === 0) {
            aktuelleKategorie = area;
        }
        
        // Button als aktiv markieren, wenn er der aktuellen Kategorie entspricht
        if (area === aktuelleKategorie) {
            button.classList.add('active');
        }
        
        // Klick-Handler hinzufügen
        button.addEventListener('click', () => {
            wechsleKategorie(area);
        });
        
        // Button zum Container hinzufügen
        filterContainer.appendChild(button);
    });
    
    console.log('Filter-Buttons erstellt, aktive Kategorie:', aktuelleKategorie);
}

/**
 * Wechselt die aktuelle Kategorie und filtert Bewohner neu
 * @param {string} kategorie - Die neue Kategorie
 */
function wechsleKategorie(kategorie) {
    console.log(`Wechsle Kategorie auf: ${kategorie}`);
    
    // Wenn keine Änderung, nichts tun
    if (kategorie === aktuelleKategorie) {
        console.log('Gleiche Kategorie, keine Änderung nötig');
        return;
    }
    
    // Neue Kategorie setzen
    aktuelleKategorie = kategorie;
    
    // UI aktualisieren
    const filterButtons = document.querySelectorAll('#etagen-filter .filter-button');
    filterButtons.forEach(button => {
        if (button.dataset.filter === kategorie) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Bewohner nach der neuen Kategorie filtern und anzeigen
    zeigeGefilterteBewohner();
}

/**
 * Filtert Bewohner nach der aktuellen Kategorie und zeigt sie an
 */
function zeigeGefilterteBewohner() {
    const bewohnerContainer = document.getElementById('bewohner-container');
    if (!bewohnerContainer) return;

    console.log(`Zeige gefilterte Bewohner für Kategorie: ${aktuelleKategorie}`);

    // Zustand der aktiven Bewohnerkarte speichern
    let aktiverBewohnerId = null;
    let aktiveInfoAnzeige = null;
    
    // Aktive Karte aus DOM ermitteln
    const aktiveBewohnerCard = document.querySelector('.bewohner-card.active');
    if (aktiveBewohnerCard) {
        aktiverBewohnerId = aktiveBewohnerCard.dataset.id;
        console.log(`Aktive Bewohnerkarte in DOM gefunden: ${aktiverBewohnerId}`);
        
        // Global speichern
        globalAktiverBewohnerId = aktiverBewohnerId;
        
        // Info-Anzeige speichern, falls vorhanden
        const infoElement = aktiveBewohnerCard.querySelector('.bewohner-info');
        if (infoElement && infoElement.style.display !== 'none') {
            aktiveInfoAnzeige = infoElement.innerHTML;
            console.log('Info-Anzeige gespeichert');
        }
    } else if (globalAktiverBewohnerId) {
        // Falls keine aktive Karte im DOM, aber globale Variable gesetzt ist
        aktiverBewohnerId = globalAktiverBewohnerId;
        console.log(`Keine aktive Karte im DOM, aber globale ID vorhanden: ${aktiverBewohnerId}`);
    }
    
    // Container leeren
    bewohnerContainer.innerHTML = '';

    // Bewohner nach der aktuellen Kategorie filtern
    const gefilterteBewohner = alleBewohner.filter(bewohner => {
        // Prüfen, ob der Bewohner eine gültige areas-Eigenschaft hat
        if (!bewohner.areas) return false;
        
        // Prüfen, ob das Feld für die Essenseintragung existiert
        const eintragungsOrt = bewohner.areas['Wo wird das Essen eingetragen!'];
        if (!eintragungsOrt) return false;
        
        // Mit der aktuellen Kategorie vergleichen
        return eintragungsOrt === aktuelleKategorie;
    });

    console.log(`${gefilterteBewohner.length} Bewohner für Kategorie "${aktuelleKategorie}" gefunden`);

    if (gefilterteBewohner.length === 0) {
        // Wenn keine Bewohner gefunden wurden, eine Meldung anzeigen
        const meldung = document.createElement('div');
        meldung.textContent = `Keine Bewohner in der Kategorie "${aktuelleKategorie}" gefunden.`;
        meldung.classList.add('keine-bewohner-meldung');
        bewohnerContainer.appendChild(meldung);
        return;
    }

    // Gefilterte Bewohner anzeigen
    let aktiveBewohnerkarteWiederhergestellt = false;
    
    gefilterteBewohner.forEach(bewohner => {
        // Normalisierte ID für Vergleiche erstellen
        const bewohnerId = `${bewohner.firstName}_${bewohner.lastName}`.trim().toLowerCase().replace(/\s+/g, '_');
        
        const bewohnerCard = document.createElement('div');
        bewohnerCard.classList.add('bewohner-card');
        bewohnerCard.dataset.id = bewohnerId;
        
        // Bewohnername als eigenes Element mit separaten Spans für Vor- und Nachnamen
        const nameElement = document.createElement('div');
        nameElement.classList.add('bewohner-name');

        // Vorname in eigenem Span für bessere Kontrolle in der mobilen Ansicht
        const vornameSpan = document.createElement('span');
        vornameSpan.classList.add('vorname');
        vornameSpan.textContent = bewohner.firstName;
        nameElement.appendChild(vornameSpan);

        // Leerzeichen zwischen Vor- und Nachname
        nameElement.appendChild(document.createTextNode(' '));

        // Nachname in eigenem Span
        const nachnameSpan = document.createElement('span');
        nachnameSpan.classList.add('nachname');
        nachnameSpan.textContent = bewohner.lastName;
        nameElement.appendChild(nachnameSpan);

        bewohnerCard.appendChild(nameElement);
        
        // Personenbild hinzufügen
        const personenBild = document.createElement('img');
        personenBild.classList.add('bewohner-card-img');
        personenBild.src = 'img/person.png';
        personenBild.alt = `${bewohner.firstName} ${bewohner.lastName}`;
        bewohnerCard.appendChild(personenBild);
        
        // Platz für Bewohner-Info
        const infoElement = document.createElement('div');
        infoElement.classList.add('bewohner-info');
        infoElement.style.display = 'none'; // Standardmäßig versteckt
        bewohnerCard.appendChild(infoElement);
        
        // Details-Button hinzufügen
        const detailsButton = document.createElement('button');
        detailsButton.classList.add('details-button');

        // Text in einem Span, damit er in der mobilen Ansicht ausgeblendet werden kann
        const buttonText = document.createElement('span');
        buttonText.textContent = 'Details';
        detailsButton.appendChild(buttonText);

        bewohnerCard.appendChild(detailsButton);

        // Event-Listener für Klicks auf die Bewohnerkarte (ohne Button)
        nameElement.addEventListener('click', () => {
            // Alle Karten zurücksetzen
            document.querySelectorAll('.bewohner-card').forEach(card => {
                card.classList.remove('active');
                const info = card.querySelector('.bewohner-info');
                if (info) info.style.display = 'none';
            });
            
            // Diese Karte als aktiv markieren
            bewohnerCard.classList.add('active');
            
            // Globale Variable aktualisieren
            globalAktiverBewohnerId = bewohnerCard.dataset.id;
            console.log(`Neuer aktiver Bewohner gesetzt: ${globalAktiverBewohnerId}`);
            
            // Info-Element immer ausgeblendet lassen
            const info = bewohnerCard.querySelector('.bewohner-info');
            if (info) info.style.display = 'none';
            
            // Benutzerdefiniertes Event auslösen
            console.log('Bewohner ausgewählt für andere Funktion:', bewohner);
            const event = new CustomEvent('bewohnerCardClicked', {
                detail: { 
                    bewohner,
                    cardElement: bewohnerCard
                }
            });
            document.dispatchEvent(event);
        });

        // Zusätzlicher Event-Listener für die gesamte Karte (nicht nur den Namen)
        bewohnerCard.addEventListener('click', (e) => {
            // Verhindern, dass der Klick auf Buttons behandelt wird
            if (e.target.closest('button')) return;
            
            // Simuliere einen Klick auf das Namenselement, um den gleichen Code zu verwenden
            nameElement.click();
        });

        // Event-Listener für Klicks auf den Details-Button
        detailsButton.addEventListener('click', (e) => {
            // Verhindern, dass das Ereignis zur Karte weitergeleitet wird
            e.stopPropagation();
            
            // Detailansicht anzeigen
            console.log('Details anzeigen für:', bewohner);
            // Benutzerdefiniertes Event auslösen für Detailansicht
            const event = new CustomEvent('bewohnerSelected', {
                detail: { bewohner }
            });
            document.dispatchEvent(event);
        });

        // Prüfen, ob diese Karte die aktive war und Zustand wiederherstellen
        // Vergleiche case-insensitive und normalisiere IDs für bessere Übereinstimmung
        if (aktiverBewohnerId) {
            const normalisierterId = aktiverBewohnerId.toLowerCase().trim();
            
            // Vergleiche mit verschiedenen Varianten des Bewohner-IDs
            if (
                bewohnerId === normalisierterId ||
                bewohnerId.replace(/_/g, ' ') === normalisierterId.replace(/_/g, ' ') ||
                bewohnerId.replace(/\s+/g, '') === normalisierterId.replace(/\s+/g, '') ||
                bewohnerId.replace(/_/g, '') === normalisierterId.replace(/_/g, '')
            ) {
                console.log(`Aktive Bewohnerkarte wiederhergestellt: ${bewohner.firstName} ${bewohner.lastName}`);
                aktiveBewohnerkarteWiederhergestellt = true;
                
                // Karte als aktiv markieren mit expliziten Stilen
                bewohnerCard.classList.add('active');
                bewohnerCard.style.backgroundColor = '#e3f2fd';
                bewohnerCard.style.borderColor = '#2196F3';
                bewohnerCard.style.borderWidth = '2px';
                bewohnerCard.style.borderStyle = 'solid';
                bewohnerCard.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.3)';
                
                // Info-Anzeige wiederherstellen, falls vorhanden
                if (aktiveInfoAnzeige) {
                    infoElement.innerHTML = aktiveInfoAnzeige;
                    infoElement.style.display = 'none';
                    console.log('Info-Anzeige wiederhergestellt (aber nicht angezeigt)');
                } else {
                    // Mindestens leere Info-Anzeige zeigen
                    infoElement.innerHTML = `<span>Essens für: <strong>${bewohner.firstName} ${bewohner.lastName}</strong></span>`;
                    infoElement.style.display = 'none';
                }
            }
        }

        bewohnerContainer.appendChild(bewohnerCard);
    });
    
    // Feedback über Wiederherstellung
    if (aktiverBewohnerId && !aktiveBewohnerkarteWiederhergestellt) {
        console.log(`Warnung: Der aktive Bewohner (${aktiverBewohnerId}) ist nicht in der aktuellen Kategorie "${aktuelleKategorie}" enthalten`);
    }

    // Event auslösen, um Breitenkorrektur zu veranlassen
    document.dispatchEvent(new CustomEvent('bewohnerListUpdated'));
}

/**
 * Aktualisiert die Anzeige nach einer Kalenderwochenänderung
 * @param {CustomEvent} event - Das Kalenderwochenänderungsereignis
 */
function aktualisiereNachKalenderwocheAenderung(event) {
    // Die Kalenderwoche hat sich geändert, daher muss ggf. die neue Liste angefordert werden
    // Hier können Sie auch andere Aktualisierungen vornehmen, die durch eine Kalenderwochenänderung erforderlich sind
    
    // Wenn ein aktiver Bewohner ausgewählt ist, dessen Karte wieder als aktiv markieren
    const aktiveBewohnerCard = document.querySelector('.bewohner-card.active');
    if (aktiveBewohnerCard) {
        const aktiverBewohnerId = aktiveBewohnerCard.dataset.id;
        console.log(`Aktiver Bewohner beim Kalenderwochenwechsel: ${aktiverBewohnerId}`);
        
        // Zustand der Info-Anzeige wird vom Event-Handler in script.js verwaltet
        // Wir stellen nur sicher, dass die Karte als aktiv markiert bleibt
    }
}

/**
 * Setzt die ID des global aktiven Bewohners
 * @param {string} bewohnerId - Die ID des aktiven Bewohners
 */
function setzeGlobalAktivenBewohner(bewohnerId) {
    console.log(`Setze global aktiven Bewohner auf: ${bewohnerId}`);
    globalAktiverBewohnerId = bewohnerId;
}

/**
 * Initialisiert das Bewohner-Modul und lädt die Daten
 */
async function initialisiere() {
    console.log('Initialisiere Bewohner-Modul');
    
    try {
        // Zuerst die Filter-Konfiguration laden
        filterConfig = await ladeFilterKonfiguration();
        console.log('Filter-Konfiguration geladen:', filterConfig);
        
        // Dann die Bewohnerdaten laden
        alleBewohner = await ladeBewohner();
        console.log(`${alleBewohner.length} Bewohner geladen`);
        
        // Standard-Kategorie setzen (Fallback)
        if (!aktuelleKategorie) {
            aktuelleKategorie = 'Saal';
        }
        
        // Filter-Buttons erstellen mit der Konfiguration
        erstelleFilterButtons(filterConfig);
        
        // Bewohner anzeigen
        zeigeGefilterteBewohner();
        
        // Event-Listener für Kalenderwochenänderung
        document.addEventListener('kalenderwocheChanged', aktualisiereNachKalenderwocheAenderung);
        
        console.log('Bewohner-Modul vollständig initialisiert');
    } catch (error) {
        console.error('Fehler bei der Initialisierung des Bewohner-Moduls:', error);
    }
}

// Modulexport
export {
    initialisiere,
    setzeGlobalAktivenBewohner,
    wechsleKategorie
};
