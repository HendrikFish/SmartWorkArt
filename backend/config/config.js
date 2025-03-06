/**
 * Globale Konfigurationsdatei für API-Endpunkte und Basis-URLs des Projekts
 * Ermöglicht dynamisches Umschalten zwischen Produktions- und Entwicklungsumgebung
 */

const config = {
  // Basis-URL für API-Anfragen
  API_BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://smartworkart.onrender.com'
    : 'http://localhost:8086',
  
  // Login-URL
  LOGIN_URL: process.env.NODE_ENV === 'production'
    ? 'https://smartworkart.onrender.com/login'
    : 'http://localhost:8086/login',
  
  // Frontend-URL
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://smartworkart.onrender.com'
    : 'http://localhost:8086'
};

module.exports = config; 