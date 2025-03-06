/**
 * Globale Konfigurationsdatei für Frontend-API-Endpunkte und Basis-URLs
 * Ermöglicht dynamisches Umschalten zwischen Produktions- und Entwicklungsumgebung
 */

const isProduction = window.location.hostname !== 'localhost';

const config = {
  // Basis-URL für API-Anfragen
  API_BASE_URL: isProduction
    ? 'https://smartworkart.onrender.com'
    : 'http://localhost:8086',
  
  // API-Endpunkt
  API_ENDPOINT: isProduction
    ? 'https://smartworkart.onrender.com/api'
    : 'http://localhost:8086/api',
  
  // Login-URL
  LOGIN_URL: isProduction
    ? 'https://smartworkart.onrender.com/login'
    : 'http://localhost:8086/login'
};

export default config; 