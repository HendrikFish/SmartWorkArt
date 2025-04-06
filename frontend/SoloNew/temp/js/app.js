/**
 * SoloNew - Hauptanwendung
 * Steuert die Initialisierung und Koordination aller Module
 * 
 * Diese Datei dient als Einstiegspunkt der Anwendung und
 * orchestriert das Laden und die Initialisierung aller Module.
 */

// Module importieren
import { ApiService } from './modules/api-service.js';
import { ToastManager } from './modules/toast-manager.js';
import { ConfigManager } from './modules/config-manager.js';
import { FilterManager } from './modules/filter-manager.js';
import { ResidentManager } from './modules/resident-manager.js';
import { ModalManager } from './modules/modal-manager.js';
import { OcrManager } from './modules/ocr-manager.js';

// Hauptanwendung
const App = {
    initialized: false,
    loading: false,
    
    /**
     * Initialisiert die Anwendung und alle Module
     */
    async init() {
        if (this.initialized || this.loading) return;
        
        try {
            this.loading = true;
            console.log('SoloNew Anwendung wird initialisiert...');
            
            // Ladeindikator anzeigen
            document.getElementById('appLoadingSpinner')?.classList.remove('d-none');
            
            // Module in der richtigen Reihenfolge initialisieren
            await this.initializeModules();
            
            // Erste Bewohnerliste laden
            await ResidentManager.loadResidents();
            ResidentManager.displayAllResidents();
            
            // Event-Listener einrichten
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('SoloNew Anwendung erfolgreich initialisiert');
            
            // Willkommenstoast anzeigen
            ToastManager.info('Anwendung erfolgreich geladen');
        } catch (error) {
            console.error('Fehler bei der Initialisierung der Anwendung:', error);
            
            // Fehlerbehandlung
            document.getElementById('errorContainer')?.classList.remove('d-none');
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.textContent = `Initialisierungsfehler: ${error.message || 'Unbekannter Fehler'}`;
            }
            
            // Neuladeschaltfläche anzeigen
            const reloadButton = document.getElementById('reloadButton');
            if (reloadButton) {
                reloadButton.classList.remove('d-none');
                reloadButton.addEventListener('click', () => window.location.reload());
            }
        } finally {
            // Ladeindikator ausblenden
            document.getElementById('appLoadingSpinner')?.classList.add('d-none');
            document.getElementById('mainContent')?.classList.remove('d-none');
            this.loading = false;
        }
    },
    
    /**
     * Initialisiert alle Module in der richtigen Reihenfolge
     */
    async initializeModules() {
        // Verwendung von Promise.all für parallele Initialisierung wo möglich
        console.log('Initialisiere grundlegende Module...');
        
        // Erst die grundlegenden Module laden
        await ToastManager.init();
        await ApiService.init();
        
        console.log('Grundlegende Module initialisiert');
        
        // Konfiguration laden (benötigt von anderen Modulen)
        console.log('Lade Konfiguration...');
        await ConfigManager.init();
        
        // Restliche Module laden
        console.log('Initialisiere Anwendungsmodule...');
        await Promise.all([
            FilterManager.init(),
            ResidentManager.init(),
            ModalManager.init(),
            OcrManager.init()
        ]);
        
        console.log('Anwendungsmodule erfolgreich initialisiert');
    },
    
    /**
     * Richtet Event-Listener für die Anwendung ein
     */
    setupEventListeners() {
        console.log('Event-Listener werden eingerichtet...');
        
        // Globale Navigation
        document.addEventListener('click', this.handleNavigationEvents.bind(this));
        
        // Suchleiste
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.handleSearch.bind(this));
        }
        
        // Neuer Bewohner Button
        const newResidentBtn = document.getElementById('newResidentBtn');
        if (newResidentBtn) {
            newResidentBtn.addEventListener('click', () => {
                ModalManager.showNewResidentModal();
            });
        }
        
        // OCR-Button
        const ocrBtn = document.getElementById('ocrBtn');
        if (ocrBtn) {
            ocrBtn.addEventListener('click', () => {
                ModalManager.showOcrModal();
            });
        }
        
        // Konfigurations-Button
        const configBtn = document.getElementById('configBtn');
        if (configBtn) {
            configBtn.addEventListener('click', () => {
                ModalManager.showConfigModal();
            });
        }
        
        // Auferstehungs-Button
        const resurrectionBtn = document.getElementById('resurrectionBtn');
        if (resurrectionBtn) {
            resurrectionBtn.addEventListener('click', () => {
                ModalManager.showResurrectionModal();
            });
        }
        
        // Filter-Reset-Button
        const resetFiltersBtn = document.getElementById('resetFiltersBtn');
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                FilterManager.resetFilters();
                searchInput.value = '';
                ResidentManager.displayAllResidents();
            });
        }
        
        console.log('Event-Listener erfolgreich eingerichtet');
    },
    
    /**
     * Behandelt Navigationsereignisse über Event-Delegation
     * @param {Event} event - Das Klick-Event
     */
    handleNavigationEvents(event) {
        // Bewohner-Details bei Klick auf eine Bewohnerkarte anzeigen
        const residentCard = event.target.closest('.resident-card');
        if (residentCard) {
            const residentId = residentCard.dataset.id;
            if (residentId) {
                ModalManager.showResidentDetailModal(residentId);
            }
            return;
        }
        
        // Andere Navigationsereignisse können hier hinzugefügt werden
    },
    
    /**
     * Behandelt Sucheingaben
     * @param {Event} event - Das Input-Event
     */
    handleSearch(event) {
        const query = event.target.value.trim().toLowerCase();
        
        if (query.length === 0) {
            // Bei leerer Suche alle Bewohner anzeigen, aber Filter beibehalten
            ResidentManager.applyFilters();
        } else {
            // Bei Suche die Ergebnisse filtern
            ResidentManager.searchResidents(query);
        }
    }
};

// Anwendung starten, wenn das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM geladen, starte Anwendung...');
    // App als globales Objekt verfügbar machen
    window.App = App;
    
    // Module für andere Skripte verfügbar machen
    window.ApiService = ApiService;
    window.ToastManager = ToastManager;
    window.ConfigManager = ConfigManager;
    window.FilterManager = FilterManager;
    window.ResidentManager = ResidentManager;
    window.ModalManager = ModalManager;
    window.OcrManager = OcrManager;
    
    // Anwendung initialisieren
    App.init().catch(error => {
        console.error('Kritischer Fehler bei der Anwendungsinitialisierung:', error);
    });
}); 