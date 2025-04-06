/**
 * API-Service Modul
 * Stellt Funktionen für die Kommunikation mit der API bereit
 */

export const ApiService = {
    apiBaseUrl: '/api/solo',
    
    /**
     * Initialisiert den API-Service
     * @param {Object} options - Konfigurationsoptionen
     */
    init(options = {}) {
        if (options.apiBaseUrl) {
            this.apiBaseUrl = options.apiBaseUrl;
        }
        
        console.log('API-Service initialisiert mit Basis-URL:', this.apiBaseUrl);
    },
    
    /**
     * Führt eine API-Anfrage aus
     * @param {string} endpoint - API-Endpunkt
     * @param {Object} options - Fetch-Optionen
     * @returns {Promise<any>} - API-Antwort
     */
    async fetch(endpoint, options = {}) {
        try {
            const url = `${this.apiBaseUrl}${endpoint}`;
            
            // Standardoptionen für alle Anfragen
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            // Optionen zusammenführen
            const mergedOptions = { ...defaultOptions, ...options };
            
            // Wenn Daten übergeben wurden und Methode nicht GET ist, konvertiere zu JSON
            if (mergedOptions.data && mergedOptions.method !== 'GET') {
                mergedOptions.body = JSON.stringify(mergedOptions.data);
                delete mergedOptions.data;
            }
            
            console.log(`API-Anfrage: ${mergedOptions.method || 'GET'} ${url}`);
            
            const response = await fetch(url, mergedOptions);
            
            // Wenn Antwort nicht OK, wirf einen Fehler
            if (!response.ok) {
                // Versuche, JSON-Fehlermeldung zu lesen
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Fehler ${response.status}: ${response.statusText}`);
                } catch (jsonError) {
                    // Falls JSON-Parsing fehlschlägt, wirf den ursprünglichen Fehler
                    throw new Error(`Fehler ${response.status}: ${response.statusText}`);
                }
            }
            
            // Versuche, JSON zu parsen, falls möglich
            try {
                return await response.json();
            } catch (jsonError) {
                // Für nicht-JSON-Antworten
                return await response.text();
            }
        } catch (error) {
            console.error('API-Fehler:', error);
            throw error;
        }
    },
    
    /**
     * Lädt die Konfiguration vom Server (aus formConfig.json)
     * @returns {Promise<Object>} - Konfigurationsdaten
     */
    async getConfig() {
        try {
            return await this.fetch('/config');
        } catch (error) {
            console.error('Fehler beim Laden der Konfiguration:', error);
            throw new Error('Konfiguration konnte nicht geladen werden: ' + error.message);
        }
    },
    
    /**
     * Aktualisiert die Konfiguration auf dem Server (in formConfig.json)
     * @param {Object} configData - Neue Konfigurationsdaten
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async updateConfig(configData) {
        try {
            return await this.fetch('/config', {
                method: 'POST',
                data: configData
            });
        } catch (error) {
            console.error('Fehler beim Speichern der Konfiguration:', error);
            throw new Error('Konfiguration konnte nicht gespeichert werden: ' + error.message);
        }
    },
    
    /**
     * Lädt die Filter vom Server (aus filter.json)
     * @returns {Promise<Object>} - Filterdaten
     */
    async getFilters() {
        try {
            return await this.fetch('/filters');
        } catch (error) {
            console.error('Fehler beim Laden der Filter:', error);
            throw new Error('Filter konnten nicht geladen werden: ' + error.message);
        }
    },
    
    /**
     * Aktualisiert die Filter auf dem Server (in filter.json)
     * @param {Object} filterData - Neue Filterdaten
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async updateFilters(filterData) {
        try {
            return await this.fetch('/filters', {
                method: 'PUT',
                data: filterData
            });
        } catch (error) {
            console.error('Fehler beim Speichern der Filter:', error);
            throw new Error('Filter konnten nicht gespeichert werden: ' + error.message);
        }
    },
    
    /**
     * Holt alle Bewohner vom Server
     * @returns {Promise<Array>} - Liste der Bewohner
     */
    async getResidents() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/residents`);
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const residents = await response.json();
            
            // Debug: Analysiere die Bewohnerstruktur
            console.log('Geladene Bewohner:', residents.length);
            if (residents.length > 0) {
                console.log('Beispiel Bewohner:', residents[0]);
                
                // Prüfe auf areas Objekt
                let withAreas = 0;
                let withoutAreas = 0;
                let withWoWird = 0;
                
                residents.forEach(resident => {
                    if (resident.areas) {
                        withAreas++;
                        
                        // Prüfe speziell nach "Wo wird das Essen eingetragen!"
                        if (resident.areas['Wo wird das Essen eingetragen!']) {
                            withWoWird++;
                        }
                    } else {
                        withoutAreas++;
                    }
                });
                
                console.log('Bewohner Statistik:');
                console.log(`- Mit areas Objekt: ${withAreas}`);
                console.log(`- Ohne areas Objekt: ${withoutAreas}`);
                console.log(`- Mit 'Wo wird das Essen eingetragen!': ${withWoWird}`);
            }
            
            return residents;
        } catch (error) {
            console.error('Fehler beim Laden der Bewohner:', error);
            throw error;
        }
    },
    
    /**
     * Lädt entlassene Bewohner vom Server
     * @returns {Promise<Array>} - Liste entlassener Bewohner
     */
    async getDismissedResidents() {
        try {
            return await this.fetch('/residents/dismissed');
        } catch (error) {
            console.error('Fehler beim Laden der entlassenen Bewohner:', error);
            throw new Error('Entlassene Bewohner konnten nicht geladen werden: ' + error.message);
        }
    },
    
    /**
     * Erstellt einen neuen Bewohner
     * @param {Object} residentData - Bewohnerdaten
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async createResident(residentData) {
        try {
            return await this.fetch('/resident', {
                method: 'POST',
                data: residentData
            });
        } catch (error) {
            console.error('Fehler beim Erstellen des Bewohners:', error);
            throw new Error('Bewohner konnte nicht erstellt werden: ' + error.message);
        }
    },
    
    /**
     * Aktualisiert einen Bewohner
     * @param {string} residentName - Name des Bewohners
     * @param {Object} residentData - Neue Bewohnerdaten
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async updateResident(residentName, residentData) {
        try {
            return await this.fetch(`/resident/${residentName}`, {
                method: 'PUT',
                data: residentData
            });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Bewohners:', error);
            throw new Error('Bewohner konnte nicht aktualisiert werden: ' + error.message);
        }
    },
    
    /**
     * Entlässt einen Bewohner
     * @param {string} residentName - Name des Bewohners
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async dismissResident(residentName) {
        try {
            return await this.fetch(`/resident/dismiss/${residentName}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Fehler beim Entlassen des Bewohners:', error);
            throw new Error('Bewohner konnte nicht entlassen werden: ' + error.message);
        }
    },
    
    /**
     * Stellt einen entlassenen Bewohner wieder her
     * @param {string} residentName - Name des Bewohners
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async resurrectResident(residentName) {
        try {
            return await this.fetch(`/resident/resurrect/${residentName}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Fehler beim Wiederherstellen des Bewohners:', error);
            throw new Error('Bewohner konnte nicht wiederhergestellt werden: ' + error.message);
        }
    },
    
    /**
     * Sendet ein Bild für die OCR-Verarbeitung an den Server
     * @param {File} file - Die Bilddatei
     * @returns {Promise<Object>} Die Serverantwort
     */
    async processOcrImage(file) {
        try {
            console.log('Sende Bild für OCR-Verarbeitung:', file.name, 'Größe:', (file.size / 1024).toFixed(2), 'KB');
            
            // FormData für den Upload
            const formData = new FormData();
            formData.append('image', file);
            
            // Debug-Ausgabe für FormData (begrenzt, da FormData nicht direkt sichtbar ist)
            console.log('FormData erstellt, Bild angehängt:', file.name);
            
            // Konfiguration für fetch
            const config = {
                method: 'POST',
                body: formData,
                // Keine Content-Type-Header hier, wird durch FormData automatisch gesetzt
            };
            
            // Debug-Ausgabe für API-URL
            const apiUrl = `${this.apiBaseUrl}/ocr/process`;
            console.log('Sende OCR-Anfrage an:', apiUrl);
            
            // API-Anfrage senden
            const response = await fetch(apiUrl, config);
            
            console.log('OCR API-Antwort Status:', response.status);
            
            // HTTP-Fehler abfangen
            if (!response.ok) {
                // Versuche, den Fehlerstatus zu lesen
                try {
                    const errorData = await response.json();
                    console.error('OCR API-Fehler:', errorData);
                    throw new Error(errorData.message || `OCR-Fehler: HTTP ${response.status}`);
                } catch (jsonError) {
                    // Falls JSON-Parsing fehlschlägt, wirf einen generischen Fehler
                    console.error('OCR API-Fehler (kein JSON):', response.statusText);
                    throw new Error(`OCR-Fehler: HTTP ${response.status} ${response.statusText}`);
                }
            }
            
            // Erfolgreiche Antwort: Analysiere das JSON
            let result;
            try {
                result = await response.json();
                console.log('OCR-Ergebnis erhalten (Erste 100 Zeichen):', 
                    result.text ? result.text.substring(0, 100) + '...' : 'Kein Text in der Antwort');
                
                // Überprüfe, ob das Ergebnis gültig ist
                if (!result || !result.text) {
                    console.warn('OCR-Ergebnis ohne Text erhalten:', result);
                    throw new Error('Keine Texterkennung im Bild möglich');
                }
            } catch (jsonError) {
                console.error('Fehler beim Parsen der OCR-Antwort:', jsonError);
                throw new Error('Fehler beim Verarbeiten der OCR-Antwort');
            }
            
            // Gib das Ergebnis zurück
            return result;
        } catch (error) {
            console.error('Fehler bei der OCR-Verarbeitung:', error);
            throw error;
        }
    },
    
    /**
     * Speichert die aktuelle Filterkonfiguration im Backend
     * @returns {Promise<Object>} - Antwort vom Server
     */
    async saveFilterConfig() {
        try {
            // Debug-Ausgabe für die zu speichernden Filter
            console.log('Speichere Filter-Konfiguration:', this.config.filters);
            
            // Aktualisiere die Filter im Backend
            const result = await ApiService.updateFilters({
                fields: this.config.filters.fields || [],
                areas: this.config.filters.areas || []
            });
            
            console.log('Filter gespeichert:', result);
            return result;
        } catch (error) {
            console.error('Fehler beim Speichern der Filter:', error);
            ToastManager.error('Fehler beim Speichern der Filter');
            throw error;
        }
    }
}; 