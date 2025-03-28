# Seniorenheim Verwaltungssystem

## Überblick
Die Website dient der Verwaltung und Organisation des täglichen Ablaufs in einem Seniorenheim. Sie ermöglicht es dem Personal, Bewohnerdaten zu verwalten, Essenspläne zu erstellen und den täglichen Betrieb effizient zu gestalten.

### Backend-Struktur (`backend/data/solo/`)
Das Backend-Verzeichnis ist die zentrale Datenverwaltung des Systems und besteht aus zwei Hauptkomponenten:

1. **Konfigurationsverzeichnis** (`config/`)
   - Speichert alle Systemkonfigurationen
   - Enthält `formConfig.json` für die Bereichskonfiguration
   - Verwaltet Einstellungen und Standardwerte
   - Ermöglicht die Anpassung des Systems ohne Code-Änderungen

2. **Personenverzeichnis** (`person/`)
   - Speichert alle Bewohnerdaten
   - Unterteilt in:
     - `upToDate/`: Aktuelle Bewohnerdaten
     - `old/`: Historische Daten entlassener Bewohner
   - Ermöglicht die Nachverfolgung von Bewohnerhistorie
   - Sichert die Datenpersistenz
   -Dient als Backup um versehentlich gelöschte Personen zurück in `upToDate/` zu bringen wenn benötigt

### Hauptfunktionen

1. **Bewohnerverwaltung**
   - Erfassung und Verwaltung von Bewohnerdaten
   - Speicherung von persönlichen Informationen und Präferenzen
   - Verwaltung von Allergien und Ernährungsbesonderheiten
   - Dokumentenerkennung von Personen durch OCR-Technologie

2. **Dokumentenerkennung**
   - Automatische Texterkennung aus Dokumenten
   - Extraktion von Bewohnerinformationen
   - Unterstützung für verschiedene Dokumentformate
   - Integration mit bestehenden Bewohnerdaten

3. **Essensplanung**
   - Erfassung der Essensorte (Saal, 1. OG, 2. OG, 3. OG)
   - Verwaltung von Frühstück, Mittag- und Abendessen
   - Berücksichtigung von Ernährungsbesonderheiten

4. **Flexible Konfiguration**
   - Anpassbare Bereiche und Kategorien
   - Individuelle Einstellungen pro Bereich
   - Mehrsprachige Unterstützung

5. **Benutzerfreundlichkeit**
   - Intuitive Bedienung
   - Übersichtliche Darstellung
   - Schnelle Erfassung von Daten

### Zielgruppe
- Pflegepersonal
- Küchenpersonal
- Verwaltungspersonal
- Externe Dienstleister

### Technische Features
- Responsive Design für mobile Nutzung
- Offline-Fähigkeit für grundlegende Funktionen
- Automatische Datensynchronisation
- Sichere Datenspeicherung

## Bereichskonfiguration und Filter-Logik

### Übersicht
Das System ermöglicht die flexible Konfiguration von Bereichen (Areas) für die Bewohnerverwaltung. Jeder Bereich kann individuell angepasst werden und verschiedene Funktionen erfüllen.

### Bereichskonfiguration

#### Grundstruktur
Jeder Bereich besteht aus:
- Einem Namen (z.B. "Allergene", "Frühstück", "Mittagessen")
- Konfigurierbaren Buttons (z.B. "Saal", "1. OG", "2. OG")
- Verschiedenen Einstellungsmöglichkeiten

#### Einstellungsmöglichkeiten pro Bereich

1. **Mehrfachauswahl erlauben**
   - Ermöglicht die Auswahl mehrerer Buttons gleichzeitig
   - Beispiel: Ein Bewohner kann mehrere Allergene haben

2. **Menü-Filter**
   - Ermöglicht die Filterung der Bewohner nach diesem Bereich
   - Beispiel: Alle Bewohner im Saal für das Frühstück anzeigen

3. **Menü Relevant**
   - Bestimmt, ob der Bereich im Bewohnerformular bearbeitet werden kann
   - Beispiel: Essensort kann geändert werden

### Filter-Logik

#### Implementierung
Die Filter-Logik ist in zwei Hauptkomponenten aufgeteilt:

1. **ConfigManager**
   - Verwaltet die Konfiguration der Bereiche
   - Speichert die Einstellungen in `formConfig.json`
   - Ermöglicht das Hinzufügen/Löschen von Bereichen und Buttons

2. **FilterManager**
   - Verarbeitet die aktiven Filter
   - Zeigt gefilterte Bewohner an
   - Unterstützt kombinierte Filter (mehrere Bereiche gleichzeitig)

#### Filter-Typen

1. **Feld-Filter**
   - Filtert nach persönlichen Daten (Name, Geschlecht, etc.)
   - Wird in der Konfiguration definiert

2. **Bereichs-Filter**
   - Filtert nach konfigurierten Bereichen
   - Berücksichtigt die Einstellungen des Bereichs (Mehrfachauswahl, etc.)

### Beispiel-Konfiguration

```json
{
  "areas": [
    {
      "name": "Allergene",
      "allowMultiple": true,
      "menuFilter": false,
      "menuRelevant": true,
      "buttons": [
        { "label": "Laktoseintoleranz" },
        { "label": "Fruktoseunverträglichkeit" },
        { "label": "Nussallergie" }
      ]
    },
    {
      "name": "Frühstück",
      "allowMultiple": true,
      "menuFilter": true,
      "menuRelevant": true,
      "buttons": [
        { "label": "Saal" },
        { "label": "1. OG" },
        { "label": "2. OG" }
      ]
    }
  ]
}
```

### Verwendung

1. **Bereich erstellen**
   - Klicken Sie auf "+ Bereich hinzufügen"
   - Geben Sie einen Namen ein
   - Konfigurieren Sie die Einstellungen
   - Fügen Sie Buttons hinzu

2. **Filter aktivieren**
   - Wählen Sie "Menü-Filter" für Bereiche, die als Filter verwendet werden sollen
   - Die gefilterten Bewohner werden automatisch angezeigt

3. **Mehrfachauswahl**
   - Aktivieren Sie "Mehrfachauswahl erlauben" für Bereiche, die mehrere Optionen erlauben sollen
   - Beispiel: Ein Bewohner kann mehrere Allergene haben

4. **Bearbeitbarkeit**
   - Aktivieren Sie "Menü Relevant" für Bereiche, die im Bewohnerformular bearbeitet werden sollen
   - Deaktivieren Sie es für Bereiche, die nur angezeigt werden sollen

### Technische Details

#### Speicherung
- Die Konfiguration wird in `backend/data/solo/config/formConfig.json` gespeichert
- Änderungen werden sofort wirksam
- Die Konfiguration wird beim Start der Anwendung geladen

#### Filter-Logik
```javascript
// Beispiel für die Filter-Logik
applyAreaFilter(residents, areaName, config) {
    const area = config.areas.find(a => a.name === areaName);
    if (!area) return residents;

    return residents.filter(resident => {
        const residentArea = resident.areas?.[areaName];
        if (!residentArea) return false;

        if (area.allowMultiple) {
            return Array.isArray(residentArea) && residentArea.length > 0;
        } else {
            return residentArea;
        }
    });
}
```

#### JSON-Dateistruktur

1. **Bewohnerdaten** (`person/upToDate/[name].json`)
```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "gender": "m",
  "birthDate": "1940-01-01",
  "room": "101",
  "areas": {
    "Allergene": ["Laktoseintoleranz", "Nussallergie"],
    "Frühstück": "Saal",
    "Mittagessen": "1. OG",
    "Abendessen": "Saal"
  },
  "lastModified": "2024-03-27T12:00:00Z",
  "status": "active"
}
```

2. **Konfigurationsdaten** (`config/formConfig.json`)
```json
{
  "areas": [
    {
      "name": "Allergene",
      "allowMultiple": true,
      "menuFilter": false,
      "menuRelevant": true,
      "buttons": [
        { "label": "Laktoseintoleranz" },
        { "label": "Nussallergie" }
      ]
    }
  ],
  "fields": [
    {
      "name": "firstName",
      "type": "text",
      "required": true,
      "label": "Vorname"
    },
    {
      "name": "lastName",
      "type": "text",
      "required": true,
      "label": "Nachname"
    }
  ]
}
```

#### API-Endpunkte

1. **Bewohnerverwaltung**
   - `GET /api/solo/residents` - Liste aller aktiven Bewohner
   - `POST /api/solo/resident` - Neuen Bewohner erstellen
   - `PUT /api/solo/resident/:name` - Bewohnerdaten aktualisieren
   - `POST /api/solo/resident/dismiss/:name` - Bewohner entlassen
   - `POST /api/solo/resident/resurrect/:name` - Bewohner wiederherstellen

2. **Konfiguration**
   - `GET /api/solo/config` - Konfiguration laden
   - `POST /api/solo/config` - Konfiguration aktualisieren

3. **Filter und Suche**
   - `GET /api/solo/residents/filter` - Bewohner nach Kriterien filtern
   - `GET /api/solo/residents/search` - Bewohner durchsuchen

#### Datenvalidierung

1. **Eingabevalidierung**
   - Pflichtfelder: Vorname, Nachname, Geschlecht
   - Datumsformat: ISO 8601 (YYYY-MM-DD)
   - Bereichswerte: Müssen in der Konfiguration definiert sein

2. **Datenintegrität**
   - Eindeutige Bewohneridentifikation
   - Konsistente Bereichswerte
   - Automatische Zeitstempel für Änderungen

3. **Validierungsregeln**
```javascript
const validationRules = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZäöüßÄÖÜ\s-]+$/
  },
  areas: {
    validateAgainstConfig: true,
    allowMultiple: (areaName) => config.areas.find(a => a.name === areaName)?.allowMultiple
  }
};
```

#### Backup-Strategie

1. **Automatische Backups**
   - Tägliche Sicherungskopie um 00:00 Uhr
   - Wöchentliche Archivierung
   - Monatliche Langzeitarchivierung

2. **Backup-Struktur**
```
backup/
├── daily/
│   └── YYYY-MM-DD/
│       ├── config/
│       └── person/
├── weekly/
│   └── week-XX/
└── monthly/
    └── YYYY-MM/
```

3. **Wiederherstellung**
   - Automatische Wiederherstellung bei Datenverlust
   - Manuelle Wiederherstellung aus Archiv
   - Versionierung der Backups

4. **Sicherheitsmaßnahmen**
   - Verschlüsselte Backups
   - Mehrfache Redundanz
   - Regelmäßige Backup-Tests

#### OCR-Funktionalität

1. **Dokumentenverarbeitung**
   - Unterstützt PDF, JPG, PNG und andere Bildformate
   - Automatische Texterkennung mit Tesseract.js
   - Mehrsprachige Unterstützung (primär Deutsch)

2. **Datenextraktion**
   - Erkennung von Namen und persönlichen Daten
   - Strukturierte Erfassung von Informationen
   - Validierung der erkannten Daten

3. **Integration**
   - Direkte Verknüpfung mit Bewohnerdatenbank
   - Automatische Vorschläge für bestehende Bewohner
   - Manuelle Korrekturmöglichkeiten

4. **API-Endpunkt**
   - `POST /api/solo/ocr/process` - Dokumentenverarbeitung
   - Parameter: Bilddatei (multipart/form-data)
   - Rückgabe: Erkannte Texte und strukturierte Daten

### Verbesserungsmöglichkeiten

1. **Performance-Optimierung**
   - Implementierung von Caching für häufig verwendete Filter
   - Optimierung der Filter-Logik für große Datenmengen

2. **Benutzerfreundlichkeit**
   - Drag & Drop für Button-Reihenfolge
   - Vorschau der Filter-Effekte
   - Speichern von Filter-Vorlagen

3. **Erweiterbarkeit**
   - Unterstützung für komplexere Filter-Logiken
   - Integration von Statistiken und Auswertungen
   - Export/Import von Konfigurationen

### Fehlerbehebung

1. **Filter funktioniert nicht**
   - Prüfen Sie, ob "Menü-Filter" aktiviert ist
   - Überprüfen Sie die Konfiguration in `formConfig.json`
   - Prüfen Sie die Browser-Konsole auf Fehler

2. **Mehrfachauswahl nicht möglich**
   - Stellen Sie sicher, dass "Mehrfachauswahl erlauben" aktiviert ist
   - Überprüfen Sie die Button-Konfiguration

3. **Bereich nicht bearbeitbar**
   - Aktivieren Sie "Menü Relevant" für den Bereich
   - Prüfen Sie die Berechtigungen 

# Solo-Modul Dokumentation

## ResidentDetailModal

Der `ResidentDetailModal` ist eine wichtige Komponente für die Verwaltung der Bewohnerdetails. Er ermöglicht das Anzeigen und Bearbeiten aller Informationen eines Bewohners.

### Funktionen

#### 1. Anzeigen der Bewohnerdetails
- Zeigt alle persönlichen Informationen des Bewohners an
- Zeigt alle konfigurierten Bereiche mit ihren Buttons
- Markiert aktive Buttons in blau basierend auf den gespeicherten Werten
- Unterstützt Einzel- und Mehrfachauswahl von Buttons

#### 2. Bearbeiten der Bewohnerdetails
- Alle Felder sind bearbeitbar
- Buttons können durch Klicken aktiviert/deaktiviert werden
- Änderungen werden erst beim Klicken auf "Speichern" gespeichert
- Unterstützt das Entlassen von Bewohnern

### Datenstruktur

Die Bewohnerdaten werden in JSON-Dateien gespeichert:
```json
{
  "firstName": "Vorname",
  "lastName": "Nachname",
  "gender": "Geschlecht",
  "areas": {
    "Bereich1": "Wert1",
    "Bereich2": "Wert2, Wert3"
  },
  "vergin": "Alter",
  "lastModified": "Zeitstempel"
}
```

### Konfiguration

Die Anzeige und Bearbeitung wird durch die `formConfig.json` gesteuert:
```json
{
  "fields": [
    {
      "id": "vergin",
      "label": "Alter",
      "type": "number",
      "required": false
    }
  ],
  "areas": [
    {
      "name": "Bereich1",
      "allowMultiple": false,
      "menuFilter": false,
      "menuRelevant": true,
      "buttons": [
        {
          "label": "Option1"
        },
        {
          "label": "Option2"
        }
      ]
    }
  ]
}
```

### Verwendung

```javascript
// Modal initialisieren
ResidentDetailModal.init();

// Bewohnerdetails anzeigen
ResidentDetailModal.show(resident, () => {
    // Callback nach erfolgreichem Speichern
    console.log('Bewohner wurde aktualisiert');
});
```

### CSS-Klassen

- `.filter-button`: Basis-Styling für alle Buttons
- `.filter-button.active`: Styling für aktive Buttons (blau)
- `.area-group`: Container für einen Bereich mit Buttons
- `.button-group`: Container für die Buttons eines Bereichs

### Event-Handler

1. Button-Klicks:
   - Toggle den aktiven Zustand
   - Aktualisieren die UI
   - Speichern den neuen Zustand im resident-Objekt

2. Speichern-Button:
   - Sammelt alle Formular-Daten
   - Speichert die Änderungen in der JSON-Datei
   - Aktualisiert die UI

3. Entlassen-Button:
   - Bestätigungsdialog
   - Verschiebt den Bewohner in den "old"-Ordner
   - Aktualisiert die UI

### Fehlerbehandlung

- Validierung der Eingaben
- Fehlermeldungen bei API-Fehlern
- Bestätigungsdialoge für wichtige Aktionen
- Automatische UI-Aktualisierung nach Fehlern 

# Seniorenheim-Management-System

## Filter-System

### Filter-Konfiguration
Die Filter-Konfiguration wird in `backend/data/solo/config/filter.json` gespeichert und enthält:
- `fields`: Array von Feld-Filtern (z.B. "Alter")
- `areas`: Array von Bereichs-Filtern (z.B. "Wo wird das Essen eingetragen!")

### Filter-Funktionalität
Das System unterstützt zwei Arten von Filtern:
1. **Feld-Filter**: Filtert nach spezifischen Feldern wie Alter
2. **Bereichs-Filter**: Filtert nach Bereichen wie Essenszeiten oder Allergenen

### Filter-UI
Die Filter-Optionen werden in der `filterOptions`-Sektion angezeigt:
```html
<div id="filterOptions">
    <div class="filter-section">
        <h4>Nach Feld filtern</h4>
        <div class="filter-options">
            <!-- Feld-Filter -->
        </div>
    </div>
    <div class="filter-section">
        <h4>Nach Bereich filtern</h4>
        <div class="filter-options">
            <!-- Bereichs-Filter -->
        </div>
    </div>
</div>
```

### Filter-Management
- Filter werden beim Start der Website aus der `filter.json` geladen
- Aktive Filter werden in der UI durch aktivierte Switches angezeigt
- Filter-Änderungen werden automatisch in der `filter.json` gespeichert
- Die Bewohnerliste wird bei Filter-Änderungen automatisch aktualisiert

### Filter-Logik
1. **Feld-Filter**:
   - Filtert Bewohner basierend auf spezifischen Feldern
   - Unterstützt verschiedene Feldtypen (Text, Zahlen, etc.)

2. **Bereichs-Filter**:
   - Filtert Bewohner basierend auf ausgewählten Bereichen
   - Unterstützt Mehrfachauswahl für bestimmte Bereiche
   - Zeigt Bewohner in gruppierten Spalten an

### Filter-Anzeige
- Aktive Filter werden in der UI durch aktivierte Switches angezeigt
- Die gefilterten Bewohner werden in gruppierten Spalten dargestellt
- Jede Spalte zeigt den Filter-Namen und die zugehörigen Bewohner

### Filter-Persistenz
- Filter-Einstellungen werden in `filter.json` gespeichert
- Beim Neuladen der Seite werden die letzten Filter-Einstellungen automatisch wiederhergestellt
- Filter-Änderungen werden sofort gespeichert und angewendet 