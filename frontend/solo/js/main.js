// Importiere Module
import { FilterManager } from './Module/filter.js';
import { Modal } from './Module/modal.js';
import { Toast } from './Module/module.js';
import { ResidentManager } from './Module/resident.js';

// Wenn das Dokument geladen ist
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOMContentLoaded-Event ausgelöst');
        
        // Initialisiere die Module
        console.log('Initialisiere Module...');
        
        // Initialisiere FilterManager
        console.log('Versuche FilterManager zu initialisieren...');
        await FilterManager.init();
        console.log('FilterManager erfolgreich initialisiert');
        
        // Initialisiere andere Module wenn nötig
        // ...
        
        // Initialisiere Event Listener
        initEventListeners();
        
    } catch (error) {
        console.error('Fehler im DOMContentLoaded-Handler:', error);
        Toast.show('Fehler beim Laden der Seite', 'error');
    }
});

// Initialisiere Event Listener
function initEventListeners() {
    // Hier kannst du weitere Event Listener initialisieren
    console.log('Event Listener wurden initialisiert');
} 