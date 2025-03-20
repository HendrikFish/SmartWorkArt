/**
 * Modul für die Erstellung und Verwaltung der Menüplan-Tabelle
 */

// Array der Kategorien, die in der Tabelle angezeigt werden sollen
const KATEGORIEN = [
    "suppe",
    "menue1",
    "menue2",
    "dessert",
    "abendSuppe",
    "milchspeise",
    "normalkost"
];

// Übersetzungen der Kategorienamen für die Anzeige
const KATEGORIE_ANZEIGE = {
    "suppe": "SUPPE",
    "menue1": "MENÜ 1",
    "menue2": "MENÜ 2",
    "dessert": "DESSERT",
    "abendSuppe": "ABENDSUPPE",
    "milchspeise": "MILCHSPEISE",
    "normalkost": "NORMALKOST"
};

// Wochentage für die Tabellenspalten
const WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

/**
 * Lädt den Menüplan für eine bestimmte Kalenderwoche und Jahr
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 * @returns {Promise<Object>} Die Menüplandaten
 */
async function ladeMenueplan(kw, jahr) {
    try {
        console.log(`Versuche Menüplan für KW${kw}/${jahr} zu laden...`);
        
        // Prüfen, ob es eine Override-Datei gibt
        let response;
        try {
            response = await fetch(`/api/solomenue/menueplan/${jahr}/KW${kw}_override`);
            if (response.ok) {
                console.log(`Override-Menüplan für KW${kw}/${jahr} gefunden`);
                return await response.json();
            } else {
                console.log(`Kein Override-Menüplan für KW${kw}/${jahr} gefunden, versuche normalen Menüplan`);
            }
        } catch (overrideError) {
            console.log(`Fehler beim Laden des Override-Menüplans: ${overrideError.message}`);
        }
        
        // Wenn keine Override-Datei gefunden wurde, die normale Datei laden
        try {
            response = await fetch(`/api/solomenue/menueplan/${jahr}/KW${kw}`);
            if (response.ok) {
                console.log(`Normaler Menüplan für KW${kw}/${jahr} gefunden`);
                return await response.json();
            } else {
                console.warn(`Menüplan für KW${kw}/${jahr} konnte nicht geladen werden: ${response.status} ${response.statusText}`);
                return null;
            }
        } catch (normalError) {
            console.warn(`Fehler beim Laden des normalen Menüplans: ${normalError.message}`);
            return null;
        }
    } catch (error) {
        console.error("Fehler beim Laden des Menüplans:", error);
        return null;
    }
}

/**
 * Erstellt eine leere Menüplantabelle
 * @returns {HTMLTableElement} Die erstellte Tabelle
 */
function erstelleLeereTabelle() {
    const tabelle = document.createElement('table');
    tabelle.className = 'menueplan-tabelle';
    
    // Tabellenkopf erstellen
    const thead = document.createElement('thead');
    const kopfzeile = document.createElement('tr');
    
    // Erste Zelle (leer)
    const leereKopfzelle = document.createElement('th');
    leereKopfzelle.textContent = 'Kategorie';
    kopfzeile.appendChild(leereKopfzelle);
    
    // Wochentage
    WOCHENTAGE.forEach(tag => {
        const tageszelle = document.createElement('th');
        tageszelle.textContent = tag;
        tageszelle.setAttribute('data-tag', tag);
        kopfzeile.appendChild(tageszelle);
    });
    
    thead.appendChild(kopfzeile);
    tabelle.appendChild(thead);
    
    // Tabellenkörper erstellen
    const tbody = document.createElement('tbody');
    
    // Für jede Kategorie eine Zeile erstellen
    KATEGORIEN.forEach(kategorie => {
        const zeile = document.createElement('tr');
        zeile.setAttribute('data-kategorie', kategorie);
        
        // Kategorie-Zelle
        const kategorieZelle = document.createElement('td');
        kategorieZelle.textContent = KATEGORIE_ANZEIGE[kategorie] || kategorie;
        kategorieZelle.className = 'kategorie-zelle';
        zeile.appendChild(kategorieZelle);
        
        // Für jeden Tag eine leere Zelle
        WOCHENTAGE.forEach(tag => {
            const menueZelle = document.createElement('td');
            menueZelle.className = 'menue-zelle';
            menueZelle.setAttribute('data-tag', tag);
            menueZelle.setAttribute('data-kategorie', kategorie);
            // ID für einfacheren Zugriff
            menueZelle.id = `zelle-${tag}-${kategorie}`;
            zeile.appendChild(menueZelle);
        });
        
        tbody.appendChild(zeile);
    });
    
    tabelle.appendChild(tbody);
    
    return tabelle;
}

/**
 * Füllt die Tabelle mit den Daten aus dem Menüplan
 * @param {HTMLTableElement} tabelle - Die zu füllende Tabelle
 * @param {Object} menuplanDaten - Die Menüplandaten
 */
function fuelleTabelle(tabelle, menuplanDaten) {
    if (!menuplanDaten || !menuplanDaten.days) {
        console.error("Ungültige Menüplandaten:", menuplanDaten);
        return;
    }

    // Für jeden Tag im Menüplan
    menuplanDaten.days.forEach(tagesdaten => {
        const tag = tagesdaten.day;
        
        // Für jede Kategorie prüfen, ob es Daten gibt
        KATEGORIEN.forEach(kategorie => {
            if (tagesdaten[kategorie] && tagesdaten[kategorie].length > 0) {
                // Zelle in der Tabelle finden
                const zeile = tabelle.querySelector(`tr[data-kategorie="${kategorie}"]`);
                if (!zeile) return;
                
                const zelle = zeile.querySelector(`td[data-tag="${tag}"]`);
                if (!zelle) return;
                
                // Alle Komponenten der Kategorie auflisten
                zelle.innerHTML = ''; // Zelle leeren
                
                const komponenten = tagesdaten[kategorie];
                komponenten.forEach(komponente => {
                    const komponenteElement = document.createElement('div');
                    komponenteElement.classList.add('menue-komponente');
                    komponenteElement.textContent = komponente.name || "-";
                    zelle.appendChild(komponenteElement);
                });
            }
        });
    });
}

/**
 * Erstellt eine Menüplantabelle und füllt sie mit Daten
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 * @returns {Promise<HTMLTableElement>} Die gefüllte Tabelle
 */
async function erstelleMenueplanTabelle(kw, jahr) {
    // Leere Tabelle erstellen
    const tabelle = erstelleLeereTabelle();
    
    // Menüplandaten laden
    const menuplanDaten = await ladeMenueplan(kw, jahr);
    
    if (menuplanDaten) {
        // Tabelle mit Daten füllen
        fuelleTabelle(tabelle, menuplanDaten);
    } else {
        // Fehlermeldung in die Tabelle einfügen
        const tbody = tabelle.querySelector('tbody');
        const fehlermeldungZeile = document.createElement('tr');
        const fehlermeldungZelle = document.createElement('td');
        fehlermeldungZelle.colSpan = WOCHENTAGE.length + 1;
        fehlermeldungZelle.textContent = `Keine Menüplandaten für KW${kw}/${jahr} verfügbar`;
        fehlermeldungZelle.classList.add('fehlermeldung');
        fehlermeldungZeile.appendChild(fehlermeldungZelle);
        tbody.appendChild(fehlermeldungZeile);
    }
    
    // Event auslösen, dass die Tabelle erstellt wurde
    document.dispatchEvent(new CustomEvent('menuplanTabelleErstellt', {
        detail: { tabelle, kw, jahr }
    }));
    
    return tabelle;
}

/**
 * Strukturiert die Tabelle für Mobilgeräte um, sodass jeder Tag mit allen Kategorien separat angezeigt wird
 * @param {HTMLElement} tabelle - Die Tabelle, die umstrukturiert werden soll
 */
function strukturiereTabelleFuerMobile(tabelle) {
    // Nur auf kleinen Bildschirmen umstrukturieren
    if (window.innerWidth > 767) return;
    
    console.log('[Mobile] Strukturiere Tabelle für Mobilgeräte um');
    
    // Tabelle als mobil formatiert markieren
    tabelle.classList.add('mobile-formatiert');
    
    // Container für die umstrukturierte Tabelle erstellen
    const mobileContainer = document.createElement('div');
    mobileContainer.className = 'mobile-menueplan-container';
    
    // Wochentage aus der Tabelle auslesen
    const tage = [];
    const thead = tabelle.querySelector('thead');
    if (thead) {
        const kopfzeile = thead.querySelector('tr');
        if (kopfzeile) {
            // Alle th-Elemente durchgehen (außer dem ersten, das ist für Kategorien)
            const thElements = kopfzeile.querySelectorAll('th');
            for (let i = 1; i < thElements.length; i++) {
                tage.push(thElements[i].textContent.trim());
            }
        }
    }
    
    // Kategorien und deren Inhalte pro Tag extrahieren
    const tbody = tabelle.querySelector('tbody');
    if (!tbody) return;
    
    const zeilen = tbody.querySelectorAll('tr');
    if (!zeilen.length) return;
    
    // Kategorien sammeln
    const kategorien = [];
    zeilen.forEach(zeile => {
        const kategorieTd = zeile.querySelector('td.kategorie-zelle');
        if (kategorieTd) {
            kategorien.push({
                name: kategorieTd.textContent.trim(),
                zeile: zeile
            });
        }
    });
    
    console.log(`[Mobile] Gefundene Tage: ${tage.length}, Kategorien: ${kategorien.length}`);
    
    // Für jeden Tag einen eigenen Abschnitt erstellen
    tage.forEach((tag, tagIndex) => {
        // Tag-Sektion erstellen
        const tagSektion = document.createElement('div');
        tagSektion.className = 'tag-sektion';
        
        // Tag-Überschrift
        const tagHeader = document.createElement('div');
        tagHeader.className = 'tag-header';
        tagHeader.textContent = tag;
        tagSektion.appendChild(tagHeader);
        
        // Container für die Kategorien dieses Tages
        const tagKategorien = document.createElement('div');
        tagKategorien.className = 'tag-kategorien';
        
        // Für jede Kategorie eine Zeile erstellen
        kategorien.forEach(kategorie => {
            // Kategorie-Zeile
            const kategorieZeile = document.createElement('div');
            kategorieZeile.className = 'kategorie-zeile';
            
            // Kategorie-Name
            const kategorieName = document.createElement('div');
            kategorieName.className = 'kategorie-name';
            kategorieName.textContent = kategorie.name;
            kategorieZeile.appendChild(kategorieName);
            
            // Kategorie-Inhalt (die eigentliche Menü-Zelle)
            const kategorieInhalt = document.createElement('div');
            kategorieInhalt.className = 'kategorie-inhalt';
            
            // Die entsprechende Zelle für diesen Tag und diese Kategorie finden
            // tagIndex + 1, weil das erste TD die Kategorie ist
            const menueZellen = kategorie.zeile.querySelectorAll('td');
            if (menueZellen.length > tagIndex + 1) {
                const menueZelle = menueZellen[tagIndex + 1];
                
                // Inhalte und Attribute kopieren
                kategorieInhalt.innerHTML = menueZelle.innerHTML;
                
                // Klasse für Klickbarkeit übernehmen
                if (menueZelle.classList.contains('klickbar')) {
                    kategorieInhalt.classList.add('klickbar');
                    
                    // Daten-Attribute für Tag und Kategorie übernehmen
                    kategorieInhalt.dataset.tag = tag;
                    kategorieInhalt.dataset.kategorie = menueZelle.dataset.kategorie;
                    
                    // Klick-Ereignis hinzufügen
                    kategorieInhalt.addEventListener('click', function() {
                        // Das gleiche Event auslösen wie bei der Original-Zelle
                        console.log(`[Mobile] Klick auf ${tag} - ${kategorie.name}`);
                        const event = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        menueZelle.dispatchEvent(event);
                        
                        // Auswahlklassen aktualisieren
                        ['auswahl-100', 'auswahl-50', 'auswahl-25'].forEach(klasse => {
                            if (menueZelle.classList.contains(klasse)) {
                                kategorieInhalt.classList.add(klasse);
                            } else {
                                kategorieInhalt.classList.remove(klasse);
                            }
                        });
                    });
                }
                
                // Auswahlklassen übernehmen
                ['auswahl-100', 'auswahl-50', 'auswahl-25'].forEach(klasse => {
                    if (menueZelle.classList.contains(klasse)) {
                        kategorieInhalt.classList.add(klasse);
                    }
                });
            }
            
            kategorieZeile.appendChild(kategorieInhalt);
            tagKategorien.appendChild(kategorieZeile);
        });
        
        tagSektion.appendChild(tagKategorien);
        mobileContainer.appendChild(tagSektion);
    });
    
    // Mobile Container nach der Tabelle einfügen
    tabelle.after(mobileContainer);
}

/**
 * Zeigt die Menüplantabelle im angegebenen Container an
 * @param {string} containerId - Die ID des Containers
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 */
async function zeigeMenueplanTabelle(containerId, kw, jahr) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container mit ID "${containerId}" nicht gefunden`);
        return;
    }
    
    // Container leeren
    container.innerHTML = '';
    
    // Ladeanzeige hinzufügen
    const ladeAnzeige = document.createElement('div');
    ladeAnzeige.classList.add('lade-anzeige');
    ladeAnzeige.textContent = 'Lade Menüplan...';
    container.appendChild(ladeAnzeige);
    
    try {
        // Tabelle erstellen und füllen
        const tabelle = await erstelleMenueplanTabelle(kw, jahr);
        
        // Tabelle zum Container hinzufügen
        container.appendChild(tabelle);
        
        // Für Mobilgeräte umstrukturieren
        strukturiereTabelleFuerMobile(tabelle);
        
        // Ladeanzeige entfernen
        ladeAnzeige.remove();
    } catch (error) {
        // Bei Fehler Fehlermeldung anzeigen
        ladeAnzeige.textContent = `Fehler beim Laden des Menüplans: ${error.message}`;
        ladeAnzeige.classList.add('fehler');
    }
}

/**
 * Event-Handler für Änderungen der Kalenderwoche
 * @param {CustomEvent} event - Das Kalenderwoche-Event
 */
function aktualisiereNachKalenderwocheAenderung(event) {
    const { kw, jahr } = event.detail;
    console.log(`Kalenderwochen-Handler: KW${kw}/${jahr}`);
    
    // Menüplantabelle aktualisieren
    zeigeMenueplanTabelle('menueplan-container', kw, jahr);
    
    // Bestehende mobile Umstrukturierung entfernen
    const mobilContainer = document.querySelector('.mobile-menueplan-container');
    if (mobilContainer) {
        mobilContainer.remove();
    }
    
    // Die aktuelle Tabelle für andere Module verfügbar machen
    const aktuelleTabelle = document.querySelector('.menueplan-tabelle');
    
    // Prüfen, ob ein Bewohner ausgewählt ist und dessen Auswahl aktualisieren
    // Dies wird jetzt von BewohnerAuswahl-Modul direkt gehandhabt über den eigenen Event-Listener
    // für das kalenderwocheChanged-Event in der BewohnerAuswahl.initialisiere-Funktion
    
    // Aktualisierung des Bewohner-Indikators nach kurzer Verzögerung
    // damit die BewohnerAuswahl-Module Zeit hat, die Daten zu laden
    if (window.aktuellerBewohner && window.BewohnerAuswahl) {
        setTimeout(() => {
            try {
                // Prüfen, ob eine bestehende Auswahl geladen wurde
                const auswahl = window.BewohnerAuswahl.getAktuelleBewohnerAuswahl();
                const isExisting = auswahl && Object.keys(auswahl).some(tag => 
                    tag !== 'name' && Object.keys(auswahl[tag]).length > 0
                );
                
                // Bewohner-Indikator aktualisieren, falls die Funktion vorhanden ist
                if (typeof window.zeigeAktivenBewohnerIndikator === 'function') {
                    window.zeigeAktivenBewohnerIndikator(window.aktuellerBewohner, isExisting);
                }
                
                // Aktive Bewohnerkarte finden und Info aktualisieren
                const aktiveBewohnerCard = document.querySelector('.bewohner-card.active');
                if (aktiveBewohnerCard) {
                    const infoElement = aktiveBewohnerCard.querySelector('.bewohner-info');
                    if (infoElement) {
                        if (isExisting) {
                            infoElement.innerHTML = `<span>Essensauswahl für: <strong>${window.aktuellerBewohner.firstName} ${window.aktuellerBewohner.lastName}</strong></span>
                                                  <span class="auswahl-status">(Bestehende Auswahl für KW${kw}/${jahr})</span>`;
                        } else {
                            infoElement.innerHTML = `<span>Essensauswahl für: <strong>${window.aktuellerBewohner.firstName} ${window.aktuellerBewohner.lastName}</strong></span>
                                                  <span class="auswahl-status">(Neue Auswahl für KW${kw}/${jahr})</span>`;
                        }
                        
                        // Infoelement anzeigen
                        infoElement.style.display = 'flex';
                    }
                }
            } catch (error) {
                console.error("Fehler beim Aktualisieren der Bewohneranzeige nach Kalenderwochenwechsel:", error);
            }
        }, 500);
    }
}

/**
 * Aktualisiert die mobile Ansicht nach einer Bewohnerauswahl oder Planaktualisierung
 */
function aktualisiereNachBewohnerAuswahl() {
    console.log('[Mobile] Aktualisiere mobile Ansicht nach Bewohnerauswahl');
    
    // Bestehende mobile Umstrukturierung entfernen
    const mobilContainer = document.querySelector('.mobile-menueplan-container');
    if (mobilContainer) {
        mobilContainer.remove();
    }
    
    // Tabelle neu umstrukturieren, falls vorhanden
    const tabelle = document.querySelector('.menueplan-tabelle');
    if (tabelle) {
        tabelle.classList.remove('mobile-formatiert');
        strukturiereTabelleFuerMobile(tabelle);
    }
}

/**
 * Initialisiert die Menüplantabelle
 */
function initialisiere() {
    // Container für die Menüplantabelle erstellen, falls noch nicht vorhanden
    let menuplanContainer = document.getElementById('menueplan-container');
    
    if (!menuplanContainer) {
        menuplanContainer = document.createElement('section');
        menuplanContainer.id = 'menueplan-container';
        menuplanContainer.classList.add('menueplan-container');
        
        // Container im DOM platzieren (nach dem Bewohner-Container)
        const bewohnerContainer = document.getElementById('bewohner-container');
        if (bewohnerContainer && bewohnerContainer.parentNode) {
            bewohnerContainer.parentNode.insertBefore(menuplanContainer, bewohnerContainer.nextSibling);
        } else {
            // Alternativ an main anhängen
            const main = document.querySelector('main');
            if (main) {
                main.appendChild(menuplanContainer);
            }
        }
    }
    
    // Event-Listener für Änderungen der Kalenderwoche
    document.addEventListener('kalenderwocheChanged', aktualisiereNachKalenderwocheAenderung);
    
    // Event-Listener für Fenstergröße hinzufügen, um bei Größenänderung die Mobilansicht anzupassen
    window.addEventListener('resize', () => {
        // Bestehende mobile Umstrukturierung entfernen
        const mobilContainer = document.querySelector('.mobile-menueplan-container');
        if (mobilContainer) {
            mobilContainer.remove();
        }
        
        // Tabelle neu umstrukturieren, falls vorhanden
        const tabelle = document.querySelector('.menueplan-tabelle');
        if (tabelle) {
            tabelle.classList.remove('mobile-formatiert');
            strukturiereTabelleFuerMobile(tabelle);
        }
    });
    
    // Event-Listener für Bewohnerauswahl hinzufügen, um die mobile Ansicht zu aktualisieren
    document.addEventListener('bewohnerSelected', () => {
        console.log('[Mobile] Bewohner ausgewählt, aktualisiere mobile Ansicht');
        // Kurze Verzögerung, damit die Tabelle zuerst aktualisiert werden kann
        setTimeout(aktualisiereNachBewohnerAuswahl, 100);
    });
    
    // Event-Listener für erfolgreiche Aktualisierung der Tabelle in bewohnerAuswahl.js
    document.addEventListener('tabelleAktualisiert', () => {
        console.log('[Mobile] Tabelle wurde aktualisiert, aktualisiere mobile Ansicht');
        // Kurze Verzögerung, damit die Tabelle zuerst vollständig aktualisiert werden kann
        setTimeout(aktualisiereNachBewohnerAuswahl, 100);
    });
    
    // Aktuelle Kalenderwoche ermitteln und Tabelle anzeigen
    const heute = new Date();
    const kw = getWeekNumber(heute);
    const jahr = heute.getFullYear();
    
    zeigeMenueplanTabelle('menueplan-container', kw, jahr);
}

/**
 * Hilfsfunktion zur Berechnung der Kalenderwoche eines Datums
 * @param {Date} datum - Das Datum
 * @returns {number} Die Kalenderwoche
 */
function getWeekNumber(datum) {
    const d = new Date(Date.UTC(datum.getFullYear(), datum.getMonth(), datum.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Module exportieren
export {
    initialisiere,
    zeigeMenueplanTabelle,
    erstelleMenueplanTabelle,
    ladeMenueplan
};
