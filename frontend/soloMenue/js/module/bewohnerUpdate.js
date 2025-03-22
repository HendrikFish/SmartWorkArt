/**
 * Modul für die Aktualisierung von Bewohnerdaten
 */

/**
 * Initialisiert die Event-Listener für den Update-Button
 */
export function initialisiere() {
    console.log('BewohnerUpdate-Modul wird initialisiert...');
    
    // Event-Listener für alle btn-success Buttons hinzufügen
    document.addEventListener('click', function(event) {
        // Prüfen, ob das geklickte Element oder ein Elternelement die Klasse 'btn-success' hat
        const btnSuccess = event.target.closest('.btn.btn-success');
        
        if (btnSuccess) {
            event.preventDefault();
            console.log('Update-Button wurde geklickt');
            
            // Bewohner-ID aus dem data-attribute oder parent container holen
            const bewohnerId = btnSuccess.dataset.bewohnerId || 
                               btnSuccess.closest('[data-bewohner-id]')?.dataset.bewohnerId;
            
            if (bewohnerId) {
                console.log(`Aktualisiere Bewohner mit ID: ${bewohnerId}`);
                aktualisiereBenutzer(bewohnerId);
            } else {
                console.error('Keine Bewohner-ID gefunden');
                zeigeFehlerMeldung('Keine Bewohner-ID gefunden');
            }
        }
    });
}

/**
 * Aktualisiert die Daten eines Bewohners
 * @param {string} bewohnerId - Die ID des zu aktualisierenden Bewohners
 */
async function aktualisiereBenutzer(bewohnerId) {
    try {
        // Zeige Lade-Indikator
        zeigeLoadingIndikator();
        
        // Lade aktuelle Bewohnerdaten
        const bewohner = await ladeBewohnerDaten(bewohnerId);
        
        if (!bewohner) {
            throw new Error('Bewohner konnte nicht geladen werden');
        }
        
        // Formular-Daten sammeln (falls ein Formular vorhanden ist)
        const formData = sammleFormularDaten(bewohner);
        
        // Bewohnerdaten mit den neuen Daten aktualisieren
        const updatedData = {
            ...bewohner,
            ...formData,
            lastModified: new Date().toISOString()
        };
        
        // Bewohnername formatieren (falls erforderlich)
        const bewohnerName = `${bewohner.firstName.trim()}_${bewohner.lastName.trim()}`;
        
        // API-Aufruf zum Aktualisieren der Daten
        const response = await fetch(`/api/solomenue/update-bewohner/${bewohnerName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
            credentials: 'include'
        });
        
        // Lade-Indikator ausblenden
        verbergeLoadingIndikator();
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server-Fehler: ${response.status} ${errorText}`);
        }
        
        const result = await response.json();
        
        // Erfolgsmeldung anzeigen
        zeigeErfolgsMeldung('Bewohnerdaten erfolgreich aktualisiert!');
        
        // Optional: Seite neu laden oder aktualisieren
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
        return result;
    } catch (error) {
        // Lade-Indikator ausblenden bei Fehler
        verbergeLoadingIndikator();
        
        console.error('Fehler bei der Aktualisierung der Bewohnerdaten:', error);
        zeigeFehlerMeldung(`Fehler: ${error.message}`);
        return null;
    }
}

/**
 * Lädt die Daten eines Bewohners vom Server
 * @param {string} bewohnerId - Die ID des Bewohners
 * @returns {Promise<Object>} Die Bewohnerdaten oder null bei Fehler
 */
async function ladeBewohnerDaten(bewohnerId) {
    try {
        const response = await fetch(`/api/solomenue/bewohner/${bewohnerId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Fehler: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Laden der Bewohnerdaten:', error);
        return null;
    }
}

/**
 * Sammelt Daten aus einem Formular (falls vorhanden)
 * @param {Object} bewohner - Die aktuellen Bewohnerdaten als Fallback
 * @returns {Object} Die gesammelten Formulardaten
 */
function sammleFormularDaten(bewohner) {
    // Hier könnte Code stehen, um Daten aus einem Formular zu sammeln
    // Falls kein Formular vorhanden ist, geben wir leere Daten zurück
    
    const formData = {};
    
    // Beispiel: Wenn ein Formular mit der ID 'bewohner-form' existiert
    const form = document.getElementById('bewohner-form');
    
    if (form) {
        // Formular-Elemente durchlaufen
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            
            // Nur Elemente mit Name-Attribut berücksichtigen
            if (element.name) {
                // Je nach Element-Typ den Wert auslesen
                if (element.type === 'checkbox') {
                    formData[element.name] = element.checked;
                } else if (element.type === 'radio') {
                    if (element.checked) {
                        formData[element.name] = element.value;
                    }
                } else {
                    formData[element.name] = element.value;
                }
            }
        }
    }
    
    return formData;
}

/**
 * Zeigt einen Lade-Indikator an
 */
function zeigeLoadingIndikator() {
    // Prüfen, ob bereits ein Lade-Indikator existiert
    let loadingElement = document.getElementById('loading-indicator');
    
    if (!loadingElement) {
        // Lade-Indikator erstellen
        loadingElement = document.createElement('div');
        loadingElement.id = 'loading-indicator';
        loadingElement.classList.add('loading-indicator');
        loadingElement.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Daten werden aktualisiert...</p>
        `;
        
        // Stil hinzufügen
        const style = document.createElement('style');
        style.textContent = `
            .loading-indicator {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                color: white;
            }
            
            .loading-spinner {
                border: 5px solid #f3f3f3;
                border-top: 5px solid #3498db;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                animation: spin 2s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loadingElement);
    } else {
        // Vorhandenen Lade-Indikator anzeigen
        loadingElement.style.display = 'flex';
    }
}

/**
 * Blendet den Lade-Indikator aus
 */
function verbergeLoadingIndikator() {
    const loadingElement = document.getElementById('loading-indicator');
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

/**
 * Zeigt eine Erfolgsmeldung an
 * @param {string} nachricht - Die anzuzeigende Nachricht
 */
function zeigeErfolgsMeldung(nachricht) {
    zeigeNotifikation(nachricht, 'erfolg');
}

/**
 * Zeigt eine Fehlermeldung an
 * @param {string} nachricht - Die anzuzeigende Nachricht
 */
function zeigeFehlerMeldung(nachricht) {
    zeigeNotifikation(nachricht, 'fehler');
}

/**
 * Zeigt eine Benachrichtigung an
 * @param {string} nachricht - Die anzuzeigende Nachricht
 * @param {string} typ - Der Typ der Nachricht ('erfolg' oder 'fehler')
 */
function zeigeNotifikation(nachricht, typ) {
    // Prüfen, ob bereits eine Benachrichtigungsstyling existiert
    let styleElement = document.getElementById('notification-styles');
    
    if (!styleElement) {
        // Styling für Benachrichtigungen erstellen
        styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                animation: fadeInOut 4s ease-in-out;
            }
            
            .notification-erfolg {
                background-color: #4CAF50;
            }
            
            .notification-fehler {
                background-color: #f44336;
            }
            
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(-20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(-20px); }
            }
        `;
        
        document.head.appendChild(styleElement);
    }
    
    // Benachrichtigung erstellen
    const notification = document.createElement('div');
    notification.classList.add('notification', `notification-${typ}`);
    notification.textContent = nachricht;
    
    document.body.appendChild(notification);
    
    // Benachrichtigung nach 4 Sekunden entfernen
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 4000);
} 