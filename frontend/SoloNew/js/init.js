/**
 * Initialisierungs-Skript
 * Lädt und initialisiert alle Module der Anwendung
 */

// Import von Modulen
import { ApiService } from './Module/api-service.js';
import { ToastManager } from './Module/toast-manager.js';
import { ConfigManager } from './Module/config-manager.js';
import { ResidentManager } from './Module/resident-manager.js';
import { ModalManager } from './Module/modal-manager.js';
import { FilterManager } from './Module/filter-manager.js';
import { OCRManager } from './Module/ocr-manager.js';

/**
 * Initialisiert die Anwendung
 * Lädt und initialisiert alle Module
 */
async function initApp() {
    try {
        console.log('SoloNew App wird initialisiert...');
        
        // Toast-Manager initialisieren (für Benachrichtigungen)
        await ToastManager.init();
        
        // API-Service initialisieren (für API-Anfragen)
        ApiService.init({
            apiBaseUrl: '/api/solo'
        });
        
        // Config-Manager initialisieren (für Konfiguration)
        await ConfigManager.init();
        
        // Resident-Manager initialisieren (für Bewohnerdaten)
        await ResidentManager.init();
        
        // Filter-Manager initialisieren (für Filterung)
        await FilterManager.init();
        
        // Modal-Manager initialisieren (für Modals)
        ModalManager.init();
        
        // OCR-Manager initialisieren (für Dokumentenerkennung)
        OCRManager.init();
        
        // Alle Bewohner anzeigen
        await ResidentManager.displayAllResidents();
        
        console.log('Anwendung erfolgreich initialisiert');

        // Service Worker registrieren, falls verfügbar
        registerServiceWorker();
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        
        // Zeige Fehlermeldung in der UI an
        if (ToastManager) {
            ToastManager.error('Fehler bei der Initialisierung: ' + error.message);
        } else {
            // Fallback, falls der ToastManager nicht verfügbar ist
            alert('Fehler bei der Initialisierung: ' + error.message);
        }
    }
}

/**
 * Registriert den Service Worker, falls verfügbar
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('ServiceWorker registriert:', registration);
            } catch (error) {
                console.error('ServiceWorker Registrierung fehlgeschlagen:', error);
            }
        });
    }
}

// Initialisiere die Anwendung, wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', initApp);

// Exportiere die Initialisierungsfunktion für mögliche Wiederverwendung
export { initApp }; 