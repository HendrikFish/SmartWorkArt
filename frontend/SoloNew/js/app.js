/**
 * SoloNew - Hauptanwendungsmodul
 * Verwaltet die Initialisierung und Koordination aller Anwendungsmodule
 */

// Importiere die benötigten Module
import { ApiService } from './Module/api-service.js';
import { ToastManager } from './Module/toast-manager.js';
import { ConfigManager } from './Module/config-manager.js';
import { ResidentManager } from './Module/resident-manager.js';
import { FilterManager } from './Module/filter-manager.js';
import { ModalManager } from './Module/modal-manager.js';
import { OCRManager } from './Module/ocr-manager.js';
import { DarkModeManager } from './Module/dark-mode-manager.js';

/**
 * Hauptanwendungsklasse
 */
class SoloNewApp {
  /**
   * Konstruktor der Anwendung
   */
  constructor() {
    // Status der Initialisierung
    this.isInitialized = false;
    
    // Module als Eigenschaften speichern, um sie global im Kontext der Anwendung zugänglich zu machen
    this.api = ApiService;
    this.toast = ToastManager;
    this.config = ConfigManager;
    this.residents = ResidentManager;
    this.filters = FilterManager;
    this.modals = ModalManager;
    this.ocr = OCRManager;
    this.darkMode = DarkModeManager;
    
    // Binden der Event-Handler an die Instanz
    this.initEventListeners = this.initEventListeners.bind(this);
  }
  
  /**
   * Initialisiert die Anwendung
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('SoloNew-App wird initialisiert...');
      
      // Toast-Manager initialisieren
      await this.toast.init();
      this.toast.info('Anwendung wird geladen...');
      
      // API-Service initialisieren
      await this.api.init({
        apiBaseUrl: '/api/solo',
        timeout: 15000
      });
      
      // Konfiguration laden
      await this.config.init();
      
      // Einstellungen laden, inkl. Dark Mode
      this.darkMode.init();
      
      // Residents Manager initialisieren
      await this.residents.init(this);
      
      // Filter-Manager initialisieren
      this.filters.init(this);
      
      // Modal-Manager initialisieren
      this.modals.init(this);
      
      // OCR-Manager initialisieren
      this.ocr.init(this);
      
      // Event-Listener registrieren
      this.initEventListeners();
      
      // Anwendungsstatus aktualisieren
      this.isInitialized = true;
      
      // Bewohner laden und anzeigen
      try {
        // Verwende die korrekte Methode displayAllResidents statt loadAndDisplayResidents
        await this.residents.displayAllResidents();
      } catch (displayError) {
        console.warn('Fehler beim Anzeigen der Bewohner:', displayError);
        this.toast.warning('Bewohnerliste konnte nicht angezeigt werden');
        
        // Fallback: Versuche, nur die Bewohner zu laden, ohne sie anzuzeigen
        try {
          await this.residents.loadResidents();
          console.log('Bewohner wurden geladen, aber nicht angezeigt');
        } catch (loadError) {
          console.error('Auch das Laden der Bewohner ist fehlgeschlagen:', loadError);
        }
      }
      
      console.log('SoloNew-App erfolgreich initialisiert');
      this.toast.success('Anwendung erfolgreich geladen');
    } catch (error) {
      console.error('Fehler bei der Initialisierung der Anwendung:', error);
      this.toast.error(`Initialisierungsfehler: ${error.message}`);
      
      // Versuche, einige grundlegende Funktionen trotzdem zu aktivieren
      this.initEmergencyMode();
    }
  }
  
  /**
   * Registriert die Event-Listener für die Anwendung
   */
  initEventListeners() {
    // Suchfunktion
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        this.residents.searchResidents(event.target.value);
      });
    }
    
    // Button-Event-Listener
    this.initActionButtons();
    
    // Filter-Reset-Button
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
      resetFilterBtn.addEventListener('click', () => {
        this.filters.resetFilters();
      });
    }
    
    // Service Worker registrieren für PWA-Funktionalität
    this.registerServiceWorker();
  }
  
  /**
   * Initialisiert die Event-Listener für Aktionsbuttons
   */
  initActionButtons() {
    // Neuer Bewohner Button
    const newResidentBtn = document.getElementById('newResidentBtn');
    if (newResidentBtn) {
      newResidentBtn.addEventListener('click', () => {
        this.modals.showNewResidentModal();
      });
    }
    
    // Upload Button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.ocr.showUploadOptions();
      });
    }
    
    // Auferstehungs-Button im Hauptmenü
    const resurrectionBtn = document.getElementById('resurrectionBtn');
    if (resurrectionBtn) {
      resurrectionBtn.addEventListener('click', () => {
        this.modals.showResurrectionModal();
      });
    }
    
    // Konfiguration Button
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
      configBtn.addEventListener('click', () => {
        this.modals.showConfigModal();
      });
    }
  }
  
  /**
   * Registriert den Service Worker für PWA-Funktionalität
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/frontend/SoloNew/service-worker.js')
        .then((registration) => {
          console.log('Service Worker erfolgreich registriert:', registration);
        })
        .catch((error) => {
          console.error('Service Worker-Registrierung fehlgeschlagen:', error);
        });
    }
  }
  
  /**
   * Aktiviert den Notfallmodus bei Initialisierungsfehlern
   */
  initEmergencyMode() {
    console.warn('Notfallmodus wird aktiviert...');
    this.toast.warning('Einige Funktionen könnten eingeschränkt sein.');
    
    // Grundlegende UI-Funktionen aktivieren
    const uiElements = document.querySelectorAll('button, input, select');
    uiElements.forEach(element => {
      element.disabled = false;
    });
    
    // Notfall-Event-Handler
    document.body.addEventListener('click', (event) => {
      if (event.target.closest('button[disabled], input[disabled], select[disabled]')) {
        this.toast.warning('Diese Funktion ist im Notfallmodus nicht verfügbar.');
      }
    });
  }
}

// Anwendungsinstanz erstellen und starten
const app = new SoloNewApp();

// Warte, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
  // Anwendung initialisieren
  app.initialize();
});

// Exportiere die Anwendungsinstanz für manuelle Tests in der Konsole
// und für den Zugriff durch andere Module wie den ResidentManager
window.app = app; 