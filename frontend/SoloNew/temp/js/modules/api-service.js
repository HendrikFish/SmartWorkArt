/**
 * API-Service
 * Zentralisierte API-Kommunikation mit dem Backend
 */

export const ApiService = {
    apiBaseUrl: null,
    
    /**
     * Initialisiert den Service mit Konfigurationseinstellungen
     * @param {Object} config - Konfigurationsobjekt
     * @param {string} config.apiBaseUrl - Basis-URL für API-Endpunkte
     */
    init(config) {
        this.apiBaseUrl = config.apiBaseUrl || '/api/solo';
        console.log('API-Service initialisiert mit Basis-URL:', this.apiBaseUrl);
        return Promise.resolve();
    },
    
    /**
     * Führt einen API-Request durch
     * @param {string} endpoint - API-Endpunkt
     * @param {Object} options - Fetch-Optionen
     * @returns {Promise<any>} - Promise mit der API-Antwort
     */
    async request(endpoint, options = {}) {
        try {
            const url = `${this.apiBaseUrl}${endpoint}`;
            
            // Default-Optionen setzen
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'same-origin'
            };
            
            // Optionen zusammenführen
            const fetchOptions = { ...defaultOptions, ...options };
            
            // Bei POST/PUT/PATCH mit JSON-Body den Body als JSON serialisieren
            if (fetchOptions.body && typeof fetchOptions.body === 'object') {
                fetchOptions.body = JSON.stringify(fetchOptions.body);
            }
            
            console.log(`API-Request: ${fetchOptions.method} ${url}`);
            
            // Request ausführen
            const response = await fetch(url, fetchOptions);
            
            // JSON-Antwort parsen wenn möglich
            let data;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            // Auf Fehler prüfen
            if (!response.ok) {
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    data
                };
            }
            
            return data;
        } catch (error) {
            console.error('API-Request fehlgeschlagen:', error);
            throw error;
        }
    },
    
    /**
     * GET-Request an einen API-Endpunkt
     * @param {string} endpoint - API-Endpunkt
     * @param {Object} options - Zusätzliche Fetch-Optionen
     * @returns {Promise<any>} - Promise mit der API-Antwort
     */
    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },
    
    /**
     * POST-Request an einen API-Endpunkt
     * @param {string} endpoint - API-Endpunkt
     * @param {Object} data - Zu sendende Daten
     * @param {Object} options - Zusätzliche Fetch-Optionen
     * @returns {Promise<any>} - Promise mit der API-Antwort
     */
    post(endpoint, data, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'POST',
            body: data
        });
    },
    
    /**
     * PUT-Request an einen API-Endpunkt
     * @param {string} endpoint - API-Endpunkt
     * @param {Object} data - Zu sendende Daten
     * @param {Object} options - Zusätzliche Fetch-Optionen
     * @returns {Promise<any>} - Promise mit der API-Antwort
     */
    put(endpoint, data, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: 'PUT',
            body: data
        });
    },
    
    /**
     * DELETE-Request an einen API-Endpunkt
     * @param {string} endpoint - API-Endpunkt
     * @param {Object} options - Zusätzliche Fetch-Optionen
     * @returns {Promise<any>} - Promise mit der API-Antwort
     */
    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    },
    
    /**
     * Lädt alle aktuellen Bewohner
     * @returns {Promise<Array>} - Liste aller Bewohner
     */
    getResidents() {
        return this.get('/residents');
    },
    
    /**
     * Lädt alle entlassenen Bewohner
     * @returns {Promise<Array>} - Liste aller entlassenen Bewohner
     */
    getDismissedResidents() {
        return this.get('/residents/dismissed');
    },
    
    /**
     * Erstellt einen neuen Bewohner
     * @param {Object} residentData - Bewohnerdaten
     * @returns {Promise<Object>} - Erstellter Bewohner
     */
    createResident(residentData) {
        return this.post('/resident', residentData);
    },
    
    /**
     * Aktualisiert einen Bewohner
     * @param {string} residentName - Name des Bewohners als ID
     * @param {Object} residentData - Aktualisierte Bewohnerdaten
     * @returns {Promise<Object>} - Aktualisierter Bewohner
     */
    updateResident(residentName, residentData) {
        return this.put(`/resident/${residentName}`, residentData);
    },
    
    /**
     * Entlässt einen Bewohner (verschiebt ihn in den old-Ordner)
     * @param {string} residentName - Name des Bewohners als ID
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    dismissResident(residentName) {
        return this.post(`/resident/dismiss/${residentName}`);
    },
    
    /**
     * Holt einen entlassenen Bewohner zurück
     * @param {string} residentName - Name des Bewohners als ID
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    resurrectResident(residentName) {
        return this.post(`/resident/resurrect/${residentName}`);
    },
    
    /**
     * Lädt die Konfiguration
     * @returns {Promise<Object>} - Konfigurationsobjekt
     */
    getConfig() {
        return this.get('/config');
    },
    
    /**
     * Speichert die Konfiguration
     * @param {Object} configData - Konfigurationsdaten
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    saveConfig(configData) {
        return this.post('/config', configData);
    },
    
    /**
     * Lädt die Filter-Konfiguration
     * @returns {Promise<Object>} - Filter-Konfiguration
     */
    getFilters() {
        return this.get('/filters');
    },
    
    /**
     * Speichert die Filter-Konfiguration
     * @param {Object} filterData - Filter-Konfigurationsdaten
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    saveFilters(filterData) {
        return this.put('/filters', filterData);
    },
    
    /**
     * Verarbeitet ein Bild mit OCR
     * @param {FormData} formData - FormData-Objekt mit dem Bild
     * @returns {Promise<Object>} - Erkannter Text
     */
    processOcr(formData) {
        return this.request('/ocr/process', {
            method: 'POST',
            body: formData,
            headers: {
                // Content-Type wird von FormData automatisch gesetzt
                'Accept': 'application/json'
            }
        });
    },
    
    /**
     * Stellt sicher, dass alle notwendigen Verzeichnisse existieren
     * @returns {Promise<Object>} - Ergebnis der Operation
     */
    ensureDirectories() {
        return this.post('/create-directories');
    }
}; 