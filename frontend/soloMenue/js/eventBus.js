/**
 * EventBus.js
 * Ein einfacher EventBus für die Kommunikation zwischen Komponenten
 * mit Kompatibilitätsschicht für ältere Implementierungen
 */

(function() {
  const events = {};
  
  // Debug-Modus für zusätzliche Logging-Informationen
  let debugModus = false;
  
  /**
    * Event abonnieren
    * @param {string} eventName - Name des Events
    * @param {function} callback - Callback-Funktion, die aufgerufen wird, wenn das Event ausgelöst wird
   */
  function subscribe(eventName, callback) {
    if (!events[eventName]) {
      events[eventName] = [];
    }
    events[eventName].push(callback);
    
    if (debugModus) {
      console.log(`EventBus (global): Listener registriert für '${eventName}'`);
    }
    
    // API-Kompatibilität: Gibt ein Objekt zurück, mit dem der Listener entfernt werden kann
    return {
      remove: () => unsubscribe(eventName, callback)
    };
  }

  /**
   * Event auslösen
   * @param {string} eventName - Name des Events
   * @param {any} data - Daten, die an die Callback-Funktionen übergeben werden
  */
  function publish(eventName, data) {
    if (!events[eventName]) {
      if (debugModus) {
        console.log(`EventBus (global): Keine Listener für '${eventName}'`);
      }
      return;
    }
    
    if (debugModus) {
      console.log(`EventBus (global): Event '${eventName}' ausgelöst mit Daten:`, data);
    }
    
    events[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`EventBus (global): Fehler beim Ausführen des Callbacks für ${eventName}:`, error);
      }
    });
  }
  
  /**
   * Event-Abonnement entfernen
   * @param {string} eventName - Name des Events
   * @param {function} callback - Callback-Funktion, die entfernt werden soll
  */
  function unsubscribe(eventName, callback) {
    if (!events[eventName]) {
      return;
    }
    
    events[eventName] = events[eventName].filter(cb => cb !== callback);
    
    if (debugModus) {
      console.log(`EventBus (global): Listener entfernt für '${eventName}'`);
    }
    
    // Event-Array löschen, wenn keine Callbacks mehr vorhanden sind
    if (events[eventName].length === 0) {
      delete events[eventName];
    }
  }
  
  /**
   * Alle Event-Abonnements für einen bestimmten Event-Namen entfernen
   * @param {string} eventName - Name des Events
   */
  function unsubscribeAll(eventName) {
    if (eventName) {
      delete events[eventName];
      
      if (debugModus) {
        console.log(`EventBus (global): Alle Listener für '${eventName}' wurden entfernt`);
      }
    } else {
      // Wenn kein Event-Name angegeben ist, alle Events löschen
      Object.keys(events).forEach(key => {
        delete events[key];
      });
      
      if (debugModus) {
        console.log('EventBus (global): Alle Event-Listener wurden entfernt');
      }
    }
  }
  
  /**
   * Initialisiert das EventBus-Modul
   * @param {Object} options - Optionen für die Initialisierung
   * @param {boolean} options.debug - Aktiviert den Debug-Modus
   * @returns {Object} - Das EventBus-Objekt für Chaining
   */
  function initialisiere(options = {}) {
    debugModus = !!options.debug;
    if (debugModus) {
      console.log('EventBus (global): Debug-Modus aktiviert');
    }
    console.log('EventBus (global): Initialisiert');
    
    // EventBus-Objekt mit aktuellen Werten aktualisieren
    window.EventBus = EventBusObjekt;
    
    return window.EventBus;
  }

  // Öffentliche API mit beiden Namenskonventionen für Kompatibilität
  const EventBusObjekt = {
    // Neue API
    subscribe,
    publish,
    unsubscribe,
    unsubscribeAll,
    
    // Module API for compatibility
    abonniere: subscribe,
    publiziere: publish,
    deabonniere: unsubscribe,
    
    // Alte/klassische API
    initialisiere,
    on: subscribe,
    emit: publish,
    off: unsubscribe,
    offAll: unsubscribeAll
  };
  
  // Globales Objekt für den EventBus
  window.EventBus = EventBusObjekt;
  
  // Konsolen-Ausgabe beim ersten Laden
  console.log('EventBus (global): Globale Version geladen, warte auf Initialisierung');
})(); 