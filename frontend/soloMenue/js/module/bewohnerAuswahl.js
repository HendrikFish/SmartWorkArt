/**
 * Modul für die Verwaltung der Essensauswahlen der Bewohner
 * Verantwortlich für das Laden, Speichern und Anzeigen der Essensauswahlen
 */

// Konstanten für die Portionsgrößen und ihre Farben
const PORTIONEN = {
    'none': { farbe: 'transparent', text: 'Keine Auswahl' },
    '100%': { farbe: '#4CAF50', text: 'Ganze Portion' },
    '50%': { farbe: '#FF9800', text: 'Halbe Portion' },
    '25%': { farbe: '#90CAF9', text: 'Viertel Portion' }
};

// Aktuell geladene Bewohnerauswahl
let aktuelleBewohnerAuswahl = null;
let aktuelleBewohnerName = '';
let aktuelleKW = 0;
let aktuellesJahr = 0;
let aktuellerBewohner = null;

// Neue statische Variable für den Zellstatus
// let istZelleInBearbeitung = false;
// Globalen Zugriff auf Verarbeitungsstatus ermöglichen
window.istZelleInBearbeitung = false;

// Variable für den aktuell ausgewählten Bewohner
let aktiverBewohner = null;

/**
 * Lädt die Auswahl für einen Bewohner oder erstellt eine neue, wenn keine existiert
 * @param {Object} bewohner - Der Bewohner
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 * @returns {Promise<Object>} Die Bewohnerauswahl und ein Flag, ob sie bereits existierte
 */
async function ladeBewohnerAuswahl(bewohner, kw, jahr) {
    // Aktuelle Werte für KW und Jahr speichern
    aktuelleKW = kw;
    aktuellesJahr = jahr;
    
    // Aktuellen Bewohner setzen
    aktuellerBewohner = bewohner;
    
    // Bestehende Auswahl zurücksetzen (wichtig bei Bewohnerwechsel!)
    resetAuswahl();
    
    // Bewohnername für Datei zusammenstellen
    const bewohnerName = `${bewohner.firstName}_${bewohner.lastName}`.trim().replace(/\s+/g, '_');
    aktuelleBewohnerName = bewohnerName;
    
    // In der Konsole anzeigen, für welchen Bewohner wir prüfen
    console.log(`Lade Bewohnerauswahl für ${bewohnerName} (KW${kw}/${jahr})`);
    
    try {
        // Versuchen, die vorhandene Auswahl zu laden
        const response = await fetch(`/api/solomenue/bewohner-auswahl/${jahr}/KW${kw}/${bewohnerName}`);
        
        if (response.ok) {
            // Bestehende Auswahl gefunden
            const auswahl = await response.json();
            console.log(`Bestehende Auswahl gefunden und geladen für ${bewohnerName} (KW${kw}/${jahr})`);
            
            // Sicherstellen, dass alle Tage und Kategorien vorhanden sind
            const tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
            
            // Prüfe, ob die Daten korrekt sind
            if (!auswahl.name) {
                auswahl.name = bewohnerName;
            }
            
            // Stelle sicher, dass alle Tage existieren
            tage.forEach(tag => {
                if (!auswahl[tag]) {
                    auswahl[tag] = {};
                }
                
                // Für jede Kategorie in jedem Tag prüfen
                Object.keys(auswahl[tag]).forEach(kategorie => {
                    const auswahl_item = auswahl[tag][kategorie];
                    
                    // Wenn ein Portionsmaß vorhanden ist, aber selected nicht explizit gesetzt ist, selected auf true setzen
                    if (auswahl_item && auswahl_item.portion && auswahl_item.selected === undefined) {
                        auswahl_item.selected = true;
                        console.log(`Fehlende selected-Eigenschaft für ${tag}, ${kategorie} ergänzt`);
                    }
                });
            });
            
            // Debug-Ausgabe für geladene Auswahl
            console.log('Geladene Bewohnerauswahl nach Korrektur:', JSON.stringify(auswahl, null, 2));
            
            // Bewohnerauswahl global speichern
            aktuelleBewohnerAuswahl = auswahl;
            
            return { auswahl, isExisting: true };
        } else if (response.status === 404) {
            // Keine Auswahl gefunden, neue erstellen
            console.log(`Keine bestehende Auswahl gefunden für ${bewohnerName} (KW${kw}/${jahr}), erstelle neue Auswahl`);
            
            // Neue leere Auswahl erstellen
            const neueAuswahl = {
                name: bewohnerName,
                Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
            };
            
            // Neue Auswahl global speichern
            aktuelleBewohnerAuswahl = neueAuswahl;
            
            // Neue Auswahl sofort auf dem Server speichern
            try {
                await speichereBewohnerAuswahl();
                console.log(`Neue leere Auswahl für ${bewohnerName} (KW${kw}/${jahr}) wurde gespeichert`);
            } catch (saveError) {
                console.warn(`Konnte neue Auswahl nicht sofort speichern: ${saveError.message}`);
                // Weitermachen, auch wenn das Speichern fehlschlägt
            }
            
            return { auswahl: neueAuswahl, isExisting: false };
        } else {
            // Ein anderer Fehler ist aufgetreten
            throw new Error(`Fehler beim Laden der Bewohnerauswahl: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bewohnerauswahl:', error);
        
        // Im Fehlerfall eine leere Auswahl erstellen
        const neueAuswahl = {
            name: bewohnerName,
            Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
        };
        
        // Leere Auswahl global speichern
        aktuelleBewohnerAuswahl = neueAuswahl;
        
        return { auswahl: neueAuswahl, isExisting: false };
    }
}

/**
 * Erstellt eine neue leere Bewohnerauswahl
 * @returns {Promise<Object>} Die neu erstellte Bewohnerauswahl
 */
async function erstelleNeueBewohnerAuswahl() {
    // Grundgerüst erstellen
    const neueBewohnerAuswahl = {
        name: aktuelleBewohnerName
    };
    
    // Für jeden Wochentag leere Einträge vorbereiten
    const wochentage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    wochentage.forEach(tag => {
        neueBewohnerAuswahl[tag] = {};
    });
    
    // Global speichern
    aktuelleBewohnerAuswahl = neueBewohnerAuswahl;
    
    // Speichern auf dem Server
    try {
        await speichereBewohnerAuswahl();
        console.log('Neue Bewohnerauswahl erfolgreich gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern der neuen Bewohnerauswahl:', error);
    }
    
    return neueBewohnerAuswahl;
}

/**
 * Speichert die aktuelle Bewohnerauswahl sofort auf dem Server
 * @returns {Promise<boolean>} True bei Erfolg, False bei Fehler
 */
async function speichereBewohnerAuswahl() {
    console.log('Speichere Bewohnerauswahl...');
    
    // Prüfen, ob Daten zum Speichern vorhanden sind
    if (!aktuelleBewohnerAuswahl || !aktuelleBewohnerAuswahl.name) {
        console.warn('Keine vollständigen Daten zum Speichern vorhanden');
        
        // Trotzdem fortfahren, indem wir mit dem aktuellen Bewohner arbeiten
        if (aktuellerBewohner) {
            aktuelleBewohnerName = `${aktuellerBewohner.firstName}_${aktuellerBewohner.lastName}`.trim().replace(/\s+/g, '_');
            
            // Wenn keine aktuelle Auswahl vorhanden ist, erstellen wir eine neue
            if (!aktuelleBewohnerAuswahl) {
                aktuelleBewohnerAuswahl = {
                    name: aktuelleBewohnerName,
                    Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
                };
                console.log('Neue leere Bewohnerauswahl erstellt für', aktuelleBewohnerName);
            }
            
            // Name aktualisieren, falls noch nicht gesetzt
            if (!aktuelleBewohnerAuswahl.name) {
                aktuelleBewohnerAuswahl.name = aktuelleBewohnerName;
                console.log('Bewohnername in Auswahl aktualisiert auf', aktuelleBewohnerName);
            }
        } else {
            console.error('Kein aktueller Bewohner vorhanden, kann nicht speichern');
            return false;
        }
    }
    
    // Sicherstellen, dass aktuelleKW und aktuellesJahr gesetzt sind
    if (!aktuelleKW || !aktuellesJahr) {
        try {
            const kwDaten = document.querySelector('#current-week-display').textContent;
            const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
            if (match) {
                aktuelleKW = parseInt(match[1]);
                aktuellesJahr = parseInt(match[2]);
                console.log(`Kalenderwoche und Jahr aus der Anzeige geladen: KW${aktuelleKW}/${aktuellesJahr}`);
            } else {
                throw new Error('Konnte KW/Jahr nicht aus der Anzeige lesen');
            }
        } catch (error) {
            console.error('Fehler beim Ermitteln der aktuellen Kalenderwoche:', error);
            return false;
        }
    }
    
    // Speicherpfad zusammenstellen
    const url = `/api/solomenue/bewohner-auswahl/${aktuellesJahr}/KW${aktuelleKW}/${aktuelleBewohnerAuswahl.name}`;
    console.log(`Speichere unter: ${url}`);
    
    try {
        // Daten an das Backend senden
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(aktuelleBewohnerAuswahl)
        });
        
        if (response.ok) {
            console.log(`Bewohnerauswahl erfolgreich gespeichert für ${aktuelleBewohnerAuswahl.name} (KW${aktuelleKW}/${aktuellesJahr})`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`Fehler beim Speichern (${response.status}): ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error('Netzwerk- oder Serverfehler beim Speichern der Bewohnerauswahl:', error);
        return false;
    }
}

/**
 * Aktualisiert die Menüauswahl für einen Tag und eine Kategorie
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "suppe" oder "extra_kaltePlatte")
 * @param {string} portion - Die Portionsgröße ("100%", "50%", "25%", "none")
 * @param {Array} mahlzeiten - Die ausgewählten Mahlzeiten für die Kategorie
 * @returns {boolean} True bei Erfolg, False bei Fehler
 */
async function aktualisiereMenueAuswahl(tag, kategorie, portion, mahlzeiten) {
    console.log(`Aktualisiere Menüauswahl für ${tag}, ${kategorie}, Portion: ${portion}`);
    
    // Feststellen, ob es sich um eine Extra-Kategorie handelt
    const isExtraKategorie = kategorie.startsWith('extra_');
    
    // Prüfen, ob aktuelleBewohnerAuswahl bereits initialisiert ist
    if (!aktuelleBewohnerAuswahl) {
        if (aktuellerBewohner) {
            // Neue Auswahl erstellen
            aktuelleBewohnerAuswahl = {
                name: `${aktuellerBewohner.firstName}_${aktuellerBewohner.lastName}`.trim().replace(/\s+/g, '_'),
                Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
            };
            console.log('Neue Bewohnerauswahl erstellt für', aktuelleBewohnerAuswahl.name);
        } else {
            console.error('Kein aktueller Bewohner ausgewählt, kann Auswahl nicht aktualisieren');
            return false;
        }
    }
    
    // Sicherstellen, dass die Datenstruktur vorhanden ist
    if (!aktuelleBewohnerAuswahl[tag]) {
        aktuelleBewohnerAuswahl[tag] = {};
    }
    
    // Wenn Portion "none" ist, die Kategorie vollständig aus der Auswahl entfernen
    if (portion === 'none') {
        if (aktuelleBewohnerAuswahl[tag][kategorie]) {
            console.log(`Lösche Kategorie ${kategorie} für ${tag} vollständig (inkl. aller Zusatzinformationen)`);
            
            // Vollständiges Löschen aller Daten für diese Kategorie
            delete aktuelleBewohnerAuswahl[tag][kategorie];
            
            // Zusätzlich: Entferne alle visuellen Elemente aus der Zelle
            try {
                const tabelle = document.querySelector('.menueplan-tabelle');
                if (tabelle) {
                    const zelle = findeTabellenZelle(tabelle, tag, kategorie);
                    if (zelle) {
                        // Bearbeiten-Button entfernen
                        const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
                        if (bearbeitenButton) bearbeitenButton.remove();
                        
                        // Extra-Hinweise entfernen
                        const extraHinweise = zelle.querySelector('.extra-hinweise');
                        if (extraHinweise) extraHinweise.remove();
                        
                        // Ausgeschlossene Komponenten zurücksetzen
                        const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
                        komponentenElemente.forEach(element => {
                            element.classList.remove('ausgeschlossen');
                            element.textContent = element.textContent.replace(' (ohne)', '');
                        });
                        
                        // Ausgeschlossen-Klasse entfernen
                        zelle.classList.remove('ausgeschlossen');
                    }
                }
            } catch (error) {
                console.warn('Fehler beim Bereinigen visueller Elemente:', error);
            }
        }
    } else {
        // Vorhandene Auswahl für diese Kategorie abrufen, falls vorhanden
        const vorhandeneAuswahl = aktuelleBewohnerAuswahl[tag][kategorie] || {};
        
        // Sonst Auswahl aktualisieren oder neu erstellen
        aktuelleBewohnerAuswahl[tag][kategorie] = {
            category: kategorie,
            selected: true,
            portion: portion,
            meals: mahlzeiten || [],
            // Behalte vorhandene Werte oder initialisiere neue
            notizen: vorhandeneAuswahl.notizen || '',
            ausgeschlosseneKomponenten: vorhandeneAuswahl.ausgeschlosseneKomponenten || [],
            extraMenueAuswahl: vorhandeneAuswahl.extraMenueAuswahl || [],
            // Extra-Kategorie-Flag hinzufügen, um diese bei der Anzeige speziell behandeln zu können
            isExtraKategorie: isExtraKategorie
        };
        console.log(`Kategorie ${kategorie} für ${tag} aktualisiert/erstellt mit Portion ${portion}`);
    }
    
    // Auswahl auf dem Server speichern
    try {
        // Aktualisiere aktuelleKW und aktuellesJahr, falls noch nicht gesetzt
        if (!aktuelleKW || !aktuellesJahr) {
            const kwDaten = document.querySelector('#current-week-display').textContent;
            const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
            if (match) {
                aktuelleKW = parseInt(match[1]);
                aktuellesJahr = parseInt(match[2]);
                console.log(`Kalenderwoche und Jahr aus der Anzeige geladen: KW${aktuelleKW}/${aktuellesJahr}`);
            } else {
                throw new Error('Konnte KW/Jahr nicht aus der Anzeige lesen');
            }
        }
        
        // Speichern
        await speichereBewohnerAuswahl();
        return true;
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Menüauswahl:', error);
        return false;
    }
}

/**
 * Aktualisiert die Tabelle basierend auf der aktuellen Bewohnerauswahl
 * @param {HTMLTableElement} tabelle - Die zu aktualisierende Menüplantabelle
 * @returns {boolean} True bei Erfolg, False bei Fehler
 */
function aktualisiereTabelle(tabelle) {
    if (!tabelle) {
        console.error('Keine Tabelle zum Aktualisieren übergeben');
        return false;
    }
    
    console.log('Aktualisiere Tabelle mit Bewohnerauswahl:', aktuelleBewohnerAuswahl ? aktuelleBewohnerAuswahl.name : 'Keine Auswahl');
    
    // Vorhandene mobile Ansicht holen
    const mobileContainer = document.querySelector('.mobile-menueplan-container');

    if (!aktuelleBewohnerAuswahl) {
         // Desktop-Tabelle zurücksetzen
         const alleZellen = tabelle.querySelectorAll('td.menue-zelle');
         alleZellen.forEach(zelle => {
             const bearbeitenButtons = zelle.querySelectorAll('.komponenten-bearbeiten-btn');
             bearbeitenButtons.forEach(button => button.remove());
             zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
             const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
             komponentenElemente.forEach(element => {
                 element.classList.remove('ausgeschlossen');
                 element.textContent = element.textContent.replace(' (ohne)', '');
             });
             const extraHinweise = zelle.querySelector('.extra-hinweise');
             if (extraHinweise) extraHinweise.remove();
             zelle.dataset.hasClickHandler = 'false'; // Listener-Markierung entfernen
         });
         // Mobile Ansicht auch leeren/zurücksetzen
          if (mobileContainer) {
            mobileContainer.innerHTML = ''; // Einfachste Methode, um alles zu entfernen
          }
        return false;
    }

    // Alle Portionsklassen aus allen Desktop-Zellen entfernen
    const alleZellen = tabelle.querySelectorAll('td.menue-zelle');
    alleZellen.forEach(zelle => {
        const bearbeitenButtons = zelle.querySelectorAll('.komponenten-bearbeiten-btn');
        bearbeitenButtons.forEach(button => button.remove());
        zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
        const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
        komponentenElemente.forEach(element => {
            element.classList.remove('ausgeschlossen');
            element.textContent = element.textContent.replace(' (ohne)', '');
        });
        const extraHinweise = zelle.querySelector('.extra-hinweise');
        if (extraHinweise) extraHinweise.remove();
        zelle.dataset.hasClickHandler = 'false';
    });

    // Desktop-Tabelle mit Daten füllen
    Object.entries(aktuelleBewohnerAuswahl).forEach(([tag, tagAuswahl]) => {
        if (tag === 'name') return;
        if (!tagAuswahl || Object.keys(tagAuswahl).length === 0) return;

        Object.entries(tagAuswahl).forEach(([kategorie, auswahl]) => {
            if (kategorie === 'undefined' || !kategorie) {
                console.warn(`Überspringe ungültige Kategorie '${kategorie}' für Tag ${tag}`);
                return;
            }
            if (!auswahl || !auswahl.selected) return;

            const zelle = findeTabellenZelle(tabelle, tag, kategorie);
            if (!zelle) {
                console.warn(`Zelle für Tag ${tag}, Kategorie ${kategorie} nicht gefunden`);
                return;
            }

            const portionsklasse = `auswahl-${auswahl.portion.replace('%', '')}`;
            zelle.classList.add(portionsklasse);

            const isExtraKategorie = kategorie.startsWith('extra_');

            // Logik für ausgeschlossene Komponenten (vereinfacht)
            let istAusgeschlossen = false;
            if (auswahl.ausgeschlosseneKomponenten && auswahl.ausgeschlosseneKomponenten.length > 0) {
                 if (isExtraKategorie) {
                    const zellenText = zelle.textContent.replace('✎', '').replace('(ohne)','').trim();
                    istAusgeschlossen = auswahl.ausgeschlosseneKomponenten.includes(zellenText);
                 } else {
                     istAusgeschlossen = true; // Markiere als ausgeschlossen, wenn *irgendeine* Komponente in der Liste ist
                 }
            }
            // Prüfe auch das meals array
            if (!istAusgeschlossen && auswahl.meals && Array.isArray(auswahl.meals)) {
                istAusgeschlossen = auswahl.meals.some(m => m.ohne === true);
            }

            if(istAusgeschlossen) {
                zelle.classList.add('ausgeschlossen');
                 if (isExtraKategorie) {
                    if (!zelle.textContent.includes('(ohne)')) {
                        // Button sichern und wieder anhängen
                        const btn = zelle.querySelector('.komponenten-bearbeiten-btn');
                        if(btn) btn.remove();
                        zelle.textContent = `${zelle.textContent.replace('✎', '').trim()} (ohne)`;
                        if(btn) zelle.appendChild(btn);
                    }
                 } else {
                    const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
                    komponentenElemente.forEach(element => {
                        const komponentenName = element.textContent.replace(' (ohne)', '').trim();
                        const istKomponenteAusgeschlossen = auswahl.ausgeschlosseneKomponenten?.includes(komponentenName) || auswahl.meals?.find(m => m.name === komponentenName)?.ohne === true;
                        if(istKomponenteAusgeschlossen) {
                            if (!element.textContent.includes('(ohne)')) {
/**
 * Modul für die Verwaltung der Essensauswahlen der Bewohner
 * Verantwortlich für das Laden, Speichern und Anzeigen der Essensauswahlen
 */

// Konstanten für die Portionsgrößen und ihre Farben
const PORTIONEN = {
    'none': { farbe: 'transparent', text: 'Keine Auswahl' },
    '100%': { farbe: '#4CAF50', text: 'Ganze Portion' },
    '50%': { farbe: '#FF9800', text: 'Halbe Portion' },
    '25%': { farbe: '#90CAF9', text: 'Viertel Portion' }
};

// Aktuell geladene Bewohnerauswahl
let aktuelleBewohnerAuswahl = null;
let aktuelleBewohnerName = '';
let aktuelleKW = 0;
let aktuellesJahr = 0;
let aktuellerBewohner = null;

// Neue statische Variable für den Zellstatus
// let istZelleInBearbeitung = false;
// Globalen Zugriff auf Verarbeitungsstatus ermöglichen
window.istZelleInBearbeitung = false;

// Variable für den aktuell ausgewählten Bewohner
let aktiverBewohner = null;

/**
 * Lädt die Auswahl für einen Bewohner oder erstellt eine neue, wenn keine existiert
 * @param {Object} bewohner - Der Bewohner
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 * @returns {Promise<Object>} Die Bewohnerauswahl und ein Flag, ob sie bereits existierte
 */
async function ladeBewohnerAuswahl(bewohner, kw, jahr) {
    // Aktuelle Werte für KW und Jahr speichern
    aktuelleKW = kw;
    aktuellesJahr = jahr;
    
    // Aktuellen Bewohner setzen
    aktuellerBewohner = bewohner;
    
    // Bestehende Auswahl zurücksetzen (wichtig bei Bewohnerwechsel!)
    resetAuswahl();
    
    // Bewohnername für Datei zusammenstellen
    const bewohnerName = `${bewohner.firstName}_${bewohner.lastName}`.trim().replace(/\s+/g, '_');
    aktuelleBewohnerName = bewohnerName;
    
    // In der Konsole anzeigen, für welchen Bewohner wir prüfen
    console.log(`Lade Bewohnerauswahl für ${bewohnerName} (KW${kw}/${jahr})`);
    
    try {
        // Versuchen, die vorhandene Auswahl zu laden
        const response = await fetch(`/api/solomenue/bewohner-auswahl/${jahr}/KW${kw}/${bewohnerName}`);
        
        if (response.ok) {
            // Bestehende Auswahl gefunden
            const auswahl = await response.json();
            console.log(`Bestehende Auswahl gefunden und geladen für ${bewohnerName} (KW${kw}/${jahr})`);
            
            // Sicherstellen, dass alle Tage und Kategorien vorhanden sind
            const tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
            
            // Prüfe, ob die Daten korrekt sind
            if (!auswahl.name) {
                auswahl.name = bewohnerName;
            }
            
            // Stelle sicher, dass alle Tage existieren
            tage.forEach(tag => {
                if (!auswahl[tag]) {
                    auswahl[tag] = {};
                }
                
                // Für jede Kategorie in jedem Tag prüfen
                Object.keys(auswahl[tag]).forEach(kategorie => {
                    const auswahl_item = auswahl[tag][kategorie];
                    
                    // Wenn ein Portionsmaß vorhanden ist, aber selected nicht explizit gesetzt ist, selected auf true setzen
                    if (auswahl_item && auswahl_item.portion && auswahl_item.selected === undefined) {
                        auswahl_item.selected = true;
                        console.log(`Fehlende selected-Eigenschaft für ${tag}, ${kategorie} ergänzt`);
                    }
                });
            });
            
            // Debug-Ausgabe für geladene Auswahl
            console.log('Geladene Bewohnerauswahl nach Korrektur:', JSON.stringify(auswahl, null, 2));
            
            // Bewohnerauswahl global speichern
            aktuelleBewohnerAuswahl = auswahl;
            
            return { auswahl, isExisting: true };
        } else if (response.status === 404) {
            // Keine Auswahl gefunden, neue erstellen
            console.log(`Keine bestehende Auswahl gefunden für ${bewohnerName} (KW${kw}/${jahr}), erstelle neue Auswahl`);
            
            // Neue leere Auswahl erstellen
            const neueAuswahl = {
                name: bewohnerName,
                Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
            };
            
            // Neue Auswahl global speichern
            aktuelleBewohnerAuswahl = neueAuswahl;
            
            // Neue Auswahl sofort auf dem Server speichern
            try {
                await speichereBewohnerAuswahl();
                console.log(`Neue leere Auswahl für ${bewohnerName} (KW${kw}/${jahr}) wurde gespeichert`);
            } catch (saveError) {
                console.warn(`Konnte neue Auswahl nicht sofort speichern: ${saveError.message}`);
                // Weitermachen, auch wenn das Speichern fehlschlägt
            }
            
            return { auswahl: neueAuswahl, isExisting: false };
        } else {
            // Ein anderer Fehler ist aufgetreten
            throw new Error(`Fehler beim Laden der Bewohnerauswahl: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bewohnerauswahl:', error);
        
        // Im Fehlerfall eine leere Auswahl erstellen
        const neueAuswahl = {
            name: bewohnerName,
            Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
        };
        
        // Leere Auswahl global speichern
        aktuelleBewohnerAuswahl = neueAuswahl;
        
        return { auswahl: neueAuswahl, isExisting: false };
    }
}

/**
 * Erstellt eine neue leere Bewohnerauswahl
 * @returns {Promise<Object>} Die neu erstellte Bewohnerauswahl
 */
async function erstelleNeueBewohnerAuswahl() {
    // Grundgerüst erstellen
    const neueBewohnerAuswahl = {
        name: aktuelleBewohnerName
    };
    
    // Für jeden Wochentag leere Einträge vorbereiten
    const wochentage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    wochentage.forEach(tag => {
        neueBewohnerAuswahl[tag] = {};
    });
    
    // Global speichern
    aktuelleBewohnerAuswahl = neueBewohnerAuswahl;
    
    // Speichern auf dem Server
    try {
        await speichereBewohnerAuswahl();
        console.log('Neue Bewohnerauswahl erfolgreich gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern der neuen Bewohnerauswahl:', error);
    }
    
    return neueBewohnerAuswahl;
}

/**
 * Speichert die aktuelle Bewohnerauswahl sofort auf dem Server
 * @returns {Promise<boolean>} True bei Erfolg, False bei Fehler
 */
async function speichereBewohnerAuswahl() {
    console.log('Speichere Bewohnerauswahl...');
    
    // Prüfen, ob Daten zum Speichern vorhanden sind
    if (!aktuelleBewohnerAuswahl || !aktuelleBewohnerAuswahl.name) {
        console.warn('Keine vollständigen Daten zum Speichern vorhanden');
        
        // Trotzdem fortfahren, indem wir mit dem aktuellen Bewohner arbeiten
        if (aktuellerBewohner) {
            aktuelleBewohnerName = `${aktuellerBewohner.firstName}_${aktuellerBewohner.lastName}`.trim().replace(/\s+/g, '_');
            
            // Wenn keine aktuelle Auswahl vorhanden ist, erstellen wir eine neue
            if (!aktuelleBewohnerAuswahl) {
                aktuelleBewohnerAuswahl = {
                    name: aktuelleBewohnerName,
                    Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
                };
                console.log('Neue leere Bewohnerauswahl erstellt für', aktuelleBewohnerName);
            }
            
            // Name aktualisieren, falls noch nicht gesetzt
            if (!aktuelleBewohnerAuswahl.name) {
                aktuelleBewohnerAuswahl.name = aktuelleBewohnerName;
                console.log('Bewohnername in Auswahl aktualisiert auf', aktuelleBewohnerName);
            }
        } else {
            console.error('Kein aktueller Bewohner vorhanden, kann nicht speichern');
            return false;
        }
    }
    
    // Sicherstellen, dass aktuelleKW und aktuellesJahr gesetzt sind
    if (!aktuelleKW || !aktuellesJahr) {
        try {
            const kwDaten = document.querySelector('#current-week-display').textContent;
            const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
            if (match) {
                aktuelleKW = parseInt(match[1]);
                aktuellesJahr = parseInt(match[2]);
                console.log(`Kalenderwoche und Jahr aus der Anzeige geladen: KW${aktuelleKW}/${aktuellesJahr}`);
            } else {
                throw new Error('Konnte KW/Jahr nicht aus der Anzeige lesen');
            }
        } catch (error) {
            console.error('Fehler beim Ermitteln der aktuellen Kalenderwoche:', error);
            return false;
        }
    }
    
    // Speicherpfad zusammenstellen
    const url = `/api/solomenue/bewohner-auswahl/${aktuellesJahr}/KW${aktuelleKW}/${aktuelleBewohnerAuswahl.name}`;
    console.log(`Speichere unter: ${url}`);
    
    try {
        // Daten an das Backend senden
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(aktuelleBewohnerAuswahl)
        });
        
        if (response.ok) {
            console.log(`Bewohnerauswahl erfolgreich gespeichert für ${aktuelleBewohnerAuswahl.name} (KW${aktuelleKW}/${aktuellesJahr})`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`Fehler beim Speichern (${response.status}): ${errorText}`);
            return false;
        }
    } catch (error) {
        console.error('Netzwerk- oder Serverfehler beim Speichern der Bewohnerauswahl:', error);
        return false;
    }
}

/**
 * Aktualisiert die Menüauswahl für einen Tag und eine Kategorie
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "suppe" oder "extra_kaltePlatte")
 * @param {string} portion - Die Portionsgröße ("100%", "50%", "25%", "none")
 * @param {Array} mahlzeiten - Die ausgewählten Mahlzeiten für die Kategorie
 * @returns {boolean} True bei Erfolg, False bei Fehler
 */
async function aktualisiereMenueAuswahl(tag, kategorie, portion, mahlzeiten) {
    console.log(`Aktualisiere Menüauswahl für ${tag}, ${kategorie}, Portion: ${portion}`);
    
    // Feststellen, ob es sich um eine Extra-Kategorie handelt
    const isExtraKategorie = kategorie.startsWith('extra_');
    
    // Prüfen, ob aktuelleBewohnerAuswahl bereits initialisiert ist
    if (!aktuelleBewohnerAuswahl) {
        if (aktuellerBewohner) {
            // Neue Auswahl erstellen
            aktuelleBewohnerAuswahl = {
                name: `${aktuellerBewohner.firstName}_${aktuellerBewohner.lastName}`.trim().replace(/\s+/g, '_'),
                Montag: {}, Dienstag: {}, Mittwoch: {}, Donnerstag: {}, Freitag: {}, Samstag: {}, Sonntag: {}
            };
            console.log('Neue Bewohnerauswahl erstellt für', aktuelleBewohnerAuswahl.name);
        } else {
            console.error('Kein aktueller Bewohner ausgewählt, kann Auswahl nicht aktualisieren');
            return false;
        }
    }
    
    // Sicherstellen, dass die Datenstruktur vorhanden ist
    if (!aktuelleBewohnerAuswahl[tag]) {
        aktuelleBewohnerAuswahl[tag] = {};
    }
    
    // Wenn Portion "none" ist, die Kategorie vollständig aus der Auswahl entfernen
    if (portion === 'none') {
        if (aktuelleBewohnerAuswahl[tag][kategorie]) {
            console.log(`Lösche Kategorie ${kategorie} für ${tag} vollständig (inkl. aller Zusatzinformationen)`);
            
            // Vollständiges Löschen aller Daten für diese Kategorie
            delete aktuelleBewohnerAuswahl[tag][kategorie];
            
            // Zusätzlich: Entferne alle visuellen Elemente aus der Zelle
            try {
                const tabelle = document.querySelector('.menueplan-tabelle');
                if (tabelle) {
                    const zelle = findeTabellenZelle(tabelle, tag, kategorie);
                    if (zelle) {
                        // Bearbeiten-Button entfernen
                        const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
                        if (bearbeitenButton) bearbeitenButton.remove();
                        
                        // Extra-Hinweise entfernen
                        const extraHinweise = zelle.querySelector('.extra-hinweise');
                        if (extraHinweise) extraHinweise.remove();
                        
                        // Ausgeschlossene Komponenten zurücksetzen
                        const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
                        komponentenElemente.forEach(element => {
                            element.classList.remove('ausgeschlossen');
                            element.textContent = element.textContent.replace(' (ohne)', '');
                        });
                        
                        // Ausgeschlossen-Klasse entfernen
                        zelle.classList.remove('ausgeschlossen');
                    }
                }
            } catch (error) {
                console.warn('Fehler beim Bereinigen visueller Elemente:', error);
            }
        }
    } else {
        // Vorhandene Auswahl für diese Kategorie abrufen, falls vorhanden
        const vorhandeneAuswahl = aktuelleBewohnerAuswahl[tag][kategorie] || {};
        
        // Sonst Auswahl aktualisieren oder neu erstellen
        aktuelleBewohnerAuswahl[tag][kategorie] = {
            category: kategorie,
            selected: true,
            portion: portion,
            meals: mahlzeiten || [],
            // Behalte vorhandene Werte oder initialisiere neue
            notizen: vorhandeneAuswahl.notizen || '',
            ausgeschlosseneKomponenten: vorhandeneAuswahl.ausgeschlosseneKomponenten || [],
            extraMenueAuswahl: vorhandeneAuswahl.extraMenueAuswahl || [],
            // Extra-Kategorie-Flag hinzufügen, um diese bei der Anzeige speziell behandeln zu können
            isExtraKategorie: isExtraKategorie
        };
        console.log(`Kategorie ${kategorie} für ${tag} aktualisiert/erstellt mit Portion ${portion}`);
    }
    
    // Auswahl auf dem Server speichern
    try {
        // Aktualisiere aktuelleKW und aktuellesJahr, falls noch nicht gesetzt
        if (!aktuelleKW || !aktuellesJahr) {
            const kwDaten = document.querySelector('#current-week-display').textContent;
            const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
            if (match) {
                aktuelleKW = parseInt(match[1]);
                aktuellesJahr = parseInt(match[2]);
                console.log(`Kalenderwoche und Jahr aus der Anzeige geladen: KW${aktuelleKW}/${aktuellesJahr}`);
            } else {
                throw new Error('Konnte KW/Jahr nicht aus der Anzeige lesen');
            }
        }
        
        // Speichern
        await speichereBewohnerAuswahl();
        return true;
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Menüauswahl:', error);
        return false;
    }
}

/**
 * Aktualisiert die Tabelle basierend auf der aktuellen Bewohnerauswahl
 * @param {HTMLTableElement} tabelle - Die zu aktualisierende Menüplantabelle
 * @returns {boolean} True bei Erfolg, False bei Fehler
 */
function aktualisiereTabelle(tabelle) {
    if (!tabelle) {
        console.error('Keine Tabelle zum Aktualisieren übergeben');
        return false;
    }
    
    console.log('Aktualisiere Tabelle mit Bewohnerauswahl:', aktuelleBewohnerAuswahl ? aktuelleBewohnerAuswahl.name : 'Keine Auswahl');
    
    if (!aktuelleBewohnerAuswahl) return false;
    
    // Alle Portionsklassen aus allen Zellen entfernen
    const alleZellen = tabelle.querySelectorAll('td.menue-zelle');
    alleZellen.forEach(zelle => {
        // Alle Bearbeiten-Buttons entfernen (wichtig beim Bewohnerwechsel)
        const bearbeitenButtons = zelle.querySelectorAll('.komponenten-bearbeiten-btn');
        bearbeitenButtons.forEach(button => button.remove());
        
        // CSS-Klassen zurücksetzen
        zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
        
        // Entferne alle 'ausgeschlossen' Klassen und (ohne) Markierungen
        const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
        komponentenElemente.forEach(element => {
            element.classList.remove('ausgeschlossen');
            element.textContent = element.textContent.replace(' (ohne)', '');
        });
        
        // Entferne alle Extra-Hinweise
        const extraHinweise = zelle.querySelector('.extra-hinweise');
        if (extraHinweise) extraHinweise.remove();
        
        // Zurücksetzen der Klick-Handler-Markierung, damit die Handler neu hinzugefügt werden
        zelle.dataset.hasClickHandler = 'false';
    });
    
    // Für jeden Tag und jede Kategorie in der Auswahl
    Object.entries(aktuelleBewohnerAuswahl).forEach(([tag, tagAuswahl]) => {
        // Name überspringen
        if (tag === 'name') return;
        
        // Keine Auswahl für diesen Tag
        if (!tagAuswahl || Object.keys(tagAuswahl).length === 0) return;
        
        // Für jede Kategorie an diesem Tag
        Object.entries(tagAuswahl).forEach(([kategorie, auswahl]) => {
            // Prüfen, ob die Kategorie gültig ist
            if (kategorie === 'undefined' || !kategorie) {
                console.warn(`Überspringe ungültige Kategorie '${kategorie}' für Tag ${tag}`);
                return; // Nächste Iteration
            }

            if (!auswahl || !auswahl.selected) return;
            
            // Die entsprechende Zelle in der Tabelle finden
            const zelle = findeTabellenZelle(tabelle, tag, kategorie);
            
            if (!zelle) {
                console.warn(`Zelle für Tag ${tag}, Kategorie ${kategorie} nicht gefunden`);
                return;
            }
            
            // Portionsklasse setzen
            const portionsklasse = `auswahl-${auswahl.portion.replace('%', '')}`;
            zelle.classList.add(portionsklasse);
            
            // Prüfen, ob es sich um eine Extra-Kategorie handelt
            const isExtraKategorie = kategorie.startsWith('extra_');
            
            // Ausgeschlossene Komponenten markieren
            if (auswahl.ausgeschlosseneKomponenten && auswahl.ausgeschlosseneKomponenten.length > 0) {
                if (isExtraKategorie) {
                    // Für Extra-Kategorien die gesamte Zelle behandeln
                    const zellenText = zelle.textContent.replace('✎', '').trim();
                    const originalText = zellenText.replace(' (ohne)', '').trim();
                    
                    // Wenn der Zellentext in der Liste der ausgeschlossenen Komponenten ist
                    if (auswahl.ausgeschlosseneKomponenten.includes(originalText)) {
                        // Klasse für visuelle Durchstreichung hinzufügen
                        zelle.classList.add('ausgeschlossen');
                        
                        // Wenn der originalText nicht leer ist und die Zelle keinen "(ohne)"-Text enthält
                        if (originalText && !zellenText.includes('(ohne)')) {
                            // Neuen Text mit "(ohne)" erstellen, dabei Bearbeiten-Button bewahren
                            const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
                            zelle.textContent = `${originalText} (ohne)`;
                            if (bearbeitenButton) {
                                zelle.appendChild(bearbeitenButton);
                            }
                        }
                    }
                } else {
                    // Für standard Kategorien einzelne Komponenten durchstreichen
                    const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
                    komponentenElemente.forEach(element => {
                        // Ursprünglicher Name ohne "(ohne)" extrahieren
                        const komponentenName = element.textContent.replace(' (ohne)', '').trim();
                        
                        // Prüfen, ob die Komponente in der Liste der ausgeschlossenen ist
                        if (auswahl.ausgeschlosseneKomponenten.includes(komponentenName)) {
                            element.classList.add('ausgeschlossen');
                            
                            // "ohne" hinzufügen, wenn nicht bereits vorhanden
                            if (!element.textContent.includes('(ohne)')) {
                                element.textContent = `${komponentenName} (ohne)`;
                            }
                        }
                    });
                }
            }
            
            // Prüfe zusätzlich auch das meals-Array
            if (auswahl.meals && Array.isArray(auswahl.meals)) {
                if (isExtraKategorie) {
                    // Bei Extra-Kategorien das meals-Array durchgehen
                    for (const mahlzeit of auswahl.meals) {
                        if (mahlzeit.ohne === true) {
                            // Klasse für visuelle Durchstreichung hinzufügen
                            zelle.classList.add('ausgeschlossen');
                            
                            // Zellentext mit "(ohne)" markieren, wenn nicht schon vorhanden
                            const zellenText = zelle.textContent.replace('✎', '').trim();
                            if (!zellenText.includes('(ohne)')) {
                                const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
                                zelle.textContent = `${mahlzeit.name} (ohne)`;
                                if (bearbeitenButton) {
                                    zelle.appendChild(bearbeitenButton);
                                }
                            }
                            break; // Nur einmal anwenden
                        }
                    }
                } else {
                    // Bei normalen Menüs die Komponenten durchgehen
                    const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
                    
                    // Für jede Mahlzeit im meals-Array
                    for (const mahlzeit of auswahl.meals) {
                        if (mahlzeit.ohne === true) {
                            // Passende Komponente finden
                            for (const element of komponentenElemente) {
                                const komponentenName = element.textContent.replace(' (ohne)', '').trim();
                                if (komponentenName === mahlzeit.name) {
                                element.classList.add('ausgeschlossen');
                                
                                // "ohne" hinzufügen, wenn nicht bereits vorhanden
                                if (!element.textContent.includes('(ohne)')) {
                                        element.textContent = `${komponentenName} (ohne)`;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            // Für jede ausgewählte Zelle einen Bearbeiten-Button hinzufügen oder aktualisieren
            if (auswahl.portion !== 'none') {
                // Vorhandenen Button suchen
                let bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
                
                // Falls keiner vorhanden, einen neuen erstellen
                if (!bearbeitenButton) {
                    bearbeitenButton = document.createElement('button');
                    bearbeitenButton.className = 'komponenten-bearbeiten-btn';
                    bearbeitenButton.title = 'Komponenten bearbeiten';
                    bearbeitenButton.innerHTML = '✎';
                    bearbeitenButton.dataset.tag = tag;
                    bearbeitenButton.dataset.kategorie = kategorie;
                    bearbeitenButton.dataset.zellenId = zelle.id;
                    
                    zelle.appendChild(bearbeitenButton);
                }
                
                // Aktualisiere Attribute für den Button, falls sie sich geändert haben
                bearbeitenButton.dataset.tag = tag;
                bearbeitenButton.dataset.kategorie = kategorie;
                bearbeitenButton.dataset.zellenId = zelle.id;
            }

            // Klick-Event für die Zelle registrieren, falls noch nicht geschehen
            if (zelle.dataset.hasClickHandler !== 'true') {
                zelle.dataset.hasClickHandler = 'true';
            }
        });
    });
    
    // Event-Listener für Klicks auf die Zellen hinzufügen
    fuegeZellenKlickHinzu(tabelle);
    
    // Mobile Ansicht aktualisieren, falls auf einem Smartphone oder Tablet
    try {
        // Prüfen ob mobile Container existiert oder erstellt werden muss
    const mobileContainer = document.querySelector('.mobile-menueplan-container');
    if (!mobileContainer) {
            // Mobile Container erstellen
            // erstelleMobileAnsicht(tabelle);
            console.log('Mobile Ansicht wird nicht erstellt - Funktion nicht implementiert');
        }
        
        // Mobile Zellen aktualisieren
        aktualisiereZellenInMobileAnsicht(tabelle);
    } catch (mobileError) {
        console.warn('Fehler bei der Aktualisierung der mobilen Ansicht:', mobileError);
        // Weitermachen, auch wenn die mobile Aktualisierung fehlschlägt
    }
    
    return true;
}

/**
 * Aktualisiert alle Zellen in der mobilen Ansicht basierend auf der Desktop-Tabelle
 * @param {HTMLElement} desktopTabelle - Die Original-Tabelle aus der Desktop-Ansicht
 */
function aktualisiereZellenInMobileAnsicht(desktopTabelle) {
    // Prüfen, ob wir auf einem mobilen Gerät oder Tablet sind
    const isTabletOrMobile = window.innerWidth <= 1000 || 
                           /iPad|iPhone|iPod|Android|webOS|IEMobile/i.test(navigator.userAgent);
    if (!isTabletOrMobile) return;
    
    // Mobile-Container suchen
    const mobileContainer = document.querySelector('.mobile-menueplan-container');
    if (!mobileContainer) {
        console.log('Kein Mobile-Container gefunden, überspringe Aktualisierung');
        return;
    }
    
    // Prüfen, ob der Container bereits erstellt wurde, sonst jetzt erstellen
    if (!mobileContainer.querySelector('.mobile-tag-container')) {
        // erstelleMobileAnsicht(desktopTabelle);
        console.log('Mobile Ansicht muss erstellt werden - Funktion nicht verfügbar');
        return; // Ohne mobile Ansicht können wir nicht fortfahren
    }
    
    // Zunächst alle mobile Zellen zurücksetzen und Bearbeiten-Buttons entfernen
    // Zunächst alle mobile Zellen zurücksetzen und Bearbeiten-Buttons entfernen
    const alleMobileZellen = mobileContainer.querySelectorAll('.kategorie-inhalt');
    alleMobileZellen.forEach(zelle => {
        // Alle Bearbeiten-Buttons entfernen
        const bearbeitenButtons = zelle.querySelectorAll('.komponenten-bearbeiten-btn');
        bearbeitenButtons.forEach(button => button.remove());
        
        // CSS-Klassen zurücksetzen
        zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
        
        // Extra-Hinweise entfernen
        const extraHinweise = zelle.querySelector('.extra-hinweise');
        if (extraHinweise) extraHinweise.remove();
    });
    
    // Prüfen, ob wir aktuell einen Bewohner haben
    if (!aktuelleBewohnerAuswahl) {
        console.log('Keine Bewohnerauswahl aktiv, alle mobilen Zellen wurden zurückgesetzt');
        return;
    }
    
    // Alle ausgewählten Zellen in der Desktop-Ansicht
    const ausgewaehlteZellen = document.querySelectorAll('.auswahl-100, .auswahl-50, .auswahl-25');
    
    ausgewaehlteZellen.forEach(zelle => {
        aktualisiereZellInMobileAnsicht(zelle);
    });
}

/**
 * Rotiert durch die möglichen Portionsgrößen (100%, 50%, 25%, keine)
 * @param {HTMLElement} zelle - Die Zelle, deren Portionsgröße geändert werden soll
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "menue1" oder "extra_kaltePlatte")
 * @returns {boolean} - True, wenn die Änderung erfolgreich war, sonst false
 */
async function rotierePortionsGroesse(zelle, tag, kategorie) {
    try {
    // Prüfen, ob die Kategorie eine Extra-Kategorie ist
    const isExtraKategorie = kategorie.startsWith('extra_');
    let extraKategorieTitle = '';
    
    if (isExtraKategorie) {
        // Versuche, den Anzeigenamen der Extra-Kategorie zu finden
        const extraKategorieId = kategorie.substring(6); // "extra_" entfernen
        if (window.TabeleAdd && window.TabeleAdd.extraKategorien) {
            const extraKategorie = window.TabeleAdd.extraKategorien.find(k => k.id === extraKategorieId);
            if (extraKategorie) {
                extraKategorieTitle = extraKategorie.displayKategorie;
            }
        }
        console.log(`Extra-Kategorie erkannt: ${kategorie} (${extraKategorieTitle || extraKategorieId})`);
    }
    
    // Aktuelle Portion ermitteln
    let aktuellePortion = 'none';
    if (aktuelleBewohnerAuswahl && aktuelleBewohnerAuswahl[tag] && aktuelleBewohnerAuswahl[tag][kategorie]) {
        aktuellePortion = aktuelleBewohnerAuswahl[tag][kategorie].portion || 'none';
    }
    
    console.log(`Aktuelle Portion für ${tag}, ${kategorie}: ${aktuellePortion}`);
    
    // Neue Portion bestimmen basierend auf der Kategorie-Art
    let neuePortion;
    
    if (isExtraKategorie) {
        // Für Extra-Kategorien nur zwischen 100% und 'none' wechseln
        neuePortion = aktuellePortion === '100%' ? 'none' : '100%';
    } else {
        // Normale Rotation für Standard-Kategorien
        switch (aktuellePortion) {
            case '100%':
                neuePortion = '50%';
                break;
            case '50%':
                neuePortion = '25%';
                break;
            case '25%':
                neuePortion = 'none';
                break;
            default:
                neuePortion = '100%';
                break;
        }
    }
    
    console.log(`Neue Portion für ${tag}, ${kategorie}: ${neuePortion}`);
    
    // Mahlzeiten aus der Zelle extrahieren
    const mahlzeiten = [];
    const mahlzeitElemente = zelle.querySelectorAll('.menue-komponente');
    mahlzeitElemente.forEach(element => {
        if (element.dataset.rezeptId) {
            mahlzeiten.push({
                rezeptId: element.dataset.rezeptId,
                name: element.textContent.trim()
            });
        }
    });
    
    // Wenn keine Mahlzeiten über Menü-Komponenten gefunden wurden und es eine Extra-Kategorie ist,
    // den Text der Zelle als Mahlzeit verwenden
    if (mahlzeiten.length === 0 && isExtraKategorie) {
        mahlzeiten.push({
            name: zelle.textContent.replace('✎', '').trim(),
            isExtraKategorie: true,
            extraKategorieTitle: extraKategorieTitle
        });
    }
    
    // Menüauswahl aktualisieren und sofort auf dem Server speichern
    const erfolg = await aktualisiereMenueAuswahl(tag, kategorie, neuePortion, mahlzeiten);
    
    if (erfolg) {
        // WICHTIG: Bestehenden Bearbeiten-Button vor der Änderung sichern
        const existingButton = zelle.querySelector('.komponenten-bearbeiten-btn');
        
        // Visuelles Feedback - Prozentzahl kurz einblenden
        if (neuePortion !== 'none') {
            // Hintergrundfarbe je nach Portionsgröße
            let feedbackColor;
            if (neuePortion === '100%') {
                feedbackColor = '#4CAF50'; // Grün
            } else if (neuePortion === '50%') {
                feedbackColor = '#FF9800'; // Orange
            } else if (neuePortion === '25%') {
                feedbackColor = '#90CAF9'; // Hellblau
            }
            
            // Original-Inhalt der Zelle speichern (vor der Änderung)
            const originalHtml = zelle.innerHTML;
            
            // Den Button entfernen, bevor wir das Feedback anzeigen
            if (existingButton) {
                existingButton.remove();
            }
            
            // Zelle mit Feedback-Element aktualisieren (Prozentsatz anzeigen)
            // Wir positionieren das Feedback-Element absolutiert über dem Originaltext
            zelle.style.position = 'relative';
            // Der ursprüngliche Inhalt wird auf 0.1 Opazität gesetzt, nicht ganz versteckt
            zelle.innerHTML = `
                <div style="opacity: 0.1;">${originalHtml}</div>
                <div class="portion-feedback" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: ${feedbackColor};
                    color: ${neuePortion === '25%' ? 'black' : 'white'};
                    z-index: 10;
                ">${neuePortion}</div>
            `;
            
            // Nach kurzer Zeit den Feedback-Effekt entfernen und Zellzustand neu aufbauen
            setTimeout(() => {
                // Feedback-Element entfernen und zur normalen Position zurückkehren
                zelle.style.position = '';
                
                // Originalinhalt wiederherstellen
                zelle.innerHTML = originalHtml;
                
                // CSS-Klassen für die Portion setzen
                zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25');
                
                // Neue Klasse hinzufügen
                if (neuePortion !== 'none') {
                    zelle.classList.add(`auswahl-${neuePortion.replace('%', '')}`);
                }
                
                // Bei Extra-Kategorien oder ausgeschlossenen Komponenten besondere Behandlung
                if (isExtraKategorie) {
                    // Prüfen, ob diese Extra-Kategorie ausgeschlossen ist
                    let isAusgeschlossen = false;
                    if (aktuelleBewohnerAuswahl[tag] && 
                        aktuelleBewohnerAuswahl[tag][kategorie] && 
                        aktuelleBewohnerAuswahl[tag][kategorie].ausgeschlosseneKomponenten) {
                        
                        const ausgeschlosseneKomponenten = aktuelleBewohnerAuswahl[tag][kategorie].ausgeschlosseneKomponenten;
                        const extraText = mahlzeiten.length > 0 ? mahlzeiten[0].name : '';
                        isAusgeschlossen = ausgeschlosseneKomponenten.includes(extraText);
                    }
                    
                    // Ausgeschlossen-Klasse bei Bedarf hinzufügen oder entfernen
                    if (isAusgeschlossen) {
                        zelle.classList.add('ausgeschlossen');
                    } else {
                        zelle.classList.remove('ausgeschlossen');
                    }
                }
                
                // Direkte Farbgebung als zusätzliche Sicherheit (falls CSS nicht korrekt geladen)
                zelle.style.backgroundColor = '';
                zelle.style.color = '';
                zelle.style.border = '';
                
                if (neuePortion === '100%') {
                    zelle.style.backgroundColor = '#4CAF50';
                    zelle.style.color = 'white';
                    zelle.style.border = '2px solid #2E7D32';
                } else if (neuePortion === '50%') {
                    zelle.style.backgroundColor = '#FF9800';
                    zelle.style.color = 'white';
                    zelle.style.border = '2px solid #EF6C00';
                } else if (neuePortion === '25%') {
                    zelle.style.backgroundColor = '#90CAF9';
                    zelle.style.color = 'black';
                    zelle.style.border = '2px solid #1976D2';
                }
                
                // Bearbeiten-Button neu erstellen
                if (window.KomponentenEditor && typeof window.KomponentenEditor.erstelleBearbeitenButton === 'function') {
                    window.KomponentenEditor.erstelleBearbeitenButton(zelle);
                } else {
                    // Fallback: Bearbeiten-Button manuell erstellen
                    let button = document.createElement('button');
                    button.className = 'komponenten-bearbeiten-btn';
                    button.title = 'Komponenten bearbeiten';
                    button.innerHTML = '✎'; // Pencil-Symbol
                    button.id = `edit-btn-${tag}-${kategorie}`;
                    button.dataset.tag = tag;
                    button.dataset.kategorie = kategorie;
                    
                    // Wichtige Stile für bessere Clickability
                    button.style.pointerEvents = 'auto';
                    button.style.zIndex = '1000';
                    button.style.position = 'absolute';
                    button.style.right = '8px';
                    button.style.display = 'flex';
                    
                    // Event-Listener für den Button
                    button.addEventListener('click', function handleButtonClick(event) {
                        // Event-Propagation stoppen
                        event.stopPropagation();
                        event.preventDefault();
                        event.cancelBubble = true;
                        
                        // Zeitstempel zur Vermeidung von Doppelklicks
                        const jetzt = Date.now();
                        const letzterButtonKlick = parseInt(button.dataset.lastClickTime || '0');
                        if (jetzt - letzterButtonKlick < 300) {
                            console.log('Klick auf Bearbeiten-Button zu schnell nach vorherigem Klick - ignoriert');
                            return;
                        }
                        button.dataset.lastClickTime = jetzt.toString();
                        
                        // Editor öffnen
                        console.log('Bearbeiten-Button angeklickt für', tag, kategorie);
                        if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                            window.KomponentenEditor.oeffneKomponentenEditor(zelle, tag, kategorie);
                        }
                    });
                    
                    // Zusätzlicher Event-Listener für Touch-Geräte
                    button.addEventListener('touchend', function(event) {
                        event.stopPropagation();
                        event.preventDefault();
                        if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                            window.KomponentenEditor.oeffneKomponentenEditor(zelle, tag, kategorie);
                        }
                    });
                    
                    zelle.appendChild(button);
                }
                
                // Mobile Ansicht aktualisieren, falls nötig
                aktualisiereZellInMobileAnsicht(zelle);
            }, 600); // Ende des Timeouts für das Feedback
        } else {
            // Wenn keine Portion ausgewählt wurde (none)
            // Formatierung zurücksetzen
            zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
            zelle.style.backgroundColor = '';
            zelle.style.color = '';
            zelle.style.border = '';
            
            // Entferne den Bearbeiten-Button
            if (existingButton) {
                existingButton.remove();
            }
            
            // Entferne alle Extra-Hinweise
            const extraHinweise = zelle.querySelector('.extra-hinweise');
            if (extraHinweise) {
                extraHinweise.remove();
            }
            
            // Entferne alle (ohne) Kennzeichnungen
            const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
            komponentenElemente.forEach(element => {
                element.classList.remove('ausgeschlossen');
                element.textContent = element.textContent.replace(' (ohne)', '');
            });
            
            // Mobile Ansicht aktualisieren
            aktualisiereZellInMobileAnsicht(zelle);
            
            // Zusätzlich auch die mobile Zelle direkt bereinigen
            const mobilAnsicht = document.querySelector('.mobile-menueplan-container');
            if (mobilAnsicht) {
                const mobilZelle = mobilAnsicht.querySelector(`.kategorie-inhalt[data-tag="${tag}"][data-kategorie="${kategorie}"]`);
                if (mobilZelle) {
                    // CSS-Klassen zurücksetzen
                    mobilZelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
                    mobilZelle.style.backgroundColor = '';
                    mobilZelle.style.color = '';
                    mobilZelle.style.border = '';
                    
                    // Extra-Hinweise entfernen
                    const mobilExtraHinweise = mobilZelle.querySelector('.extra-hinweise');
                    if (mobilExtraHinweise) {
                        mobilExtraHinweise.remove();
                    }
                    
                    // (ohne) Kennzeichnungen entfernen
                    const mobilText = mobilZelle.textContent.replace('✎', '').replace(' (ohne)', '').trim();
                    mobilZelle.textContent = mobilText;
                }
            }
        }
        
        return true;
        } else {
            console.error(`Fehler beim Speichern der Auswahl für ${tag}, ${kategorie}`);
            return false;
        }
    } catch (error) {
        console.error(`Fehler in rotierePortionsGroesse für ${tag}, ${kategorie}:`, error);
        throw error; // Fehler weiterleiten zur übergeordneten Fehlerbehandlung
    }
}

/**
 * Verarbeitet die Portionsgröße für eine bestimmte Zelle
 * @param {HTMLElement} zelle - Die geklickte Tabellenzelle
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "milchspeise")
 * @returns {Promise<boolean>} True bei Erfolg, False bei Fehler
 */
async function verarbeitePortionsGroesse(zelle, tag, kategorie) {
    try {
        const erfolg = await rotierePortionsGroesse(zelle, tag, kategorie);
        if (erfolg) {
            console.log(`Auswahl gespeichert: ${tag}, ${kategorie} (Portion geändert)`);
            
            // NEUE FUNKTION: Animation für die mobile Ansicht
            const mobilAnsicht = document.querySelector('.mobile-menueplan-container');
            if (mobilAnsicht) {
                const mobilZelle = mobilAnsicht.querySelector(`.kategorie-inhalt[data-tag="${tag}"][data-kategorie="${kategorie}"]`);
                
                if (mobilZelle) {
                    // Extra-Animation für die mobile Ansicht
                    const mobileNeuePortions = getAktuellePortion(tag, kategorie);
                    
                    if (mobileNeuePortions !== 'none') {
                        // Originalinhalt der Mobilzelle speichern
                        const originalMobilHTML = mobilZelle.innerHTML;
                        
                        // Hintergrundfarbe je nach Portionsgröße
                        let feedbackColor;
                        if (mobileNeuePortions === '100%') {
                            feedbackColor = '#4CAF50'; // Grün
                        } else if (mobileNeuePortions === '50%') {
                            feedbackColor = '#FF9800'; // Orange
                        } else if (mobileNeuePortions === '25%') {
                            feedbackColor = '#90CAF9'; // Hellblau
                        }
                        
                        // Zelle leeren und Prozentzahl anzeigen
                        mobilZelle.innerHTML = `<div class="portion-feedback" style="background-color: ${feedbackColor}; color: ${mobileNeuePortions === '25%' ? 'black' : 'white'}">${mobileNeuePortions}</div>`;
                        
                        // Nach kurzer Zeit den ursprünglichen Inhalt wiederherstellen
                        setTimeout(() => {
                            mobilZelle.innerHTML = originalMobilHTML;
                            // Sicherstellen, dass die Mobil-Zelle korrekt aktualisiert wird
                            aktualisiereZellInMobileAnsicht(zelle);
                        }, 600);
                    }
                }
            }
            return true;
        } else {
            console.error(`Fehler beim Speichern der Auswahl für ${tag}, ${kategorie}`);
    return false;
        }
    } catch (error) {
        console.error(`Fehler beim Ändern der Portionsgröße für ${tag}, ${kategorie}:`, error);
        throw error; // Fehler weiterreichen für übergeordnete Fehlerbehandlung
    }
}



/**
 * Ermittelt die aktuelle Portionsgröße einer Zelle
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "menue1")
 * @returns {string} - Die Portionsgröße (100%, 50%, 25% oder "none")
 */
function getAktuellePortion(tag, kategorie) {
    if (aktuelleBewohnerAuswahl && aktuelleBewohnerAuswahl[tag] && aktuelleBewohnerAuswahl[tag][kategorie]) {
        return aktuelleBewohnerAuswahl[tag][kategorie].portion || 'none';
    }
    return 'none';
}

/**
 * Setzt die aktuelle Bewohnerauswahl vollständig zurück
 */
function resetAuswahl() {
    console.log('Bewohnerauswahl wird vollständig zurückgesetzt');
    aktuelleBewohnerAuswahl = null;
    aktuelleBewohnerName = null;
    
    // Zusätzlich auch alle visuellen Elemente zurücksetzen
    try {
        // Desktop-Ansicht bereinigen
        const alleZellen = document.querySelectorAll('td.menue-zelle');
        alleZellen.forEach(zelle => {
            // Bearbeiten-Buttons entfernen
            const bearbeitenButtons = zelle.querySelectorAll('.komponenten-bearbeiten-btn');
            bearbeitenButtons.forEach(button => button.remove());
            
            // CSS-Klassen zurücksetzen
            zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen');
            
            // Extra-Hinweise entfernen
            const extraHinweise = zelle.querySelector('.extra-hinweise');
            if (extraHinweise) extraHinweise.remove();
            
            // Text bei ausgeschlossenen Komponenten korrigieren
            const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
            komponentenElemente.forEach(element => {
                element.classList.remove('ausgeschlossen');
                element.textContent = element.textContent.replace(' (ohne)', '');
            });
        });
        
        // Mobile Ansicht bereinigen
        aktualisiereZellenInMobileAnsicht();
        
        console.log('Visuelle Elemente wurden beim Zurücksetzen bereinigt');
    } catch (error) {
        console.warn('Fehler beim Bereinigen visueller Elemente während des Zurücksetzens:', error);
    }
}

/**
 * Initialisiert das Modul und richtet alle Event-Listener ein
 */
function initialisiere() {
    console.log('Initialisiere BewohnerAuswahl-Modul');
    
    // Event-Listener für Kalenderwochenwechsel
    document.addEventListener('kalenderwocheChanged', async (event) => {
        // Aktuelle KW und Jahr aktualisieren
        aktuelleKW = event.detail.kw;
        aktuellesJahr = event.detail.jahr;
        
        console.log(`BewohnerAuswahl: Kalenderwoche geändert auf KW${aktuelleKW}/${aktuellesJahr}`);
        
        // Wenn ein Bewohner ausgewählt ist, dessen Auswahl für die neue Kalenderwoche laden
        if (aktuellerBewohner) {
            console.log(`Lade Bewohnerauswahl für ${aktuellerBewohner.firstName} ${aktuellerBewohner.lastName} nach Kalenderwochenwechsel`);
            try {
                // Bestehende Auswahl zurücksetzen, aber Bewohner behalten
                resetAuswahl();
                
                // Neue Auswahl laden
                const result = await ladeBewohnerAuswahl(aktuellerBewohner, aktuelleKW, aktuellesJahr);
                
                // Tabelle aktualisieren, falls vorhanden
                const tabelle = document.querySelector('.menueplan-tabelle');
                if (tabelle) {
                    aktualisiereTabelle(tabelle);
                    
                    // Sicherstellen, dass die Klick-Handler explizit hinzugefügt werden
                    console.log('Füge Klick-Handler nach Kalenderwochenwechsel hinzu');
                    fuegeZellenKlickHinzu(tabelle, true);
                }
                
                // NEUER CODE: Aktiver Bewohner Indikator aktualisieren und neu anzeigen
                if (typeof window.zeigeAktivenBewohnerIndikator === 'function') {
                    console.log('Aktualisiere Bewohner-Indikator nach Kalenderwochenwechsel');
                    window.zeigeAktivenBewohnerIndikator(aktuellerBewohner, result.isExisting);
                }
                
                // Sicherstellen, dass die Bewohner-Karte weiterhin aktiv ist
                markiereBewohnerKarteAlsAktiv(aktuellerBewohner);
            } catch (error) {
                console.error('Fehler beim Laden der Bewohnerauswahl nach Kalenderwochenwechsel:', error);
            }
        }
    });
    
    // Event-Listener für Tabellenerstellung
    document.addEventListener('menuplanTabelleErstellt', (event) => {
        console.log('Tabelle wurde erstellt, füge Klick-Handler hinzu');
        
        // Klick-Handler zu Tabellenzellen hinzufügen
        const { tabelle } = event.detail;
        
        // Wenn ein Bewohner und seine Auswahl bereits geladen sind, Tabelle aktualisieren
        if (aktuelleBewohnerAuswahl && aktuellerBewohner) {
            console.log('Aktualisiere neue Tabelle mit bestehender Bewohnerauswahl');
            aktualisiereTabelle(tabelle);
            
            // Sicherstellen, dass auch der Bewohner-Indikator angezeigt wird
            if (typeof window.zeigeAktivenBewohnerIndikator === 'function') {
                const isExisting = aktuelleBewohnerAuswahl && Object.keys(aktuelleBewohnerAuswahl).length > 1;
                window.zeigeAktivenBewohnerIndikator(aktuellerBewohner, isExisting);
            }
        } else {
            // Ansonsten einfach Klick-Handler hinzufügen
            fuegeZellenKlickHinzu(tabelle, true);
        }
    });
    
    // Wir lassen die Event-Listener für 'bewohnerCardClicked' in script.js abarbeiten
    // um Doppelausführungen zu vermeiden. Dieser Event-Listener wird nur hier als Fallback
    // behalten, falls script.js nicht richtig reagiert
    /*
    document.addEventListener('bewohnerCardClicked', async (event) => {
        const { bewohner } = event.detail;
        console.log(`Event für Bewohnerwechsel empfangen: ${bewohner.firstName} ${bewohner.lastName}`);
        
        // Bewohner setzen und Auswahl laden (enthält bereits die Tabellenaktualisierung)
        await setzeAktuellenBewohner(bewohner);
        
        // Hier ist kein erneutes aktualisiereTabelle notwendig, da es bereits in setzeAktuellenBewohner erfolgt
    });
    */
    
    // Anfangswerte aus der aktuellen Anzeige auslesen
    try {
        const kwDaten = document.querySelector('#current-week-display').textContent;
        const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
        if (match) {
            aktuelleKW = parseInt(match[1]);
            aktuellesJahr = parseInt(match[2]);
            console.log(`Initialisierung: KW${aktuelleKW}/${aktuellesJahr} aus der Anzeige geladen`);
        }
    } catch (error) {
        console.warn('Konnte Kalenderwoche bei Initialisierung nicht aus der Anzeige lesen');
    }
    
    console.log('BewohnerAuswahl-Modul vollständig initialisiert');
}

/**
 * Hilfsfunktion, um die Bewohnerkarte visuell als aktiv zu markieren
 * @param {Object} bewohner - Der Bewohner, dessen Karte markiert werden soll
 */
function markiereBewohnerKarteAlsAktiv(bewohner) {
    if (!bewohner) return;
    
    const bewohnerId = `${bewohner.firstName.trim()}_${bewohner.lastName.trim()}`;
    
    // Alle bestehenden aktiven Karten zurücksetzen
    const aktiveKarten = document.querySelectorAll('.bewohner-card.active');
    aktiveKarten.forEach(karte => karte.classList.remove('active'));
    
    // Versuche zuerst mit data-bewohner-id
    let bewohnerKarte = document.querySelector(`.bewohner-card[data-bewohner-id="${bewohnerId}"]`);
    
    // Wenn nicht gefunden, versuche mit data-id
    if (!bewohnerKarte) {
        bewohnerKarte = document.querySelector(`.bewohner-card[data-id="${bewohnerId}"]`);
    }
    
    // Als letztes versuche case-insensitive Suche
    if (!bewohnerKarte) {
        const alleKarten = document.querySelectorAll('.bewohner-card');
        for (const karte of alleKarten) {
            const kartenId = karte.dataset.id?.toLowerCase() || karte.dataset.bewohnerId?.toLowerCase();
            if (kartenId === bewohnerId.toLowerCase()) {
                bewohnerKarte = karte;
                break;
            }
        }
    }
    
    if (bewohnerKarte) {
        bewohnerKarte.classList.add('active');
        console.log(`Bewohnerkarte für ${bewohner.firstName} ${bewohner.lastName} als aktiv markiert`);
        
        // Beide Attribute für Konsistenz setzen
        bewohnerKarte.dataset.id = bewohnerId;
        bewohnerKarte.dataset.bewohnerId = bewohnerId;
    } else {
        console.warn(`Konnte keine Bewohnerkarte für ID ${bewohnerId} finden`);
    }
}

/**
 * Gibt die aktuelle Bewohnerauswahl zurück
 * @returns {Object|null} Die aktuelle Bewohnerauswahl oder null, wenn keine vorhanden
 */
function getAktuelleBewohnerAuswahl() {
    return aktuelleBewohnerAuswahl;
}

/**
 * Findet eine Tabellenzelle anhand von Tag und Kategorie
 * @param {HTMLElement} tabelle - Die Tabelle, in der gesucht werden soll
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "frühstück")
 * @returns {HTMLElement|null} Die gefundene Zelle oder null
 */
function findeTabellenZelle(tabelle, tag, kategorie) {
    // Versuche zuerst, die Zelle direkt über ein Attribut-Selektor zu finden
    let zelle = tabelle.querySelector(`td[data-tag="${tag}"][data-kategorie="${kategorie}"]`);
    
    // Wenn nicht gefunden, versuche es über die Zeile und dann die Spalte
    if (!zelle) {
        // Finde die Zeile für die Kategorie
        const zeilen = tabelle.querySelectorAll('tr');
        for (const zeile of zeilen) {
            const kategorieZelle = zeile.querySelector('.kategorie-zelle');
            if (kategorieZelle && kategorieZelle.textContent.trim().toLowerCase() === kategorie.toLowerCase()) {
                // Finde die Zelle für den Tag in dieser Zeile
                const zellen = zeile.querySelectorAll('td');
                for (const z of zellen) {
                    if (z.dataset.tag === tag) {
                        zelle = z;
                        break;
                    }
                }
                break;
            }
        }
    }
    
    // Wenn immer noch nicht gefunden, versuche es mit einer flexibleren Suche
    if (!zelle) {
        const alleZellen = tabelle.querySelectorAll('td.klickbar');
        for (const z of alleZellen) {
            if (z.dataset.tag === tag && z.dataset.kategorie === kategorie) {
                zelle = z;
                break;
            }
        }
    }
    
    return zelle;
}

/**
 * Setzt den aktuellen Bewohner und lädt seine Auswahl
 * @param {Object} bewohner - Der Bewohner, der gesetzt werden soll
 * @returns {Promise<Object>} - Ein Promise, das mit der geladenen Auswahl resolved
 */
async function setzeAktuellenBewohner(bewohner) {
    // Zurücksetzen des vorherigen Bewohners, falls ein neuer ausgewählt wird
    if (aktuellerBewohner !== bewohner) {
        resetAuswahl();
        aktuellerBewohner = bewohner;
        console.log(`Bewohner gesetzt: ${bewohner.firstName} ${bewohner.lastName}`);
    }

    // Wenn KW und Jahr bekannt sind, Auswahl laden
    if (aktuelleKW && aktuellesJahr) {
        console.log(`Lade Auswahl für ${bewohner.firstName} ${bewohner.lastName} in KW${aktuelleKW}/${aktuellesJahr}`);
        try {
            const result = await ladeBewohnerAuswahl(bewohner, aktuelleKW, aktuellesJahr);
            
            // Tabelle aktualisieren, falls vorhanden
            const tabelle = document.querySelector('.menueplan-tabelle');
            if (tabelle) {
                aktualisiereTabelle(tabelle);
                
                // WICHTIG: Klick-Handler explizit neu hinzufügen
                fuegeZellenKlickHinzu(tabelle, true);
            }
            
            // Bewohnerkarte als aktiv markieren
            markiereBewohnerKarteAlsAktiv(bewohner);
            
            return result;
        } catch (error) {
            console.error('Fehler beim Laden der Bewohnerauswahl:', error);
            return { isExisting: false, data: null };
        }
    } else {
        // Wenn KW und Jahr nicht bekannt sind, versuchen wir es aus der Anzeige zu lesen
        console.log('KW und Jahr unbekannt, versuche aus der Anzeige zu lesen...');
        
        try {
            const kwDaten = document.querySelector('#current-week-display').textContent;
            const match = kwDaten.match(/KW\s*(\d+)\/(\d+)/);
            
            if (match) {
                aktuelleKW = parseInt(match[1]);
                aktuellesJahr = parseInt(match[2]);
                console.log(`KW${aktuelleKW}/${aktuellesJahr} aus der Anzeige geladen, versuche erneut Auswahl zu laden`);
                
                // Erneut versuchen mit den gelesenen Werten
                return setzeAktuellenBewohner(bewohner);
            } else {
                console.warn('Format der KW-Anzeige konnte nicht erkannt werden');
                return { isExisting: false, data: null };
            }
        } catch (error) {
            console.error('Fehler beim Lesen von KW/Jahr aus der Anzeige:', error);
            return { isExisting: false, data: null };
        }
    }
}

// Module exportieren
export {
    initialisiere,
    setzeAktuellenBewohner,
    markiereBewohnerKarteAlsAktiv,
    resetAuswahl,
    getAktuelleBewohnerAuswahl,
    aktualisiereTabelle,
    ladeBewohnerAuswahl,
    aktualisiereZellInMobileAnsicht,
    speichereBewohnerAuswahl
}; 

/**
 * Fügt allen Zellen in der Tabelle einen Klick-Event-Listener hinzu
 * @param {HTMLTableElement} tabelle - Die Menüplantabelle
 * @param {boolean} forceReattach - Erzwingt das Neuanfügen aller Event-Listener
 */
function fuegeZellenKlickHinzu(tabelle, forceReattach = false) {
    if (!tabelle) {
        console.error('Keine Tabelle für Event-Listener übergeben');
        return;
    }
    
    // Alle Menü-Zellen auswählen
    const alleZellen = tabelle.querySelectorAll('td.menue-zelle');
    
    alleZellen.forEach(zelle => {
        // Bei forceReattach immer den Handler entfernen und neu hinzufügen
        if (forceReattach) {
            // Alle alten Event-Listener durch Clone-Ersatz entfernen
            const oldClone = zelle.cloneNode(true);
            zelle.parentNode.replaceChild(oldClone, zelle);
            zelle = oldClone;
            
            // Handler-Flag zurücksetzen
            zelle.dataset.hasClickHandler = 'false';
        }
        
        // Event-Listener nur hinzufügen, wenn noch keiner vorhanden ist
        if (zelle.dataset.hasClickHandler !== 'true') {
            // Event-Listener für Klicks hinzufügen
            zelle.addEventListener('click', function(event) {
                // Prüfen, ob der Klick auf den Bearbeiten-Button war
                if (event.target.closest('.komponenten-bearbeiten-btn')) {
                    // Klick auf Bearbeiten-Button - nicht weiter verarbeiten
                    return;
                }
                
                // Tag und Kategorie aus den Datenattributen auslesen
                const tag = this.dataset.tag || zelle.dataset.tag;
                const kategorie = this.dataset.kategorie || zelle.dataset.kategorie;
                
                if (tag && kategorie) {
                    // Zellenklick an die Verarbeitungsfunktion weiterleiten
                    handleZellenKlick(this, event);
                } else {
                    console.warn('Zelle ohne Tag oder Kategorie-Information angeklickt');
                }
            });
            
            // Event-Listener für Bearbeiten-Buttons in den Zellen
            const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
            if (bearbeitenButton) {
                bearbeitenButton.addEventListener('click', function(event) {
                    // Verhindern dass der Klick an die Zelle weitergegeben wird
                    event.stopPropagation();
                    
                    // Vorbereitung für die Bearbeitung der Komponenten
                    const tag = this.dataset.tag || zelle.dataset.tag;
                    const kategorie = this.dataset.kategorie || zelle.dataset.kategorie;
                    
                    // Öffne das Bearbeitungspanel für diese Kategorie
                    if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                        window.KomponentenEditor.oeffneKomponentenEditor(zelle, tag, kategorie);
                    } else {
                        console.warn('Komponenten-Editor-Funktion nicht gefunden');
                    }
                });
            }
            
            // Markieren, dass die Zelle jetzt einen Event-Listener hat
            zelle.dataset.hasClickHandler = 'true';
        }
    });
    
    console.log(`Event-Listener für ${alleZellen.length} Menü-Zellen ${forceReattach ? 'neu ' : ''}hinzugefügt`);
}

/**
 * Aktualisiert eine Zelle in der mobilen Ansicht basierend auf der Original-Zelle
 * @param {HTMLElement} originaleZelle - Die Original-Zelle aus der Desktop-Ansicht
 */
function aktualisiereZellInMobileAnsicht(originaleZelle) {
    // Prüfen, ob wir auf einem mobilen Gerät oder Tablet sind
    const isTabletOrMobile = window.innerWidth <= 1000 || 
                           /iPad|iPhone|iPod|Android|webOS|IEMobile/i.test(navigator.userAgent);
    if (!isTabletOrMobile) return;

    // Wenn keine Zelle übergeben wurde, abbrechen
    if (!originaleZelle) {
        console.warn('Keine Zelle zum Aktualisieren übergeben');
        return;
    }

    // Daten der Original-Zelle abrufen
    const tag = originaleZelle.dataset.tag;
    const kategorie = originaleZelle.dataset.kategorie;
    
    if (!tag || !kategorie) {
        console.warn('Zelle ohne Tag oder Kategorie-Information');
        return;
    }
    
    // Mobile-Container suchen
    const mobileContainer = document.querySelector('.mobile-menueplan-container');
    if (!mobileContainer) {
        console.log('Kein Mobile-Container gefunden, überspringe Aktualisierung');
        return;
    }
    
    // Erweiterte Selektoren für verschiedene DOM-Strukturen in der mobilen Ansicht
    // Versuche verschiedene Selektoren, um die mobile Zelle zu finden
    let mobileZelle = null;
    
    // Versuch 1: Standard-Selektor mit genauem data-Attribut-Matching
    mobileZelle = mobileContainer.querySelector(
        `.kategorie-inhalt[data-tag="${tag}"][data-kategorie="${kategorie}"]`
    );
    
    // Versuch 2: Mobile Zelle über kombinierten Tag/Kategorie-ID finden
    if (!mobileZelle) {
        const mobileCellId = `mobile-${tag}-${kategorie}`.replace(/\s+/g, '-').toLowerCase();
        mobileZelle = mobileContainer.querySelector(`#${mobileCellId}`);
    }
    
    // Versuch 3: Suche über die Klasse mit dem Tag und der Kategorie als Teil des Klassennamens
    if (!mobileZelle) {
        const mobileZellen = mobileContainer.querySelectorAll('.kategorie-inhalt');
        for (const zelle of mobileZellen) {
            // Prüfe, ob die Zelle Tag und Kategorie in irgendeiner Form enthält
            if ((zelle.dataset.tag && zelle.dataset.tag.includes(tag)) ||
                (zelle.dataset.kategorie && zelle.dataset.kategorie.includes(kategorie)) ||
                (zelle.className && zelle.className.includes(tag.toLowerCase())) ||
                (zelle.className && zelle.className.includes(kategorie.toLowerCase()))) {
                mobileZelle = zelle;
                break;
            }
        }
    }
    
    // Wenn immer noch keine Zelle gefunden wurde, versuche die Zelle über die enthaltenen Texte zu identifizieren
    if (!mobileZelle) {
        const mobileZellen = mobileContainer.querySelectorAll('.kategorie-inhalt, .mobile-menu-item');
        const originalText = originaleZelle.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
        
        for (const zelle of mobileZellen) {
            const zellenText = zelle.textContent.trim().replace(/\s+/g, ' ').toLowerCase();
            // Wenn der Text sehr ähnlich ist (mindestens 70% Übereinstimmung)
            if (zellenText.includes(originalText.substring(0, Math.floor(originalText.length * 0.7)))) {
                mobileZelle = zelle;
                // Setze die fehlenden Attribute für spätere Zuordnung
                if (!zelle.dataset.tag) zelle.dataset.tag = tag;
                if (!zelle.dataset.kategorie) zelle.dataset.kategorie = kategorie;
                break;
            }
        }
    }
    
    if (!mobileZelle) {
        // Nur eine Warnung ausgeben, nicht den gesamten Prozess unterbrechen
        console.warn(`Keine entsprechende mobile Zelle für ${tag}, ${kategorie} gefunden`);
        return;
    }
    
    // Für zukünftige Zuordnungen ID-Attribut setzen, falls noch nicht vorhanden
    if (!mobileZelle.id) {
        mobileZelle.id = `mobile-${tag}-${kategorie}`.replace(/\s+/g, '-').toLowerCase();
    }
    
    // Alten Button vor der Aktualisierung entfernen, damit wir keine doppelten Event-Listener haben
    const alteButton = mobileZelle.querySelector('.komponenten-bearbeiten-btn');
    if (alteButton) {
        alteButton.remove();
    }
    
    // Inhalt synchronisieren (HTML kopieren, aber ohne Button)
    const originalHtmlOhneButton = originaleZelle.innerHTML.replace(/<button[^>]*komponenten-bearbeiten-btn[^>]*>.*?<\/button>/g, '');
    mobileZelle.innerHTML = originalHtmlOhneButton;
    
    // Klassen synchronisieren (besonders wichtig für die Auswahl-Klassen und Bearbeitungsstatus)
    ['auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen', 'zelle-in-bearbeitung'].forEach(klasse => {
        if (originaleZelle.classList.contains(klasse)) {
            mobileZelle.classList.add(klasse);
        } else {
            mobileZelle.classList.remove(klasse);
        }
    });
    
    // Für Extra-Kategorien sicherstellen, dass der Text korrekt ist (mit oder ohne "(ohne)")
    const isExtraKategorie = kategorie && kategorie.startsWith('extra_');
    if (isExtraKategorie) {
        // Wenn die ursprüngliche Zelle die Klasse "ausgeschlossen" hat, sicherstellen, dass der mobile Text identisch ist
        if (originaleZelle.classList.contains('ausgeschlossen')) {
            const zellenText = originaleZelle.textContent.replace('✎', '').trim();
            // (ohne) zum Text hinzufügen, falls noch nicht vorhanden
            if (!zellenText.includes('(ohne)')) {
                mobileZelle.textContent = `${zellenText} (ohne)`;
            } else {
                mobileZelle.textContent = zellenText;
            }
        }
    }
}

/**
 * Erstellt die mobile Ansicht der Menüplan-Tabelle
 * @param {HTMLElement} desktopTabelle - Die Original-Tabelle aus der Desktop-Ansicht
 */
function erstelleMobileAnsicht(desktopTabelle) {
    // Prüfen, ob wir auf einem mobilen Gerät oder Tablet sind
    const isTabletOrMobile = window.innerWidth <= 1000 || 
                           /iPad|iPhone|iPod|Android|webOS|IEMobile/i.test(navigator.userAgent);
    if (!isTabletOrMobile) return;
    
    console.log('Erstelle mobile Ansicht für die Menüplan-Tabelle');
    
    // Container für die mobile Ansicht suchen oder erstellen
    let mobileContainer = document.querySelector('.mobile-menueplan-container');
    if (!mobileContainer) {
        mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-menueplan-container';
        
        // Container nach der Desktop-Tabelle einfügen
        const menueplanContainer = document.querySelector('.menueplan-container');
        if (menueplanContainer) {
            menueplanContainer.parentNode.insertBefore(mobileContainer, menueplanContainer.nextSibling);
        } else {
            // Fallback: An die Hauptansicht anhängen
            document.querySelector('main').appendChild(mobileContainer);
        }
    }
    
    // Leeren des Containers
    mobileContainer.innerHTML = '';
    
    // Überschrift für die mobile Ansicht
    const mobileTitle = document.createElement('h3');
    mobileTitle.className = 'mobile-title';
    mobileTitle.textContent = document.querySelector('.bewohner-info')?.textContent || 'Menüplan';
    mobileContainer.appendChild(mobileTitle);
    
    // Ermitteln der Tage und Kategorien aus der Desktop-Tabelle
    const tableHeader = desktopTabelle.querySelector('thead');
    const tableBody = desktopTabelle.querySelector('tbody');
    
    if (!tableHeader || !tableBody) {
        console.error('Keine Tabellenkopf oder -körper gefunden');
        return;
    }
    
    // Spaltenüberschriften (Tage) ermitteln
    const tageElemente = tableHeader.querySelectorAll('th');
    const tage = Array.from(tageElemente).slice(1).map(th => th.textContent.trim());
    
    // Für jeden Tag einen Container erstellen
    tage.forEach((tag, tagIndex) => {
        // Container für den Tag
        const tagContainer = document.createElement('div');
        tagContainer.className = 'mobile-tag-container';
        tagContainer.dataset.tag = tag;
        
        // Überschrift für den Tag
        const tagTitle = document.createElement('div');
        tagTitle.className = 'mobile-tag-title';
        tagTitle.textContent = tag;
        tagContainer.appendChild(tagTitle);
        
        // Alle Zeilen durchgehen und Kategorien für diesen Tag extrahieren
        const rows = tableBody.querySelectorAll('tr');
        
        rows.forEach(row => {
            const kategorieZelle = row.querySelector('td.kategorie-zelle');
            if (!kategorieZelle) return;
            
            const kategorie = kategorieZelle.textContent.trim();
            const kategorieId = kategorieZelle.dataset.kategorie;
            
            // Zelle für den aktuellen Tag in dieser Kategorie
            const menueZelle = row.querySelector(`td[data-tag="${tag}"]`);
            if (!menueZelle) return;
            
            // Container für diese Kategorie
            const kategorieContainer = document.createElement('div');
            kategorieContainer.className = 'mobile-kategorie-container';
            
            // Name der Kategorie
            const kategorieName = document.createElement('div');
            kategorieName.className = 'mobile-kategorie-name';
            kategorieName.textContent = kategorie;
            kategorieContainer.appendChild(kategorieName);
            
            // Inhalt der Kategorie
            const kategorieInhalt = document.createElement('div');
            kategorieInhalt.className = 'kategorie-inhalt klickbar';
            kategorieInhalt.dataset.tag = tag;
            kategorieInhalt.dataset.kategorie = kategorieId;
            kategorieInhalt.id = `mobile-${tag}-${kategorieId}`.replace(/\s+/g, '-').toLowerCase();
            
            // Inhalt aus der Desktop-Zelle kopieren
            kategorieInhalt.innerHTML = menueZelle.innerHTML;
            
            // Event-Listener für Klicks hinzufügen
            kategorieInhalt.addEventListener('click', function(event) {
                // Verhindere Propagation für Bearbeiten-Button-Klicks
                if (event.target.closest('.komponenten-bearbeiten-btn')) { // Korrektur: closest statt classList.contains
                    return;
                }
                // Rufe die zentrale Klick-Handler-Funktion auf
                handleZellenKlick(this, event); // 'this' ist hier kategorieInhalt
            });

            // Bearbeiten-Button aus der Desktop-Zelle holen (falls vorhanden) und neu erstellen/anhängen
            const desktopButton = menueZelle.querySelector('.komponenten-bearbeiten-btn');
            if (desktopButton) {
                 let mobilerButton = document.createElement('button');
                 mobilerButton.className = 'komponenten-bearbeiten-btn';
                 mobilerButton.title = 'Komponenten bearbeiten';
                 mobilerButton.innerHTML = '✎';
                 mobilerButton.dataset.tag = tag; // Tag und Kategorie für den Button speichern
                 mobilerButton.dataset.kategorie = kategorieId;

                // Event-Listener für den mobilen Button HINZUFÜGEN
                mobilerButton.addEventListener('click', function(event) {
                     event.stopPropagation(); // Verhindert, dass der Zellenklick ausgelöst wird

                     const button = event.currentTarget;
                     const mobileZelleElement = button.closest('.kategorie-inhalt'); // Die mobile Zelle finden
                     const tag = button.dataset.tag;
                     const kategorie = button.dataset.kategorie;

                     console.log(`Bearbeiten-Button (Mobile) geklickt für ${tag}, ${kategorie}`);

                     if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                         // Finde die korrespondierende Desktop-Zelle
                          const desktopTabelleElement = document.querySelector('.menueplan-tabelle');
                          const desktopZelleElement = findeTabellenZelle(desktopTabelleElement, tag, kategorie);

                          // Übergebe die *Desktop*-Zelle an den Editor (oder mobile, falls der Editor angepasst ist)
                          // Annahme: Der Editor erwartet die Desktop-Zelle für Kontext/Inhalt.
                         if (desktopZelleElement) {
                             window.KomponentenEditor.oeffneKomponentenEditor(desktopZelleElement, tag, kategorie);
                         } else {
                             console.warn(`Konnte Desktop-Zelle für ${tag}/${kategorie} nicht finden. Übergebe mobile Zelle an Editor.`);
                             window.KomponentenEditor.oeffneKomponentenEditor(mobileZelleElement, tag, kategorie); // Fallback
                         }
                     } else {
                         // Fehlerhaften Verweis auf TabeleAdd entfernt. Nur noch Warnung.
                         console.warn('Komponenten-Editor-Funktion (window.KomponentenEditor.oeffneKomponentenEditor) nicht gefunden.');
                     }
                 });
                 kategorieInhalt.appendChild(mobilerButton); // Button an die mobile Zelle anhängen
             }
            
            kategorieContainer.appendChild(kategorieInhalt);
            tagContainer.appendChild(kategorieContainer);
        });
        
        mobileContainer.appendChild(tagContainer);
    });
    
    // Event-Listener für Bearbeiten-Buttons in der mobilen Ansicht hinzufügen
    const bearbeitenButtons = mobileContainer.querySelectorAll('.komponenten-bearbeiten-btn');
    bearbeitenButtons.forEach(button => {
        // Bestehende Listener entfernen, um doppelte zu vermeiden
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
        
        // Neuen Listener hinzufügen
        clone.addEventListener('click', function(event) {
            event.stopPropagation();
            
            // Vorbereitung für die Bearbeitung der Komponenten
            const tag = this.dataset.tag;
            const kategorie = this.dataset.kategorie;
            
            // Öffne das Bearbeitungspanel für diese Kategorie
            if (window.TabeleAdd && typeof window.TabeleAdd.zeigeKomponentenEditor === 'function') {
                window.TabeleAdd.zeigeKomponentenEditor(tag, kategorie, this);
            } else {
                console.warn('Komponenten-Editor-Funktion nicht gefunden');
            }
        });
    });
    
    console.log('Mobile Ansicht wurde erstellt');
}

/**
 * Zeigt eine visuelle Feedback-Animation auf einer Zelle nach einer Portionsänderung.
 * @param {HTMLElement} zelle - Die Zelle (Desktop oder Mobile), auf der die Animation gezeigt werden soll.
 * @param {string} neuePortion - Die neue Portionsgröße ('100%', '50%', '25%', 'none').
 * @param {string} tag - Der Wochentag.
 * @param {string} kategorie - Die Menükategorie.
 * @param {boolean} isExtraKategorie - Ob es sich um eine Extra-Kategorie handelt.
 */
function zeigeFeedbackAnimation(zelle, neuePortion, tag, kategorie, isExtraKategorie) {
    if (!zelle) return;

    // Bestehenden Bearbeiten-Button sichern (falls vorhanden)
    const existingButton = zelle.querySelector('.komponenten-bearbeiten-btn');
    if (existingButton) {
        existingButton.remove(); // Entfernen, bevor innerHTML überschrieben wird
    }

    if (neuePortion !== 'none') {
        // Bearbeitungsklasse entfernen (falls noch vorhanden)
        zelle.classList.remove('zelle-in-bearbeitung');

        // Hintergrundfarbe je nach Portionsgröße
        let feedbackColor;
        if (neuePortion === '100%') feedbackColor = '#4CAF50'; // Grün
        else if (neuePortion === '50%') feedbackColor = '#FF9800'; // Orange
        else feedbackColor = '#90CAF9'; // Hellblau

        // Original-Inhalt der Zelle speichern (vor der Änderung)
        const originalHtml = zelle.innerHTML;

        // Zelle mit Feedback-Element aktualisieren (Prozentsatz anzeigen)
        zelle.style.position = 'relative';
        // Der ursprüngliche Inhalt wird auf 0.1 Opazität gesetzt, nicht ganz versteckt
        zelle.innerHTML = `
            <div style="opacity: 0.1;">${originalHtml}</div>
            <div class="portion-feedback" style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: ${feedbackColor};
                color: ${neuePortion === '25%' ? 'black' : 'white'};
                z-index: 10;
                font-size: 1.5rem;
                font-weight: bold;
            ">${neuePortion}</div>
        `;

        // Nach kurzer Zeit den Feedback-Effekt entfernen und Zellzustand neu aufbauen
        setTimeout(() => {
            // Feedback-Element entfernen und zur normalen Position zurückkehren
            zelle.style.position = '';

            // Originalinhalt wiederherstellen (wichtig, falls Inhalte dynamisch waren)
            zelle.innerHTML = originalHtml;

            // CSS-Klassen für die Portion setzen
            zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen'); // Alte Klassen entfernen

            // Neue Klasse hinzufügen
            zelle.classList.add(`auswahl-${neuePortion.replace('%', '')}`);


            // Sicherstellen, dass die ausgeschlossen-Klasse korrekt gesetzt ist (redundant, aber sicher)
            const aktuelleAuswahlFuerZelle = aktuelleBewohnerAuswahl?.[tag]?.[kategorie];
            let istAusgeschlossen = false;
            if (aktuelleAuswahlFuerZelle) {
                 if (isExtraKategorie) {
                     const ausgeschlosseneKomponenten = aktuelleAuswahlFuerZelle.ausgeschlosseneKomponenten || [];
                     const extraText = aktuelleAuswahlFuerZelle.meals?.[0]?.name || zelle.textContent.replace('✎', '').replace(' (ohne)','').trim();
                     istAusgeschlossen = ausgeschlosseneKomponenten.includes(extraText);
                 } else {
                     // Für Standard-Kategorien, prüfe, ob *irgendeine* Komponente ausgeschlossen ist
                     istAusgeschlossen = aktuelleAuswahlFuerZelle.ausgeschlosseneKomponenten?.length > 0;
                 }
                 // Aktualisiere auch, falls meals[x].ohne === true
                 if (!istAusgeschlossen && aktuelleAuswahlFuerZelle.meals) {
                    istAusgeschlossen = aktuelleAuswahlFuerZelle.meals.some(m => m.ohne === true);
                 }
            }

            if (istAusgeschlossen) {
                zelle.classList.add('ausgeschlossen');
                // Text '(ohne)' hinzufügen, falls nicht vorhanden (und Zelle nicht leer ist)
                if (isExtraKategorie) {
                    const textElement = zelle.firstChild; // Annahme: Text ist erster Knoten
                    if (textElement && textElement.nodeType === Node.TEXT_NODE && !textElement.textContent.includes('(ohne)')) {
                        textElement.textContent = `${textElement.textContent.trim()} (ohne)`;
                    }
                } else {
                    const komponenten = zelle.querySelectorAll('.menue-komponente');
                    komponenten.forEach(komp => {
                       const kompName = komp.textContent.replace(' (ohne)', '').trim();
                       if(aktuelleAuswahlFuerZelle.ausgeschlosseneKomponenten?.includes(kompName) || aktuelleAuswahlFuerZelle.meals?.find(m => m.name === kompName)?.ohne === true) {
                           if (!komp.textContent.includes('(ohne)')) {
                               komp.textContent = `${kompName} (ohne)`;
                           }
                           komp.classList.add('ausgeschlossen'); // Sicherstellen
                       } else {
                            komp.classList.remove('ausgeschlossen');
                            komp.textContent = kompName; // '(ohne)' entfernen
                       }
                    });
                }

            } else {
                 zelle.classList.remove('ausgeschlossen');
                 // '(ohne)' entfernen
                 if (isExtraKategorie) {
                     const textElement = zelle.firstChild;
                     if (textElement && textElement.nodeType === Node.TEXT_NODE) {
                         textElement.textContent = textElement.textContent.replace(' (ohne)', '').trim();
                     }
                 } else {
                      const komponenten = zelle.querySelectorAll('.menue-komponente');
                      komponenten.forEach(komp => {
                           komp.classList.remove('ausgeschlossen');
                           komp.textContent = komp.textContent.replace(' (ohne)', '').trim();
                      });
                 }
            }


            // Direkte Farbgebung entfernen (sollte über CSS-Klassen gesteuert werden)
            zelle.style.backgroundColor = '';
            zelle.style.color = '';
            zelle.style.border = '';

            // Bearbeiten-Button neu erstellen/hinzufügen, falls benötigt
            if (window.KomponentenEditor && typeof window.KomponentenEditor.erstelleBearbeitenButton === 'function') {
                 // Stelle sicher, dass der Editor die richtige Zelle (Desktop oder Mobile) bekommt
                window.KomponentenEditor.erstelleBearbeitenButton(zelle);
            } else {
                // Manueller Fallback (sollte idealerweise nicht nötig sein)
                console.warn("Fallback für Bearbeiten-Button-Erstellung genutzt.");
                let button = document.createElement('button');
                button.className = 'komponenten-bearbeiten-btn';
                // ... (Restliche Button-Erstellung wie vorher) ...
                 button.addEventListener('click', function handleButtonClick(event) {
                     event.stopPropagation();
                     // ... (Editor öffnen, wie im Original) ...
                     if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                           const btnZelle = event.target.closest('.menue-zelle, .kategorie-inhalt');
                           const btnTag = btnZelle?.dataset.tag;
                           const btnKategorie = btnZelle?.dataset.kategorie;
                           if(btnZelle && btnTag && btnKategorie) {
                               window.KomponentenEditor.oeffneKomponentenEditor(btnZelle, btnTag, btnKategorie);
                           } else {
                                console.error("Konnte Zelle, Tag oder Kategorie für Bearbeiten-Button nicht finden.")
                           }
                     }
                 });
                 zelle.appendChild(button);
            }
        }, 600); // Ende des Timeouts für das Feedback

    } else { // Wenn neuePortion === 'none'
        // Formatierung zurücksetzen
        zelle.classList.remove('auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen', 'zelle-in-bearbeitung');
        zelle.style.backgroundColor = '';
        zelle.style.color = '';
        zelle.style.border = '';

        // Entferne den Bearbeiten-Button (bereits oben entfernt)

        // Entferne alle Extra-Hinweise (falls vorhanden)
        const extraHinweise = zelle.querySelector('.extra-hinweise');
        if (extraHinweise) {
            extraHinweise.remove();
        }

        // Entferne alle (ohne) Kennzeichnungen
        const textElement = zelle.firstChild;
         if (textElement && textElement.nodeType === Node.TEXT_NODE) {
             textElement.textContent = textElement.textContent.replace(' (ohne)', '').trim();
         }
        const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
        komponentenElemente.forEach(element => {
            element.classList.remove('ausgeschlossen');
            element.textContent = element.textContent.replace(' (ohne)', '').trim();
        });
    }
}

/**
 * Behandelt einen Klick auf eine Tabellenzelle (Desktop oder Mobile)
 * @param {HTMLElement} zelle - Die geklickte Zelle (kann Desktop oder Mobile sein)
 * @param {Event|null} eventObj - Das Event-Objekt (optional)
 */
async function handleZellenKlick(zelle, eventObj) {
    // DEBUG: Prüfen ob die Funktion aufgerufen wird
    console.log('handleZellenKlick aufgerufen für Zelle:', zelle);

    // Tag und Kategorie aus den Datenattributen der Zelle extrahieren
    const tag = zelle.dataset.tag;
    const kategorie = zelle.dataset.kategorie;

    if (!tag || !kategorie) {
        console.error('Zelle hat keine Tag oder Kategorie Attribute');
        return;
    }

    // WICHTIG: Zuerst prüfen, ob der Klick auf den Bearbeiten-Button erfolgte
    if (eventObj && eventObj.target) {
        const target = eventObj.target;
        const editButton = target.closest('.komponenten-bearbeiten-btn');
        if (editButton) {
            console.log('Klick auf Bearbeiten-Button erkannt - Aktion wird vom Button-Handler ausgeführt');
            // Event stoppen, um zu verhindern, dass der Click auch die Zelle aktiviert
            eventObj.stopPropagation();
            eventObj.preventDefault();
            // Der eigentliche Editor-Aufruf erfolgt durch den Event-Listener des Buttons selbst
            return; // Keine weitere Verarbeitung des Zellenklicks
        }
        // Klick auf andere Buttons ignorieren
        if (target.tagName === 'BUTTON' || target.closest('button')) {
            console.log('Klick auf anderen Button innerhalb der Zelle erkannt - ignoriere Zellenklick');
             eventObj.stopPropagation(); // Verhindern, dass der Klick die Zelle auslöst
            return;
        }
    }

    // Prüfen, ob gerade eine Zelle bearbeitet wird
    if (window.istZelleInBearbeitung) {
        console.log(`Klick ignoriert: Eine andere Zelle wird gerade bearbeitet (${tag}, ${kategorie})`);
        return;
    }

    console.log(`Zelle geklickt: ${tag}, ${kategorie} (Typ: ${zelle.classList.contains('kategorie-inhalt') ? 'Mobile' : 'Desktop'})`);

    // Doppelklick-Schutz
    const lastClickTime = parseInt(zelle.dataset.lastClickTime || '0');
    const now = Date.now();
    if (now - lastClickTime < 300) {
        console.log(`Klicks zu schnell hintereinander, ignoriere diesen Klick (${tag}, ${kategorie})`);
        return;
    }
    zelle.dataset.lastClickTime = now.toString();

    // Identifiziere Desktop- und Mobile-Zellen
    const istMobileKlick = zelle.classList.contains('kategorie-inhalt');
    const desktopTabelle = document.querySelector('.menueplan-tabelle');
    const mobileContainer = document.querySelector('.mobile-menueplan-container');

    let desktopZelle = istMobileKlick ? findeTabellenZelle(desktopTabelle, tag, kategorie) : zelle;
    let mobileZelle = istMobileKlick ? zelle : mobileContainer?.querySelector(`.kategorie-inhalt[data-tag="${tag}"][data-kategorie="${kategorie}"]`);

    // Die Verarbeitung starten und *beide* Zellen als "in Bearbeitung" markieren
    window.istZelleInBearbeitung = true;
    if(desktopZelle) desktopZelle.classList.add('zelle-in-bearbeitung');
    if(mobileZelle) mobileZelle.classList.add('zelle-in-bearbeitung');

    try {
        // Prüfen, ob ein Bewohner ausgewählt ist
        if (!aktuellerBewohner) {
            console.warn('Kein Bewohner ausgewählt, bitte wählen Sie zuerst einen Bewohner aus');
            alert('Bitte wählen Sie zuerst einen Bewohner aus, bevor Sie eine Essensauswahl treffen.');
            throw new Error("Kein Bewohner ausgewählt"); // Fehler werfen, um in finally aufzuräumen
        }

        // Sicherstellen, dass wir die aktuellen Daten haben (lade nur wenn nötig)
        if (!aktuelleBewohnerAuswahl || !aktuelleBewohnerAuswahl.name || aktuelleBewohnerAuswahl.name !== aktuelleBewohnerName) {
             const kalenderWocheAnzeige = document.querySelector('#current-week-display');
             if (!kalenderWocheAnzeige) throw new Error("Kalenderwochenanzeige nicht gefunden.");
             const kalenderWoche = kalenderWocheAnzeige.textContent;
             const match = kalenderWoche.match(/KW\s*(\d+)\/(\d+)/);
             if (match) {
                 const kw = parseInt(match[1]);
                 const jahr = parseInt(match[2]);
                 console.log(`Lade Bewohnerinformationen vor Zellenklick (${tag}, ${kategorie})`);
                 await ladeBewohnerAuswahl(aktuellerBewohner, kw, jahr);
             } else {
                 throw new Error("Konnte aktuelle Kalenderwoche nicht ermitteln.");
             }
        }

        // Aktuelle Portion ermitteln (aus der globalen Auswahl, nicht aus der Zelle)
        let aktuellePortion = 'none';
        if (aktuelleBewohnerAuswahl && aktuelleBewohnerAuswahl[tag] && aktuelleBewohnerAuswahl[tag][kategorie]) {
            aktuellePortion = aktuelleBewohnerAuswahl[tag][kategorie].portion || 'none';
        }
        console.log(`Aktuelle Portion (aus Daten) für ${tag}, ${kategorie}: ${aktuellePortion}`);

        // Neue Portion bestimmen
        let neuePortion;
        const isExtraKategorie = kategorie.startsWith('extra_');

        if (isExtraKategorie) {
            neuePortion = aktuellePortion === '100%' ? 'none' : '100%';
        } else {
            switch (aktuellePortion) {
                case '100%': neuePortion = '50%'; break;
                case '50%': neuePortion = '25%'; break;
                case '25%': neuePortion = 'none'; break;
                default: neuePortion = '100%'; break;
            }
        }
        console.log(`Neue Portion für ${tag}, ${kategorie}: ${neuePortion}`);

        // Mahlzeiten aus der *Desktop*-Zelle extrahieren (da diese als Referenz dient)
        // oder wenn keine Desktop-Zelle da ist (unwahrscheinlich), aus der Mobilen
        const referenzZelle = desktopZelle || mobileZelle;
        const mahlzeiten = [];
         if (referenzZelle) {
            const mahlzeitElemente = referenzZelle.querySelectorAll('.menue-komponente');
            mahlzeitElemente.forEach(element => {
                if (element.dataset.rezeptId) {
                    mahlzeiten.push({
                        rezeptId: element.dataset.rezeptId,
                        // Text ohne "(ohne)" nehmen
                        name: element.textContent.replace(' (ohne)', '').trim()
                    });
                }
            });

            // Fallback für Extra-Kategorien
            if (mahlzeiten.length === 0 && isExtraKategorie) {
                let extraKategorieTitle = '';
                const extraKategorieId = kategorie.substring(6);
                if (window.TabeleAdd && window.TabeleAdd.extraKategorien) {
                    const extraKategorie = window.TabeleAdd.extraKategorien.find(k => k.id === extraKategorieId);
                    if (extraKategorie) extraKategorieTitle = extraKategorie.displayKategorie;
                }
                mahlzeiten.push({
                    // Text ohne Bearbeiten-Button und "(ohne)"
                    name: referenzZelle.textContent.replace('✎', '').replace(' (ohne)', '').trim(),
                    isExtraKategorie: true,
                    extraKategorieTitle: extraKategorieTitle
                });
            }
        } else {
             console.warn(`Keine Referenzzelle gefunden für ${tag}, ${kategorie} - Mahlzeiten können nicht extrahiert werden.`);
        }


        // Menüauswahl aktualisieren und auf dem Server speichern
        const erfolg = await aktualisiereMenueAuswahl(tag, kategorie, neuePortion, mahlzeiten);

        if (erfolg) {
            // Bearbeitungsstatus hier schon zurücksetzen, da die Aktion erfolgreich war
             window.istZelleInBearbeitung = false;

            // Animation auf beiden Zellen anwenden (falls vorhanden)
            console.log(`Anwenden der Animation auf Desktop ${desktopZelle ? 'gefunden' : 'nicht gefunden'}, Mobile ${mobileZelle ? 'gefunden' : 'nicht gefunden'}`);
            if (desktopZelle) {
                zeigeFeedbackAnimation(desktopZelle, neuePortion, tag, kategorie, isExtraKategorie);
            }
            if (mobileZelle) {
                // Wende Animation auf die mobile Zelle an
                 zeigeFeedbackAnimation(mobileZelle, neuePortion, tag, kategorie, isExtraKategorie);
            }

            console.log(`Zellstatus nach erfolgreicher Verarbeitung: ${tag}, ${kategorie}, Portion: ${neuePortion}, Bearbeitung: ${window.istZelleInBearbeitung ? 'Ja' : 'Nein'}`);
        } else {
            // Fehler beim Speichern
            console.error(`Fehler beim Speichern der Auswahl für ${tag}, ${kategorie}`);
            alert(`Fehler beim Speichern der Auswahl für ${tag}, ${kategorie}. Bitte versuchen Sie es erneut.`);
            // Fehler werfen, um in finally aufzuräumen
            throw new Error(`Fehler beim Speichern der Auswahl für ${tag}, ${kategorie}`);
        }
    } catch (error) {
        console.error(`Fehler beim Verarbeiten des Zellenklicks für ${tag}, ${kategorie}:`, error);
        // Nur Alert anzeigen, wenn es kein "Kein Bewohner" Fehler war
        if (error.message !== "Kein Bewohner ausgewählt" && !error.message.startsWith("Fehler beim Speichern")) {
            alert(`Fehler beim Verarbeiten der Auswahl: ${error.message}`);
        }
    } finally {
        // WICHTIG: Immer sicherstellen, dass der Bearbeitungsstatus zurückgesetzt wird
        window.istZelleInBearbeitung = false;
        // Klassen von beiden Zellen entfernen
        if (desktopZelle) desktopZelle.classList.remove('zelle-in-bearbeitung');
        if (mobileZelle) mobileZelle.classList.remove('zelle-in-bearbeitung');
         console.log(`Bearbeitungsstatus final zurückgesetzt für ${tag}, ${kategorie}`);
    }
}