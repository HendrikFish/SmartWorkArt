/**
 * Hauptskript für die SoloNew-Anwendung
 * Importiert und initialisiert alle Module
 */

import { ApiService } from './Module/api-service.js';
import { ToastManager } from './Module/toast-manager.js';
import { ConfigManager } from './Module/config-manager.js';
import { ResidentManager } from './Module/resident-manager.js';
import { FilterManager } from './Module/filter-manager.js';
import { ModalManager } from './Module/modal-manager.js';
import { OCRManager } from './Module/ocr-manager.js';

// Warte, bis das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', async () => {
    console.log('SoloNew App wird initialisiert...');

    try {
        // Toast-Manager global verfügbar machen für andere Module
        window.ToastManager = ToastManager;

        // Initialisiere den Toast-Manager
        await ToastManager.init();
        
        // Initialisiere den API-Service mit der korrekten Basis-URL
        await ApiService.init({
            apiBaseUrl: '/api/solo'
        });
        
        // Initialisiere den Config-Manager
        await ConfigManager.init();

        // Initialisiere den Resident-Manager
        await ResidentManager.init();
        
        // Initialisiere den Filter-Manager
        FilterManager.init();
        
        // Wenn der Filter-Seitenbereich existiert, fülle ihn mit Filtern
        const filterSidebar = document.getElementById('filterSidebar');
        if (filterSidebar) {
            FilterManager.createFilterButtons(filterSidebar);
        }
        
        // Direkter Event-Listener für den saveConfigBtn (Notfallmaßnahme)
        const saveConfigBtn = document.getElementById('saveConfigBtn');
        if (saveConfigBtn) {
            console.log('Direkter Event-Listener für saveConfigBtn wird hinzugefügt');
            saveConfigBtn.addEventListener('click', async function(event) {
                console.log('Speichern-Button wurde direkt geklickt');
                event.preventDefault();
                
                try {
                    // Sammle die aktualisierten Konfigurationsdaten
                    const updatedConfig = ConfigManager.collectConfigData();
                    
                    // Speichere die Konfiguration
                    await ConfigManager.saveConfig(updatedConfig);
                    
                    // Erfasse den aktiven Filter
                    const activeFilterButton = document.querySelector('#filterTab .filter-btn.area-filter.active');
                    if (activeFilterButton) {
                        const areaName = activeFilterButton.dataset.value || activeFilterButton.dataset.area;
                        console.log('Aktiver Filter gefunden:', areaName);
                        
                        // Wende Filter an
                        await FilterManager.applyFilter(areaName);
                    }
                    
                    // Schließe das Modal
                    const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
                    if (configModal) {
                        configModal.hide();
                    }
                    
                    ToastManager.success('Konfiguration erfolgreich gespeichert');
                } catch (error) {
                    console.error('Fehler beim Speichern der Konfiguration:', error);
                    ToastManager.error('Fehler beim Speichern: ' + error.message);
                }
            });
        }
        
        // Initialisiere den Modal-Manager und mache ihn global verfügbar
        window.ModalManager = ModalManager;
        ModalManager.init();
        
        // Initialisiere den OCR-Manager
        OCRManager.init();
        
        // Event-Listener für die Suchfunktion
        const searchInput = document.getElementById('residentSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (event) => {
                ResidentManager.searchResidents(event.target.value);
            });
        }
        
        // Event-Listener für Aktions-Buttons
        initActionButtons();
        
        // Zeige alle Bewohner an
        await ResidentManager.displayAllResidents();
        
        console.log('SoloNew App erfolgreich initialisiert');
        ToastManager.success('Anwendung erfolgreich geladen');

    } catch (error) {
        console.error('Fehler bei der Initialisierung der Anwendung:', error);
        ToastManager.error('Fehler beim Laden der Anwendung: ' + error.message);
    }
});

/**
 * Initialisiert die Event-Listener für alle Aktions-Buttons
 */
function initActionButtons() {
    // Konfigurationsbutton
    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            ModalManager.showConfigModal();
        });
    }
    
    // Neuer Bewohner Button
    const newResidentBtn = document.getElementById('newResidentBtn');
    if (newResidentBtn) {
        newResidentBtn.addEventListener('click', () => {
            ModalManager.showNewResidentModal();
        });
    }
    
    // OCR-Button / Dokumentenerkennung
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            OCRManager.showUploadOptions();
        });
    }
    
    // Wiederherstellungs-Button für entlassene Bewohner
    const resurrectionBtn = document.getElementById('resurrectionBtn');
    if (resurrectionBtn) {
        resurrectionBtn.addEventListener('click', () => {
            ModalManager.showResurrectionModal();
        });
    }
    
    // Filterzurücksetzen-Button
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('resetFilter'));
        });
    }
}

// Bereinige alle Backdrops beim Laden der Seite
document.addEventListener('DOMContentLoaded', () => {
    // Sofortige Prüfung beim Seitenladen
    cleanupModalBackdrops();
    
    // Regelmäßige Prüfung alle 5 Sekunden, um hängengebliebene Backdrops zu finden
    setInterval(() => {
        // Prüfe, ob ein Modal-Backdrop ohne aktives Modal vorhanden ist
        const hasBackdrop = document.querySelector('.modal-backdrop');
        const hasActiveModal = document.querySelector('.modal.show');
        
        if (hasBackdrop && !hasActiveModal) {
            console.log('Hängengebliebenen Modal-Backdrop gefunden und entfernt');
            cleanupModalBackdrops();
        }
    }, 5000);
});

/**
 * Hilfsfunktion zum Entfernen von hängengebliebenen Modal-Backdrops
 */
function cleanupModalBackdrops() {
    // Entferne alle überflüssigen .modal-backdrop Elemente
    const backdrops = document.querySelectorAll('.modal-backdrop.fade.show');
    if (backdrops.length > 0) {
        backdrops.forEach(backdrop => {
            if (!document.querySelector('.modal.show')) {
                // Wenn kein aktives Modal vorhanden ist, entferne den Backdrop
                backdrop.remove();
                // Entferne die overflow-hidden Klasse vom Body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }
        });
    }
}

// Event-Listener für alle Buttons, die Modals schließen
document.addEventListener('DOMContentLoaded', () => {
    // Event-Delegation für alle Button-Klicks
    document.body.addEventListener('click', (event) => {
        // Überprüfe, ob ein Schließen-Button geklickt wurde
        if (event.target.classList.contains('btn-close') || 
            event.target.hasAttribute('data-bs-dismiss') ||
            event.target.closest('[data-bs-dismiss="modal"]')) {
            // Warte kurz, um sicherzustellen, dass Bootstrap das Modal schließen kann
            setTimeout(cleanupModalBackdrops, 300);
        }
    });
    
    // Zusätzlicher Event-Listener für Modal-spezifische Events
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('hidden.bs.modal', () => {
            // Warte kurz, bevor die Bereinigung durchgeführt wird
            setTimeout(cleanupModalBackdrops, 300);
        });
    });
}); 