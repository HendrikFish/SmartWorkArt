/**
 * Hauptskript für die SoloMenü-Anwendung
 * Initialisiert und verbindet alle Module
 */

// Module importieren
import * as FunktionenTabelle from './module/funktionenTabelle.js';
import * as BewohnerDate from './module/bewohnerDate.js';
import * as BearbeitungsPanel from './module/bearbeitungsPanel.js';
import * as BewohnerButton from './module/bewohnerButton.js';
import * as TabeleAdd from './module/tabeleAdd.js';
import * as BewohnerAuswahl from './module/bewohnerAuswahl.js';
import * as KomponentenEditor from './module/komponententEditor.js';
import * as Kalenderwoche from './module/kalenderwoche.js';

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

// Initialisierung, wenn DOMContent geladen ist
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded - Initialisierung der Anwendung');
    
    // Module initialisieren
    try {
        await BewohnerDate.initialisiere();
        BewohnerAuswahl.initialisiere();
        if (typeof BearbeitungsPanel.initialisiere === 'function') {
            BearbeitungsPanel.initialisiere();
        }
        BewohnerButton.initialisiere();
        
        // UI-Komponenten initialisieren
        initBurgerMenu();
        initSeitenwahl();
        initScrollToTop();
        
        // Bewohnerbereich und Bewohnerkarten initialisieren
        initialisiereBewohnerBereich();
        
        // Kalenderwochensteuerung initialisieren
        if (typeof Kalenderwoche.initialisiere === 'function') {
            Kalenderwoche.initialisiere();
        }
        
        // Initialisierung der Menüplantabelle nach der Kalenderwoche
        console.log('Initialisiere FunktionenTabelle-Modul');
        FunktionenTabelle.initialisiere();
        
        // Initialisierung abgeschlossen 
        console.log('Initialisierung abgeschlossen');
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
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

/**
 * Initialisiert den Bewohnerbereich und fügt Event-Listener hinzu
 */
function initialisiereBewohnerBereich() {
    console.log('Initialisiere Bewohnerbereich');
    
    // Event-Listener für Bewohner-Karten hinzufügen
    document.addEventListener('bewohnerCardClicked', async (event) => {
        const { bewohner } = event.detail;
        console.log(`Bewohner angeklickt: ${bewohner.firstName} ${bewohner.lastName}`);
        
        // Aktiven Bewohner in BewohnerAuswahl-Modul setzen und Auswahl laden
        try {
            const result = await BewohnerAuswahl.setzeAktuellenBewohner(bewohner);
            
            // Aktiven Bewohner Indikator anzeigen
            zeigeAktivenBewohnerIndikator(bewohner, result.isExisting);
            
            // Bewohnerkarte visuell als aktiv markieren
            BewohnerAuswahl.markiereBewohnerKarteAlsAktiv(bewohner);
        } catch (error) {
            console.error('Fehler beim Setzen des Bewohners:', error);
        }
    });
}

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

/**
 * Initialisiert das Burger-Menü für mobile Ansichten
 */
function initBurgerMenu() {
    const burgerButton = document.querySelector('.burger-menu-button');
    const navigation = document.querySelector('nav');
    
    if (burgerButton && navigation) {
        burgerButton.addEventListener('click', () => {
            navigation.classList.toggle('active');
            burgerButton.classList.toggle('active');
        });
        
        // Klick außerhalb schließt das Menü
        document.addEventListener('click', (event) => {
            if (!navigation.contains(event.target) && !burgerButton.contains(event.target) && navigation.classList.contains('active')) {
                navigation.classList.remove('active');
                burgerButton.classList.remove('active');
            }
        });
    }
}

/**
 * Initialisiert die Seitenwahl-Navigation
 */
function initSeitenwahl() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            // Aktiven Link markieren
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Bei mobiler Ansicht das Menü nach Klick schließen
            const navigation = document.querySelector('nav');
            const burgerButton = document.querySelector('.burger-menu-button');
            
            if (window.innerWidth <= 768 && navigation && burgerButton) {
                navigation.classList.remove('active');
                burgerButton.classList.remove('active');
            }
        });
    });
    
    // Aktuellen Link basierend auf URL markieren
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}

/**
 * Initialisiert den "Zum Seitenanfang" Button
 */
function initScrollToTop() {
    // Button erstellen, falls nicht vorhanden
    let scrollButton = document.querySelector('.scroll-to-top');
    
    if (!scrollButton) {
        scrollButton = document.createElement('button');
        scrollButton.className = 'scroll-to-top';
        scrollButton.innerHTML = '<i class="fa fa-arrow-up"></i>';
        scrollButton.style.display = 'none';
        document.body.appendChild(scrollButton);
    }
    
    // Scroll-Event für das Ein-/Ausblenden des Buttons
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollButton.style.display = 'block';
        } else {
            scrollButton.style.display = 'none';
        }
    });
    
    // Klick-Event zum Scrollen nach oben
    scrollButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
