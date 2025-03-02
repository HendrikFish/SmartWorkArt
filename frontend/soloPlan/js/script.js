import { getCurrentWeek, getCurrentYear, initializeDOMElements } from './Modules/variablen.js';
import { loadResidents, loadMealPlan, loadExtraCategories } from './Modules/api.js';
import { initializeEventListeners } from './Modules/event-handling.js';
import { updateUI, initCategoryManager } from './Modules/interface.js';

// Initialisierungsfunktion
async function init() {
    try {
        console.log('Starte Initialisierung...');
        
        // Warte bis das DOM geladen ist
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
        
        // Initialisiere DOM-Elemente
        console.log('Initialisiere DOM-Elemente...');
        initializeDOMElements();
        
        // Initialisiere Event Listener
        console.log('Initialisiere Event-Listener...');
        initializeEventListeners();
        
        // Lade Daten
        console.log('Lade Bewohner...');
        await loadResidents();
        
        console.log('Lade Extra-Kategorien...');
        await loadExtraCategories();
        
        console.log('Lade Speiseplan...');
        await loadMealPlan();
        
        // Initialisiere Kategorie-Manager
        console.log('Initialisiere Kategorie-Manager...');
        initCategoryManager();
        
        // Aktualisiere die Benutzeroberfläche
        console.log('Aktualisiere Benutzeroberfläche...');
        updateUI();
        
        console.log('Initialisierung abgeschlossen');
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
        alert('Es ist ein Fehler bei der Initialisierung aufgetreten. Bitte laden Sie die Seite neu.');
    }
}

// Starte die Anwendung
init();
