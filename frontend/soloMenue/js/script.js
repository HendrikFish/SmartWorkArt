/**
 * Hauptskript für die SoloMenü-Anwendung
 * Initialisiert und verbindet alle Module
 */

// Module importieren
import * as Kalenderwoche from './module/kalenderwoche.js';
import * as BewohnerDate from './module/bewohnerDate.js';
import * as BearbeitungsPanel from './module/bearbeitungsPanel.js';
import * as BewohnerButton from './module/bewohnerButton.js';
import * as FunktionenTabelle from './module/funktionenTabelle.js';
import * as TabeleAdd from './module/tabeleAdd.js';
import * as BewohnerAuswahl from './module/bewohnerAuswahl.js';
import * as KomponentenEditor from './module/komponententEditor.js';
import * as BewohnerUpdate from './module/bewohnerUpdate.js';

// Aktuell ausgewählter Bewohner für die Menüplanung
let aktuellerBewohner = null;
let aktuelleMenueplanTabelle = null;

// Globale Zugänglichkeit für andere Module
window.aktuellerBewohner = null;

// Module global verfügbar machen für Modulkommunikation
window.BewohnerDate = BewohnerDate;
window.TabeleAdd = TabeleAdd;
window.KomponentenEditor = KomponentenEditor;

// Globales Datenobjekt für den KomponentenEditor erstellen
window.KomponentenEditorData = {
    extraMenues: [],
    extraWuensche: []
};

// Initialisiert den "Nach oben"-Button für die mobile Ansicht
function initialisiereNachObenButton() {
    const nachObenButton = document.getElementById('nach-oben-button');
    const bewohnerContainer = document.getElementById('bewohner-container');
    const kalenderContainer = document.getElementById('kalenderwochen-container');
    
    // Button nur anzeigen, wenn wir unter den Bewohner-Container scrollen
    window.addEventListener('scroll', () => {
        // Prüfen, ob wir auf einem mobilen Gerät oder Tablet sind
        const isTabletOrMobile = window.innerWidth <= 1000 || 
                               /iPad|iPhone|iPod|Android|webOS|IEMobile/i.test(navigator.userAgent);
                               
        if (isTabletOrMobile) {
            // Position des Bewohner-Containers
            const bewohnerPosition = bewohnerContainer.getBoundingClientRect().bottom;
            
            // Button anzeigen, wenn wir unter den Bewohner-Container gescrollt haben
            if (bewohnerPosition < 0) {
                nachObenButton.style.display = 'flex';
            } else {
                nachObenButton.style.display = 'none';
            }
        } else {
            // Auf Desktop-Geräten immer ausblenden
            nachObenButton.style.display = 'none';
        }
    });
    
    // Bei Klick zum Kalender- und Bewohner-Container scrollen
    nachObenButton.addEventListener('click', () => {
        // Schneller Bildlaufeffekt nach oben
        scrollMitEffekt(kalenderContainer.offsetTop, 500);
    });
    
    // Initial ausblenden
    nachObenButton.style.display = 'none';
}

/**
 * Scrollt mit einem schnellen Bildlaufeffekt zur angegebenen Position
 * @param {number} zielPosition - Die Zielposition in Pixel vom Seitenanfang
 * @param {number} dauer - Die Dauer der Animation in Millisekunden
 */
function scrollMitEffekt(zielPosition, dauer) {
    const startPosition = window.pageYOffset;
    const distanz = zielPosition - startPosition;
    let startZeit = null;
    
    // Animation mit kubischer Beschleunigung für einen dynamischen Effekt
    function animation(aktuelleZeit) {
        if (startZeit === null) startZeit = aktuelleZeit;
        const vergangeneZeit = aktuelleZeit - startZeit;
        const fortschritt = Math.min(vergangeneZeit / dauer, 1);
        
        // Kubische Easing-Funktion für schnellen Start und sanftes Ende
        const easing = fortschritt < 0.5 ? 
            4 * fortschritt * fortschritt * fortschritt : 
            1 - Math.pow(-2 * fortschritt + 2, 3) / 2;
        
        window.scrollTo(0, startPosition + distanz * easing);
        
        if (fortschritt < 1) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// Warten, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initialisiere SoloMenü-Anwendung...');

        // Spezielles Debugging für Kalenderwochenänderungen
        console.log("Debug: Füge direkten Event-Listener für Button-Klicks hinzu");
        const nextWeekBtn = document.getElementById('next-week-btn');
        const prevWeekBtn = document.getElementById('prev-week-btn');
        
        if (nextWeekBtn) {
            nextWeekBtn.addEventListener('click', () => {
                console.log("[DEBUG] Direkt-Event: Next-Week-Button wurde geklickt");
            });
        }
        
        if (prevWeekBtn) {
            prevWeekBtn.addEventListener('click', () => {
                console.log("[DEBUG] Direkt-Event: Prev-Week-Button wurde geklickt");
            });
        }
        
        // Event-Listener für kalenderwocheChanged-Event
        document.addEventListener('kalenderwocheChanged', (debugEvent) => {
            console.log('[DEBUG] kalenderwocheChanged-Event empfangen:', 
                        `KW${debugEvent.detail.kw}/${debugEvent.detail.jahr}`,
                        'Aktueller Bewohner:', aktuellerBewohner ? 
                        `${aktuellerBewohner.firstName} ${aktuellerBewohner.lastName}` : 'Keiner');
        });

        // Kalenderwochen-Funktionalität initialisieren
        Kalenderwoche.initialisiere();
        console.log('Kalenderwoche-Modul initialisiert');

        // Bewohnerdaten initialisieren
        await BewohnerDate.initialisiere();
        console.log('BewohnerDate-Modul initialisiert');

        // Bearbeitungspanel initialisieren (falls vorhanden)
        if (typeof BearbeitungsPanel.initialisiere === 'function') {
            BearbeitungsPanel.initialisiere();
            console.log('BearbeitungsPanel-Modul initialisiert');
        }

        // BewohnerButton-Modul initialisieren (für einheitliche Kartenbreite)
        if (typeof BewohnerButton.initialisiere === 'function') {
            BewohnerButton.initialisiere();
            console.log('BewohnerButton-Modul initialisiert');
        }

        // FunktionenTabelle-Modul initialisieren (für Menüplan-Tabelle)
        if (typeof FunktionenTabelle.initialisiere === 'function') {
            FunktionenTabelle.initialisiere();
            console.log('FunktionenTabelle-Modul initialisiert');
        }
        
        // TabeleAdd-Modul initialisieren (für Hinzufügen von Kategorien)
        if (typeof TabeleAdd.initialisiere === 'function') {
            await TabeleAdd.initialisiere();
            console.log('TabeleAdd-Modul initialisiert');
        }
        
        // BewohnerAuswahl-Modul initialisieren (für Essensauswahl)
        BewohnerAuswahl.initialisiere();
        console.log('BewohnerAuswahl-Modul initialisiert');

        // KomponentenEditor-Modul initialisieren (für Komponenten-Editor)
        KomponentenEditor.initialisiere();
        console.log('KomponentenEditor-Modul initialisiert');

        // BewohnerUpdate-Modul initialisieren (für btn-success Button)
        BewohnerUpdate.initialisiere();
        console.log('BewohnerUpdate-Modul initialisiert');

        // Nach oben Button für mobile Ansicht initialisieren
        initialisiereNachObenButton();
        console.log('Nach oben Button initialisiert');

        console.log('SoloMenü-Anwendung erfolgreich initialisiert');
    } catch (error) {
        console.error('Fehler bei der Initialisierung der Anwendung:', error);
    }
});

// Event-Listener für globale Ereignisse
document.addEventListener('bewohnerSelected', (event) => {
    console.log('Bewohner ausgewählt für Details:', event.detail.bewohner);
    // Detailansicht öffnen (Bearbeitungspanel anzeigen)
    if (typeof BearbeitungsPanel.zeigeBewohner === 'function') {
        BearbeitungsPanel.zeigeBewohner(event.detail.bewohner);
    }
});

/**
 * Zeigt oder aktualisiert den aktiven Bewohner Indikator über der Tabelle
 * @param {Object} bewohner - Das Bewohnerobjekt
 * @param {boolean} isExisting - Flag, ob eine bestehende Auswahl geladen wurde
 */
function zeigeAktivenBewohnerIndikator(bewohner, isExisting) {
    if (!bewohner) return;
    
    // Container für die Menüplantabelle finden oder erstellen
    let container = document.querySelector('.menueplan-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'menueplan-container';
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.appendChild(container);
        }
    }
    
    // Bestehenden Indikator entfernen, falls vorhanden
    const vorhandenerIndikator = document.querySelector('.aktiver-bewohner-indikator');
    if (vorhandenerIndikator) {
        vorhandenerIndikator.remove();
    }
    
    // Neuen Indikator erstellen
    const indikator = document.createElement('div');
    indikator.className = 'aktiver-bewohner-indikator';
    
    // Station/Bereich des Bewohners ermitteln
    const station = bewohner.areas && bewohner.areas['Wo wird das Essen eingetragen!'] 
        ? bewohner.areas['Wo wird das Essen eingetragen!'] 
        : 'Unbekannt';
    
    // Status des Plans
    const statusText = isExisting ? 'Plan' : 'Neue Auswahl erstellt';
    
    // Inhalt des Indikators
    indikator.innerHTML = `
        <div>
            <span class="name">Aktiver Bewohner: <strong>${bewohner.firstName} ${bewohner.lastName}</strong></span>
            <span class="station">${station}</span>
            <span class="status">(${statusText})</span>
        </div>
        <div class="action-buttons">
            <button class="action-button" id="reset-bewohner-button">Auswahl aufheben</button>
            <button class="action-button danger" id="clear-plan-button">Plan leeren</button>
        </div>
    `;
    
    // Indikator vor der Tabelle einfügen
    container.insertBefore(indikator, container.firstChild);
    
    // Event-Listener für den Reset-Button
    document.getElementById('reset-bewohner-button').addEventListener('click', () => {
        // Bewohner zurücksetzen
        aktuellerBewohner = null;
        
        // BewohnerAuswahl zurücksetzen
        BewohnerAuswahl.resetAuswahl();
        
        // Aktive Bewohnerkarte deaktivieren
        const aktiveBewohnerCard = document.querySelector('.bewohner-card.active');
        if (aktiveBewohnerCard) {
            aktiveBewohnerCard.classList.remove('active');
            const infoElement = aktiveBewohnerCard.querySelector('.bewohner-info');
            if (infoElement) {
                infoElement.style.display = 'none';
            }
        }
        
        // Tabelle zurücksetzen - alle Zellen demarkieren
        if (aktuelleMenueplanTabelle) {
            const alleZellen = aktuelleMenueplanTabelle.querySelectorAll('td[data-tag]');
            alleZellen.forEach(zelle => {
                zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25');
                zelle.style.backgroundColor = '';
                zelle.style.color = '';
                zelle.style.border = '';
            });
        }
        
        // Indikator entfernen
        indikator.remove();
    });
    
    // Event-Listener für den "Plan leeren"-Button
    document.getElementById('clear-plan-button').addEventListener('click', async () => {
        // Sicherheitsabfrage, ob der Benutzer wirklich löschen möchte
        if (!confirm(`Möchten Sie wirklich den gesamten Plan für ${bewohner.firstName} ${bewohner.lastName} in der aktuellen Woche löschen?`)) {
            return;
        }
        
        try {
            // Aktuelle Kalenderwoche und Jahr ermitteln
            const kwDaten = document.querySelector('#current-week-display').textContent;
            const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
            
            if (!match) {
                throw new Error('Kalenderwoche konnte nicht ermittelt werden');
            }
            
            const kw = parseInt(match[1]);
            const jahr = parseInt(match[2]);
            const bewohnerName = `${bewohner.firstName}_${bewohner.lastName}`.trim().replace(/\s+/g, '_');
            
            // Schritt 1: Physische Datei löschen via DELETE-Anfrage
            const deleteUrl = `/api/solomenue/delete-plan/${jahr}/KW${kw}/${bewohnerName}`;
            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE'
            });
            
            if (!deleteResponse.ok) {
                console.warn(`Warnung: Die physische Datei konnte nicht gelöscht werden: ${deleteResponse.status} ${deleteResponse.statusText}`);
                // Wir fahren trotzdem fort, falls die Datei nicht existiert oder andere Gründe vorliegen
            } else {
                console.log('Physische Datei erfolgreich gelöscht');
            }
            
            // Schritt 2: Neue leere Bewohnerauswahl erstellen und speichern
            const leereAuswahl = {
                name: bewohnerName,
                Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
            };
            
            // Pfad für die Speicherung zusammenstellen
            const url = `/api/solomenue/bewohner-auswahl/${jahr}/KW${kw}/${leereAuswahl.name}`;
            
            // Daten an das Backend senden
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leereAuswahl)
            });
            
            if (!response.ok) {
                throw new Error(`Fehler beim Speichern: ${response.status} ${response.statusText}`);
            }
            
            // Lokale Auswahl zurücksetzen
            BewohnerAuswahl.resetAuswahl();
            
            // Setze den aktuellen Bewohner erneut, was automatisch den Plan neu lädt
            await BewohnerAuswahl.setzeAktuellenBewohner(bewohner);
            
            // Tabelle aktualisieren
            if (aktuelleMenueplanTabelle) {
                console.log('Aktualisiere Tabelle nach dem Leeren des Plans');
                BewohnerAuswahl.aktualisiereTabelle(aktuelleMenueplanTabelle);
            }
            
            // Erfolgsmeldung
            alert(`Der Plan für ${bewohner.firstName} ${bewohner.lastName} wurde erfolgreich geleert.`);
            
        } catch (error) {
            console.error('Fehler beim Leeren des Plans:', error);
            alert(`Fehler beim Leeren des Plans: ${error.message}`);
        }
    });
}

// Funktion global verfügbar machen
window.zeigeAktivenBewohnerIndikator = zeigeAktivenBewohnerIndikator;

// Neuer Event-Listener für Klicks auf die Bewohnerkarte (ohne Button)
document.addEventListener('bewohnerCardClicked', async (event) => {
    try {
        const bewohner = event.detail.bewohner;
        const bewohnerCard = event.detail.cardElement;
        console.log('Bewohner ausgewählt für Essensauswahl:', bewohner);
        
        // Bewohner-ID für globalen Zugriff speichern (falls bewohnerDate.js diese Information benötigt)
        if (window.BewohnerDate && typeof BewohnerDate.setzeGlobalAktivenBewohner === 'function') {
            const bewohnerId = `${bewohner.firstName}_${bewohner.lastName}`.trim().toLowerCase().replace(/\s+/g, '_');
            BewohnerDate.setzeGlobalAktivenBewohner(bewohnerId);
        }
        
        // Alle Karten deaktivieren
        const alleKarten = document.querySelectorAll('.bewohner-card');
        alleKarten.forEach(karte => {
            karte.classList.remove('active');
            karte.style.backgroundColor = '';
            karte.style.borderColor = '';
            karte.style.borderWidth = '';
            karte.style.borderStyle = '';
            karte.style.boxShadow = '';
            
            // Info-Element ausblenden
            const info = karte.querySelector('.bewohner-info');
            if (info) info.style.display = 'none';
        });
        
        // Diese Karte deutlich als aktiv markieren
        bewohnerCard.classList.add('active');
        bewohnerCard.style.backgroundColor = '#e3f2fd';
        bewohnerCard.style.borderColor = '#2196F3';
        bewohnerCard.style.borderWidth = '2px';
        bewohnerCard.style.borderStyle = 'solid';
        bewohnerCard.style.boxShadow = '0 4px 8px rgba(33, 150, 243, 0.3)';
        
        // Vor der Verarbeitung prüfen, ob es ein Bewohnerwechsel ist
        const istBewohnerWechsel = aktuellerBewohner && 
            (aktuellerBewohner.firstName !== bewohner.firstName || 
             aktuellerBewohner.lastName !== bewohner.lastName);
        
        if (istBewohnerWechsel) {
            console.log(`Bewohnerwechsel: von ${aktuellerBewohner.firstName} ${aktuellerBewohner.lastName} zu ${bewohner.firstName} ${bewohner.lastName}`);
        }
        
        // Aktuellen Bewohner speichern
        aktuellerBewohner = bewohner;
        window.aktuellerBewohner = bewohner; // Für globale Verfügbarkeit
        
        // Aktuellen Bewohner auch im BewohnerAuswahl-Modul speichern und Auswahl laden
        console.log(`Lade Bewohnerauswahl für ${bewohner.firstName} ${bewohner.lastName}`);
        let result;
        
        try {
            // Das setzeAktuellenBewohner im Modul lädt automatisch die Auswahl
            result = await BewohnerAuswahl.setzeAktuellenBewohner(bewohner);
            
            // Wenn keine Auswahl zurückgegeben wurde, manuell laden (Fallback)
            if (!result || !result.auswahl) {
                result = await BewohnerAuswahl.ladeBewohnerAuswahl(bewohner);
            }
        } catch (loadError) {
            console.error('Fehler beim Laden der Bewohnerauswahl:', loadError);
            
            // Trotz Fehler mit einer lokalen Auswahl weitermachen
            const localAuswahl = {
                name: `${bewohner.firstName}_${bewohner.lastName}`.trim().replace(/\s+/g, '_'),
                Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
            };
            
            alert(`Es gab einen Fehler beim Laden der Bewohnerauswahl. Bitte prüfen Sie die Konsole für weitere Details. Wir arbeiten mit einer lokalen Version weiter, die möglicherweise nicht gespeichert werden kann.`);
            
            result = { auswahl: localAuswahl, isExisting: false };
        }
        
        // Extrahiere Ergebnis
        const auswahl = result.auswahl;
        const isExisting = result.isExisting;
        
        // Menüplantabelle erstellen oder aktualisieren
        if (!aktuelleMenueplanTabelle) {
            console.log('Keine Menüplantabelle vorhanden, erstelle neue Tabelle');
            // Wenn noch keine Tabelle existiert, eine neue erstellen
            try {
                aktuelleMenueplanTabelle = await FunktionenTabelle.erstelleMenueplanTabelle();
            } catch (tableError) {
                console.error('Fehler beim Erstellen der Menüplantabelle:', tableError);
                alert(`Fehler beim Erstellen der Menüplantabelle: ${tableError.message}`);
                return;
            }
            
            // Tabelle in den Container einfügen
            const container = document.querySelector('.menueplan-container') || document.createElement('div');
            container.className = 'menueplan-container';
            
            if (container) {
                container.innerHTML = '';
                container.appendChild(aktuelleMenueplanTabelle);
                
                // Container zur Hauptseite hinzufügen, falls noch nicht vorhanden
                if (!document.querySelector('.menueplan-container')) {
                    const mainElement = document.querySelector('main');
                    if (mainElement) {
                        mainElement.appendChild(container);
                    }
                }
            }
        } else if (istBewohnerWechsel) {
            // Bei Bewohnerwechsel alle Zellen zurücksetzen, um alte Markierungen zu entfernen
            const alleZellen = aktuelleMenueplanTabelle.querySelectorAll('td[data-tag]');
            alleZellen.forEach(zelle => {
                zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25');
                zelle.style.backgroundColor = '';
                zelle.style.color = '';
                zelle.style.border = '';
            });
        }
        
        // Tabelle mit den Auswahlen des Bewohners aktualisieren
        console.log('Aktualisiere Tabelle mit Bewohnerauswahl');
        try {
            BewohnerAuswahl.aktualisiereTabelle(aktuelleMenueplanTabelle);
        } catch (updateError) {
            console.error('Fehler beim Aktualisieren der Tabelle:', updateError);
        }
        
        // Permanenten Indikator für aktiven Bewohner anzeigen
        zeigeAktivenBewohnerIndikator(bewohner, isExisting);
        
        // Info innerhalb der Bewohnerkarte anzeigen
        const infoElement = bewohnerCard.querySelector('.bewohner-info');
        if (infoElement) {
            // Anzeigen, ob eine bestehende Auswahl geladen wurde oder eine neue erstellt wurde
            if (isExisting) {
                infoElement.innerHTML = `<span>Essen für: <strong>${bewohner.firstName} ${bewohner.lastName}</strong></span>
                               <span class="auswahl-status">(Plan)</span>`;
            } else {
                infoElement.innerHTML = `<span>Esse für: <strong>${bewohner.firstName} ${bewohner.lastName}</strong></span>
                               <span class="auswahl-status">(Neue Auswahl erstellt)</span>`;
            }
            
            // Info anzeigen
            infoElement.style.display = 'flex';
        }
    } catch (error) {
        console.error('Allgemeiner Fehler bei der Bewohnerauswahl:', error);
        alert(`Ein unerwarteter Fehler ist aufgetreten: ${error.message}`);
    }
});

// Event-Listener für die Aktualisierung der Menüplantabelle
document.addEventListener('menuplanTabelleErstellt', (event) => {
    const { tabelle, kw, jahr } = event.detail;
    
    // Tabelle speichern
    aktuelleMenueplanTabelle = tabelle;
    
    // Wenn ein Bewohner ausgewählt ist, die Tabelle mit dessen Auswahl aktualisieren
    if (aktuellerBewohner) {
        BewohnerAuswahl.aktualisiereTabelle(tabelle);
    }
});

// Event-Delegation für die Komponenten-Bearbeiten-Buttons
document.getElementById('menueplan-container').addEventListener('click', function(event) {
    // Prüfen, ob ein Bearbeiten-Button oder dessen Kind angeklickt wurde
    let target = event.target;
    
    // Nach oben durch die DOM-Hierarchie navigieren, bis wir den Button finden
    while (target !== this && !target.classList.contains('komponenten-bearbeiten-btn')) {
        target = target.parentNode;
        if (!target) return; // Wenn wir aus dem DOM herausfallen
    }
    
    // Wenn ein Button gefunden wurde
    if (target.classList.contains('komponenten-bearbeiten-btn')) {
        event.stopPropagation();
        const tag = target.getAttribute('data-tag');
        const kategorie = target.getAttribute('data-kategorie');
        
        // Finde die zugehörige Zelle
        const zellenId = target.getAttribute('data-zellen-id') || `zelle-${tag}-${kategorie}`;
        const zelle = document.getElementById(zellenId) || target.closest('td[data-tag]');
        
        // Die Bearbeitungsfunktion aufrufen (mit korrektem Namen und Parametern)
        if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
            window.KomponentenEditor.oeffneKomponentenEditor(zelle, tag, kategorie);
        } else {
            console.error('KomponentenEditor.oeffneKomponentenEditor ist nicht verfügbar');
        }
    }
});
