/**
 * Kalenderwochenfunktionen für die SoloMenü-Anwendung
 */

// Aktuelle Kalenderwoche speichern
let aktuelleKalenderwoche = {
    kw: 0,
    jahr: 0,
    startDatum: null,
    endDatum: null
};

/**
 * Berechnet die Kalenderwoche für ein gegebenes Datum
 * @param {Date} datum - Das Datum, für das die Kalenderwoche berechnet werden soll
 * @returns {number} Die Kalenderwoche
 */
function berechneKalenderwoche(datum) {
    const ersterJanuar = new Date(datum.getFullYear(), 0, 1);
    const zielDatum = new Date(datum);
    
    // Berechne den Tag des Jahres
    const tageImJahr = Math.floor((zielDatum - ersterJanuar) / (24 * 60 * 60 * 1000));
    
    // Berechne die Kalenderwoche
    const wochentag = ersterJanuar.getDay(); // 0 für Sonntag, 1 für Montag, ...
    const ersterWochentag = wochentag === 0 ? 7 : wochentag; // ISO: Montag = 1, Sonntag = 7
    const korrektur = ersterWochentag <= 4 ? 0 : 1; // KW1 ist die Woche mit dem ersten Donnerstag
    
    let kw = Math.floor((tageImJahr + ersterWochentag - 1) / 7) + 1 - korrektur;
    
    // Spezialfall: Letzte oder erste Tage des Jahres
    if (kw < 1) {
        // Letzten Tage des Vorjahres gehören zur letzten KW des Vorjahres
        const letzterTagVorjahr = new Date(datum.getFullYear() - 1, 11, 31);
        return berechneKalenderwoche(letzterTagVorjahr);
    } else if (kw > 52) {
        // Prüfen, ob es KW 53 gibt oder schon KW 1 des nächsten Jahres
        const letzterTagJahr = new Date(datum.getFullYear(), 11, 31);
        const kw53 = berechneKalenderwoche(letzterTagJahr);
        if (kw53 == 1) {
            kw = 1;
        }
    }
    
    return kw;
}

/**
 * Berechnet das Start- und Enddatum einer Kalenderwoche
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 * @returns {Object} Start- und Enddatum der Kalenderwoche
 */
function berechneKalenderwochenDaten(kw, jahr) {
    // Finde den ersten Tag des Jahres
    const ersterTagJahr = new Date(jahr, 0, 1);
    
    // Finde den ersten Montag des Jahres oder den ersten Tag des Jahres, wenn es ein Montag ist
    const tagErsterTagJahr = ersterTagJahr.getDay() || 7; // Umwandlung: Sonntag von 0 zu 7
    const differenzZuMontag = tagErsterTagJahr > 1 ? 9 - tagErsterTagJahr : 1;
    const ersterMontag = new Date(jahr, 0, differenzZuMontag);
    
    // Berechne den Start der gewünschten KW (Montag)
    const startKW = new Date(ersterMontag);
    startKW.setDate(ersterMontag.getDate() + (kw - 1) * 7);
    
    // Berechne das Ende der gewünschten KW (Sonntag)
    const endKW = new Date(startKW);
    endKW.setDate(startKW.getDate() + 6);
    
    return {
        startDatum: startKW,
        endDatum: endKW
    };
}

/**
 * Formatiert ein Datum als deutsches Datum (TT.MM.YYYY)
 * @param {Date} datum - Das zu formatierende Datum
 * @returns {string} Das formatierte Datum
 */
function formatiereDatum(datum) {
    return datum.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Protokolliert Änderungen der Kalenderwoche für besseres Debugging
 * @param {string} aktion - Die Aktion, die ausgeführt wurde
 */
function logKalenderwoche(aktion) {
    console.log(`[KW-LOG] ${aktion}: KW${aktuelleKalenderwoche.kw}/${aktuelleKalenderwoche.jahr} (${formatiereDatum(aktuelleKalenderwoche.startDatum)} - ${formatiereDatum(aktuelleKalenderwoche.endDatum)})`);
}

/**
 * Aktualisiert die Anzeige der aktuellen Kalenderwoche
 */
function aktualisiereKalenderwocheAnzeige() {
    const kwDisplay = document.getElementById('current-week-display');
    
    if (!kwDisplay) return;
    
    const startFormatiert = formatiereDatum(aktuelleKalenderwoche.startDatum);
    const endFormatiert = formatiereDatum(aktuelleKalenderwoche.endDatum);
    
    kwDisplay.textContent = `KW ${aktuelleKalenderwoche.kw}/${aktuelleKalenderwoche.jahr} (${startFormatiert} - ${endFormatiert})`;
    
    // Benutzerdefiniertes Event auslösen, wenn sich die Kalenderwoche ändert
    const event = new CustomEvent('kalenderwocheChanged', {
        detail: {
            kw: aktuelleKalenderwoche.kw,
            jahr: aktuelleKalenderwoche.jahr,
            startDatum: aktuelleKalenderwoche.startDatum,
            endDatum: aktuelleKalenderwoche.endDatum
        }
    });
    
    console.log(`[KW-CHANGE] Event 'kalenderwocheChanged' wird ausgelöst für KW${aktuelleKalenderwoche.kw}/${aktuelleKalenderwoche.jahr}`);
    document.dispatchEvent(event);
}

/**
 * Setzt die aktuelle Kalenderwoche auf die angegebene KW und Jahr
 * @param {number} kw - Die Kalenderwoche
 * @param {number} jahr - Das Jahr
 */
function setzeKalenderwoche(kw, jahr) {
    // Sicherstellen, dass KW und Jahr gültige Werte haben
    if (kw < 1) {
        kw = 52;
        jahr--;
    } else if (kw > 52) {
        kw = 1;
        jahr++;
    }
    
    // Kalenderwochendaten berechnen
    const kwDaten = berechneKalenderwochenDaten(kw, jahr);
    
    // Aktuelle Kalenderwoche setzen
    aktuelleKalenderwoche = {
        kw: kw,
        jahr: jahr,
        startDatum: kwDaten.startDatum,
        endDatum: kwDaten.endDatum
    };
    
    // Anzeige aktualisieren
    aktualisiereKalenderwocheAnzeige();
    
    // Für Debugging-Zwecke
    logKalenderwoche('Kalenderwoche gesetzt');
}

/**
 * Wechselt zur nächsten Kalenderwoche
 */
function naechsteKalenderwoche() {
    setzeKalenderwoche(aktuelleKalenderwoche.kw + 1, aktuelleKalenderwoche.jahr);
    logKalenderwoche('Nächste Kalenderwoche');
}

/**
 * Wechselt zur vorherigen Kalenderwoche
 */
function vorherigeKalenderwoche() {
    setzeKalenderwoche(aktuelleKalenderwoche.kw - 1, aktuelleKalenderwoche.jahr);
    logKalenderwoche('Vorherige Kalenderwoche');
}

/**
 * Setzt die Kalenderwoche auf die aktuelle Woche des heutigen Datums
 */
function setzeAktuelleKalenderwoche() {
    const heuteDatum = new Date();
    const kw = berechneKalenderwoche(heuteDatum);
    const jahr = heuteDatum.getFullYear();
    
    setzeKalenderwoche(kw, jahr);
    logKalenderwoche('Aktuelle Kalenderwoche');
}

/**
 * Initialisiert die Kalenderwochenanzeige mit dem aktuellen Datum
 */
function initialisiere() {
    const heuteDatum = new Date();
    const kw = berechneKalenderwoche(heuteDatum);
    const jahr = heuteDatum.getFullYear();
    
    setzeKalenderwoche(kw, jahr);
    
    // Event-Listener für die Navigationsbuttons
    const prevButton = document.getElementById('prev-week-btn');
    const nextButton = document.getElementById('next-week-btn');
    const currentButton = document.getElementById('current-week-btn');
    
    if (prevButton) {
        prevButton.addEventListener('click', vorherigeKalenderwoche);
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', naechsteKalenderwoche);
    }
    
    if (currentButton) {
        currentButton.addEventListener('click', setzeAktuelleKalenderwoche);
    }
}

/**
 * Gibt die aktuell ausgewählte Kalenderwoche und das Jahr zurück
 * @returns {Object} Objekt mit kw und jahr
 */
function getAktuelleKalenderwoche() {
    return {
        kw: aktuelleKalenderwoche.kw,
        jahr: aktuelleKalenderwoche.jahr
    };
}

// Module exportieren
export {
    initialisiere,
    berechneKalenderwoche,
    berechneKalenderwochenDaten,
    formatiereDatum,
    setzeKalenderwoche,
    naechsteKalenderwoche,
    vorherigeKalenderwoche,
    getAktuelleKalenderwoche,
    setzeAktuelleKalenderwoche
};
