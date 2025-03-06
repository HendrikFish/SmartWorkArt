# SoloPlan - Speiseplan-Verwaltung für Seniorenheime

## Übersicht

SoloPlan ist eine Webanwendung zur Verwaltung des Speiseplans in Seniorenheimen. Sie ermöglicht es dem Personal, den Wochenspeiseplan für jeden Bewohner individuell anzupassen und zu verwalten.

Die Anwendung bietet folgende Hauptfunktionen:
- Auswahl und Anzeige von Bewohnern
- Wochenweise Navigation durch den Speiseplan
- Auswahl und Anpassung von Mahlzeiten für jeden Bewohner
- Verwaltung von Extra-Kategorien für Mahlzeiten
- Speichern der Auswahl für jeden Bewohner

## Projekt-Struktur

```
frontend/soloPlan/
│
├── css/
│   └── styles.css             # Hauptstildatei für die Anwendung
│
├── js/
│   ├── script.js              # Hauptskript für die Initialisierung
│   └── Modules/               # Modularer Code für bessere Organisation
│       ├── api.js             # API-Verbindungen und Datenmanagement
│       ├── event-handling.js  # Verarbeitung von Benutzerinteraktionen
│       ├── hilfsfunktionen.js # Allgemeine Hilfsfunktionen
│       ├── interface.js       # UI-Konstruktion und -Updates
│       ├── konstanten.js      # Konstanten und unveränderliche Werte
│       ├── panel-handling.js  # Verwaltung von UI-Panels
│       └── variablen.js       # Zustandsverwaltung und DOM-Referenzen
│
└── index.html                 # Haupt-HTML-Datei für die Anwendung
```

## Technische Details

Die Anwendung ist als modulare, client-seitige Webanwendung aufgebaut, die mit einem Backend-API-Service kommuniziert. Sie nutzt moderne JavaScript-Funktionen wie ES-Module und Promises für eine bessere Codeorganisation.

### Architektur

- **Modularer Aufbau**: Jede JavaScript-Datei übernimmt eine spezifische Rolle im System
- **Klare Trennung** von UI, Datenverarbeitung und Event-Handling
- **Responsive Design**: Funktioniert auf verschiedenen Bildschirmgrößen
- **Fehlerbehandlung**: Robustes Error-Handling für API-Anfragen
- **Caching**: Optimierte Datenabrufe zur Minimierung von API-Anfragen

### Verwendete Technologien

- Vanilla JavaScript (ES6+)
- ES-Modules für Code-Organisation
- Fetch API für HTTP-Anfragen
- Responsive CSS
- HTML5 für semantische Markups

## Installation und Start

1. Stelle sicher, dass die Konfiguration in `js/config.js` korrekt ist
2. Die Anwendung benötigt einen laufenden Backend-Service mit den entsprechenden API-Endpunkten
3. Öffne die `index.html` in einem modernen Browser

## Verbesserungen und Wartung

Bei der Weiterentwicklung des Projekts sollten folgende Aspekte beachtet werden:

1. **Konsistente Fehlerbehandlung**: Stelle sicher, dass alle API-Aufrufe korrekt mit Fehlern umgehen
2. **Performance-Optimierung**: Minimiere unnötige DOM-Manipulationen
3. **Code-Kommentierung**: Halte Kommentare aktuell, besonders bei komplexen Funktionen
4. **UI-Verbesserungen**: Achte auf Barrierefreiheit und intuitive Benutzererfahrung
5. **Testen**: Führe regelmäßige Regressionstests durch, um sicherzustellen, dass Änderungen keine existierenden Funktionen beeinträchtigen 