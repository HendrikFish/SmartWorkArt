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
    
    // Wenn Portion "none" ist, die Kategorie aus der Auswahl entfernen
    if (portion === 'none') {
        if (aktuelleBewohnerAuswahl[tag][kategorie]) {
            delete aktuelleBewohnerAuswahl[tag][kategorie];
            console.log(`Kategorie ${kategorie} für ${tag} entfernt`);
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
                            // Bereits eine Mahlzeit gefunden, die ausgeschlossen ist
                            break;
                        }
                    }
                } else {
                    // Bei standard Kategorien die einzelnen Komponenten durchgehen
                    const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
                    
                    // Über alle meals-Einträge iterieren
                    auswahl.meals.forEach(mahlzeit => {
                        // Wenn diese Mahlzeit als "ohne" markiert ist
                        if (mahlzeit.ohne === true) {
                            // Entsprechendes Element in der Tabelle finden
                            const element = Array.from(komponentenElemente).find(el => 
                                el.textContent.replace(' (ohne)', '').trim() === mahlzeit.name
                            );
                            
                            // Wenn gefunden, als ausgeschlossen markieren
                            if (element) {
                                element.classList.add('ausgeschlossen');
                                
                                // "ohne" hinzufügen, wenn nicht bereits vorhanden
                                if (!element.textContent.includes('(ohne)')) {
                                    element.textContent = `${mahlzeit.name} (ohne)`;
                                }
                            }
                        }
                    });
                }
            }
            
            // Extra-Menü-Optionen anzeigen
            if (auswahl.extraMenueAuswahl && auswahl.extraMenueAuswahl.length > 0) {
                // Container für Extra-Hinweise erstellen
                const extraHinweiseContainer = document.createElement('div');
                extraHinweiseContainer.className = 'extra-hinweise';
                
                // Titel-Element
                const titelElement = document.createElement('div');
                titelElement.className = 'extra-hinweis-titel';
                titelElement.textContent = 'Extras:';
                extraHinweiseContainer.appendChild(titelElement);
                
                // Liste der Extra-Optionen
                const listeElement = document.createElement('div');
                listeElement.className = 'extra-hinweis-liste';
                
                // Namen der Extra-Optionen anhand ihrer IDs aus den global verfügbaren Listen abrufen
                const extraNamen = [];
                auswahl.extraMenueAuswahl.forEach(extraId => {
                    // Zuerst versuchen, den Namen aus extraMenues zu holen (falls vorhanden im window-Objekt)
                    if (window.KomponentenEditorData && window.KomponentenEditorData.extraMenues) {
                        const extraMenue = window.KomponentenEditorData.extraMenues.find(m => m.id === extraId);
                        if (extraMenue) {
                            extraNamen.push(extraMenue.name);
                            return;
                        }
                    }
                    
                    // Falls nicht gefunden, versuchen aus extraWuensche zu holen
                    if (window.KomponentenEditorData && window.KomponentenEditorData.extraWuensche) {
                        const extraWunsch = window.KomponentenEditorData.extraWuensche.find(w => w.id === extraId);
                        if (extraWunsch) {
                            extraNamen.push(extraWunsch.name);
                            return;
                        }
                    }
                    
                    // Fallback: ID verwenden, wenn kein Name gefunden wurde
                    extraNamen.push(extraId);
                });
                
                listeElement.textContent = extraNamen.join(', ');
                extraHinweiseContainer.appendChild(listeElement);
                
                // Container zur Zelle hinzufügen
                zelle.appendChild(extraHinweiseContainer);
            }
            
            // Notizen anzeigen, falls vorhanden
            if (auswahl.notizen && auswahl.notizen.trim() !== '') {
                // Falls bereits ein Extra-Hinweise-Container existiert, diesen nutzen
                let extraHinweiseContainer = zelle.querySelector('.extra-hinweise');
                if (!extraHinweiseContainer) {
                    extraHinweiseContainer = document.createElement('div');
                    extraHinweiseContainer.className = 'extra-hinweise';
                    zelle.appendChild(extraHinweiseContainer);
                }
                
                // Notiz-Element erstellen
                const notizElement = document.createElement('div');
                notizElement.className = 'extra-hinweis-notiz';
                notizElement.textContent = auswahl.notizen;
                extraHinweiseContainer.appendChild(notizElement);
            }
            
            // "Bearbeiten"-Button hinzufügen
            if (window.KomponentenEditor && typeof window.KomponentenEditor.erstelleBearbeitenButton === 'function') {
                window.KomponentenEditor.erstelleBearbeitenButton(zelle);
            }
        });
    });
    
    // WICHTIG: Nach der Aktualisierung der Inhalte die Klick-Handler neu hinzufügen
    fuegeZellenKlickHinzu(tabelle, true);
    
    // Mobile Ansicht aktualisieren
    aktualisiereZellenInMobileAnsicht();
    
    return true;
}

/**
 * Fügt Klick-Handler zu den Tabellenzellen hinzu
 * @param {HTMLTableElement} tabelle - Die Menüplantabelle
 * @param {boolean} forceReattach - Ob bestehende Handler entfernt und neu hinzugefügt werden sollen
 */
function fuegeZellenKlickHinzu(tabelle, forceReattach = false) {
    if (!tabelle) {
        console.error('Keine Tabelle für Klick-Handler vorhanden');
        return;
    }
    
    console.log('Füge Klick-Handler zu Tabellenzellen hinzu', forceReattach ? '(erzwinge Neuverknüpfung)' : '');
    
    // Alle Zellen mit einem Klick-Handler versehen
    const zellen = tabelle.querySelectorAll('td[data-tag]');
    console.log(`${zellen.length} Zellen gefunden für Klick-Handler`);
    
    zellen.forEach(zelle => {
        // Wenn erzwungene Neuverknüpfung oder noch kein Handler existiert
        if (forceReattach || zelle.dataset.hasClickHandler !== 'true') {
            const tag = zelle.dataset.tag;
            const kategorie = zelle.getAttribute('data-kategorie') || zelle.closest('tr')?.dataset.kategorie;
            
            if (!tag || !kategorie) {
                console.warn('Zelle ohne Tag oder Kategorie gefunden, überspringe');
                return;
            }
            
            // Bei Neuverknüpfung den alten Event-Listener entfernen
            if (forceReattach && zelle.dataset.hasClickHandler === 'true') {
                console.log(`Erneuere Klick-Handler für ${tag}, ${kategorie}`);
                // Alle bestehenden Klick-Listener entfernen durch Klonen des Elements
                const oldZelle = zelle;
                const newZelle = oldZelle.cloneNode(true);
                oldZelle.parentNode.replaceChild(newZelle, oldZelle);
                zelle = newZelle; // Referenz aktualisieren
            }
            
            // Sicherstellen, dass die Zelle eine ID hat
            if (!zelle.id) {
                zelle.id = `zelle-${tag}-${kategorie}`;
            }
            
            // Klasse für Hover-Effekt hinzufügen
            zelle.classList.add('klickbar');
            
            // Klick-Event hinzufügen
            zelle.addEventListener('click', async (event) => {
                // Verhindern, dass das Ereignis mehrfach ausgelöst wird
                event.stopPropagation();
                
                // Visuelles Feedback während der Verarbeitung
                const originalBackground = zelle.style.backgroundColor;
                zelle.style.backgroundColor = '#e0e0e0';
                
                try {
                    await handleZellenKlick(zelle, tag, kategorie, event);
                } catch (error) {
                    console.error(`Fehler beim Behandeln des Zellenklicks für ${tag}, ${kategorie}:`, error);
                    
                    // Zurück zur ursprünglichen Farbe bei Fehler
                    zelle.style.backgroundColor = originalBackground;
                    
                    // Fehlermeldung anzeigen
                    alert(`Fehler beim Verarbeiten der Auswahl: ${error.message}`);
                }
            });
            
            // Markieren, dass Handler hinzugefügt wurde
            zelle.dataset.hasClickHandler = 'true';
        }
    });
    
    console.log('Alle Klick-Handler zu Tabellenzellen hinzugefügt');
}

/**
 * Aktualisiert eine Zelle in der mobilen Ansicht basierend auf der Original-Zelle
 * @param {HTMLElement} originaleZelle - Die Original-Zelle aus der Desktop-Ansicht
 */
function aktualisiereZellInMobileAnsicht(originaleZelle) {
    // Prüfen, ob wir auf einem mobilen Gerät sind
    const isMobile = window.innerWidth <= 767;
    if (!isMobile) return;

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
    
    // Entsprechende mobile Zelle finden
    const mobileZelle = mobileContainer.querySelector(
        `.kategorie-inhalt[data-tag="${tag}"][data-kategorie="${kategorie}"]`
    );
    
    if (!mobileZelle) {
        console.warn(`Keine entsprechende mobile Zelle für ${tag}, ${kategorie} gefunden`);
        return;
    }
    
    // Alten Button vor der Aktualisierung entfernen, damit wir keine doppelten Event-Listener haben
    const alteButton = mobileZelle.querySelector('.komponenten-bearbeiten-btn');
    if (alteButton) {
        alteButton.remove();
    }
    
    // Inhalt synchronisieren (HTML kopieren, aber ohne Button)
    const originalHtmlOhneButton = originaleZelle.innerHTML.replace(/<button[^>]*komponenten-bearbeiten-btn[^>]*>.*?<\/button>/g, '');
    mobileZelle.innerHTML = originalHtmlOhneButton;
    
    // Klassen synchronisieren (besonders wichtig für die Auswahl-Klassen)
    ['auswahl-100', 'auswahl-50', 'auswahl-25', 'ausgeschlossen'].forEach(klasse => {
        if (originaleZelle.classList.contains(klasse)) {
            mobileZelle.classList.add(klasse);
        } else {
            mobileZelle.classList.remove(klasse);
        }
    });
    
    // Für Extra-Kategorien sicherstellen, dass der Text korrekt ist (mit oder ohne "(ohne)")
    const isExtraKategorie = kategorie.startsWith('extra_');
    if (isExtraKategorie) {
        // Wenn die ursprüngliche Zelle die Klasse "ausgeschlossen" hat, sicherstellen, dass der mobile Text identisch ist
        if (originaleZelle.classList.contains('ausgeschlossen')) {
            const zellenText = mobileZelle.textContent.replace('✎', '').trim();
            if (!zellenText.includes('(ohne)')) {
                const originalText = zellenText.replace(' (ohne)', '').trim();
                
                // Text mit "(ohne)" setzen
                mobileZelle.textContent = `${originalText} (ohne)`;
            }
        } else if (!originaleZelle.classList.contains('ausgeschlossen')) {
            // Falls die Zelle nicht ausgeschlossen ist, sicherstellen, dass kein "(ohne)" im Text ist
            const zellenText = mobileZelle.textContent.replace('✎', '').trim();
            if (zellenText.includes('(ohne)')) {
                const originalText = zellenText.replace(' (ohne)', '').trim();
                
                // Text ohne "(ohne)" setzen
                mobileZelle.textContent = originalText;
            }
        }
    }
    
    // Bearbeiten-Button für ausgewählte Zellen anpassen oder neu erstellen
    if (mobileZelle.classList.contains('auswahl-100') || 
        mobileZelle.classList.contains('auswahl-50') || 
        mobileZelle.classList.contains('auswahl-25')) {
        
        // Immer einen neuen Button erstellen
        const bearbeitenButton = document.createElement('button');
        bearbeitenButton.className = 'komponenten-bearbeiten-btn';
        bearbeitenButton.title = 'Komponenten bearbeiten';
        bearbeitenButton.innerHTML = '✎';
        bearbeitenButton.id = `btn-${tag}-${kategorie}`;
        
        // Wichtig: zIndex und pointer-events explizit setzen
        bearbeitenButton.style.zIndex = '1000';
        bearbeitenButton.style.pointerEvents = 'auto';
        bearbeitenButton.style.position = 'absolute';
        bearbeitenButton.style.display = 'flex';
        
        // Event-Listener für den Button definieren
        const handleButtonClick = function(event) {
            // Alle Event-Propagation stoppen (sowohl Bubbling als auch Capturing)
            event.stopPropagation();
            event.preventDefault();
            
            // Verhindere, dass der Klick die Zelle aktiviert oder weitere Events auslöst
            event.cancelBubble = true;
            
            console.log('Bearbeiten-Button angeklickt für', tag, kategorie);
            
            // Mit kurzer Verzögerung öffnen, um sicherzustellen, dass keine weiteren Events ausgelöst werden
            setTimeout(() => {
                if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                    window.KomponentenEditor.oeffneKomponentenEditor(originaleZelle, tag, kategorie);
                }
            }, 10);
        };
        
        // Event-Listener hinzufügen (mit mehreren Methoden für maximale Kompatibilität)
        bearbeitenButton.addEventListener('click', handleButtonClick);
        bearbeitenButton.addEventListener('touchend', handleButtonClick);
        
        // Button zur Zelle hinzufügen
        mobileZelle.appendChild(bearbeitenButton);
        
        // Zusätzlich Doppelklick-Handler hinzufügen als alternative Bedienungsmöglichkeit
        if (mobileZelle.dataset.hasDblClickHandler !== 'true') {
            mobileZelle.addEventListener('dblclick', () => {
                if (window.KomponentenEditor && typeof window.KomponentenEditor.oeffneKomponentenEditor === 'function') {
                    window.KomponentenEditor.oeffneKomponentenEditor(originaleZelle, tag, kategorie);
                }
            });
            mobileZelle.dataset.hasDblClickHandler = 'true';
        }
    } else {
        // Wenn keine Auswahl besteht, Bearbeiten-Button entfernen
        const bearbeitenButton = mobileZelle.querySelector('.komponenten-bearbeiten-btn');
        if (bearbeitenButton) bearbeitenButton.remove();
    }
}

/**
 * Aktualisiert alle Zellen in der mobilen Ansicht
 */
function aktualisiereZellenInMobileAnsicht() {
    // Prüfen, ob wir auf einem mobilen Gerät sind
    const isMobile = window.innerWidth <= 767;
    if (!isMobile) return;
    
    // Mobile-Container suchen
    const mobileContainer = document.querySelector('.mobile-menueplan-container');
    if (!mobileContainer) {
        console.log('Kein Mobile-Container gefunden, überspringe Aktualisierung');
        return;
    }
    
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
            const originalTextContent = zelle.textContent.trim();
            
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
            
            // Mobile Ansicht aktualisieren
            aktualisiereZellInMobileAnsicht(zelle);
        }
        
        return true;
    }
    
    return false;
}

/**
 * Behandelt einen Klick auf eine Tabellenzelle
 * @param {HTMLElement} zelle - Die geklickte Tabellenzelle
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "suppe")
 * @param {Event|null} eventObj - Das Event-Objekt (optional)
 */
async function handleZellenKlick(zelle, tag, kategorie, eventObj) {
    console.log(`Zelle geklickt: ${tag}, ${kategorie}`);
    
    // Prüfen, ob der Klick vom Bearbeiten-Button kam
    if (eventObj && eventObj.target) {
        // Prüfen, ob das geklickte Element oder eines seiner Elternelemente der Bearbeiten-Button ist
        const isEditButtonClick = eventObj.target.classList.contains('komponenten-bearbeiten-btn') || 
                                eventObj.target.closest('.komponenten-bearbeiten-btn');
        
        if (isEditButtonClick) {
            console.log('Klick kam vom Bearbeiten-Button, wird ignoriert');
            return;
        }
    }
    
    // Prüfen, ob der Klick auf ein Element innerhalb des Bearbeiten-Buttons erfolgte
    if (eventObj && eventObj.target) {
        const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
        if (bearbeitenButton && (bearbeitenButton.contains(eventObj.target) || eventObj.target === bearbeitenButton)) {
            console.log('Klick auf Element innerhalb des Bearbeiten-Buttons, wird ignoriert');
            return;
        }
    }
    
    // Prüfen, ob der letzte Klick zu kurz her ist (Schutz vor ungewollten Doppelklicks)
    if (zelle.dataset.lastClickTime) {
        const lastClickTime = parseInt(zelle.dataset.lastClickTime);
        const now = Date.now();
        // Wenn der letzte Klick weniger als 300ms her ist, ignorieren (verhindert unbeabsichtigte Doppelklicks)
        if (now - lastClickTime < 300) {
            console.log('Klicks zu schnell hintereinander, ignoriere diesen Klick');
            return;
        }
    }
    // Aktuelle Zeit für den Klick speichern
    zelle.dataset.lastClickTime = Date.now().toString();
    
    // Erkennen, ob es sich um eine Extra-Kategorie handelt
    const isExtraKategorie = kategorie.startsWith('extra_');
    if (isExtraKategorie) {
        console.log(`Erkannt als Extra-Kategorie: ${kategorie}`);
    }
    
    // Prüfen, ob ein Bewohner ausgewählt ist
    if (!aktuellerBewohner) {
        console.warn('Kein Bewohner ausgewählt, bitte wählen Sie zuerst einen Bewohner aus');
        alert('Bitte wählen Sie zuerst einen Bewohner aus, bevor Sie eine Essensauswahl treffen.');
        return;
    }
    
    // Sicherstellen, dass wir die aktuellen Daten haben
    if (!aktuelleBewohnerAuswahl || !aktuelleBewohnerAuswahl.name) {
        try {
            // Versuche, aktuelle Auswahl zu laden oder zu erstellen
            const kalenderWoche = document.querySelector('#current-week-display').textContent;
            const match = kalenderWoche.match(/KW\s*(\d+)\/(\d+)/);
            
            if (match) {
                const kw = parseInt(match[1]);
                const jahr = parseInt(match[2]);
                
                console.log('Aktualisierte Bewohnerinformationen werden geladen vor dem Zellenklick');
                await ladeBewohnerAuswahl(aktuellerBewohner, kw, jahr);
            } else {
                console.error('Konnte aktuelle Kalenderwoche nicht ermitteln');
                alert('Ein Fehler ist aufgetreten beim Ermitteln der aktuellen Kalenderwoche. Bitte aktualisieren Sie die Seite.');
                return;
            }
        } catch (error) {
            console.error('Fehler beim Laden der aktuellen Auswahl:', error);
            alert('Ein Fehler ist aufgetreten. Bitte aktualisieren Sie die Seite und versuchen Sie es erneut.');
            return;
        }
    }
    
    // Portionsgröße rotieren und Zelle aktualisieren mit sofortigem Speichern
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
        } else {
            console.error(`Fehler beim Speichern der Auswahl für ${tag}, ${kategorie}`);
            alert('Fehler beim Speichern der Auswahl. Bitte versuchen Sie es erneut.');
        }
    } catch (error) {
        console.error('Fehler beim Rotieren der Portionsgröße:', error);
        alert(`Fehler beim Ändern der Portionsgröße: ${error.message}`);
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
 * Speichert den aktuellen Bewohner und setzt alle zugehörigen Variablen
 * @param {Object} bewohner - Der ausgewählte Bewohner
 */
function setzeAktuellenBewohner(bewohner) {
    console.log(`Bewohner wird gesetzt: ${bewohner.firstName} ${bewohner.lastName}`);
    
    // Alten Bewohner vollständig zurücksetzen
    if (aktuellerBewohner && (aktuellerBewohner.firstName !== bewohner.firstName || aktuellerBewohner.lastName !== bewohner.lastName)) {
        console.log(`Wechsel des Bewohners von ${aktuellerBewohner.firstName} ${aktuellerBewohner.lastName} zu ${bewohner.firstName} ${bewohner.lastName}`);
        resetAuswahl();
    }
    
    // Neuen Bewohner setzen
    aktuellerBewohner = bewohner;
    aktuelleBewohnerName = `${bewohner.firstName}_${bewohner.lastName}`.trim().replace(/\s+/g, '_');
    
    // Automatisch auch die aktuelle Auswahl für diesen Bewohner laden, falls KW und Jahr bekannt sind
    if (aktuelleKW && aktuellesJahr) {
        console.log(`Lade automatisch Bewohnerauswahl für ${aktuelleBewohnerName} (KW${aktuelleKW}/${aktuellesJahr})`);
        return ladeBewohnerAuswahl(bewohner, aktuelleKW, aktuellesJahr)
            .then(result => {
                // Nach dem Laden auch direkt die Tabelle aktualisieren
                const tabelle = document.querySelector('.menueplan-tabelle');
                if (tabelle) {
                    console.log("Plan wird nach Bewohnerwechsel neu geladen");
                    aktualisiereTabelle(tabelle);
                    
                    // Sicherstellen, dass alle Klick-Handler aktiv sind
                    fuegeZellenKlickHinzu(tabelle, true);
                }
                return result;
            });
    } else {
        console.log('Kalenderwoche/Jahr nicht bekannt, Auswahl wird nicht automatisch geladen');
        return Promise.resolve({ auswahl: null, isExisting: false });
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
                // Bestehende Auswahl zurücksetzen
                resetAuswahl();
                
                // Neue Auswahl laden
                await ladeBewohnerAuswahl(aktuellerBewohner, aktuelleKW, aktuellesJahr);
                
                // Tabelle aktualisieren, falls vorhanden
                const tabelle = document.querySelector('.menueplan-tabelle');
                if (tabelle) {
                    aktualisiereTabelle(tabelle);
                    
                    // Sicherstellen, dass die Klick-Handler explizit hinzugefügt werden
                    console.log('Füge Klick-Handler nach Kalenderwochenwechsel hinzu');
                    fuegeZellenKlickHinzu(tabelle, true);
                }
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
        } else {
            // Ansonsten einfach Klick-Handler hinzufügen
            fuegeZellenKlickHinzu(tabelle, true);
        }
    });
    
    // Event-Listener für Bewohnerwechsel
    document.addEventListener('bewohnerCardClicked', async (event) => {
        const { bewohner } = event.detail;
        console.log(`Event für Bewohnerwechsel empfangen: ${bewohner.firstName} ${bewohner.lastName}`);
        
        // Bewohner setzen und Auswahl laden (enthält bereits die Tabellenaktualisierung)
        await setzeAktuellenBewohner(bewohner);
        
        // Hier ist kein erneutes aktualisiereTabelle notwendig, da es bereits in setzeAktuellenBewohner erfolgt
    });
    
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
 * @param {string} kategorie - Die Kategorie (z.B. "menue1" oder "extra_kaltePlatte")
 * @returns {HTMLElement|null} - Die gefundene Zelle oder null, wenn keine gefunden wurde
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

// Module exportieren
export {
    initialisiere,
    getAktuelleBewohnerAuswahl,
    aktualisiereTabelle,
    speichereBewohnerAuswahl,
    resetAuswahl,
    setzeAktuellenBewohner,
    aktualisiereMenueAuswahl,
    findeTabellenZelle,
    aktualisiereZellInMobileAnsicht,
    aktualisiereZellenInMobileAnsicht,
    handleZellenKlick,
    ladeBewohnerAuswahl
}; 