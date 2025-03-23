/**
 * Modul für die Bearbeitung von Essenskomponenten in der SoloMenü-Anwendung
 * Ermöglicht das Hinzufügen von Notizen, Abwählen von Komponenten und Auswählen von Optionen
 */

// Module-Imports
import * as BewohnerAuswahl from './bewohnerAuswahl.js';

// Globale Variablen
let aktiveZelle = null;
let aktiverTag = null;
let aktiveKategorie = null;
let extraMenues = [];
let extraWuensche = [];

/**
 * Erstellt das Komponenten-Editor-Panel im DOM, falls es noch nicht existiert
 * @returns {HTMLElement} Das erzeugte oder bereits existierende Panel
 */
function erstellePanel() {
    // Prüfen, ob das Panel bereits existiert
    let panel = document.getElementById('komponenten-editor-panel');
    if (panel) return panel;

    // Overlay für Hintergrund erstellen
    const overlay = document.createElement('div');
    overlay.id = 'komponenten-editor-overlay';
    overlay.classList.add('overlay');
    overlay.addEventListener('click', schliessePanel);
    document.body.appendChild(overlay);

    // Panel erstellen
    panel = document.createElement('div');
    panel.id = 'komponenten-editor-panel';
    panel.classList.add('panel');

    // Panel-Header
    const panelHeader = document.createElement('div');
    panelHeader.classList.add('panel-header');

    const panelTitle = document.createElement('div');
    panelTitle.classList.add('panel-title');
    panelTitle.textContent = 'Komponenten bearbeiten';

    const closeButton = document.createElement('button');
    closeButton.classList.add('close-panel');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', schliessePanel);

    panelHeader.appendChild(panelTitle);
    panelHeader.appendChild(closeButton);

    // Panel-Content
    const panelContent = document.createElement('div');
    panelContent.classList.add('panel-content');
    panelContent.id = 'komponenten-editor-content';

    panel.appendChild(panelHeader);
    panel.appendChild(panelContent);
    document.body.appendChild(panel);

    return panel;
}

/**
 * Schließt das Komponenten-Editor-Panel
 */
function schliessePanel() {
    const panel = document.getElementById('komponenten-editor-panel');
    const overlay = document.getElementById('komponenten-editor-overlay');

    if (panel) panel.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    // Zurücksetzen der aktiven Elemente
    aktiveZelle = null;
    aktiverTag = null;
    aktiveKategorie = null;
}

/**
 * Lädt die verfügbaren Extra-Menüs vom Server
 */
async function ladeExtraMenues() {
    try {
        const response = await fetch('/api/solomenue/extras');
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        const data = await response.json();
        extraMenues = data.extramenues || [];
        
        // Globale Variable nur in der initialisiere-Funktion aktualisieren,
        // nicht hier, um Probleme mit nicht erweiterbaren Objekten zu vermeiden
        
        console.log('Extra-Menüs geladen:', extraMenues);
    } catch (error) {
        console.error('Fehler beim Laden der Extra-Menüs:', error);
        extraMenues = [];
    }
}

/**
 * Lädt die verfügbaren Extra-Wünsche vom Server
 */
async function ladeExtraWuensche() {
    try {
        const response = await fetch('/api/solomenue/wuensche');
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        const data = await response.json();
        extraWuensche = data.extrawuensche || [];
        
        // Globale Variable nur in der initialisiere-Funktion aktualisieren,
        // nicht hier, um Probleme mit nicht erweiterbaren Objekten zu vermeiden
        
        console.log('Extra-Wünsche geladen:', extraWuensche);
    } catch (error) {
        console.error('Fehler beim Laden der Extra-Wünsche:', error);
        extraWuensche = [];
    }
}

/**
 * Öffnet den Komponenten-Editor für eine bestimmte Zelle
 * @param {HTMLElement} zelle - Die Zelle, für die der Editor geöffnet werden soll
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "suppe")
 */
async function oeffneKomponentenEditor(zelle, tag, kategorie) {
    console.log(`Öffne Komponenten-Editor für: ${tag}, ${kategorie}`);
    
    // Wenn schon ein Editor geöffnet ist, diesen schließen
    schliessePanel();
    
    // Prüfen, ob alle Parameter vorhanden sind
    if (!zelle || !tag || !kategorie) {
        console.error('Fehlende Parameter für Komponenten-Editor:', { zelle, tag, kategorie });
        return;
    }
    
    // Aktuelle Daten speichern
    aktiveZelle = zelle;
    aktiverTag = tag;
    aktiveKategorie = kategorie;

    try {
        // Prüfen, ob ein Bewohner ausgewählt ist
        let bewohnerAuswahl;
        try {
            bewohnerAuswahl = BewohnerAuswahl.getAktuelleBewohnerAuswahl();
            console.log("Bewohnerauswahl erhalten:", bewohnerAuswahl ? "Ja" : "Nein");
        } catch (auswahlfehler) {
            console.error("Fehler beim Abrufen der Bewohnerauswahl:", auswahlfehler);
            if (typeof BewohnerAuswahl !== 'undefined') {
                console.log("BewohnerAuswahl-Modul verfügbar:", Object.keys(BewohnerAuswahl));
            } else {
                console.error("BewohnerAuswahl-Modul nicht definiert");
            }
            throw new Error(`Konnte Bewohnerauswahl nicht abrufen: ${auswahlfehler.message}`);
        }
        
        if (!bewohnerAuswahl) {
            alert('Bitte wählen Sie zuerst einen Bewohner aus.');
            return;
        }

        // Extra-Menüs und Wünsche laden, falls noch nicht geladen
        // Daten laden, falls die Arrays leer sind
        const ladeBeladePromises = [];
        
        if (extraMenues.length === 0) {
            ladeBeladePromises.push(ladeExtraMenues());
        }
        
        if (extraWuensche.length === 0) {
            ladeBeladePromises.push(ladeExtraWuensche());
        }
        
        // Warten, bis alle Daten geladen sind (falls nötig)
        if (ladeBeladePromises.length > 0) {
            await Promise.all(ladeBeladePromises);
            
            // Aktualisiere nach dem Laden die globalen Objekte
            bereitstelleGlobaleObjekte();
        }
        
        // Menükomponenten und aktuelle Auswahl ermitteln
        const komponentenDaten = ermittleKomponentenDaten(bewohnerAuswahl, tag, kategorie);
        
        // Panel erstellen und anzeigen
        const panel = erstellePanel();
        const content = document.getElementById('komponenten-editor-content');

        if (!content) {
            throw new Error("Komponenten-Editor-Content-Element nicht gefunden");
        }

        // Inhalt des Panels aktualisieren
        content.innerHTML = erzeugeKomponentenEditorHTML(komponentenDaten);

        // Event-Listener für Formulareingaben hinzufügen
        registriereEventListener();

        // Panel anzeigen
        panel.classList.add('active');
        const overlay = document.getElementById('komponenten-editor-overlay');
        if (overlay) overlay.classList.add('active');
    } catch (error) {
        console.error('Fehler beim Öffnen des Komponenten-Editors:', error);
        // Detaillierte Fehlermeldung anzeigen
        alert(`Fehler beim Laden der Komponenten-Daten: ${error.message || 'Unbekannter Fehler'}`);
    }
}

/**
 * Ermittelt die Daten für den Komponenten-Editor
 * @param {Object} bewohnerAuswahl - Die aktuelle Bewohnerauswahl
 * @param {string} tag - Der Tag (z.B. "Montag")
 * @param {string} kategorie - Die Kategorie (z.B. "suppe")
 * @returns {Object} Die aufbereiteten Daten für den Editor
 */
function ermittleKomponentenDaten(bewohnerAuswahl, tag, kategorie) {
    const isExtraKategorie = kategorie.startsWith('extra_');
    const displayKategorie = isExtraKategorie 
        ? kategorie.replace('extra_', '') 
        : kategorie;
    
    // Basisinformationen
    const daten = {
        tag,
        kategorie,
        displayKategorie,
        isExtraKategorie,
        auswahl: null,
        mahlzeiten: [],
        ausgewaehlteKomponenten: [],
        ausgeschlosseneKomponenten: [],
        notizen: '',
        extraMenueAuswahl: []
    };
    
    // Aktuelle Auswahl aus dem Bewohnerauswahl-Objekt extrahieren
    if (bewohnerAuswahl && bewohnerAuswahl[tag] && bewohnerAuswahl[tag][kategorie]) {
        const tagAuswahl = bewohnerAuswahl[tag][kategorie];
        daten.auswahl = tagAuswahl;
        
        // Mahlzeiten-Komponenten
        if (tagAuswahl.meals && Array.isArray(tagAuswahl.meals)) {
            // Hier werden die Mahlzeiten direkt aus dem meals-Array übernommen
            daten.mahlzeiten = tagAuswahl.meals;
            console.log('Extrahierte Mahlzeiten:', daten.mahlzeiten);
        }
        
        // Notizen
        if (tagAuswahl.notizen) {
            daten.notizen = tagAuswahl.notizen;
        }
        
        // Ausgeschlossene Komponenten
        if (tagAuswahl.ausgeschlosseneKomponenten && Array.isArray(tagAuswahl.ausgeschlosseneKomponenten)) {
            daten.ausgeschlosseneKomponenten = tagAuswahl.ausgeschlosseneKomponenten;
        }
        
        // Gewählte Extra-Menüs
        if (tagAuswahl.extraMenueAuswahl && Array.isArray(tagAuswahl.extraMenueAuswahl)) {
            daten.extraMenueAuswahl = tagAuswahl.extraMenueAuswahl;
        }
    }
    
    // Prüfen, ob Mahlzeiten vorhanden sind, und falls nicht, versuchen, sie aus der Tabelle zu extrahieren
    if (daten.mahlzeiten.length === 0 && aktiveZelle) {
        // Versuche, Mahlzeiten aus der Zelle zu extrahieren
        const mahlzeitElemente = aktiveZelle.querySelectorAll('.menue-komponente');
        
        if (mahlzeitElemente.length > 0) {
            console.log('Extrahiere Mahlzeiten aus der Zelle, da keine im meals-Array gefunden wurden');
            mahlzeitElemente.forEach(element => {
                const name = element.textContent.replace(' (ohne)', '').trim();
                daten.mahlzeiten.push({
                    name: name,
                    // Prüfen, ob die Komponente ausgeschlossen ist
                    ohne: element.classList.contains('ausgeschlossen')
                });
            });
        } else if (isExtraKategorie) {
            // Für selbst erstellte Kategorien den Text der Zelle als Mahlzeit verwenden
            const zellentext = aktiveZelle.innerText.replace('✎', '').replace(' (ohne)', '').trim();
            if (zellentext) {
                console.log('Extrahiere den Zellentext als Mahlzeit für Extra-Kategorie:', zellentext);
                
                // Prüfen, ob diese Komponente bereits ausgeschlossen ist
                const istAusgeschlossen = aktiveZelle.classList.contains('ausgeschlossen') || 
                                         (daten.ausgeschlosseneKomponenten && daten.ausgeschlosseneKomponenten.includes(zellentext));
                
                daten.mahlzeiten.push({
                    name: zellentext,
                    ohne: istAusgeschlossen
                });
            }
        }
    }
    
    return daten;
}

/**
 * Erzeugt das HTML für den Komponenten-Editor
 * @param {Object} daten - Die aufbereiteten Daten für den Editor
 * @returns {string} Das HTML für den Editor
 */
function erzeugeKomponentenEditorHTML(daten) {
    const { tag, kategorie, displayKategorie, mahlzeiten, notizen, ausgeschlosseneKomponenten, extraMenueAuswahl, isExtraKategorie } = daten;
    
    // Für Extra-Kategorien den korrekten Anzeigenamen laden
    let anzeigeKategorieName = displayKategorie;
    
    // Bei Extra-Kategorien versuchen, den Anzeigenamen zu finden
    if (isExtraKategorie && window.TabeleAdd && window.TabeleAdd.getExtraKategorien) {
        const alleExtraKategorien = window.TabeleAdd.getExtraKategorien();
        const kategorieID = displayKategorie;
        
        // Suche die Kategorie mit passender ID
        const gefundeneKategorie = alleExtraKategorien.find(kat => kat.id === kategorieID);
        if (gefundeneKategorie) {
            anzeigeKategorieName = gefundeneKategorie.displayKategorie;
            console.log(`Anzeigename für Kategorie-ID ${kategorieID} gefunden: ${anzeigeKategorieName}`);
        }
    }
    
    // Basisstruktur
    let html = `
        <div class="komponenten-editor-info">
            <div class="tag-kategorie-info">
                <strong>${tag}</strong> - <span class="kategorie-name">${anzeigeKategorieName.charAt(0).toUpperCase() + anzeigeKategorieName.slice(1)}</span>
            </div>
        </div>
        
        <div class="form-group">
            <label for="notizen-textarea">Notizen/Anmerkungen:</label>
            <textarea id="notizen-textarea" class="form-input" placeholder="Notizen zur Zubereitung oder Servierung hinzufügen">${notizen}</textarea>
        </div>
    `;
    
    // Komponenten-Auswahl anzeigen, wenn Mahlzeiten vorhanden sind
    if (mahlzeiten && mahlzeiten.length > 0) {
        html += `
            <div class="form-group">
                <label>Komponenten:</label>
                <div class="extra-optionen-container">
        `;
        
        // Für jede Mahlzeit-Komponente eine Checkbox erstellen (im gleichen Stil wie Extra-Wünsche)
        mahlzeiten.forEach((mahlzeit, index) => {
            const isAusgeschlossen = ausgeschlosseneKomponenten.includes(mahlzeit.name);
            
            // Checkbox erstellen im gleichen Stil wie Extra-Wünsche
            html += `
                <div class="extra-wunsch-wrapper">
                    <input type="checkbox" id="komponente-${index}" class="komponente-checkbox" 
                           data-name="${mahlzeit.name}" ${isAusgeschlossen ? '' : 'checked'}>
                    <label for="komponente-${index}" ${isAusgeschlossen ? 'class="durchgestrichen"' : ''}>${mahlzeit.name}</label>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Extra-Menü-Optionen anzeigen
    html += `
        <div class="form-group">
            <label>Extra-Optionen:</label>
            <div class="extra-optionen-container">
    `;
    
    // Normalisiere die Kategorie für den Vergleich
    const normalisiereKategorie = (kat) => {
        if (!kat) return '';
        
        const katStr = String(kat).toUpperCase();
        // Entferne "extra_" Präfix, falls vorhanden
        const ohnePrefix = katStr.startsWith('EXTRA_') ? katStr.substring(6) : katStr;
        
        // Standardisiere häufige Kategorienamen
        if (ohnePrefix === 'MENUE1' || ohnePrefix === 'MENU1') return 'MENÜ 1';
        if (ohnePrefix === 'MENUE2' || ohnePrefix === 'MENU2') return 'MENÜ 2';
        if (ohnePrefix === 'KALTEPLATTE') return 'KALTE PLATTE';
        
        return ohnePrefix;
    };
    
    // Verwende aktiveKategorie, die global verfügbar ist
    const verwendeteKategorie = aktiveKategorie || daten.kategorie || '';
    const kategorieName = normalisiereKategorie(verwendeteKategorie);
    console.log(`Normalisierte Kategorie: ${kategorieName} (Original: ${verwendeteKategorie})`);
    
    // Filtern der Extra-Menüs nach der aktuellen Kategorie
    const passendeExtraMenues = extraMenues.filter(menue => {
        return normalisiereKategorie(menue['kategorie-name']) === kategorieName;
    });
    
    console.log(`Gefilterte Extra-Menüs für Kategorie ${kategorie}:`, passendeExtraMenues);
    
    if (passendeExtraMenues.length === 0) {
        html += `<div class="no-extra-optionen" style="padding: 10px; color: #666;">Keine Extra-Optionen für diese Kategorie verfügbar.</div>`;
    } else {
        // Nur die passenden Extra-Menüs für diese Kategorie anzeigen
        html += `<div class="extra-optionen-liste">`;
        
        passendeExtraMenues.forEach(menue => {
            const isSelected = extraMenueAuswahl.includes(menue.id);
            html += `
                <div class="extra-option-wrapper">
                    <input type="checkbox" id="extra-${menue.id}" class="extra-option-checkbox" 
                           data-id="${menue.id}" ${isSelected ? 'checked' : ''}>
                    <label for="extra-${menue.id}" title="${menue.description}">${menue.name}</label>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    html += `
            </div>
        </div>
        
        <div class="form-group">
            <label>Extra-Wünsche:</label>
            <div class="extra-wuensche-container">
    `;
    
    // Extra-Wünsche anzeigen
    extraWuensche.forEach(wunsch => {
        const isSelected = extraMenueAuswahl.includes(wunsch.id);
        html += `
            <div class="extra-wunsch-wrapper">
                <input type="checkbox" id="wunsch-${wunsch.id}" class="extra-wunsch-checkbox" 
                       data-id="${wunsch.id}" ${isSelected ? 'checked' : ''}>
                <label for="wunsch-${wunsch.id}" title="${wunsch.description}">${wunsch.name}</label>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        
        <div class="form-buttons">
            <button id="speichern-btn" class="btn btn-primary">Speichern</button>
            <button id="abbrechen-btn" class="btn btn-secondary">Abbrechen</button>
        </div>
    `;
    
    return html;
}

/**
 * Registriert die Event-Listener für die Formularelemente
 */
function registriereEventListener() {
    // Checkboxen für Komponenten
    const komponentenCheckboxen = document.querySelectorAll('.komponente-checkbox');
    komponentenCheckboxen.forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            // Label-Element finden, das zur Checkbox gehört
            const label = document.querySelector(`label[for="${checkbox.id}"]`);
            
            // Label-Darstellung basierend auf dem Status der Checkbox aktualisieren
            if (checkbox.checked) {
                // Komponente ist ausgewählt (wird angezeigt)
                label.classList.remove('durchgestrichen');
            } else {
                // Komponente ist abgewählt (wird ausgeschlossen)
                label.classList.add('durchgestrichen');
            }
        });
    });
    
    // Abbrechen-Button
    const abbrechenBtn = document.getElementById('abbrechen-btn');
    if (abbrechenBtn) {
        abbrechenBtn.addEventListener('click', schliessePanel);
    }
    
    // Speichern-Button
    const speichernBtn = document.getElementById('speichern-btn');
    if (speichernBtn) {
        speichernBtn.addEventListener('click', speichereKomponentenAenderungen);
    }
}

/**
 * Speichert die Änderungen an den Komponenten
 */
async function speichereKomponentenAenderungen() {
    if (!aktiveZelle || !aktiverTag || !aktiveKategorie) {
        console.error('Keine aktive Zelle/Tag/Kategorie für das Speichern definiert');
        return;
    }
    
    try {
        // Bewohnerauswahl abrufen
        const bewohnerAuswahl = BewohnerAuswahl.getAktuelleBewohnerAuswahl();
        if (!bewohnerAuswahl) {
            throw new Error('Keine Bewohnerauswahl gefunden');
        }
        
        // Aktuelle Auswahl für Tag und Kategorie
        const tagAuswahl = bewohnerAuswahl[aktiverTag] || {};
        const kategorieAuswahl = tagAuswahl[aktiveKategorie];
        
        if (!kategorieAuswahl) {
            throw new Error(`Keine Auswahl für ${aktiverTag}, ${aktiveKategorie} gefunden`);
        }
        
        // Notizen aus Textarea abrufen
        const notizenTextarea = document.getElementById('notizen-textarea');
        const notizen = notizenTextarea ? notizenTextarea.value.trim() : '';
        
        // Ausgeschlossene Komponenten aus Checkboxen abrufen und Mahlzeiten aktualisieren
        const ausgeschlosseneKomponenten = [];
        
        // WICHTIG: Für selbst erstellte Kategorien sicherstellen, dass ein meals-Array existiert
        const isExtraKategorie = aktiveKategorie.startsWith('extra_');
        if (!kategorieAuswahl.meals || !Array.isArray(kategorieAuswahl.meals)) {
            // Initialisiere das meals-Array, wenn es nicht existiert
            if (isExtraKategorie) {
                // Hole den Text der Komponente aus der Zelle (ohne Button und Markierungen)
                const textWrapper = aktiveZelle.querySelector('span') || aktiveZelle;
                const zellenText = textWrapper.textContent.replace('✎', '').replace(' (ohne)', '').trim();
                
                // Erstelle ein meals-Array mit dem Zellentext
                kategorieAuswahl.meals = [{
                    name: zellenText,
                    isExtraKategorie: true // Markierung als Extra-Kategorie
                }];
                
                console.log(`Meals-Array für Extra-Kategorie '${zellenText}' erstellt:`, kategorieAuswahl.meals);
            }
        }
        
        // Wenn meals vorhanden ist, für jede Komponente "ohne" setzen basierend auf den Checkboxen
        if (kategorieAuswahl.meals && Array.isArray(kategorieAuswahl.meals)) {
            const komponentenCheckboxen = document.querySelectorAll('.komponente-checkbox');
            
            // Für jede Mahlzeit-Komponente
            kategorieAuswahl.meals.forEach(mahlzeit => {
                // Checkbox für diese Komponente finden
                const checkbox = Array.from(komponentenCheckboxen).find(cb => cb.dataset.name === mahlzeit.name);
                
                // Wenn die Checkbox gefunden wurde und nicht ausgewählt ist
                if (checkbox && !checkbox.checked) {
                    // "ohne": true in der Mahlzeit setzen
                    mahlzeit.ohne = true;
                    // Zu ausgeschlossenen Komponenten hinzufügen
                    ausgeschlosseneKomponenten.push(mahlzeit.name);
                } else if (checkbox && checkbox.checked) {
                    // Wenn die Komponente wieder ausgewählt wurde
                    // "ohne" Attribut entfernen
                    delete mahlzeit.ohne;
                    
                    // Aus der Liste der ausgeschlossenen Komponenten entfernen, falls vorhanden
                    const index = kategorieAuswahl.ausgeschlosseneKomponenten ? 
                        kategorieAuswahl.ausgeschlosseneKomponenten.indexOf(mahlzeit.name) : -1;
                    if (index !== -1) {
                        // Bestehende ausgeschlosseneKomponenten-Liste aktualisieren
                        kategorieAuswahl.ausgeschlosseneKomponenten.splice(index, 1);
                        console.log(`Komponente '${mahlzeit.name}' aus ausgeschlosseneKomponenten entfernt`);
                    }
                }
            });
        } else {
            // Falls meals nicht vorhanden ist, nur die ausgeschlossenen Komponenten sammeln
            const komponentenCheckboxen = document.querySelectorAll('.komponente-checkbox');
            
            // Hier müssen wir auch sicherstellen, dass wir die bestehende Liste behalten und nur aktualisieren
            ausgeschlosseneKomponenten = [];
            komponentenCheckboxen.forEach(checkbox => {
                if (!checkbox.checked) {
                    ausgeschlosseneKomponenten.push(checkbox.dataset.name);
                }
            });
        }
        
        // Ausgewählte Extra-Menüs aus Checkboxen abrufen
        const extraMenueAuswahl = [];
        const extraOptionCheckboxen = document.querySelectorAll('.extra-option-checkbox, .extra-wunsch-checkbox');
        extraOptionCheckboxen.forEach(checkbox => {
            if (checkbox.checked) {
                extraMenueAuswahl.push(checkbox.dataset.id);
            }
        });
        
        // Aktualisierte Daten in der Bewohnerauswahl speichern
        kategorieAuswahl.notizen = notizen;
        kategorieAuswahl.ausgeschlosseneKomponenten = ausgeschlosseneKomponenten;
        kategorieAuswahl.extraMenueAuswahl = extraMenueAuswahl;
        
        // WICHTIG: Für selbst erstellte Kategorien zusätzliche Prüfung
        if (isExtraKategorie && ausgeschlosseneKomponenten.length > 0) {
            // Sicherstellen, dass die ausgeschlossenen Komponenten auch im meals-Array vermerkt sind
            if (kategorieAuswahl.meals && kategorieAuswahl.meals.length > 0) {
                kategorieAuswahl.meals.forEach(mahlzeit => {
                    if (ausgeschlosseneKomponenten.includes(mahlzeit.name)) {
                        mahlzeit.ohne = true;
                    }
                });
            }
            
            console.log(`Ausgeschlossene Komponenten für Extra-Kategorie '${aktiveKategorie}' gespeichert:`, 
                ausgeschlosseneKomponenten, kategorieAuswahl.meals);
        }
        
        // Speichern der aktualisierten Bewohnerauswahl
        await BewohnerAuswahl.speichereBewohnerAuswahl();
        
        // Panel schließen (vor dem Neuladen)
        schliessePanel();
        
        // NEU: Kompletten Plan neu laden, um alle Änderungen sofort anzuzeigen
        console.log('Aktualisiere gesamten Plan nach dem Speichern der Komponenten');
        
        // Tabelle finden und aktualisieren
        const tabelle = document.querySelector('.menueplan-tabelle');
        if (tabelle && BewohnerAuswahl && typeof BewohnerAuswahl.aktualisiereTabelle === 'function') {
            // Kurze Verzögerung, um sicherzustellen, dass das Panel vollständig geschlossen ist
            setTimeout(() => {
                BewohnerAuswahl.aktualisiereTabelle(tabelle);
                console.log('Plan wurde vollständig neu geladen nach Speichern der Komponenten');
                
                // Optional: Feedback für den Benutzer anzeigen
                const feedbackElement = document.createElement('div');
                feedbackElement.className = 'speicher-feedback';
                feedbackElement.textContent = 'Änderungen gespeichert';
                feedbackElement.style.position = 'fixed';
                feedbackElement.style.bottom = '20px';
                feedbackElement.style.left = '50%';
                feedbackElement.style.transform = 'translateX(-50%)';
                feedbackElement.style.background = '#4CAF50';
                feedbackElement.style.color = 'white';
                feedbackElement.style.padding = '10px 20px';
                feedbackElement.style.borderRadius = '4px';
                feedbackElement.style.zIndex = '2000';
                feedbackElement.style.opacity = '0';
                feedbackElement.style.transition = 'opacity 0.3s ease';
                
                document.body.appendChild(feedbackElement);
                
                // Feedback einblenden und nach kurzer Zeit wieder ausblenden
                setTimeout(() => {
                    feedbackElement.style.opacity = '1';
                    
                    setTimeout(() => {
                        feedbackElement.style.opacity = '0';
                        setTimeout(() => {
                            if (feedbackElement.parentNode) {
                                feedbackElement.parentNode.removeChild(feedbackElement);
                            }
                        }, 300); // Warten bis Animation abgeschlossen ist
                    }, 2000); // 2 Sekunden anzeigen
                }, 100);
            }, 300); // 300ms Verzögerung für Panel-Schließung
        } else {
            console.warn('Konnte Tabelle nicht vollständig neu laden, manuelle Aktualisierung nötig');
        }
        
        console.log('Komponenten erfolgreich aktualisiert', {
            tag: aktiverTag,
            kategorie: aktiveKategorie,
            notizen,
            ausgeschlosseneKomponenten,
            extraMenueAuswahl,
            meals: kategorieAuswahl.meals // Für Debugging
        });
        
    } catch (error) {
        console.error('Fehler beim Speichern der Komponenten-Änderungen:', error);
        alert(`Fehler beim Speichern: ${error.message}`);
    }
}

/**
 * Aktualisiert die visuelle Darstellung der Zelle basierend auf den ausgewählten Optionen
 * @param {HTMLElement} zelle - Die zu aktualisierende Zelle
 * @param {Array} ausgeschlosseneKomponenten - Liste der ausgeschlossenen Komponenten
 * @param {Array} extraMenueAuswahl - Liste der ausgewählten Extra-Menüs
 */
function aktualisiereZellenDarstellung(zelle, ausgeschlosseneKomponenten, extraMenueAuswahl) {
    // Sicherstellen, dass ausgeschlosseneKomponenten ein Array ist
    ausgeschlosseneKomponenten = Array.isArray(ausgeschlosseneKomponenten) ? ausgeschlosseneKomponenten : [];
    
    // Alle Komponenten-Elemente in der Zelle durchgehen
    const komponentenElemente = zelle.querySelectorAll('.menue-komponente');
    
    // Überprüfen, ob es sich um eine Extrakategorie-Zelle handelt (keine .menue-komponente-Elemente)
    const istExtraKategorie = komponentenElemente.length === 0 && zelle.dataset.kategorie && zelle.dataset.kategorie.startsWith('extra_');
    
    // Für Extra-Kategorien
    if (istExtraKategorie) {
        const zellenText = zelle.textContent.replace('✎', '').trim();
        const originalText = zellenText.replace(' (ohne)', '').trim();
        
        // Den Bearbeiten-Button für später speichern
        const bearbeitenButton = zelle.querySelector('.komponenten-bearbeiten-btn');
        
        // Prüfen, ob diese Komponente ausgeschlossen ist
        if (ausgeschlosseneKomponenten.includes(originalText)) {
            // Komponente ist ausgeschlossen
            zelle.classList.add('ausgeschlossen');
            
            // Text mit "(ohne)" anzeigen, wenn noch nicht vorhanden
            if (!zellenText.includes('(ohne)')) {
                zelle.textContent = `${originalText} (ohne)`;
                // Bearbeiten-Button wieder hinzufügen, falls vorhanden
                if (bearbeitenButton) {
                    zelle.appendChild(bearbeitenButton);
                }
            }
        } else {
            // Komponente ist NICHT ausgeschlossen
            zelle.classList.remove('ausgeschlossen');
            
            // "(ohne)" entfernen, falls vorhanden
            if (zellenText.includes('(ohne)')) {
                zelle.textContent = originalText;
                // Bearbeiten-Button wieder hinzufügen, falls vorhanden
                if (bearbeitenButton) {
                    zelle.appendChild(bearbeitenButton);
                }
            }
        }
    } else if (komponentenElemente.length > 0) {
        // Für normale Kategorien mit einzelnen Komponenten
        komponentenElemente.forEach(element => {
            const komponentenName = element.textContent.replace(' (ohne)', '').trim();
            
            // Prüfen, ob diese Komponente ausgeschlossen ist
            if (ausgeschlosseneKomponenten.includes(komponentenName)) {
                // Komponente ist ausgeschlossen
                element.classList.add('ausgeschlossen');
                
                // "(ohne)" hinzufügen, wenn nicht bereits vorhanden
                if (!element.textContent.includes('(ohne)')) {
                    element.textContent = `${komponentenName} (ohne)`;
                }
            } else {
                // Komponente ist NICHT ausgeschlossen
                element.classList.remove('ausgeschlossen');
                
                // "(ohne)" entfernen, falls vorhanden
                if (element.textContent.includes('(ohne)')) {
                    element.textContent = komponentenName;
                }
            }
        });
    }
    
    // Extra-Menü-Hinweise erstellen oder aktualisieren
    let extraHinweiseContainer = zelle.querySelector('.extra-hinweise');
    
    // Wenn keine Extra-Menüs ausgewählt sind, aber ein Container existiert, diesen entfernen
    if ((!extraMenueAuswahl || extraMenueAuswahl.length === 0) && extraHinweiseContainer) {
        extraHinweiseContainer.remove();
    }
    
    // Container erstellen, falls er noch nicht existiert
    if (!extraHinweiseContainer && extraMenueAuswahl && extraMenueAuswahl.length > 0) {
        extraHinweiseContainer = document.createElement('div');
        extraHinweiseContainer.className = 'extra-hinweise';
        zelle.appendChild(extraHinweiseContainer);
    }
    
    if (extraHinweiseContainer && extraMenueAuswahl && extraMenueAuswahl.length > 0) {
        // Hinweise für ausgewählte Extra-Menüs erstellen
        const hinweisTexte = extraMenueAuswahl.map(id => {
            // Versuche zuerst die lokalen Arrays zu verwenden
            let extraMenue = extraMenues.find(m => m.id === id);
            let extraWunsch = extraWuensche.find(w => w.id === id);
            
            // Falls die lokalen Arrays leer sind, versuche die globalen zu verwenden
            if (!extraMenue && window.KomponentenEditorData) {
                try {
                    // Sicherere Variante mit Prüfung, ob extraMenues ein Array ist
                    const globalMenuesArray = window.KomponentenEditorData.extraMenues;
                    if (Array.isArray(globalMenuesArray)) {
                        extraMenue = globalMenuesArray.find(m => m && m.id === id);
                    }
                } catch (e) {
                    console.warn("Fehler beim Zugriff auf window.KomponentenEditorData.extraMenues", e);
                }
            }
            
            if (!extraWunsch && window.KomponentenEditorData) {
                try {
                    // Sicherere Variante mit Prüfung, ob extraWuensche ein Array ist
                    const globalWuenscheArray = window.KomponentenEditorData.extraWuensche;
                    if (Array.isArray(globalWuenscheArray)) {
                        extraWunsch = globalWuenscheArray.find(w => w && w.id === id);
                    }
                } catch (e) {
                    console.warn("Fehler beim Zugriff auf window.KomponentenEditorData.extraWuensche", e);
                }
            }
            
            // Als Fallback-Lösung für unbekannte IDs: ID selbst verwenden
            const menueName = extraMenue ? extraMenue.name : null;
            const wunschName = extraWunsch ? extraWunsch.name : null;
            
            return menueName || wunschName || id;
        });
        
        if (hinweisTexte.length > 0) {
            extraHinweiseContainer.innerHTML = `<div class="extra-hinweis-titel">Extras:</div>
                                               <div class="extra-hinweis-liste">${hinweisTexte.join(', ')}</div>`;
        } else {
            extraHinweiseContainer.remove();
        }
    }
    
    // Mobile Ansicht aktualisieren
    if (BewohnerAuswahl && typeof BewohnerAuswahl.aktualisiereZellInMobileAnsicht === 'function') {
        BewohnerAuswahl.aktualisiereZellInMobileAnsicht(zelle);
    }
}

/**
 * Erstellt einen Bearbeiten-Button für eine ausgewählte Zelle
 * @param {HTMLElement} zelle - Die Tabellenzelle, die einen Bearbeiten-Button erhalten soll
 */
function erstelleBearbeitenButton(zelle) {
    // Prüfen, ob bereits ein Button existiert
    let button = zelle.querySelector('.komponenten-bearbeiten-btn');
    const tag = zelle.dataset.tag;
    const kategorie = zelle.dataset.kategorie;
    
    if (button) {
        // Wenn Button bereits existiert, stellen wir sicher, dass er korrekt angezeigt wird
        button.style.display = 'flex';
        // Wir entfernen keine Event-Listener, da der Button bereits korrekt konfiguriert sein sollte
        return;
    }
    
    // Prüfen, ob es sich um eine ausgewählte Zelle handelt
    if (!zelle.classList.contains('auswahl-100') && 
        !zelle.classList.contains('auswahl-50') && 
        !zelle.classList.contains('auswahl-25')) {
        return;
    }
    
    // Button erstellen
    button = document.createElement('button');
    button.className = 'komponenten-bearbeiten-btn';
    button.title = 'Komponenten bearbeiten';
    button.innerHTML = '✎'; // Pencil-Symbol
    
    // Eine eindeutige ID für den Button setzen
    button.id = `edit-btn-${tag}-${kategorie}`;
    
    // Button mit data-Attributen versehen
    button.dataset.tag = tag;
    button.dataset.kategorie = kategorie;
    
    // Event-Listener für den Button mit einer benannten Funktion
    function handleButtonClick(event) {
        // Alle Event-Propagation stoppen (sowohl Bubbling als auch Capturing)
        event.stopPropagation();
        event.preventDefault();
        
        // Verhindere, dass der Klick die Zelle aktiviert oder weitere Events auslöst
        event.cancelBubble = true;
        
        // Zeitstempel für den Button-Klick speichern, um schnelle versehentliche Klicks zu erkennen
        const jetzt = Date.now();
        const letzterButtonKlick = parseInt(button.dataset.lastClickTime || '0');
        
        // Wenn der letzte Klick auf den Button weniger als 300ms her ist, ignorieren (verhindert Doppelklicks)
        if (jetzt - letzterButtonKlick < 300) {
            console.log('Klick auf Bearbeiten-Button zu schnell nach vorherigem Klick - ignoriert');
            return;
        }
        
        // Aktuellen Zeitstempel speichern
        button.dataset.lastClickTime = jetzt.toString();
        
        console.log('Bearbeiten-Button angeklickt für', zelle.dataset.tag, zelle.dataset.kategorie);
        
        // Mit kurzer Verzögerung öffnen, um sicherzustellen, dass keine weiteren Events ausgelöst werden
        setTimeout(() => {
            // Tag und Kategorie aus Datenattributen der Zelle ermitteln
            const tag = zelle.dataset.tag;
            const kategorie = zelle.dataset.kategorie;
            
            if (tag && kategorie) {
                oeffneKomponentenEditor(zelle, tag, kategorie);
            }
        }, 10);
    }
    
    // Event-Listener hinzufügen
    button.addEventListener('click', handleButtonClick);
    
    // Button in CSS als interaktives Element kennzeichnen
    button.style.pointerEvents = 'auto';
    button.style.zIndex = '200';
    
    // Button in Zelle einfügen
    zelle.appendChild(button);
}

/**
 * Fügt dynamisch Bearbeiten-Buttons zu allen ausgewählten Zellen hinzu
 * @param {HTMLElement} tabelle - Die Menüplan-Tabelle
 */
function fuegeBearbeitenButtonsHinzu(tabelle) {
    // Alle Zellen mit "auswahl-100", "auswahl-50" oder "auswahl-25" Klasse finden
    const ausgewaehlteZellen = tabelle.querySelectorAll('.auswahl-100, .auswahl-50, .auswahl-25');
    
    ausgewaehlteZellen.forEach(zelle => {
        erstelleBearbeitenButton(zelle);
    });
}

/**
 * Überwacht die Menüplantabelle auf Änderungen, um dynamisch Bearbeiten-Buttons hinzuzufügen
 * @param {HTMLElement} tabellenContainer - Der Container der Menüplantabelle
 */
function beobachteTabelleAufAenderungen(tabellenContainer) {
    if (!tabellenContainer) return;
    
    // MutationObserver erstellen
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && 
                (mutation.target.classList.contains('auswahl-100') || 
                 mutation.target.classList.contains('auswahl-50') || 
                 mutation.target.classList.contains('auswahl-25'))) {
                // Wenn eine Zelle als ausgewählt markiert wurde, Bearbeiten-Button hinzufügen
                erstelleBearbeitenButton(mutation.target);
            } else if (mutation.type === 'childList') {
                // Wenn neue Zellen hinzugefügt wurden, nach ausgewählten Zellen suchen
                const tabelle = tabellenContainer.querySelector('.menueplan-tabelle');
                if (tabelle) {
                    fuegeBearbeitenButtonsHinzu(tabelle);
                }
            }
        });
    });
    
    // Konfiguration des Observers: Attributänderungen und Kind-Elemente überwachen
    const config = { 
        attributes: true, 
        childList: true, 
        subtree: true, 
        attributeFilter: ['class'] 
    };
    
    // Beobachtung starten
    observer.observe(tabellenContainer, config);
}

/**
 * Doppelklick-Handler für Zellen, um den Komponenten-Editor zu öffnen
 * @param {HTMLElement} tabelle - Die Menüplan-Tabelle
 */
function fuegeZellenDoppelklickHinzu(tabelle) {
    if (!tabelle) return;
    
    // Event-Delegation für Doppelklicks auf Tabellenzellen
    tabelle.addEventListener('dblclick', (event) => {
        // Nächste Zelle finden (kann auch ein Kind-Element sein)
        let zelle = event.target.closest('.menue-zelle');
        
        if (zelle && (zelle.classList.contains('auswahl-100') || 
                     zelle.classList.contains('auswahl-50') || 
                     zelle.classList.contains('auswahl-25'))) {
            
            // Prüfen, ob es ein beabsichtigter Doppelklick war (mindestens 350ms zwischen den Klicks)
            // Ein "echter" Doppelklick erfolgt typischerweise mit einer größeren Zeitspanne als ein versehentlicher Doppelklick
            const jetzt = Date.now();
            const letzterKlick = parseInt(zelle.dataset.lastClickTime || '0');
            
            // Wenn der Zeitabstand zwischen dem letzten normalen Klick und diesem Doppelklick angemessen ist,
            // den Editor öffnen (typisch für beabsichtigte Doppelklicks sind 300-500ms)
            if (jetzt - letzterKlick > 350) {
                // Tag und Kategorie aus Datenattributen der Zelle ermitteln
                const tag = zelle.dataset.tag;
                const kategorie = zelle.dataset.kategorie;
                
                if (tag && kategorie) {
                    oeffneKomponentenEditor(zelle, tag, kategorie);
                }
            } else {
                console.log('Doppelklick zu schnell nach einem normalen Klick, ignoriere als unbeabsichtigt');
            }
        }
    });
}

/**
 * Initialisiert das Modul
 */
function initialisiere() {
    console.log('Komponenten-Editor wird initialisiert');
    
    // Ein separates globales Objekt für den Datenaustausch erstellen,
    // statt das Modul selbst zu verändern
    window.KomponentenEditorData = window.KomponentenEditorData || {};
    
    // Panel erstellen, aber noch nicht anzeigen
    erstellePanel();
    
    // Event-Listener für Tastatureingaben (ESC zum Schließen)
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            schliessePanel();
        }
    });
    
    // Auf Ereignis hören, wenn eine neue Menüplantabelle erstellt wird
    document.addEventListener('menuplanTabelleErstellt', (event) => {
        const tabelle = event.detail.tabelle;
        if (tabelle) {
            console.log('Neue Menüplantabelle erkannt, füge Bearbeiten-Buttons hinzu');
            fuegeBearbeitenButtonsHinzu(tabelle);
            fuegeZellenDoppelklickHinzu(tabelle);
        }
    });
    
    // Tabellen-Container beobachten
    const tabellenContainer = document.getElementById('menueplan-container');
    if (tabellenContainer) {
        beobachteTabelleAufAenderungen(tabellenContainer);
    }
    
    // Initial Extra-Menüs und Wünsche laden
    Promise.all([ladeExtraMenues(), ladeExtraWuensche()])
        .then(() => {
            console.log('Extra-Menüs und Wünsche geladen');
            
            // Die globalen Daten aktualisieren, wobei wir in das KomponentenEditorData-Objekt
            // schreiben, nicht in das KomponentenEditor-Modul
            try {
                window.KomponentenEditorData.extraMenues = [...extraMenues];
                window.KomponentenEditorData.extraWuensche = [...extraWuensche];
                console.log("Arrays im KomponentenEditorData-Objekt aktualisiert");
            } catch (e) {
                console.warn("Konnte Arrays im KomponentenEditorData-Objekt nicht aktualisieren", e);
            }
        })
        .catch(error => {
            console.error('Fehler beim Laden von Extra-Daten:', error);
        });
}

// Module exportieren 
export {
    initialisiere,
    oeffneKomponentenEditor,
    fuegeBearbeitenButtonsHinzu,
    erstelleBearbeitenButton,
    // Direkte Referenzen auf die Daten (nur lesend)
    extraMenues,
    extraWuensche
}; 