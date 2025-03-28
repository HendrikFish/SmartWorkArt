# SoloMenü Anwendung - Dokumentation

## Übersicht
Die SoloMenü-Anwendung wurde mit einem modernen, modularen Ansatz entwickelt, um die Verwaltung von Menüplänen in einem Seniorenheim zu erleichtern. Die Anwendung unterstützt jetzt Mehrsprachigkeit und verwendet ein zentralisiertes Event-System für eine bessere Kommunikation zwischen Modulen.

## Neue Funktionen

### Mehrsprachigkeit (I18n)
Die Anwendung unterstützt jetzt mehrere Sprachen (Deutsch, Englisch, Bosnisch, Kroatisch und Slowakisch) und verwendet das leistungsstarke i18next-Framework für Übersetzungen.

#### Unterstützte Sprachen:
- Deutsch (de) - Standardsprache
- Englisch (en)
- Bosnisch (bs)
- Kroatisch (hr)
- Slowakisch (sk)

#### Verwendung der Mehrsprachigkeits-Funktionen:
1. **HTML-Elemente mit Übersetzungsschlüsseln versehen:**
   ```html
   <!-- Einfacher Text -->
   <button data-i18n-key="buttons.speichern">Speichern</button>

   <!-- Platzhalter in Input-Feldern -->
   <input type="text" data-i18n-placeholder="formular.namePlaceholder">
   
   <!-- Tooltips/Titel -->
   <button data-i18n-title="buttons.saveTooltip">💾</button>
   ```

2. **Übersetzungen programmatisch abrufen und anwenden:**
   ```javascript
   // Text abrufen
   const text = window.i18n.translate('buttons.speichern');
   
   // Sprache ändern
   window.i18n.changeLanguage('en');
   ```

3. **Auf DOM-Änderungen reagieren:**
   Wenn Sie dynamisch neue Elemente mit Übersetzungsschlüsseln hinzufügen, lösen Sie das 'domUpdated'-Event aus:
   ```javascript
   // Nach dem Hinzufügen neuer DOM-Elemente mit Übersetzungsschlüsseln
   EventBus.publish('domUpdated');
   ```

### Übersetzungsdateien
Die Übersetzungen werden in JSON-Dateien im Verzeichnis `locales/[sprachcode]/translation.json` gespeichert und haben eine hierarchische Struktur:

```json
{
  "navigation": {
    "prev-week-btn": "Vorherige Woche",
    "next-week-btn": "Nächste Woche"
  },
  "buttons": {
    "speichern": "Speichern",
    "abbrechen": "Abbrechen"
  }
}
```

### Event-Bus-System
Ein zentralisiertes Event-System zur Verbesserung der Kommunikation zwischen Modulen ohne enge Kopplung.

#### Verwendung des Event-Bus:
1. **Events registrieren:**
   ```javascript
   // Event-Listener hinzufügen
   EventBus.subscribe('ereignis:name', (data) => {
     console.log('Ereignis empfangen:', data);
   });
   ```

2. **Events auslösen:**
   ```javascript
   // Event mit Daten auslösen
   EventBus.publish('ereignis:name', { 
     eigenschaft1: 'Wert1', 
     eigenschaft2: 'Wert2' 
   });
   ```

3. **Event-Listener entfernen:**
   ```javascript
   // Bestimmten Listener entfernen
   EventBus.unsubscribe('ereignis:name', meinCallback);
   
   // Alle Listener für ein Ereignis entfernen
   EventBus.unsubscribeAll('ereignis:name');
   ```

## Modulstruktur
Die Anwendung verwendet ein modulares Design, wobei jede Funktion in einer separaten JavaScript-Datei definiert ist:

- **eventBus.js**: Zentrale Event-Verwaltung
- **i18nextAdapter.js**: Mehrsprachigkeits-Unterstützung mit i18next
- **BewohnerPanel.js**: Verwaltung von Bewohnerdetails
- **BewohnerAnzeiger.js**: Anzeige von Bewohnerlisten
- **FormularContainer.js**: Verwaltung von Formularen
- **script.js**: Hauptskript zur Initialisierung aller Module

## Best Practices für die Entwicklung

### Hinzufügen neuer Texte/Übersetzungen
1. Fügen Sie neue Textschlüssel in allen Übersetzungsdateien (`locales/[sprachcode]/translation.json`) hinzu.
2. Verwenden Sie bei HTML-Elementen das Attribut `data-i18n-key` mit dem entsprechenden Schlüssel.
3. Bei dynamisch erstellten Elementen nutzen Sie `window.i18n.translate(key)`.

### Hinzufügen neuer Events
1. Wählen Sie einen aussagekräftigen Event-Namen mit Namensraum (z.B. `bewohner:ausgewaehlt`).
2. Dokumentieren Sie die erwarteten Daten für das Event.
3. Verwenden Sie den EventBus, um Events zu registrieren und auszulösen.

### Hinzufügen neuer Module
1. Importieren Sie die benötigten Module.
2. Stellen Sie eine `initialisiere()`-Funktion bereit.
3. Registrieren Sie benötigte Event-Listener.
4. Aktualisieren Sie `script.js`, um das neue Modul zu initialisieren.

## Erweiterbarkeit
Die Modularisierung ermöglicht eine einfache Erweiterung der Anwendung:

1. **Neue Sprachen hinzufügen**: 
   - Erstellen Sie eine neue Übersetzungsdatei unter `locales/[sprachcode]/translation.json`
   - Fügen Sie den Sprachcode zu den unterstützten Sprachen in `i18nextAdapter.js` hinzu
   - Ergänzen Sie den neuen Eintrag im Sprachauswahl-Dropdown

2. **Neue Funktionen hinzufügen**: Erstellen Sie neue Module und integrieren Sie sie über den EventBus.
3. **UI-Anpassungen**: Aktualisieren Sie die CSS-Dateien für konsistentes Styling.

## Installationshinweise
1. Stellen Sie sicher, dass die i18next-Bibliotheken im Verzeichnis `js/libs/` vorhanden sind:
   - i18next.min.js
   - i18nextHttpBackend.min.js
   
   Falls nicht, laden Sie sie von den CDNs herunter (siehe `js/libs/download-info.txt`).

2. Überprüfen Sie die Verzeichnisstruktur für die Übersetzungsdateien:
   ```
   locales/
     ├── de/
     │   └── translation.json
     ├── en/
     │   └── translation.json
     ├── bs/
     │   └── translation.json
     ├── hr/
     │   └── translation.json
     └── sk/
         └── translation.json
   ```

## Wartung und Fehlerbehebung
- Überprüfen Sie die Konsole auf Fehler und Warnungen.
- Nutzen Sie den Debug-Modus von i18next durch Setzen von `debug: true` in der i18next-Konfiguration.
- Verwenden Sie Browser-Entwicklertools, um das DOM und Netzwerkanfragen zu überprüfen.

## Fazit
Die SoloMenü-Anwendung bietet nun eine robuste Grundlage für mehrsprachige Benutzeroberflächen und eine bessere Modulkommunikation. Das neue i18next-basierte Übersetzungssystem macht die Anwendung benutzerfreundlicher und erleichtert die Erweiterung um weitere Sprachen. Die Integration des EventBus sorgt für eine entkoppelte Kommunikation zwischen Modulen. 