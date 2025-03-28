/**
 * DatenSpeicher.js
 * Modul für das Speichern der Bewohnerdaten
 */

/**
 * Speichert die Bewohnerdaten auf dem Server
 * @param {Object} bewohner - Der zu speichernde Bewohner
 * @param {Object} aktualisierteAreas - Die aktualisierten Bereiche
 * @returns {Promise<Object>} Das Ergebnis des Speichervorgangs
 */
async function speichereBewohnerdaten(bewohner, aktualisierteAreas) {
    if (!bewohner) {
        throw new Error('Keine Bewohnerdaten zum Speichern vorhanden');
    }
    
    // Bewohnerdaten aktualisieren - Leerzeichen im Namen entfernen
    const vorname = bewohner.firstName.trim().toLowerCase();
    const nachname = bewohner.lastName.trim().toLowerCase();
    const bewohnerName = `${vorname}_${nachname}`;
    
    const bewohnerDaten = {
        ...bewohner,
        firstName: bewohner.firstName.trim(),  // Original Vorname beibehalten (nur trimmen)
        lastName: bewohner.lastName.trim(),    // Original Nachname beibehalten (nur trimmen)
        areas: aktualisierteAreas,
        lastModified: new Date().toISOString()  // Hinzufügen eines Zeitstempels
    };
    
    try {
        console.log(`Speichere Bewohnerdaten für: ${bewohnerName}`, bewohnerDaten);
        
        // Daten an den Fallback-Endpunkt senden
        const response = await fetch('/api/bewohner-save-direct', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: bewohnerName,
                data: bewohnerDaten
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP Fehler: ${response.status} - ${errorText}`);
        }
        
        const ergebnis = await response.json();
        console.log('Bewohnerdaten erfolgreich aktualisiert:', ergebnis);
        
        // Event auslösen, dass Bewohnerdaten aktualisiert wurden
        document.dispatchEvent(new CustomEvent('bewohnerDataUpdated', {
            detail: { bewohner: bewohnerDaten }
        }));
        
        return {
            erfolg: true,
            bewohner: bewohnerDaten,
            meldung: 'Die Bewohnerdaten wurden erfolgreich aktualisiert.'
        };
    } catch (error) {
        console.error('Fehler beim Speichern der Bewohnerdaten:', error);
        
        throw new Error(`Fehler beim Speichern der Bewohnerdaten: ${error.message}`);
    }
}

// Modul exportieren
export {
    speichereBewohnerdaten
}; 